/**
 * Static fixtures shaped exactly like real responses from
 * images-api.nasa.gov/search (verified against the live public API,
 * 2026-07, no key used). Tests must never depend on the live network — these
 * fixtures are the contract.
 */

export const REAL_IMAGE_ITEM = {
  href: "https://images-assets.nasa.gov/image/PIA07081/collection.json",
  data: [
    {
      center: "JPL",
      date_created: "2004-11-30T21:29:24Z",
      description: "Mars Rover Studies Soil on Mars",
      keywords: ["Mars", "Mars Exploration Rover MER"],
      media_type: "image",
      nasa_id: "PIA07081",
      secondary_creator: "NASA/JPL",
      title: "Mars Rover Studies Soil on Mars",
    },
  ],
  links: [
    {
      href: "https://images-assets.nasa.gov/image/PIA07081/PIA07081~thumb.jpg",
      rel: "preview",
      render: "image",
      width: 640,
      height: 640,
    },
    {
      href: "https://images-assets.nasa.gov/image/PIA07081/PIA07081~orig.jpg",
      rel: "canonical",
      render: "image",
      width: 1024,
      height: 1024,
    },
  ],
};

/** A video item — must be skipped, this app only shows images. */
export const VIDEO_ITEM = {
  href: "https://images-assets.nasa.gov/video/abc/collection.json",
  data: [
    {
      nasa_id: "video-abc",
      title: "A NASA video",
      media_type: "video",
    },
  ],
  links: [{ href: "https://images-assets.nasa.gov/video/abc/thumb.jpg", rel: "preview" }],
};

/** Missing links entirely. */
export const MALFORMED_NO_LINKS = {
  href: "https://images-assets.nasa.gov/image/broken/collection.json",
  data: [{ nasa_id: "broken-1", title: "Broken Item", media_type: "image" }],
  links: [],
};

/** Link href on the wrong host — should never be trusted/rendered. */
export const MALFORMED_UNTRUSTED_HOST = {
  href: "https://images-assets.nasa.gov/image/broken2/collection.json",
  data: [{ nasa_id: "broken-2", title: "Suspicious Item", media_type: "image" }],
  links: [{ href: "https://evil.example.com/thumb.jpg", rel: "preview" }],
};

export const NOT_AN_OBJECT = "just a string, not an item record";
