/**
 * Milestone 3 Phase 0 proof-of-concept. Standalone script — NOT part of the
 * Next.js app, NOT imported by production code, NOT run by the automated
 * test suite. Run manually with:
 *
 *   npx tsx poc/semantic-search/run-poc.mts
 *
 * It fetches the live Poly Haven catalog (same code path Milestone 2 uses),
 * selects a ~40-asset subset, embeds it locally with a small quantized
 * sentence-transformer, ranks it by cosine similarity against three test
 * queries, and prints that ranking next to the existing deterministic
 * keyword ranking for direct comparison. Nothing here is mocked — this is a
 * real model run against real live data, on purpose.
 */
import { env, pipeline } from "@huggingface/transformers";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPolyHavenCatalog } from "@/lib/providers/polyhaven/fetch-assets";
import { DEFAULT_QUERY } from "@/domain/asset/query";
import type { AssetSearchResult } from "@/domain/asset/types";
import { computeRelevance, formatWhyItFits } from "@/lib/search/relevance";
import { buildEmbeddingText } from "./embedding-text";
import { cosineSimilarity } from "./cosine-similarity";
import { selectPocDataset } from "./select-dataset";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const TARGET_SIZE = 48;
const TOP_N = 10;

interface QuerySpec {
  readonly text: string;
  readonly expectedFamily: string;
  readonly isExpected: (asset: AssetSearchResult) => boolean;
}

const QUERIES: readonly QuerySpec[] = [
  {
    text: "a worn old ball for a realistic sports game",
    expectedFamily: '"Dirty Football"',
    isExpected: (asset) => asset.name.toLowerCase() === "dirty football",
  },
  {
    text: "rough damaged ground material for an abandoned outdoor area",
    expectedFamily: "a concrete/weathered ground texture",
    isExpected: (asset) => asset.assetType === "Texture",
  },
  {
    text: "evening city environment with colorful sky lighting",
    expectedFamily: "a genuine city-skyline HDRI (Joburg Central Sunset / Shanghai Riverside / Rooftop Night)",
    isExpected: (asset) =>
      ["polyhaven:sunset_jhbcentral", "polyhaven:shanghai_riverside", "polyhaven:rooftop_night"].includes(asset.id),
  },
];

// Keep the downloaded model weights inside this POC folder, not the OS-wide
// HF cache and not the Next.js app's own state, so it's trivially gitignored
// and doesn't get confused with anything else.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
env.cacheDir = path.join(__dirname, ".model-cache");

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function printRanked(
  title: string,
  ranked: readonly { asset: AssetSearchResult; score: number; note?: string }[],
) {
  console.log(`\n--- ${title} ---`);
  ranked.slice(0, TOP_N).forEach((entry, index) => {
    const score = entry.score.toFixed(4);
    const extra = entry.note ? `  (${entry.note})` : "";
    console.log(
      `${String(index + 1).padStart(2)}. [${score}] ${entry.asset.name}  {${entry.asset.assetType}/${entry.asset.category}}${extra}`,
    );
  });
}

async function main() {
  const scriptStart = performance.now();

  console.log("Fetching live Poly Haven catalog...");
  const { assets: fullCatalog, totalUpstream, skipped } = await fetchPolyHavenCatalog();
  console.log(`Fetched ${fullCatalog.length} normalized assets (of ${totalUpstream} upstream, ${skipped} skipped).`);

  const { assets: dataset, anchorFound, citySkylineIdsFound } = selectPocDataset(fullCatalog, TARGET_SIZE);
  console.log(`\nSelected POC dataset: ${dataset.length} assets. "Dirty Football" present: ${anchorFound}`);
  if (!anchorFound) {
    console.warn('WARNING: "Dirty Football" was not found in the live catalog — query 1 cannot be evaluated as intended.');
  }
  console.log(
    `Preferred city-skyline HDRIs found live: ${citySkylineIdsFound.length}/3 (${citySkylineIdsFound.join(", ") || "none"})`,
  );
  console.log("Dataset asset types:", countBy(dataset, (a) => a.assetType));

  console.log(`\nLoading model "${MODEL_ID}" (dtype: q8)...`);
  const modelLoadStart = performance.now();
  const extractor = await pipeline("feature-extraction", MODEL_ID, { dtype: "q8" });
  const modelLoadMs = performance.now() - modelLoadStart;
  console.log(`Model ready in ${formatMs(modelLoadMs)}.`);

  console.log("\nEmbedding dataset assets...");
  const embedAssetsStart = performance.now();
  const assetEmbeddings = new Map<string, Float32Array>();
  for (const asset of dataset) {
    const text = buildEmbeddingText(asset);
    const output = await extractor(text, { pooling: "mean", normalize: true });
    assetEmbeddings.set(asset.id, output.data as Float32Array);
  }
  const embedAssetsMs = performance.now() - embedAssetsStart;
  console.log(`Embedded ${dataset.length} assets in ${formatMs(embedAssetsMs)} (${(embedAssetsMs / dataset.length).toFixed(1)}ms/asset avg).`);

  for (const { text: query, expectedFamily, isExpected } of QUERIES) {
    console.log(`\n\n================ QUERY: "${query}" ================`);
    console.log(`Expected family: ${expectedFamily}`);

    const queryEmbedStart = performance.now();
    const queryOutput = await extractor(query, { pooling: "mean", normalize: true });
    const queryEmbedding = queryOutput.data as Float32Array;
    const queryEmbedMs = performance.now() - queryEmbedStart;
    console.log(`(query embedded in ${formatMs(queryEmbedMs)})`);

    const semanticRanking = dataset
      .map((asset) => ({
        asset,
        score: cosineSimilarity(queryEmbedding, assetEmbeddings.get(asset.id)!),
      }))
      .sort((a, b) => b.score - a.score);
    printRanked("SEMANTIC (embedding cosine similarity)", semanticRanking);
    reportExpectedPosition("SEMANTIC", semanticRanking, isExpected);

    const deterministicQuery = { ...DEFAULT_QUERY, text: query };
    const keywordRanking = dataset
      .map((asset) => {
        const relevance = computeRelevance(asset, deterministicQuery);
        return { asset, score: relevance.score, note: formatWhyItFits(relevance) };
      })
      .sort((a, b) => b.score - a.score);
    printRanked("DETERMINISTIC (existing keyword/tag relevance)", keywordRanking);
    reportExpectedPosition("DETERMINISTIC", keywordRanking, isExpected);
  }

  const totalMs = performance.now() - scriptStart;
  console.log(`\n\nTotal script duration: ${formatMs(totalMs)} (model load: ${formatMs(modelLoadMs)}, dataset embedding: ${formatMs(embedAssetsMs)}).`);
}

function reportExpectedPosition(
  label: string,
  ranked: readonly { asset: AssetSearchResult; score: number }[],
  isExpected: (asset: AssetSearchResult) => boolean,
): void {
  const position = ranked.findIndex((entry) => isExpected(entry.asset));
  if (position === -1) {
    console.log(`  -> [${label}] expected family did NOT appear anywhere in the ${ranked.length}-asset ranking.`);
  } else {
    console.log(
      `  -> [${label}] expected family first appears at position ${position + 1} of ${ranked.length}: "${ranked[position].asset.name}".`,
    );
  }
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

main().catch((error) => {
  console.error("POC run failed:", error);
  process.exitCode = 1;
});
