export interface RoutableChatProduct {
  id: number;
  name: string;
  category?: string;
  tastingNotes?: string;
  tastingNotesAr?: string;
  description?: string;
  tags?: string[];
  brewMethods?: string[];
  isInStock?: boolean;
  stockQuantity?: number;
  matchReason?: string;
  matchReasonAr?: string;
}

const FRUIT = /fruit|berry|berries|citrus|lemon|orange|peach|apricot|mango|pineapple|strawberry|blueberry|raspberry|cherry|grape|فاكه|فواكه|توت|حمضيات|ليمون|برتقال|خوخ|كرز/i;
const FILTER = /v\s*60|pour[ -]?over|filter|drip|كاليتا|ترشيح|فلتر/i;
const EXCLUDED = /capsule|pod|equipment|accessor|paper|filter paper|brewer|grinder|kettle|machine|كبسول|معدات|ورق|مطحنة|غلاية|ماكينة/i;

const searchable = (product: RoutableChatProduct): string => [
  product.name, product.category, product.tastingNotes, product.tastingNotesAr,
  product.description, ...(product.tags ?? []), ...(product.brewMethods ?? []),
].filter(Boolean).join(' ');

export const dedupeProductsById = <T extends { id: number }>(products: T[]): T[] => {
  const seen = new Set<number>();
  return products.filter((product) => product.id > 0 && !seen.has(product.id) && Boolean(seen.add(product.id)));
};

export const selectFruityFilterCoffees = <T extends RoutableChatProduct>(products: T[]): T[] =>
  dedupeProductsById(products).filter((product) => {
    const text = searchable(product);
    const inStock = product.isInStock === true || (product.stockQuantity ?? 0) > 0;
    return inStock && FILTER.test(text) && FRUIT.test(text) && !EXCLUDED.test(`${product.name} ${product.category ?? ''}`);
  }).map((product) => ({
    ...product,
    matchReason: 'In stock · fruity tasting notes · suitable for V60/filter brewing',
    matchReasonAr: 'متوفر · نكهات فاكهية · مناسب لتحضير V60 والفلتر',
  })).slice(0, 4) as T[];

export const getMeaningfulMatchLabel = (percentage: number, isArabic: boolean): string => {
  if (percentage >= 85) return isArabic ? 'مناسب جداً لذوقك' : 'Excellent taste match';
  if (percentage >= 70) return isArabic ? 'مناسب لذوقك' : 'Good taste match';
  return isArabic ? 'قد يناسب ذوقك' : 'Worth exploring';
};

export const cleanCustomerEmail = (email: string): string => email.replace(/^mailto:/i, '').replace(/\\/g, '').trim();

export const formatBundleTotal = (value: string | number | undefined, region: 'om' | 'sa' = 'om'): string => {
  const amount = Number(String(value ?? '').replace(/,/g, '').match(/\d+(?:\.\d+)?/)?.[0]);
  const currency = region === 'sa' ? 'SAR' : 'OMR';
  if (!Number.isFinite(amount)) return `Total: — ${currency}`;
  return `Total: ${amount.toFixed(region === 'om' ? 3 : 2)} ${currency}`;
};
