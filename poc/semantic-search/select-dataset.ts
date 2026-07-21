import type { AssetSearchResult } from "@/domain/asset/types";

/**
 * Milestone 3 Phase 0 proof-of-concept only. Not imported by production code.
 *
 * Deterministically selects a 40-60 asset subset of the live Poly Haven
 * catalog for the semantic-search POC, guaranteeing coverage of the asset
 * groups the task requires: the "Dirty Football" anchor asset, several
 * unrelated models, concrete/weathered textures, and genuine sunset/city
 * skyline HDRIs — plus a diverse filler of other assets up to the target
 * size.
 *
 * All keyword lists and the PREFERRED_CITY_SKYLINE_IDS list below were
 * calibrated against the real live Poly Haven catalog (verified via the
 * public API before writing this), not guessed. If Poly Haven ever removes
 * one of these specific assets, selection simply skips it — nothing here is
 * ever fabricated.
 */

const CONCRETE_WEATHERED_TERMS = ["concrete", "weathered", "worn", "cracked", "damaged"];
const SUNSET_TERMS = ["sunset", "sunrise", "dusk", "twilight", "golden hour", "evening"];
const CITY_TERMS = ["city", "skyline", "riverside", "rooftop", "downtown", "urban"];
const INDOOR_EXCLUDE_TERMS = ["abandoned", "interior", "room", "hall", "workshop", "canteen", "warehouse"];
const OUTDOOR_TERMS = ["outdoor"];

/**
 * Specific real, live Poly Haven HDRIs confirmed (by exact id, via the live
 * API) to genuinely depict an evening/twilight city skyline — the task's
 * examples, plus one more of the same caliber found the same way.
 */
const PREFERRED_CITY_SKYLINE_IDS = ["sunset_jhbcentral", "shanghai_riverside", "rooftop_night"];

function haystackOf(asset: AssetSearchResult): string {
  return `${asset.name} ${asset.tags.join(" ")}`.toLowerCase();
}

function matchesAny(asset: AssetSearchResult, terms: readonly string[]): boolean {
  const haystack = haystackOf(asset);
  return terms.some((term) => haystack.includes(term));
}

function looksIndoor(asset: AssetSearchResult): boolean {
  return matchesAny(asset, INDOOR_EXCLUDE_TERMS);
}

export interface PocDatasetSelection {
  readonly assets: readonly AssetSearchResult[];
  readonly anchorFound: boolean;
  /** Which of PREFERRED_CITY_SKYLINE_IDS were actually present in the live catalog and included. */
  readonly citySkylineIdsFound: readonly string[];
}

export function selectPocDataset(
  catalog: readonly AssetSearchResult[],
  targetSize = 48,
): PocDatasetSelection {
  const selected = new Map<string, AssetSearchResult>();
  const add = (asset: AssetSearchResult | undefined) => {
    if (asset && !selected.has(asset.id)) selected.set(asset.id, asset);
  };
  const byId = new Map(catalog.map((asset) => [asset.id, asset]));

  // 1. The anchor asset the whole POC exists to test (query 1's target).
  const anchor = catalog.find((asset) => asset.name.toLowerCase() === "dirty football");
  add(anchor);

  // 2. A few OTHER football/sports assets — near-neighbors that a naive
  //    "exact title" search might confuse with the anchor.
  catalog
    .filter((asset) => asset.id !== anchor?.id && matchesAny(asset, ["football", "soccer"]))
    .slice(0, 3)
    .forEach(add);

  // 3. Concrete / weathered textures (query 2's targets).
  catalog
    .filter((asset) => asset.assetType === "Texture" && matchesAny(asset, CONCRETE_WEATHERED_TERMS))
    .slice(0, 8)
    .forEach(add);

  // 4. Guaranteed genuine city-skyline HDRIs (query 3's targets), by exact
  //    id — real assets confirmed live, never fabricated. Note ids that
  //    turn out to be absent, so we can report that honestly.
  const citySkylineIdsFound: string[] = [];
  for (const id of PREFERRED_CITY_SKYLINE_IDS) {
    const asset = byId.get(`polyhaven:${id}`) ?? byId.get(id);
    if (asset) {
      citySkylineIdsFound.push(id);
      add(asset);
    }
  }

  // 5. More genuine city/sunset HDRIs by keyword, explicitly excluding
  //    assets that just sound like an indoor/abandoned interior scene —
  //    the false positives Phase 0 pulled in.
  catalog
    .filter(
      (asset) =>
        asset.assetType === "HDRI" &&
        !looksIndoor(asset) &&
        (matchesAny(asset, SUNSET_TERMS) || matchesAny(asset, CITY_TERMS)),
    )
    .slice(0, 10)
    .forEach(add);

  // 6. General outdoor HDRIs as lighter filler for variety.
  catalog
    .filter((asset) => asset.assetType === "HDRI" && !looksIndoor(asset) && matchesAny(asset, OUTDOOR_TERMS))
    .slice(0, 4)
    .forEach(add);

  // 7. Several unrelated models — unambiguous negative examples.
  catalog
    .filter(
      (asset) =>
        asset.assetType !== "HDRI" &&
        asset.assetType !== "Texture" &&
        !matchesAny(asset, ["football", "soccer", ...CONCRETE_WEATHERED_TERMS]),
    )
    .slice(0, 10)
    .forEach(add);

  // 8. Fill remaining slots with a spread across the rest of the catalog
  //    for general diversity, without overriding anything already chosen.
  const step = Math.max(1, Math.floor(catalog.length / targetSize));
  for (let i = 0; selected.size < targetSize && i < catalog.length; i += step) {
    add(catalog[i]);
  }
  for (let i = 0; selected.size < targetSize && i < catalog.length; i++) {
    add(catalog[i]);
  }

  return {
    assets: [...selected.values()].slice(0, targetSize),
    anchorFound: anchor !== undefined,
    citySkylineIdsFound,
  };
}
