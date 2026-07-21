import type { AssetSearchQuery, AssetSearchResult } from "@/domain/asset";
import { tokenizeSearchText } from "./tokenize";

export interface Relevance {
  readonly score: number;
  readonly reasons: readonly string[];
}

/**
 * Deterministic relevance scoring for live provider results — tag/text/
 * category/license overlap with the current query. This is explicitly NOT an
 * AI judgment; it exists so live results can show an honest "Relevance"
 * indicator instead of the mock dataset's hand-authored placeholder score.
 */
export function computeRelevance(asset: AssetSearchResult, query: AssetSearchQuery): Relevance {
  const reasons: string[] = [];
  let score = 40;

  const terms = tokenizeSearchText(query.text);
  if (terms.length > 0) {
    const tagSet = new Set(asset.tags.map((tag) => tag.toLowerCase()));
    const haystack = `${asset.name} ${asset.description}`.toLowerCase();
    const matchedTerms = terms.filter((term) => tagSet.has(term) || haystack.includes(term));
    if (matchedTerms.length > 0) {
      score += Math.round((matchedTerms.length / terms.length) * 40);
      reasons.push(`matches "${matchedTerms.join(", ")}"`);
    }
  }

  if (query.category !== "all" && (asset.category === query.category || asset.category === "both")) {
    score += 10;
    reasons.push(`${query.category} asset`);
  }

  if (query.contextTags.length > 0) {
    const tagSet = new Set(asset.tags.map((tag) => tag.toLowerCase()));
    const matchedContext = query.contextTags.filter((tag) => tagSet.has(tag.toLowerCase()));
    if (matchedContext.length > 0) {
      score += 10;
      reasons.push(`tagged ${matchedContext.join(", ")}`);
    }
  }

  if (asset.license === "CC0") {
    reasons.push("CC0 — free for any use");
  } else if (asset.pricing.model === "free") {
    reasons.push("free to use");
  }

  return { score: Math.max(0, Math.min(99, score)), reasons };
}

export function formatWhyItFits(relevance: Relevance): string {
  if (relevance.reasons.length === 0) {
    return "Matches your current filters.";
  }
  const [first, ...rest] = relevance.reasons;
  const capitalized = first.charAt(0).toUpperCase() + first.slice(1);
  return [capitalized, ...rest].join(" · ") + ".";
}
