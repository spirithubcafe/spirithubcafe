// Advanced product option contracts.
// These types are intentionally additive and are not wired into the storefront,
// cart, checkout, payment, or shipping flows yet.

export type ProductVariantMode = 'standard' | 'advanced';

export type ProductOptionCode = 'pack_size' | 'grind' | 'color' | 'size' | string;

export interface ProductOptionValue {
  id: number;
  productOptionId: number;
  value: string;
  label: string;
  labelAr?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductOption {
  id: number;
  productId: number;
  code: ProductOptionCode;
  name: string;
  nameAr?: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  values: ProductOptionValue[];
}

export interface ProductVariantOptionSelection {
  optionId: number;
  optionValueId: number;
}

export interface AdvancedVariantDefinition {
  variantId: number;
  selections: ProductVariantOptionSelection[];
}

/**
 * Convert a physical product weight to kilograms for shipping APIs.
 * Product/variant storage remains explicit (value + unit); this conversion is
 * only for shipping boundaries such as Aramex.
 */
export const normalizeWeightToKg = (weight: number, unit: string): number => {
  if (!Number.isFinite(weight) || weight <= 0) return 0;

  switch (unit.trim().toLowerCase()) {
    case 'kg':
      return weight;
    case 'g':
      return weight / 1000;
    case 'lb':
      return weight * 0.453592;
    case 'oz':
      return weight * 0.0283495;
    default:
      return 0;
  }
};
