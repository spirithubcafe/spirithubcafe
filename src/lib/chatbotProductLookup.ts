import {
  deriveAvailability,
  resolveProductTarget,
  selectBrewingText,
  type AvailabilityStatus,
  type ProductTargetCandidate,
} from './chatbotProductIntents.ts';

export type ProductLookupKind = 'price' | 'availability' | 'brewing';

export type ProductLookupStatus =
  | 'answered'
  | 'ambiguous'
  | 'not_found'
  | 'unavailable'
  | 'brewing_missing';

export interface LookupProduct extends ProductTargetCandidate {
  price: number;
  minPrice?: number;
  maxPrice?: number;
  discountPrice?: number;
  isInStock?: boolean;
  stockQuantity?: number;
}

export interface ProductLookupDeps<P extends LookupProduct> {
  /** Phase 1 product search through MCP (spirithub.search_products). */
  search: (query: string) => Promise<P[]>;
  /** spirithub.get_product_variants. Only ever used to derive in_stock / out_of_stock. */
  getVariants: (productId: number) => Promise<unknown>;
  /** spirithub.get_product, used for the catalog brewing instructions. */
  getProduct: (productId: number) => Promise<unknown>;
  formatPrice: (value: number) => string;
}

export interface ProductLookupResult<P extends LookupProduct> {
  status: ProductLookupStatus;
  text: string;
  products: P[];
  availability?: AvailabilityStatus;
}

const bold = (name: string) => `**${name}**`;

const displayName = (product: ProductTargetCandidate, isAr: boolean): string =>
  isAr && product.nameAr ? product.nameAr : product.name;

/** Copy of a product card with every inventory number removed; only the boolean isInStock may remain. */
const toPublicProduct = <P extends LookupProduct>(product: P, availability?: AvailabilityStatus): P => {
  const copy = { ...product } as P;
  delete copy.stockQuantity;
  delete (copy as { lowStockThreshold?: number }).lowStockThreshold;
  if (availability) copy.isInStock = availability === 'in_stock';
  return copy;
};

const closestMatchPrefix = (isAr: boolean) => (isAr ? 'أقرب نتيجة: ' : 'Closest match: ');

const buildPriceText = (product: LookupProduct, isAr: boolean, formatPrice: (value: number) => string): string => {
  const name = bold(displayName(product, isAr));
  const min = product.minPrice && product.minPrice > 0 ? product.minPrice : product.price;
  const max = product.maxPrice && product.maxPrice > 0 ? product.maxPrice : min;

  if (!min || min <= 0) {
    return isAr ? `سعر ${name} غير مدرج حالياً. يمكنك فتح بطاقة المنتج لمزيد من التفاصيل.` : `The price for ${name} is not listed right now. Open the product card for details.`;
  }

  if (max > min) {
    return isAr
      ? `يبدأ سعر ${name} من ${formatPrice(min)} (يعتمد السعر على الحجم).`
      : `${name} starts from ${formatPrice(min)} (the price depends on the size).`;
  }

  return isAr ? `سعر ${name} هو ${formatPrice(min)}.` : `${name} is ${formatPrice(min)}.`;
};

const buildAvailabilityText = (product: LookupProduct, status: AvailabilityStatus, isAr: boolean): string => {
  const name = bold(displayName(product, isAr));
  if (status === 'in_stock') {
    return isAr ? `${name} متوفر حالياً.` : `${name} is currently in stock.`;
  }

  return isAr
    ? `${name} غير متوفر حالياً. يمكنك استخدام الزر أسفل البطاقة ليتم إشعارك عند توفره.`
    : `${name} is currently out of stock. Use the button below the card to be notified when it is back.`;
};

