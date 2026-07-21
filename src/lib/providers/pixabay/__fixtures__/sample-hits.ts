/**
 * Fixtures shaped exactly like Pixabay's own documented example response at
 * https://pixabay.com/api/docs/ (fetched live, 2026-07 — official docs, not
 * scraped page content). We don't have a Pixabay API key (per the
 * constraint against creating one on the user's behalf), so these are the
 * authoritative shape to test against rather than a live-captured response.
 */

export const PHOTO_HIT = {
  id: 195893,
  pageURL: "https://pixabay.com/en/blossom-bloom-flower-195893/",
  type: "photo",
  tags: "blossom, bloom, flower",
  previewURL: "https://cdn.pixabay.com/photo/2013/10/15/09/12/flower-195893_150.jpg",
  previewWidth: 150,
  previewHeight: 84,
  webformatURL: "https://pixabay.com/get/35bbf209e13e39d2_640.jpg",
  webformatWidth: 640,
  webformatHeight: 360,
  largeImageURL: "https://pixabay.com/get/ed6a99fd0a76647_1280.jpg",
  imageWidth: 4000,
  imageHeight: 2250,
  imageSize: 4731420,
  views: 7671,
  downloads: 6439,
  likes: 5,
  comments: 2,
  user_id: 48777,
  user: "Josch13",
  userImageURL: "https://cdn.pixabay.com/user/2013/11/05/02-10-23-764_250x250.jpg",
};

export const ILLUSTRATION_HIT = {
  ...PHOTO_HIT,
  id: 73424,
  pageURL: "https://pixabay.com/en/some-illustration-73424/",
  type: "illustration",
  tags: "background, abstract, wallpaper",
  user: "SomeIllustrator",
};

export const VECTOR_HIT = {
  ...PHOTO_HIT,
  id: 55555,
  pageURL: "https://pixabay.com/en/some-vector-55555/",
  type: "vector",
  tags: "icon, flat, design",
  user: "SomeVectorArtist",
};

/** Untrusted image host — must be rejected. */
export const MALFORMED_UNTRUSTED_IMAGE_HOST = {
  ...PHOTO_HIT,
  id: 99991,
  previewURL: "https://evil.example.com/preview.jpg",
};

/** pageURL not on pixabay.com — must be rejected. */
export const MALFORMED_UNTRUSTED_PAGE_URL = {
  ...PHOTO_HIT,
  id: 99992,
  pageURL: "https://evil.example.com/en/x-99992/",
};

/** Missing user entirely — must be rejected. */
export const MALFORMED_MISSING_USER = {
  ...PHOTO_HIT,
  id: 99993,
  user: "",
};

export const NOT_AN_OBJECT = "just a string, not a hit record";

export function searchResponse(...hits: readonly unknown[]) {
  return { total: hits.length, totalHits: hits.length, hits };
}
