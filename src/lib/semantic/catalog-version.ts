/**
 * Deterministic, dependency-free hash of the asset id set embeddings were
 * generated from. Not a security hash — just a cheap, stable change-detector
 * stamped into manifest.json so it's obvious from the file alone whether the
 * embeddings still correspond to the catalog they were built against.
 */
export function computeCatalogVersion(assetIds: readonly string[]): string {
  const sorted = [...assetIds].sort();
  const input = `${sorted.length}:${sorted.join(",")}`;

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
