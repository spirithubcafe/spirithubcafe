// Admin-only DTOs mirroring the backend BundleConfigurationsController contracts exactly.
// Backend source of truth: SpirithubcafeApi.Models/BundleConfigurationDtos.cs

export const BUILD_YOUR_OWN_COFFEE_CODE = 'BUILD_YOUR_OWN_COFFEE';

export interface BundleTierDto {
  id: number;
  requiredQuantity: number;
  discountPercentage: number;
  complimentaryQuantity: number;
  displayOrder: number;
}

export interface BundleEligibleVariantDto {
  productVariantId: number;
  productId: number;
  productName: string;
  variantSku: string;
  weight: number;
  weightUnit: string;
}

export interface BundleDefinitionDto {
  id: number;
  code: string;
  name: string;
  nameAr?: string | null;
  isActive: boolean;
  minimumQuantity: number;
  maximumQuantity: number;
  allowDuplicateVariants: boolean;
  excludePremiumProducts: boolean;
  excludeLimitedProducts: boolean;
  allowCouponDiscounts: boolean;
  complimentaryProductVariantId?: number | null;
  configurationVersion: number;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
  createdAt: string;
  updatedAt: string;
  tiers: BundleTierDto[];
  eligibleVariants: BundleEligibleVariantDto[];
}

// Write DTO for PUT/POST — intentionally excludes id, configurationVersion, tier ids and
// eligible-variant DTO objects (backend only accepts a flat list of variant ids).
export interface BundleTierUpsertDto {
  requiredQuantity: number;
  discountPercentage: number;
  complimentaryQuantity: number;
  displayOrder: number;
}

export interface BundleDefinitionCreateUpdateDto {
  code: string;
  name: string;
  nameAr?: string | null;
  isActive: boolean;
  minimumQuantity: number;
  maximumQuantity: number;
  allowDuplicateVariants: boolean;
  excludePremiumProducts: boolean;
  excludeLimitedProducts: boolean;
  allowCouponDiscounts: boolean;
  complimentaryProductVariantId?: number | null;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
  tiers: BundleTierUpsertDto[];
  eligibleProductVariantIds: number[];
}
