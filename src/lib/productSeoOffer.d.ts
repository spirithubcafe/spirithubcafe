import type { Product, ProductVariant } from '../types/product';

export interface RepresentativeProductSeoOffer {
  representativeVariant: ProductVariant;
  priceValue: number;
  priceText: string;
  availabilityUrl: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
  availabilityText: 'in stock' | 'out of stock';
}

export function getRepresentativeProductSeoOffer(
  product: Product | null | undefined,
): RepresentativeProductSeoOffer | null;
