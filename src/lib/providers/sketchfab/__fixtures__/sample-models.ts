/**
 * Static fixtures shaped exactly like real responses from
 * https://api.sketchfab.com/v3/search?type=models (verified against the
 * live public API, 2026-07, no token used), trimmed to the fields our
 * parser/normalizer actually use. Tests must never depend on the live
 * network — these fixtures are the contract.
 */

export const DOWNLOADABLE_CC_BY_MODEL = {
  uid: "9aea3b516d3e4e169710049b32282670",
  name: "The Wizard's Chair",
  description: "A prop made as a Digital Sculpting course assignment.",
  viewerUrl: "https://sketchfab.com/3d-models/none-9aea3b516d3e4e169710049b32282670",
  publishedAt: "2020-11-03T13:58:21.718675",
  isDownloadable: true,
  isAgeRestricted: false,
  faceCount: 999786,
  tags: [{ name: "chair" }, { name: "furniture" }, { name: "stylized" }],
  categories: [{ name: "art-abstract" }, { name: "furniture-home" }],
  thumbnails: {
    images: [
      { uid: "a", size: 1, width: 1920, height: 1080, url: "https://media.sketchfab.com/models/x/1920.jpeg" },
      { uid: "b", size: 1, width: 1024, height: 576, url: "https://media.sketchfab.com/models/x/1024.jpeg" },
      { uid: "c", size: 1, width: 256, height: 144, url: "https://media.sketchfab.com/models/x/256.jpeg" },
    ],
  },
  user: {
    uid: "5a7cfd6e11d3497199e8bc4e66a0d7cb",
    username: "SilkevdSmissen",
    displayName: "SilkevdSmissen",
    profileUrl: "https://sketchfab.com/SilkevdSmissen",
  },
  archives: {
    glb: { size: 34741352 },
    gltf: { size: 16567803 },
    source: { size: 28692055 },
    usdz: { size: 17115625 },
  },
  license: {
    uid: "34b725081a6a4184957efaec2cb84ed3",
    label: "CC Attribution-NonCommercial-NoDerivs",
  },
};

export const NULL_LICENSE_NON_DOWNLOADABLE_MODEL = {
  uid: "14ec4c0460c64065af1c6fd31f104344",
  name: "Dragon",
  description: "Dragon form for Dragon Knight (Dota 2)",
  viewerUrl: "https://sketchfab.com/3d-models/none-14ec4c0460c64065af1c6fd31f104344",
  publishedAt: "2015-03-28T22:50:07",
  isDownloadable: false,
  isAgeRestricted: false,
  faceCount: 6276,
  tags: [{ name: "dragon" }, { name: "dota2" }],
  categories: [{ name: "characters-creatures" }],
  thumbnails: {
    images: [{ uid: "d", size: 1, width: 1024, height: 576, url: "https://media.sketchfab.com/models/y/1024.jpeg" }],
  },
  user: {
    uid: "f1755cd24aa447849aee04e266fd3e8a",
    username: "stanislavpotlov",
    displayName: "Stanislav Potlov",
    profileUrl: "https://sketchfab.com/stanislavpotlov",
  },
  archives: {},
  license: null,
};

/** Age-restricted — must be excluded, same policy as Poly Haven's nsfw skip. */
export const AGE_RESTRICTED_MODEL = {
  ...NULL_LICENSE_NON_DOWNLOADABLE_MODEL,
  uid: "age-restricted-example",
  name: "Age Restricted Example",
  isAgeRestricted: true,
};

/** Missing thumbnails entirely. */
export const MALFORMED_MISSING_THUMBNAILS = {
  uid: "broken-1",
  name: "Broken Model",
  description: "",
  viewerUrl: "https://sketchfab.com/3d-models/broken-1",
  isDownloadable: false,
  tags: [],
  categories: [],
  user: { username: "someone", displayName: "Someone", profileUrl: "https://sketchfab.com/someone" },
  license: null,
};

/** Thumbnail URL on the wrong host — should never be trusted/rendered. */
export const MALFORMED_UNTRUSTED_THUMBNAIL_HOST = {
  uid: "broken-2",
  name: "Suspicious Model",
  description: "",
  viewerUrl: "https://sketchfab.com/3d-models/broken-2",
  isDownloadable: false,
  tags: [],
  categories: [],
  thumbnails: { images: [{ url: "https://evil.example.com/thumb.jpg", width: 512, height: 512 }] },
  user: { username: "someone", displayName: "Someone", profileUrl: "https://sketchfab.com/someone" },
  license: null,
};

/** viewerUrl not on the trusted sketchfab.com host. */
export const MALFORMED_UNTRUSTED_VIEWER_URL = {
  ...NULL_LICENSE_NON_DOWNLOADABLE_MODEL,
  uid: "broken-3",
  viewerUrl: "https://evil.example.com/3d-models/broken-3",
};

export const NOT_AN_OBJECT = "just a string, not a model record";

/**
 * Shaped like a real `/v3/models/{uid}` single-model-lookup response
 * (verified live, 2026-07), used to resolve a favorited Sketchfab asset by
 * id. Same overall model shape as a `/v3/search` entry, but its `license`
 * object has no `uid` field — just `label`/`uri`/`fullName`/`url`/`slug` —
 * which is the real, live-confirmed discrepancy parseLicense must tolerate.
 */
export const SINGLE_MODEL_LOOKUP_SHAPE = {
  uid: "fb0053a2e59b43868e934c239bf4eb36",
  name: "Black Dragon with Idle Animation",
  description: "",
  viewerUrl: "https://sketchfab.com/3d-models/black-dragon-with-idle-animation-fb0053a2e59b43868e934c239bf4eb36",
  publishedAt: "2015-08-18T16:58:03",
  isDownloadable: true,
  isAgeRestricted: false,
  faceCount: 37992,
  tags: [{ name: "dragon" }, { name: "game-ready" }],
  categories: [{ name: "characters-creatures" }],
  thumbnails: {
    images: [{ width: 1024, height: 576, url: "https://media.sketchfab.com/models/z/1024.jpeg" }],
  },
  user: {
    username: "someartist",
    displayName: "Some Artist",
    profileUrl: "https://sketchfab.com/someartist",
  },
  license: {
    uri: "https://api.sketchfab.com/v3/licenses/bbfe3f7dbcdd4122b966b85b9786a989",
    label: "CC Attribution-NonCommercial",
    fullName: "Creative Commons Attribution-NonCommercial",
    requirements: "Author must be credited. No commercial use.",
    url: "http://creativecommons.org/licenses/by-nc/4.0/",
    slug: "by-nc",
  },
};
