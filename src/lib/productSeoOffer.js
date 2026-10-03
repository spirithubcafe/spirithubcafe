const IN_STOCK_URL = 'https://schema.org/InStock';
const OUT_OF_STOCK_URL = 'https://schema.org/OutOfStock';

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getActiveVariants = (product) =>
  Array.isArray(product?.variants)
    ? product.variants.filter((variant) => variant?.isActive !== false)
    : [];

const getRepresentativeVariant = (product) => {
  const activeVariants = getActiveVariants(product);
  return activeVariants.find((variant) => variant?.isDefault) ?? activeVariants[0] ?? null;
};

const resolveVariantPrice = (variant) => {
  const discountPrice = toFiniteNumber(variant?.discountPrice);
  if (discountPrice !== null && discountPrice > 0) {
    return discountPrice;
  }

  const regularPrice = toFiniteNumber(variant?.price);
  return regularPrice !== null ? regularPrice : null;
};

export const getRepresentativeProductSeoOffer = (product) => {
  const representativeVariant = getRepresentativeVariant(product);
  if (!representativeVariant) {
    return null;
  }

  const priceValue = resolveVariantPrice(representativeVariant);
  if (priceValue === null || priceValue <= 0) {
    return null;
  }

  const stockQuantity = toFiniteNumber(representativeVariant.stockQuantity);
  const inStock = stockQuantity !== null && stockQuantity > 0;

  return {
    representativeVariant,
    priceValue,
    priceText: priceValue.toFixed(3),
    availabilityUrl: inStock ? IN_STOCK_URL : OUT_OF_STOCK_URL,
    availabilityText: inStock ? 'in stock' : 'out of stock',
  };
};
