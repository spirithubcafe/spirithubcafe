/**
 * Stock-related helpers to enforce variant-level quantity limits.
 *
 * Every add-to-cart / update-quantity path should route through these
 * so the logic lives in one place.
 */

/** Default hard cap when stock info is unavailable (legacy / non-variant items). */
export const DEFAULT_MAX_QUANTITY = 10;

/**
 * Return the effective stock for a variant object.
 * Accepts any object that *may* carry `stockQuantity`.
 */
export const getVariantStock = (
  variant: { stockQuantity?: number | null } | null | undefined,
): number | undefined => {
  if (!variant) return undefined;
  const qty = variant.stockQuantity;
  return typeof qty === 'number' ? qty : undefined;
};

/**
 * Clamp a requested quantity so it never exceeds available stock.
 *
 * @param requested  – the quantity the user wants
 * @param maxStock   – the variant's stockQuantity (undefined = no limit known → fall back to DEFAULT_MAX_QUANTITY)
 * @returns            the clamped value (always ≥ 1 when requested ≥ 1)
 */
export const clampQuantity = (
  requested: number,
  maxStock: number | undefined,
): number => {
  const ceiling = maxStock ?? DEFAULT_MAX_QUANTITY;
  return Math.max(1, Math.min(requested, ceiling));
};

/**
 * Determine whether adding `addQty` items is allowed given what's already
 * in the cart for the same variant.
 *
 * @returns `true` if the addition is within stock limits.
 */
export const canAddToCart = (
  currentQtyInCart: number,
  addQty: number,
  maxStock: number | undefined,
): boolean => {
  if (maxStock === undefined) return true; // no stock info → allow (capped later by DEFAULT_MAX)
  return currentQtyInCart + addQty <= maxStock;
};

/**
 * Compute how many more units can be added for a variant.
 */
export const remainingStock = (
  currentQtyInCart: number,
  maxStock: number | undefined,
): number => {
  if (maxStock === undefined) return DEFAULT_MAX_QUANTITY - currentQtyInCart;
  return Math.max(0, maxStock - currentQtyInCart);
};
