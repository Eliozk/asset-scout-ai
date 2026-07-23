/**
 * Static fixtures shaped exactly like real responses from
 * https://ambientcg.com/api/v2/full_json (verified against the live public
 * API, 2026-07, no key used), trimmed to the fields our parser/normalizer
 * actually use. Tests must never depend on the live network — these
 * fixtures are the contract.
 */

export const REAL_MATERIAL_ASSET = {
  assetId: "Wood095",
  displayName: "Wood 095",
  dataType: "Material",
  tags: ["wood", "beige", "polished", "modern"],
  shortLink: "https://ambientcg.com/a/Wood095",
  downloadCount: 33271,
  releaseDate: "2026-03-08 14:00:00",
  previewImage: {
    "512-PNG": "https://acg-media.struffelproductions.com/file/ambientCG-Web/media/thumbnail/512-PNG/Wood095.png",
    "512-JPG-FFFFFF": "https://acg-media.struffelproductions.com/file/ambientCG-Web/media/thumbnail/512-JPG-FFFFFF/Wood095.jpg",
  },
};

export const REAL_HDRI_ASSET = {
  assetId: "DaySkyHDRI065B",
  displayName: "Day Sky HDRI 065 B",
  dataType: "HDRI",
  tags: ["sky", "day", "clear", "outdoor"],
  shortLink: "https://ambientcg.com/a/DaySkyHDRI065B",
  downloadCount: 9120,
  releaseDate: "2025-11-01 10:00:00",
  previewImage: {
    "512-PNG": "https://acg-media.struffelproductions.com/file/ambientCG-Web/media/thumbnail/512-PNG/DaySkyHDRI065B.png",
  },
};

/** A dataType this app has no confident AssetType mapping for yet — must be skipped, not force-mapped. */
export const UNSUPPORTED_DATA_TYPE_ASSET = {
  ...REAL_MATERIAL_ASSET,
  assetId: "Decal001",
  dataType: "Decal",
};

/** Missing previewImage entirely. */
export const MALFORMED_MISSING_PREVIEW = {
  assetId: "Broken001",
  displayName: "Broken Asset",
  dataType: "Material",
  tags: [],
  shortLink: "https://ambientcg.com/a/Broken001",
};

/** shortLink on the wrong host — should never be trusted. */
export const MALFORMED_UNTRUSTED_SHORTLINK = {
  ...REAL_MATERIAL_ASSET,
  assetId: "Broken002",
  shortLink: "https://evil.example.com/a/Broken002",
};

/** previewImage URL on the wrong host — should never be trusted/rendered. */
export const MALFORMED_UNTRUSTED_IMAGE_HOST = {
  ...REAL_MATERIAL_ASSET,
  assetId: "Broken003",
  previewImage: { "512-PNG": "https://evil.example.com/thumb.png" },
};

export const NOT_AN_OBJECT = "just a string, not an asset record";
