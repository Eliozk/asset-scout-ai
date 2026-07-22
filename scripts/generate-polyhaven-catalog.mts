/**
 * Milestone 5 Phase 2: generates the versioned static Poly Haven catalog
 * served by /api/providers/polyhaven in production (no ~3MB upstream fetch
 * on every serverless cold start — see fetch-assets.ts for why the old
 * process-local in-memory cache alone isn't reliable on Vercel). Run
 * manually with:
 *
 *   npm run polyhaven:generate
 *
 * Not part of `next build` — regenerate deliberately (see README's "Catalog
 * & embeddings refresh" section). This is the ONLY script that fetches Poly
 * Haven's live /assets endpoint; scripts/generate-embeddings.mts reads the
 * catalog.json this writes rather than fetching independently, so the two
 * artifacts can never drift out of sync with each other. Writes:
 *   - src/data/polyhaven-catalog/catalog.json   (AssetSearchResult[], imported by fetch-assets.ts)
 *   - src/data/polyhaven-catalog/manifest.json  (source url, generated-at, catalog version, counts)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFreshCatalog } from "@/lib/providers/polyhaven/fetch-assets";
import { computeCatalogVersion } from "@/lib/semantic/catalog-version";
import type { PolyHavenCatalogManifest } from "@/lib/providers/polyhaven/catalog-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(REPO_ROOT, "src", "data", "polyhaven-catalog");
const SOURCE_URL = "https://api.polyhaven.com/assets";
const LICENSE = "CC0";

async function main() {
  console.log(`Fetching Poly Haven's live catalog (${SOURCE_URL})...`);
  const { assets, totalUpstream, skipped } = await fetchFreshCatalog();
  console.log(`Fetched ${totalUpstream} upstream entries: ${assets.length} normalized, ${skipped} skipped.`);

  if (assets.length === 0) {
    throw new Error("Poly Haven catalog fetch produced zero valid entries — refusing to write an empty catalog.");
  }

  // Stable, deterministic ordering independent of upstream dict iteration order.
  // Same sort scripts/generate-embeddings.mts applies to whatever catalog it's
  // given, so re-running that script against this exact file reproduces the
  // exact same asset order and catalogVersion.
  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id));
  const assetIds = sortedAssets.map((asset) => asset.id);

  const manifest: PolyHavenCatalogManifest = {
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    catalogVersion: computeCatalogVersion(assetIds),
    count: sortedAssets.length,
    totalUpstream,
    skipped,
    license: LICENSE,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "catalog.json"), JSON.stringify(sortedAssets, null, 2) + "\n");
  await writeFile(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nWrote catalog.json (${sortedAssets.length} entries) and manifest.json.`);
  console.log(`Catalog version: ${manifest.catalogVersion}`);
  console.log("\nNext step: run `npm run embeddings:generate` to regenerate embeddings from this exact catalog.");
}

main().catch((error) => {
  console.error("Poly Haven catalog generation failed:", error);
  process.exitCode = 1;
});
