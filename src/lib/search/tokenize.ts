/**
 * Concise English stopword list: common words that carry no search meaning
 * on their own. Deliberately short — game-asset terms that happen to be
 * short (2d, 3d, ui, vr, hdri, pbr) must never end up in this set.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  "a",
  "an",
  "the",
  "for",
  "with",
  "of",
  "in",
  "on",
  "to",
  "and",
  "or",
  "from",
  "by",
  "at",
  "is",
  "are",
]);

/**
 * Splits free-text search input into meaningful lowercase terms:
 * - strips leading/trailing punctuation from each word, but keeps internal
 *   hyphens intact so compound terms like "low-poly" stay one token instead
 *   of being split or mangled — the one place hyphen handling happens, so
 *   it's applied consistently everywhere this tokenizer is used;
 * - drops common English stopwords (see STOPWORDS above);
 * - drops single-character noise tokens, without touching short-but-real
 *   game-asset terms ("2d", "3d", "ui", "vr" are all length 2+ and pass
 *   through untouched).
 *
 * Used by both the keyword filter (filter.ts) and the deterministic
 * relevance scorer (relevance.ts) so search and ranking agree on what
 * counts as a meaningful term.
 */
export function tokenizeSearchText(text: string): string[] {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^\w-]+|[^\w-]+$/g, ""))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}
