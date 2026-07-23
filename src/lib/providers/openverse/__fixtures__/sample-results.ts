/**
 * Static fixtures shaped exactly like real responses from
 * api.openverse.org/v1/images/ (verified against the live public API,
 * 2026-07, anonymous access, no key used). Tests must never depend on the
 * live network — these fixtures are the contract.
 */

export const CC_BY_SA_RESULT = {
  id: "4c9447af-dc33-4d64-b4ad-127c5b62597c",
  title: "Robots",
  foreign_landing_url: "https://www.flickr.com/photos/59568944@N00/130151351",
  url: "https://live.staticflickr.com/1/130151351_82d99c375c.jpg",
  creator: "ralphhogaboom",
  license: "by-sa",
  license_version: "2.0",
  attribution: '"Robots" by ralphhogaboom is licensed under CC BY-SA 2.0.',
  tags: [{ name: "robot" }, { name: "robots" }],
  mature: false,
  width: 500,
  height: 375,
  thumbnail: "https://api.openverse.org/v1/images/4c9447af-dc33-4d64-b4ad-127c5b62597c/thumb/",
};

export const CC0_RESULT = {
  id: "aaaa1111-2222-3333-4444-555566667777",
  title: "Public domain gear icon",
  foreign_landing_url: "https://openverse.example.org/gear-icon",
  url: "https://example-cdn.org/gear.png",
  creator: "someone",
  license: "cc0",
  attribution: '"Public domain gear icon" is marked CC0 1.0.',
  tags: [],
  mature: false,
  thumbnail: "https://api.openverse.org/v1/images/aaaa1111-2222-3333-4444-555566667777/thumb/",
};

/** Flagged mature — must always be excluded. */
export const MATURE_RESULT = { ...CC_BY_SA_RESULT, id: "mature-1", mature: true };

/** Missing thumbnail entirely. */
export const MALFORMED_MISSING_THUMBNAIL = {
  id: "broken-1",
  title: "Broken Result",
  foreign_landing_url: "https://example.org/broken",
  license: "by",
  mature: false,
};

/** Thumbnail on the wrong host — should never be trusted/rendered. */
export const MALFORMED_UNTRUSTED_THUMBNAIL_HOST = {
  ...CC_BY_SA_RESULT,
  id: "broken-2",
  thumbnail: "https://evil.example.com/thumb.jpg",
};

export const NOT_AN_OBJECT = "just a string, not a result record";
