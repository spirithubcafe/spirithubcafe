interface CoffeeOrigin {
  query: string;
  aliases: string[];
}

const ORIGINS: CoffeeOrigin[] = [
  { query: 'Ethiopia', aliases: ['اثيوبيا', 'الحبشه'] },
  { query: 'Colombia', aliases: ['كولومبيا', 'كلومبيا', 'كولمبيا'] },
  { query: 'Brazil', aliases: ['البرازيل', 'برازيل'] },
  { query: 'Kenya', aliases: ['كينيا'] },
  { query: 'Panama', aliases: ['بنما'] },
  { query: 'Costa Rica', aliases: ['كوستاريكا', 'كوستا ريكا'] },
  { query: 'El Salvador', aliases: ['السلفادور', 'سلفادور'] },
  { query: 'Guatemala', aliases: ['غواتيمالا', 'جواتيمالا'] },
  { query: 'Rwanda', aliases: ['رواندا'] },
  { query: 'Burundi', aliases: ['بوروندي', 'بروندي'] },
  { query: 'Yemen', aliases: ['اليمن', 'يمن'] },
  { query: 'Indonesia', aliases: ['اندونيسيا', 'إندونيسيا'] },
];

const normalizeArabic = (value: string): string => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u064b-\u065f\u0670]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/[^\u0621-\u063a\u0641-\u064a\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const editDistance = (left: string, right: string): number => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return row[right.length];
};

export const resolveCoffeeOrigin = (userText: string): string | null => {
  const normalized = normalizeArabic(userText);
  if (!normalized) return null;

  for (const origin of ORIGINS) {
    if (origin.aliases.some((alias) => normalized.includes(normalizeArabic(alias)))) return origin.query;
  }

  const meaningfulWords = normalized
    .split(' ')
    .filter((word) => word.length >= 4 && !['قهوه', 'بنفس', 'اريد', 'ابحث', 'منتج', 'منتجات'].includes(word));
  for (const origin of ORIGINS) {
    for (const alias of origin.aliases) {
      const candidate = normalizeArabic(alias).replace(/\s/g, '');
      const allowedDistance = candidate.length >= 8 ? 2 : 1;
      if (meaningfulWords.some((word) => editDistance(word, candidate) <= allowedDistance)) return origin.query;
      if (editDistance(normalized.replace(/\s/g, ''), candidate) <= allowedDistance) return origin.query;
    }
  }

  return null;
};

