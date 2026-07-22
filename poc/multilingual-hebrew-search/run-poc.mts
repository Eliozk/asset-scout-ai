/**
 * ISOLATED RESEARCH POC — Part 2 of the Hebrew-search correction milestone.
 * Standalone script, same pattern as poc/semantic-search/run-poc.mts — NOT
 * part of the Next.js app, NOT imported by production code, NOT run by the
 * automated test suite. Run manually with:
 *
 *   npx tsx poc/multilingual-hebrew-search/run-poc.mts
 *
 * Answers, with real measurements against the real live Poly Haven catalog:
 *   - does a Transformers.js-compatible multilingual embedding model retrieve
 *     relevant English catalog assets for the 4 required Hebrew queries?
 *   - what does that cost in download size, load time, and per-query latency
 *     versus the current production model (Xenova/all-MiniLM-L6-v2)?
 *
 * Uses its own cache dir (poc/multilingual-hebrew-search/.model-cache,
 * gitignored, separate from the production .cache/transformers-model) so
 * this POC never touches or invalidates the real generated embeddings
 * artifact.
 */
import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { mkdir, rm, stat, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPolyHavenCatalog } from "@/lib/providers/polyhaven/fetch-assets";
import { buildEmbeddingText } from "@/lib/semantic/embedding-text";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POC_CACHE_DIR = path.join(__dirname, ".model-cache");

env.cacheDir = POC_CACHE_DIR;

interface ModelCandidate {
  readonly id: string;
  readonly label: string;
}

const MODELS: readonly ModelCandidate[] = [
  { id: "Xenova/all-MiniLM-L6-v2", label: "CURRENT (English-only, production)" },
  { id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2", label: "CANDIDATE (multilingual, 50+ languages incl. Hebrew)" },
];

const HEBREW_QUERIES: ReadonlyArray<{ hebrew: string; english: string }> = [
  { hebrew: "חרב מימי הביניים למשחק פנטזיה", english: "medieval sword for a fantasy game" },
  { hebrew: "דרקון מצויר למשחק לילדים", english: "cartoon dragon for a kids' game" },
  { hebrew: "כיסא עץ ישן", english: "old wooden chair" },
  { hebrew: "טירה עתיקה בלילה", english: "ancient castle at night" },
];

function fmtMs(ms: number): string {
  return `${ms.toFixed(0)}ms`;
}

function fmtMiB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

async function dirSizeBytes(dir: string): Promise<number> {
  let total = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await dirSizeBytes(full);
    else total += (await stat(full)).size;
  }
  return total;
}

function cosineSim(a: Float32Array, b: Float32Array): number {
  // Both vectors come from `normalize: true` pooled output, so a plain dot
  // product already equals cosine similarity.
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

interface SampleAsset {
  readonly id: string;
  readonly text: string;
}

/** A real, mixed sample from the live Poly Haven catalog: some items whose
 * text plausibly relates to the 4 test queries (sword/dragon/chair/castle),
 * plus plenty of unrelated filler — so a model can't "succeed" by accident
 * just because we handed it an easy, pre-filtered pool. */
async function pickSampleAssets(): Promise<SampleAsset[]> {
  console.log("Fetching the live Poly Haven catalog for a real sample (same fetch as production)...");
  const { assets, totalUpstream } = await fetchPolyHavenCatalog();
  console.log(`Fetched ${assets.length} of ${totalUpstream} upstream assets.\n`);

  const keywords = ["sword", "weapon", "dragon", "chair", "wood", "castle", "fort", "tower", "medieval"];
  const relevant = assets.filter((a) => {
    const haystack = `${a.name} ${a.description} ${a.tags.join(" ")}`.toLowerCase();
    return keywords.some((k) => haystack.includes(k));
  });
  const relevantIds = new Set(relevant.map((a) => a.id));
  const filler = assets.filter((a) => !relevantIds.has(a.id)).slice(0, 40);

  const sample = [...relevant.slice(0, 30), ...filler];
  return sample.map((asset) => ({ id: asset.id, text: buildEmbeddingText(asset) }));
}

async function embedAll(
  extractor: FeatureExtractionPipeline,
  texts: readonly string[],
): Promise<{ vectors: Float32Array[]; totalMs: number }> {
  const start = performance.now();
  const vectors: Float32Array[] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    vectors.push(output.data as Float32Array);
  }
  return { vectors, totalMs: performance.now() - start };
}

