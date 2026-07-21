/**
 * Milestone 3 Phase 1: generates the full-catalog embeddings artifact
 * shipped to the browser as static files. Run manually with:
 *
 *   npm run embeddings:generate
 *
 * Not part of `next build` — regenerate deliberately when the live Poly
 * Haven catalog changes materially. Writes:
 *   - public/semantic-search/embeddings.bin   (Float32Array, row-major, one row per asset)
 *   - public/semantic-search/manifest.json    (model id, dimensions, catalog version, ordered asset ids)
 */
import { env, pipeline } from "@huggingface/transformers";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPolyHavenCatalog } from "@/lib/providers/polyhaven/fetch-assets";
import { buildEmbeddingText } from "@/lib/semantic/embedding-text";
import { computeCatalogVersion } from "@/lib/semantic/catalog-version";
import type { SemanticManifest } from "@/lib/semantic/manifest";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EXPECTED_DIMENSIONS = 384;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(REPO_ROOT, "public", "semantic-search");

// Keep the downloaded model weights out of both `public/` (never shipped)
// and version control — gitignored, see .gitignore.
env.cacheDir = path.join(REPO_ROOT, ".cache", "transformers-model");

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  const start = performance.now();

  console.log("Fetching live Poly Haven catalog...");
  const { assets, totalUpstream, skipped } = await fetchPolyHavenCatalog();
  console.log(`Fetched ${assets.length} normalized assets (of ${totalUpstream} upstream, ${skipped} skipped).`);

  // Stable, deterministic ordering independent of upstream dict iteration order.
  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id));

  console.log(`Loading model "${MODEL_ID}" (dtype: q8)...`);
  const modelLoadStart = performance.now();
  const extractor = await pipeline("feature-extraction", MODEL_ID, { dtype: "q8" });
  console.log(`Model ready in ${formatMs(performance.now() - modelLoadStart)}.`);

  console.log(`Embedding ${sortedAssets.length} assets...`);
  const embedStart = performance.now();
  const embeddings = new Float32Array(sortedAssets.length * EXPECTED_DIMENSIONS);
  const assetIds: string[] = [];

  for (let i = 0; i < sortedAssets.length; i++) {
    const asset = sortedAssets[i];
    const text = buildEmbeddingText(asset);
    const output = await extractor(text, { pooling: "mean", normalize: true });
    const vector = output.data as Float32Array;

    if (vector.length !== EXPECTED_DIMENSIONS) {
      throw new Error(
        `Unexpected embedding dimension for "${asset.id}": got ${vector.length}, expected ${EXPECTED_DIMENSIONS}.`,
      );
    }

    embeddings.set(vector, i * EXPECTED_DIMENSIONS);
    assetIds.push(asset.id);

    if ((i + 1) % 250 === 0 || i === sortedAssets.length - 1) {
      console.log(`  ...${i + 1}/${sortedAssets.length}`);
    }
  }
  console.log(`Embedded all assets in ${formatMs(performance.now() - embedStart)}.`);

  const manifest: SemanticManifest = {
    modelId: MODEL_ID,
    dimensions: EXPECTED_DIMENSIONS,
    catalogVersion: computeCatalogVersion(assetIds),
    generatedAt: new Date().toISOString(),
    count: assetIds.length,
    assetIds,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "embeddings.bin"), Buffer.from(embeddings.buffer));
  await writeFile(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest));

  const bytes = embeddings.byteLength;
  console.log(`\nWrote embeddings.bin (${(bytes / 1024 / 1024).toFixed(2)} MiB) and manifest.json.`);
  console.log(`Catalog version: ${manifest.catalogVersion}`);
  console.log(`Total duration: ${formatMs(performance.now() - start)}.`);
}

main().catch((error) => {
  console.error("Embedding generation failed:", error);
  process.exitCode = 1;
});
