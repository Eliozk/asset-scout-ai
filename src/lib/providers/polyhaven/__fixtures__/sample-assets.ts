/**
 * Static fixtures shaped exactly like real responses from GET
 * https://api.polyhaven.com/assets (verified against the live API,
 * 2026-07), trimmed to the fields our normalizer/parser actually use. Tests
 * must never depend on the live network — these fixtures are the contract.
 */

export const HDRI_FIXTURE = {
  type: 0,
  name: "Aarfontein Dirt Road",
  categories: ["outdoor", "nature", "natural light", "high contrast", "clear", "morning-afternoon"],
  tags: ["sun", "arid", "gravel", "dirt road", "scrubland", "tracks", "erosion", "backplates"],
  description:
    "Unclipped, free 24K HDRI: sun low over a scrubby dirt road beneath a clear blue sky, warm golden-hour light casting long shadows with crisp contrast.",
  authors: { "Jarod Guest": "backplates", "Dario Barresi": "all" },
  date_published: 1782777600,
  max_resolution: [24576, 12288],
  download_count: 3075,
  thumbnail_url: "https://cdn.polyhaven.com/asset_img/thumbs/aarfontein_dirt_road.png?width=256&height=256",
};

export const TEXTURE_FIXTURE = {
  type: 1,
  name: "Aerial Asphalt 01",
  categories: ["asphalt", "outdoor", "floor", "road", "man made", "aerial"],
  tags: ["road", "flat", "cracked"],
  description:
    "Free 8K asphalt texture of a flat, worn road with subtle cracks, faint tire marks and gritty surface - ideal for aerial, outdoor, road and floor scenes.",
  authors: { "Rob Tuytel": "All" },
  date_published: 1597061145,
  dimensions: [30000, 30000],
  max_resolution: [8192, 8192],
  download_count: 144299,
  thumbnail_url: "https://cdn.polyhaven.com/asset_img/thumbs/aerial_asphalt_01.png?width=256&height=256",
};

export const MODEL_FIXTURE = {
  type: 2,
  name: "Arm Chair 01",
  categories: ["furniture", "seating"],
  tags: ["gothic", "vintage", "chair", "furniture", "victorian", "couch", "wood", "varnished", "classic"],
  description:
    "Free (CC0) vintage Victorian armchair 3D model - varnished carved wood frame, upholstered seat; gothic/classic styling ideal for interiors, period scenes, and renders.",
  authors: { "Kirill Sannikov": "All" },
  date_published: 1585605600,
  dimensions: [848.4309017658234, 765.7602727413177, 1065.087635157397],
  max_resolution: [4096, 4096],
  polycount: 5626,
  lods: true,
  download_count: 31416,
  thumbnail_url: "https://cdn.polyhaven.com/asset_img/thumbs/ArmChair_01.png?width=256&height=256",
};

export const MODEL_FIXTURE_UNKNOWN_CATEGORY = {
  ...MODEL_FIXTURE,
  categories: ["some-brand-new-category-poly-haven-added-later"],
};

/** Missing thumbnail_url entirely. */
export const MALFORMED_MISSING_THUMBNAIL = {
  type: 2,
  name: "Broken Asset",
  categories: ["props"],
  tags: [],
  authors: {},
};

/** thumbnail_url on the wrong host — should never be trusted/rendered. */
export const MALFORMED_WRONG_THUMBNAIL_HOST = {
  type: 1,
  name: "Suspicious Asset",
  categories: ["floor"],
  tags: [],
  authors: {},
  thumbnail_url: "https://evil.example.com/thumb.png",
};

/** Invalid `type` value outside the documented 0/1/2 range. */
export const MALFORMED_UNKNOWN_TYPE = {
  type: 99,
  name: "Future Asset Type",
  categories: [],
  tags: [],
  authors: {},
  thumbnail_url: "https://cdn.polyhaven.com/asset_img/thumbs/future.png",
};

/** Flagged NSFW upstream — must be excluded from a portfolio search app. */
export const MALFORMED_NSFW = {
  ...HDRI_FIXTURE,
  name: "NSFW Asset",
  nsfw: true,
};

export const NOT_AN_OBJECT = "just a string, not an asset record";
