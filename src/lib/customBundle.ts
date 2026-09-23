import type { CartCustomBundle, CustomBundleSelection, CustomBundleSelectionItem } from '../types/customBundle';
import type { Order } from '../types/order';

export const aggregateBundleItems = (items: CustomBundleSelectionItem[]): CustomBundleSelectionItem[] => {
  const quantities = new Map<string, CustomBundleSelectionItem>();
  for (const item of items) {
    const key = `${item.productId}:${item.productVariantId}`;
    const existing = quantities.get(key);
    quantities.set(key, existing ? { ...existing, quantity: existing.quantity + item.quantity } : { ...item });
  }
  return [...quantities.values()];
};

export const createQuoteRequestGuard = () => {
  let current = 0;
  return {
    next: () => ++current,
    isCurrent: (request: number) => request === current,
  };
};

export const canAddBundleSelection = (selectedCount: number, configuredMaximum: number): boolean =>
  selectedCount < Math.min(configuredMaximum, 3);

export const toOrderCustomBundles = (bundles: CartCustomBundle[]): CustomBundleSelection[] =>
  bundles.map(({ selection }) => ({
    definitionId: selection.definitionId,
    configurationVersion: selection.configurationVersion,
    items: selection.items.map(({ productId, productVariantId, quantity }) => ({ productId, productVariantId, quantity })),
  }));

export const getBundledOrderItemIds = (order: Pick<Order, 'customBundles'>): Set<number> =>
  new Set((order.customBundles ?? []).flatMap((bundle) => bundle.components.map((component) => component.orderItemId)));

export const getUnbundledOrderItems = (order: Pick<Order, 'items' | 'customBundles'>) => {
  const bundledIds = getBundledOrderItemIds(order);
  return order.items.filter((item) => !bundledIds.has(item.id));
};

export const parseStoredBundles = (value: string | null): CartCustomBundle[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((bundle): bundle is CartCustomBundle => {
      const candidate = bundle as Partial<CartCustomBundle>;
      return Boolean(candidate.id && candidate.selection?.definitionId && Array.isArray(candidate.selection.items));
    });
  } catch {
    return [];
  }
};

export const customBundleErrorMessage = (code: string | undefined, isArabic: boolean): string => {
  const messages: Record<string, [string, string]> = {
    CONFIGURATION_CHANGED: ['Bundle options changed. Please review your selection.', 'تغيّرت خيارات الحزمة. يرجى مراجعة اختيارك.'],
    INSUFFICIENT_STOCK: ['Some selected items no longer have enough stock.', 'لا تتوفر كمية كافية لبعض المنتجات المختارة.'],
    VARIANT_INACTIVE: ['A selected size is no longer available.', 'أحد الأحجام المختارة لم يعد متاحاً.'],
    NOT_ELIGIBLE: ['A selected coffee is no longer eligible.', 'إحدى القهوات المختارة لم تعد مؤهلة.'],
    GIFT_UNAVAILABLE: ['The complimentary gift is temporarily unavailable.', 'الهدية المجانية غير متاحة مؤقتاً.'],
    NOT_AVAILABLE: ['Build Your Own Bundle is currently unavailable.', 'خيار اصنع حزمتك غير متاح حالياً.'],
  };
  const match = code ? messages[code.toUpperCase()] : undefined;
  return match?.[isArabic ? 1 : 0] ?? (isArabic ? 'تعذر تحديث الحزمة. حاول مرة أخرى.' : 'Unable to refresh the bundle. Please try again.');
};
