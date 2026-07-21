/**
 * Milestone 4 Phase 2: generates the versioned static Kenney catalog shipped
 * as part of the app bundle (zero network calls at search time). Run
 * manually with:
 *
 *   npm run kenney:generate
 *
 * Not part of `next build` — regenerate deliberately when Kenney's feed has
 * new releases worth indexing. Fetches ONLY Kenney's official public feed
 * (https://kenney.nl/feed, "Latest game assets") — no scraping, no browser
 * automation, no account/API key. That feed is deliberately small (the ~25
 * most recent asset-pack releases), so this is an "Authorized Indexed
 * Catalog" of recent Kenney releases, not Kenney's full historical library.
 * Writes:
 *   - src/data/kenney-catalog/catalog.json   (AssetSearchResult[], statically imported by the provider)
 *   - src/data/kenney-catalog/manifest.json  (source url, generated-at, catalog version, license, scope note)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchKenneyFeedXml, parseAndNormalizeFeed } from "@/lib/providers/kenney/fetch-feed";
import { computeCatalogVersion } from "@/lib/semantic/catalog-version";
import type { KenneyCatalogManifest } from "@/lib/providers/kenney/catalog-schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(REPO_ROOT, "src", "data", "kenney-catalog");
const SOURCE_URL = "https://kenney.nl/feed";
const LICENSE = "CC0";
const SCOPE_NOTE =
  "Kenney's official public feed only lists the most recent asset-pack releases " +
  "(observed: the latest 25 at generation time) — this is NOT Kenney's full historical catalog.";

async function main() {
  console.log(`Fetching Kenney's official feed (${SOURCE_URL})...`);
  const xml = await fetchKenneyFeedXml();

  const { assets, totalUpstream, skipped } = parseAndNormalizeFeed(xml);
  console.log(`Parsed ${totalUpstream} upstream items: ${assets.length} normalized, ${skipped} skipped.`);

  if (assets.length === 0) {
    throw new Error("Kenney feed produced zero valid entries — refusing to write an empty catalog.");
  }

  // Stable, deterministic ordering independent of upstream feed order.
  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id));
  const assetIds = sortedAssets.map((asset) => asset.id);

  const manifest: KenneyCatalogManifest = {
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    catalogVersion: computeCatalogVersion(assetIds),
    count: sortedAssets.length,
    skipped,
    license: LICENSE,
    scope: SCOPE_NOTE,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "catalog.json"), JSON.stringify(sortedAssets, null, 2) + "\n");
  await writeFile(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nWrote catalog.json (${sortedAssets.length} entries) and manifest.json.`);
  console.log(`Catalog version: ${manifest.catalogVersion}`);
}

main().catch((error) => {
  console.error("Kenney catalog generation failed:", error);
  process.exitCode = 1;
});
