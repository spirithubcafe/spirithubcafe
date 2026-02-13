import { memo } from 'react';
import { useProductViewers } from '../../hooks/useProductViewers';

/* ------------------------------------------------------------------ */
/*  <ProductViewers />                                                 */
/*  Subtle inline "👁️ X viewing this product" text for PDP only.     */
/*  Matches the muted-rating style: small, stone-colored, no badge.   */
/* ------------------------------------------------------------------ */

interface ProductViewersProps {
  productId: string | undefined;
}

const ProductViewersInner = ({ productId }: ProductViewersProps) => {
  const count = useProductViewers(productId);

  if (!productId || count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 select-none">
      <span aria-hidden="true">👁️</span>
      <span>{count} viewing this product</span>
    </span>
  );
};

export const ProductViewers = memo(ProductViewersInner);

