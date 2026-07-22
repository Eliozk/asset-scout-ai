import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isValidPolyHavenCatalogManifest, validatePolyHavenCatalog } from "@/lib/providers/polyhaven/catalog-schema";
import { parseSemanticManifest } from "./manifest";
import { computeCatalogVersion } from "./catalog-version";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(REPO_ROOT, relativePath), "utf-8"));
}

/**
 * Guards against exactly the failure mode Milestone 5 Phase 2 set out to
 * prevent: scripts/generate-polyhaven-catalog.mts and
 * scripts/generate-embeddings.mts being run independently (or only one of
 * them re-run) and silently drifting apart. Since `npm run embeddings:generate`
 * now reads the committed catalog.json rather than fetching Poly Haven live,
 * these two committed artifacts SHOULD always be generated together (see
 * `npm run catalog:refresh` and README's "Catalog & embeddings refresh")
 * and therefore always agree — a failure here means someone committed one
 * without the other.
 */
describe("Poly Haven catalog <-> semantic embeddings consistency", () => {
  it("the committed catalog and embeddings manifest are both present and individually well-formed", () => {
    const catalog = validatePolyHavenCatalog(readJson("src/data/polyhaven-catalog/catalog.json"));
    const catalogManifest = readJson("src/data/polyhaven-catalog/manifest.json");
    const semanticManifest = parseSemanticManifest(readJson("public/semantic-search/manifest.json"));

    expect(catalog.length).toBeGreaterThan(0);
    expect(isValidPolyHavenCatalogManifest(catalogManifest)).toBe(true);
    expect(semanticManifest).not.toBeNull();
  });

  it("every embedded asset id actually exists in the current Poly Haven catalog (no orphaned/mismatched-source ids)", () => {
    const catalog = validatePolyHavenCatalog(readJson("src/data/polyhaven-catalog/catalog.json"));
    const catalogIds = new Set(catalog.map((asset) => asset.id));
    const semanticManifest = parseSemanticManifest(readJson("public/semantic-search/manifest.json"));

    expect(semanticManifest).not.toBeNull();
    for (const id of semanticManifest!.assetIds) {
      expect(catalogIds.has(id)).toBe(true);
    }
  });

  it("the embeddings manifest's catalogVersion matches a fresh hash of its own assetIds (internal self-consistency)", () => {
    const semanticManifest = parseSemanticManifest(readJson("public/semantic-search/manifest.json"));
    expect(semanticManifest).not.toBeNull();
    expect(semanticManifest!.catalogVersion).toBe(computeCatalogVersion(semanticManifest!.assetIds));
  });

  it("the committed catalog and the embeddings manifest were generated from the exact same catalogVersion", () => {
    const catalogManifest = readJson("src/data/polyhaven-catalog/manifest.json");
    const semanticManifest = parseSemanticManifest(readJson("public/semantic-search/manifest.json"));

    expect(isValidPolyHavenCatalogManifest(catalogManifest)).toBe(true);
    expect(semanticManifest).not.toBeNull();
    expect(semanticManifest!.catalogVersion).toBe((catalogManifest as { catalogVersion: string }).catalogVersion);
  });
});