async function runModel(candidate: ModelCandidate, sample: SampleAsset[]) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`MODEL: ${candidate.id}  [${candidate.label}]`);
  console.log("=".repeat(70));

  // Cold load: this process's cache dir has nothing for this model yet on
  // the very first run — pipeline() downloads over the network and caches
  // to POC_CACHE_DIR, exactly mirroring a real first-time browser visitor.
  const coldStart = performance.now();
  const rssBefore = process.memoryUsage().rss;
  let extractor = await pipeline("feature-extraction", candidate.id, { dtype: "q8" });
  const coldLoadMs = performance.now() - coldStart;
  const rssAfterLoad = process.memoryUsage().rss;

  const modelDir = path.join(POC_CACHE_DIR, candidate.id);
  const onDiskBytes = await dirSizeBytes(modelDir);

  // Warm load: dispose and re-create the pipeline in the SAME process, now
  // that every file is already on local disk — approximates a repeat visit
  // where the browser's own HTTP/IndexedDB cache serves the model with no
  // network fetch (Node has no such cache, so this isolates "disk + WASM
  // init" cost from "network download" cost, which is the number that
  // actually matters for a returning user).
  await extractor.dispose();
  const warmStart = performance.now();
  extractor = await pipeline("feature-extraction", candidate.id, { dtype: "q8" });
  const warmLoadMs = performance.now() - warmStart;

  const probe = await extractor("probe", { pooling: "mean", normalize: true });
  const dimensions = (probe.data as Float32Array).length;

  console.log(`Embedding dimension: ${dimensions}`);
  console.log(`On-disk model size (q8, incl. tokenizer): ${fmtMiB(onDiskBytes)}`);
  console.log(`Cold load time (first ever run, downloads over network): ${fmtMs(coldLoadMs)}`);
  console.log(`Warm load time (files already on disk, no network): ${fmtMs(warmLoadMs)}`);
  console.log(`Process RSS delta after first load: ${fmtMiB(rssAfterLoad - rssBefore)}`);

  const { vectors: sampleVectors, totalMs: sampleEmbedMs } = await embedAll(
    extractor,
    sample.map((s) => s.text),
  );
  console.log(
    `Embedded ${sample.length} real catalog sample assets in ${fmtMs(sampleEmbedMs)} ` +
      `(avg ${fmtMs(sampleEmbedMs / sample.length)}/asset).`,
  );

  const queryLatencies: number[] = [];
  console.log("\n--- Per-query results (top 5 nearest real catalog assets) ---");
  for (const { hebrew, english } of HEBREW_QUERIES) {
    const t0 = performance.now();
    const hebrewOut = await extractor(hebrew, { pooling: "mean", normalize: true });
    const hebrewMs = performance.now() - t0;
    queryLatencies.push(hebrewMs);

    const t1 = performance.now();
    const englishOut = await extractor(english, { pooling: "mean", normalize: true });
    const englishMs = performance.now() - t1;
    queryLatencies.push(englishMs);

    const hebrewVec = hebrewOut.data as Float32Array;
    const englishVec = englishOut.data as Float32Array;

    const ranked = sample
      .map((s, i) => ({ id: s.id, text: s.text, sim: cosineSim(hebrewVec, sampleVectors[i]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 5);
    const rankedEnglish = sample
      .map((s, i) => ({ id: s.id, sim: cosineSim(englishVec, sampleVectors[i]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3);

    console.log(`\nHebrew query: "${hebrew}"  (= "${english}")`);
    console.log(`  Hebrew query latency: ${fmtMs(hebrewMs)} | English control latency: ${fmtMs(englishMs)}`);
    console.log(`  Top-5 for HEBREW text:`);
    for (const r of ranked) console.log(`    ${r.sim.toFixed(3)}  ${r.id}  — ${r.text.slice(0, 70)}`);
    console.log(`  Top-3 for ENGLISH control (same meaning):`);
    for (const r of rankedEnglish) console.log(`    ${r.sim.toFixed(3)}  ${r.id}`);

    const overlap = ranked.slice(0, 3).filter((r) => rankedEnglish.some((e) => e.id === r.id)).length;
    console.log(`  Overlap between Hebrew top-3 and English-control top-3: ${overlap}/3`);
  }

  const avgQueryMs = queryLatencies.reduce((a, b) => a + b, 0) / queryLatencies.length;
  console.log(`\nAverage single-query embedding latency: ${fmtMs(avgQueryMs)}`);

  await extractor.dispose();

  return { onDiskBytes, coldLoadMs, warmLoadMs, dimensions, avgQueryMs };
}

async function main() {
  await rm(POC_CACHE_DIR, { recursive: true, force: true });
  await mkdir(POC_CACHE_DIR, { recursive: true });

  const sample = await pickSampleAssets();
  console.log(`Sample size: ${sample.length} real catalog assets.`);

  const summary: Record<string, Awaited<ReturnType<typeof runModel>>> = {};
  for (const candidate of MODELS) {
    summary[candidate.id] = await runModel(candidate, sample);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log("=".repeat(70));
  for (const candidate of MODELS) {
    const s = summary[candidate.id];
    console.log(
      `${candidate.id}: ${fmtMiB(s.onDiskBytes)} on disk, dim=${s.dimensions}, ` +
        `cold=${fmtMs(s.coldLoadMs)}, warm=${fmtMs(s.warmLoadMs)}, avg query=${fmtMs(s.avgQueryMs)}`,
    );
  }
}

main().catch((error) => {
  console.error("POC failed:", error);
  process.exitCode = 1;
});