const messages = {
  notFound: (query: string, isAr: boolean) =>
    isAr
      ? `لم أجد منتجاً يطابق "${query}". جرّب اسماً آخر أو اختر من الأكثر مبيعاً.`
      : `I could not find a product matching "${query}". Try another name or browse the best sellers.`,
  unavailable: (isAr: boolean) =>
    isAr
      ? 'لا أستطيع التحقق من ذلك الآن. حاول مرة أخرى بعد قليل أو تواصل مع الدعم.'
      : "I can't check that right now. Please try again in a moment or contact support.",
  ambiguousPrice: (isAr: boolean) =>
    isAr ? 'عدة منتجات تطابق طلبك. هذه أسعارها:' : 'Several products match. Here are their prices:',
  ambiguousAvailability: (isAr: boolean) =>
    isAr
      ? 'عدة منتجات تطابق طلبك. أخبرني بالاسم الدقيق وسأتحقق من توفره.'
      : 'Several products match. Tell me the exact name and I will check availability.',
  ambiguousBrewing: (isAr: boolean) =>
    isAr
      ? 'عدة منتجات تطابق طلبك. أخبرني بالاسم الدقيق وسأعرض لك طريقة التحضير.'
      : 'Several products match. Tell me the exact name and I will show you the brewing instructions.',
  brewingTitle: (name: string, isAr: boolean) =>
    isAr ? `طريقة تحضير ${bold(name)}:` : `Brewing instructions for ${bold(name)}:`,
  brewingLanguageNote: (isAr: boolean) =>
    isAr ? '(التعليمات متوفرة بالإنجليزية فقط.)' : '(These instructions are available in Arabic only.)',
  brewingMissing: (isAr: boolean) =>
    isAr
      ? 'طريقة التحضير غير مدرجة لهذا المنتج حتى الآن. يمكنك التواصل مع فريقنا أو بدء اختبار القهوة لنساعدك في اختيار طريقة التحضير.'
      : 'Brewing instructions are not listed for this product yet. You can contact our team or take the coffee quiz and we will help you choose a brew method.',
};

/**
 * Deterministic price / availability / brewing answers for a named product.
 * Phase 1 search finds the product; this never generates product facts and never exposes stock numbers.
 */
export async function runProductLookup<P extends LookupProduct>(
  kind: ProductLookupKind,
  productQuery: string,
  isAr: boolean,
  deps: ProductLookupDeps<P>,
): Promise<ProductLookupResult<P>> {
  const unavailable = (): ProductLookupResult<P> => ({ status: 'unavailable', text: messages.unavailable(isAr), products: [] });

  let results: P[];
  try {
    results = await deps.search(productQuery);
  } catch {
    return unavailable();
  }

  const target = resolveProductTarget(results, productQuery, { preferClearLeadingMatch: kind === 'brewing' });
  if (target.kind === 'empty') {
    return { status: 'not_found', text: messages.notFound(productQuery, isAr), products: [] };
  }

  if (target.kind === 'ambiguous') {
    const candidates = target.candidates.map((candidate) => toPublicProduct(candidate));
    const text = kind === 'price' ? messages.ambiguousPrice(isAr) : kind === 'availability' ? messages.ambiguousAvailability(isAr) : messages.ambiguousBrewing(isAr);
    return { status: 'ambiguous', text, products: candidates };
  }

  const product = target.product;
  const prefix = target.kind === 'unverified' ? closestMatchPrefix(isAr) : '';

  if (kind === 'price') {
    return { status: 'answered', text: `${prefix}${buildPriceText(product, isAr, deps.formatPrice)}`, products: [toPublicProduct(product)] };
  }

  if (kind === 'availability') {
    let availability: AvailabilityStatus;
    try {
      availability = deriveAvailability(await deps.getVariants(product.id));
    } catch {
      return unavailable();
    }

    return {
      status: 'answered',
      text: `${prefix}${buildAvailabilityText(product, availability, isAr)}`,
      products: [toPublicProduct(product, availability)],
      availability,
    };
  }

  let productData: unknown;
  try {
    productData = await deps.getProduct(product.id);
  } catch {
    return unavailable();
  }

  const brewing = selectBrewingText(productData, isAr);
  if (!brewing) {
    return { status: 'brewing_missing', text: `${prefix}${messages.brewingMissing(isAr)}`, products: [toPublicProduct(product)] };
  }

  const note = brewing.isFallbackLanguage ? `\n\n${messages.brewingLanguageNote(isAr)}` : '';
  return {
    status: 'answered',
    text: `${prefix}${messages.brewingTitle(displayName(product, isAr), isAr)}\n\n${brewing.text}${note}`,
    products: [toPublicProduct(product)],
  };
}
