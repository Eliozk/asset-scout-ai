import type { AssetSearchQuery } from "./query";
import type { AssetSearchResult } from "./types";

/**
 * Contract that every asset search backend must satisfy, whether it's the
 * in-memory mock used in this milestone or a future live integration with
 * Sketchfab, Fab, Unity Asset Store, etc. UI code only ever talks to this
 * interface, never to a provider's raw response shape.
 */
export interface AssetSearchProvider {
  readonly id: string;
  readonly label: string;
  search(query: AssetSearchQuery): Promise<AssetSearchResult[]>;
}
