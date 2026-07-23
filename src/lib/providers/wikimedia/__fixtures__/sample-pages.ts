/**
 * Static fixtures shaped exactly like real responses from
 * commons.wikimedia.org/w/api.php (action=query&generator=search...),
 * verified against the live public API (2026-07). Tests must never depend on
 * the live network — these fixtures are the contract.
 */

export const CC_BY_PAGE = {
  pageid: 112631640,
  title: "File:Albion Hospitaller Medieval Sword 1 (6092737619) (II).jpg",
  imageinfo: [
    {
      thumburl:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Albion_Sword.jpg/512px-Albion_Sword.jpg",
      url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Albion_Sword.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Albion_Hospitaller_Medieval_Sword_1_(6092737619)_(II).jpg",
      width: 2732,
      height: 588,
      extmetadata: {
        Artist: { value: '<a href="https://www.flickr.com/people/53303459@N03">Søren Niedziella</a>' },
        LicenseShortName: { value: "CC BY 2.0" },
        License: { value: "cc-by-2.0" },
      },
    },
  ],
};

export const CC0_PAGE = {
  pageid: 55000111,
  title: "File:Public Domain Rock Texture.png",
  imageinfo: [
    {
      thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Rock.png/512px-Rock.png",
      url: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Rock.png",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Public_Domain_Rock_Texture.png",
      width: 1024,
      height: 768,
      extmetadata: {
        LicenseShortName: { value: "CC0 1.0" },
        License: { value: "cc0-1.0" },
      },
    },
  ],
};

export const NO_LICENSE_METADATA_PAGE = {
  pageid: 77000222,
  title: "File:Unknown License Item.jpg",
  imageinfo: [
    {
      thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Unknown.jpg/512px-Unknown.jpg",
      url: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Unknown.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Unknown_License_Item.jpg",
    },
  ],
};

/** Missing imageinfo entirely. */
export const MALFORMED_NO_IMAGEINFO = {
  pageid: 1,
  title: "File:Broken.jpg",
  imageinfo: [],
};

/** thumburl/url on the wrong host — should never be trusted/rendered. */
export const MALFORMED_UNTRUSTED_HOST = {
  pageid: 2,
  title: "File:Suspicious.jpg",
  imageinfo: [
    {
      thumburl: "https://evil.example.com/thumb.jpg",
      url: "https://evil.example.com/full.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Suspicious.jpg",
    },
  ],
};

/** Not a File-namespace title. */
export const MALFORMED_NOT_A_FILE = {
  pageid: 3,
  title: "Category:Swords",
  imageinfo: [
    {
      thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/X.jpg/512px-X.jpg",
      url: "https://upload.wikimedia.org/wikipedia/commons/c/cc/X.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/Category:Swords",
    },
  ],
};

export const NOT_AN_OBJECT = "just a string, not a page record";
