// Generic words that make the backend's exact-phrase product search miss the real product name
const SEARCH_FILLER_WORDS = new Set([
  'قهوه', 'قهوة', 'بن', 'سعر', 'اسعار', 'أسعار', 'بكم', 'كم', 'اريد', 'أريد', 'ابي', 'أبي', 'ابغى', 'أبغى',
  'منتج', 'عن', 'ما', 'هو', 'هي', 'في', 'من', 'لو', 'سمحت',
  'coffee', 'price', 'prices', 'cost', 'of', 'the', 'a', 'an', 'is', 'how', 'much', 'what', 'whats', 'for', 'want', 'need', 'i',
]);

// The backend matches letters exactly, so ه typed instead of ة (or vice versa) returns nothing
function arabicSpellingVariants(text: string): string[] {
  return Array.from(new Set([
    text,
    text.replace(/ه(?=\s|$)/g, 'ة'),
    text.replace(/ة(?=\s|$)/g, 'ه'),
  ]));
}

export function buildFallbackSearchQueries(query: string): string[] {
  const contentTokens = query
    .split(/[\s,.;:!?؟،"'()\-–|]+/)
    .filter((token) => token && !SEARCH_FILLER_WORDS.has(token.toLowerCase()));
  if (contentTokens.length === 0) return [];

  const queries = arabicSpellingVariants(contentTokens.join(' '));

  if (contentTokens.length > 1) {
    const longestFirst = contentTokens
      .filter((token) => token.length >= 3)
      .sort((a, b) => b.length - a.length);
    for (const token of longestFirst) queries.push(...arabicSpellingVariants(token));
  }

  return queries;
}
