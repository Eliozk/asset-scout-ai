/**
 * Scripts whose text cannot be meaningfully matched against this app's
 * catalog: every provider's name/description/tags are English (or
 * transliterated Latin), and the production semantic model
 * (Xenova/all-MiniLM-L6-v2) is English-only, not a multilingual embedding
 * model — so a query written entirely in one of these scripts can't retrieve
 * relevant results via either keyword or semantic matching today.
 */
const NON_LATIN_SCRIPT_PATTERN =
  /[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Greek}\p{Script=Devanagari}\p{Script=Thai}]/u;

/**
 * True when the query contains at least one letter from a script this app
 * cannot search meaningfully (see NON_LATIN_SCRIPT_PATTERN). Used to show an
 * honest limitation notice instead of silently returning few/irrelevant
 * matches with no explanation.
 */
export function containsUnsupportedScript(text: string): boolean {
  return NON_LATIN_SCRIPT_PATTERN.test(text);
}
