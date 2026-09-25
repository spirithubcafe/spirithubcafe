import type {
  BundleDefinitionCreateUpdateDto,
  BundleDefinitionDto,
  BundleTierUpsertDto,
} from '../types/bundleAdmin';
import type { VariantStockOverviewItem } from '../types/product';

export interface BundleTierDraft {
  requiredQuantity: number;
  discountPercentage: number;
  complimentaryQuantity: number;
  displayOrder: number;
}

export interface BundleSettingsDraft {
  isActive: boolean;
  allowDuplicateVariants: boolean;
  excludePremiumProducts: boolean;
  excludeLimitedProducts: boolean;
  allowCouponDiscounts: boolean;
  tiers: BundleTierDraft[];
}

export interface BundleProductGroup {
  productId: number;
  productName: string;
  productNameAr?: string;
  productSku: string;
  mainImagePath?: string;
  productIsActive: boolean;
  categoryId: number;
  categoryName: string;
  variants: VariantStockOverviewItem[];
}

/** Existing eligible variants must render checked on load. */
export const getInitialSelectedVariantIds = (definition: BundleDefinitionDto): Set<number> =>
  new Set(definition.eligibleVariants.map((variant) => variant.productVariantId));

export const getInitialSettingsDraft = (definition: BundleDefinitionDto): BundleSettingsDraft => ({
  isActive: definition.isActive,
  allowDuplicateVariants: definition.allowDuplicateVariants,
  excludePremiumProducts: definition.excludePremiumProducts,
  excludeLimitedProducts: definition.excludeLimitedProducts,
  allowCouponDiscounts: definition.allowCouponDiscounts,
  tiers: definition.tiers
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.requiredQuantity - b.requiredQuantity)
    .map((tier) => ({
      requiredQuantity: tier.requiredQuantity,
      discountPercentage: tier.discountPercentage,
      complimentaryQuantity: tier.complimentaryQuantity,
      displayOrder: tier.displayOrder,
    })),
});

/**
 * Toggles a variant in/out of the eligible set. An inactive variant can only ever be
 * deselected, never newly selected. Returns the SAME set reference when a select is
 * rejected so callers can detect the no-op (e.g. to show a warning toast).
 */
export const toggleVariantSelection = (
  selected: ReadonlySet<number>,
  variantId: number,
  variantIsActive: boolean
): Set<number> => {
  if (selected.has(variantId)) {
    const next = new Set(selected);
    next.delete(variantId);
    return next;
  }
  if (!variantIsActive) {
    return selected as Set<number>;
  }
  const next = new Set(selected);
  next.add(variantId);
  return next;
};

/** Groups a flat stock-overview list under their parent product for the checkbox grid. */
export const groupVariantsByProduct = (items: VariantStockOverviewItem[]): BundleProductGroup[] => {
  const groups = new Map<number, BundleProductGroup>();
  for (const item of items) {
    let group = groups.get(item.productId);
    if (!group) {
      group = {
        productId: item.productId,
        productName: item.productName,
        productNameAr: item.productNameAr,
        productSku: item.productSku,
        mainImagePath: item.mainImagePath,
        productIsActive: item.productIsActive,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        variants: [],
      };
      groups.set(item.productId, group);
    }
    group.variants.push(item);
  }
  const result = Array.from(groups.values());
  for (const group of result) {
    group.variants.sort((a, b) => a.weight - b.weight);
  }
  result.sort((a, b) => a.productName.localeCompare(b.productName));
  return result;
};

/**
 * Builds the exact PUT payload. Non-editable fields (code/name/nameAr/min/max quantity,
 * complimentary gift variant, start/end dates) are preserved verbatim from the loaded
 * definition. configurationVersion and tier/variant DTO ids are never included.
 */
export const buildBundleUpdatePayload = (
  original: BundleDefinitionDto,
  settings: BundleSettingsDraft,
  selectedVariantIds: ReadonlySet<number>
): BundleDefinitionCreateUpdateDto => ({
  code: original.code,
  name: original.name,
  nameAr: original.nameAr ?? null,
  isActive: settings.isActive,
  minimumQuantity: original.minimumQuantity,
  maximumQuantity: original.maximumQuantity,
  allowDuplicateVariants: settings.allowDuplicateVariants,
  excludePremiumProducts: settings.excludePremiumProducts,
  excludeLimitedProducts: settings.excludeLimitedProducts,
  allowCouponDiscounts: settings.allowCouponDiscounts,
  complimentaryProductVariantId: original.complimentaryProductVariantId ?? null,
  startsAtUtc: original.startsAtUtc ?? null,
  endsAtUtc: original.endsAtUtc ?? null,
  tiers: settings.tiers.map(
    (tier): BundleTierUpsertDto => ({
      requiredQuantity: tier.requiredQuantity,
      discountPercentage: tier.discountPercentage,
      complimentaryQuantity: tier.complimentaryQuantity,
      displayOrder: tier.displayOrder,
    })
  ),
  eligibleProductVariantIds: Array.from(selectedVariantIds).sort((a, b) => a - b),
});

/** Mirrors the backend's own validation so Save fails fast with a clear message. */
export const validateBundlePayload = (dto: BundleDefinitionCreateUpdateDto): string | null => {
  for (const tier of dto.tiers) {
    if (tier.discountPercentage < 0 || tier.discountPercentage > 100) {
      return `Tier ${tier.requiredQuantity}: discount percentage must be between 0 and 100.`;
    }
    if (tier.complimentaryQuantity < 0) {
      return `Tier ${tier.requiredQuantity}: complimentary quantity cannot be negative.`;
    }
  }
  if (dto.isActive) {
    if (dto.tiers.length === 0) {
      return 'An active bundle configuration must have at least one tier.';
    }
    if (dto.eligibleProductVariantIds.length === 0) {
      return 'An active bundle configuration must have at least one eligible variant. Deactivate the bundle first if you intend to clear all eligible variants.';
    }
    if (!dto.complimentaryProductVariantId) {
      return 'An active bundle configuration must have a complimentary product variant configured.';
    }
  }
  return null;
};

/**
 * Reads a backend { message } error body off an axios-shaped error without importing axios
 * (kept dependency-free so it can be unit tested without loading the real API client).
 */
export const extractBundleApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const maybeAxios = error as { response?: { data?: { message?: string } } };
    const backendMessage = maybeAxios.response?.data?.message;
    if (backendMessage) return backendMessage;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
