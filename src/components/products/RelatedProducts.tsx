import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useCallback, useEffect, memo } from 'react';
import type { Product as ApiProduct } from '../../types/product';
import type { ShopProduct, ShopPage } from '../../types/shop';
import { getProductImageUrl, handleImageError } from '../../lib/imageUtils';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { useCart } from '../../hooks/useCart';
import { useProductRecommendations } from '../../hooks/useProductRecommendations';

interface Props {
  currentProduct: ApiProduct;
  shopData: ShopPage | null;
}

// ── Card ──────────────────────────────────────────────────────────────────────

const RecommendedCard = ({
  product,
  onCardClick,
  onCartAdd,
}: {
  product: ShopProduct;
  onCardClick: (slug: string | undefined) => void;
  onCartAdd: (categoryId: number, categorySlug?: string | null) => void;
}) => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const { addToCart, openCart } = useCart();
  const isArabic = language === 'ar';

  const name = isArabic ? product.nameAr || product.name : product.name;
  const tasting = isArabic
    ? product.tastingNotesAr || product.tastingNotes
    : product.tastingNotes;
  const productSlug = product.slug || `${product.id}`;
  const productUrl = `/${currentRegion.code}/shop/product/${productSlug}`;
  const priceForCart = product.minPrice ?? product.maxPrice ?? 0;
  const displayPrice = (product.minPrice ?? product.maxPrice ?? 0).toFixed(3);
  const canQuickAdd =
    product.minPrice !== null &&
    product.minPrice !== undefined &&
    (product.maxPrice === null ||
      product.maxPrice === undefined ||
      product.minPrice === product.maxPrice) &&
    priceForCart > 0;

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: `${product.id}`,
      productId: product.id,
      productVariantId: null,
      name,
      price: priceForCart,
      image: getProductImageUrl(product.mainImagePath),
      tastingNotes: product.tastingNotes ?? undefined,
      variantName: undefined,
      weight: undefined,
      weightUnit: undefined,
    });
    onCartAdd(product.categoryId, product.categorySlug);
    openCart();
  };

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-amber-300/70"
    >

      {/* ── Image ── */}
      <Link to={productUrl} className="relative block shrink-0 overflow-hidden bg-white" style={{ aspectRatio: '5/3' }} onClick={() => onCardClick(product.categorySlug)}>
        <img
          src={getProductImageUrl(product.mainImagePath)}
          alt={name}
          className="h-full w-full object-contain p-1.5 transition-transform duration-500 will-change-transform group-hover:scale-[1.05]"
          loading="lazy"
          onError={(e) => handleImageError(e, '/images/products/default-product.webp')}
        />

        {/* Badges */}
        {(product.isLimited || product.isPremium) && (
          <div className="absolute left-2 top-2">
            {product.isLimited && (
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-900 shadow-sm">
                {isArabic ? 'محدود' : 'Limited'}
              </span>
            )}
            {product.isPremium && !product.isLimited && (
              <span className="rounded-md bg-[#6B4423] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                {isArabic ? 'مميز' : 'Premium'}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col p-2.5 pt-2">

        {/* Category chip */}
        <span className="mb-1.5 inline-block self-start rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-stone-400">
          {product.categoryName}
        </span>

        {/* Name */}
        <Link to={productUrl} className="block flex-1" onClick={() => onCardClick(product.categorySlug)}>
          <h3 className="line-clamp-2 text-[12px] font-semibold leading-tight text-stone-900 transition-colors group-hover:text-amber-700">
            {name}
          </h3>
        </Link>

        {/* Tasting note */}
        {tasting && (
          <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-stone-400">{tasting}</p>
        )}

        {/* Rating stars — compact */}
        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`h-2.5 w-2.5 flex-none ${i < Math.round(product.averageRating) ? 'text-amber-400' : 'text-stone-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-0.5 text-[9px] text-stone-400">{product.averageRating.toFixed(1)}</span>
          </div>
        )}

        {/* Divider */}
        <div className="my-2 h-px bg-stone-100" />

        {/* Price + cart */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] font-extrabold leading-none text-[#6B4423]">{displayPrice}</span>
            <span className="text-[9px] font-medium text-stone-400">{currentRegion.currency}</span>
          </div>

          {canQuickAdd ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={isArabic ? 'إضافة إلى السلة' : 'Add to cart'}
              className="inline-flex items-center gap-1 rounded-lg bg-[#6B4423] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-95"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {isArabic ? 'أضف' : 'Add'}
            </button>
          ) : (
            <Link
              to={productUrl}
              aria-label={isArabic ? 'عرض المنتج' : 'View product'}
              className="inline-flex items-center gap-1 rounded-lg bg-[#6B4423] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-95"
              onClick={() => onCardClick(product.categorySlug)}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {isArabic ? 'عرض' : 'View'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Section ───────────────────────────────────────────────────────────────────

const RelatedProductsInner = ({ currentProduct, shopData }: Props) => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { recommendations, onCartAdd, onProductCardClick } = useProductRecommendations(currentProduct, shopData);

  const syncArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // In Chrome/Edge RTL mode scrollLeft is negative — Math.abs normalises it
    const scrollPos = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(scrollPos > 4);
    setCanScrollRight(scrollPos < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(syncArrows);
    el.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener('scroll', syncArrows);
      window.removeEventListener('resize', syncArrows);
    };
  }, [recommendations, syncArrows]);

  const scrollCards = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector(':scope > *') as HTMLElement | null;
    const amount = (firstCard?.offsetWidth ?? 260) + 12;
    // Always scroll in the physical direction clicked — RTL browsers handle the rest
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (recommendations.length === 0) return null;

  const shopUrl = `/${currentRegion.code}/shop`;

  return (
    <section className="mt-8 md:mt-10 rounded-2xl bg-[#faf7f2] px-4 py-5 md:px-6 md:py-6">

      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-1 rounded-full bg-amber-500" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-600">
              {isArabic ? 'مُختار لك' : 'Curated for you'}
            </p>
            <h2 className="text-base font-extrabold tracking-tight text-[#3b1f0e] md:text-lg">
              {isArabic ? 'قد يعجبك أيضاً' : 'You might also like'}
            </h2>
          </div>
        </div>
        <Link
          to={shopUrl}
          className="group hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-stone-400 transition-colors hover:text-amber-700 md:flex"
        >
          {isArabic ? 'تصفح الكل' : 'Browse all'}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ── Carousel ── */}
      <div className="relative">

        {/* Left arrow — prev in LTR, next in RTL */}
        <button
          onClick={() => scrollCards('left')}
          disabled={isArabic ? !canScrollRight : !canScrollLeft}
          aria-label={isArabic ? 'التالي' : 'Scroll left'}
          className={`absolute left-2 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 transition-all duration-200 hover:bg-[#6B4423] hover:text-white hover:shadow-lg active:scale-90 md:-left-3 ${
            (isArabic ? canScrollRight : canScrollLeft) ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scroll track with right-edge fade on mobile */}
        <div className="relative">
          {/* Fade hint — right edge in LTR, left edge in RTL */}
          <div className={`pointer-events-none absolute inset-y-0 z-10 w-10 md:hidden ${
            isArabic
              ? 'left-0 bg-gradient-to-r from-[#faf7f2] to-transparent'
              : 'right-0 bg-gradient-to-l from-[#faf7f2] to-transparent'
          }`} />

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1 [touch-action:pan-x_pan-y] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-3"
          >
            {recommendations.map((p) => (
              <div
                key={p.id}
                className="flex-none snap-start w-[73vw] sm:w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)]"
              >
                <RecommendedCard product={p} onCardClick={onProductCardClick} onCartAdd={onCartAdd} />
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow — next in LTR, prev in RTL */}
        <button
          onClick={() => scrollCards('right')}
          disabled={isArabic ? !canScrollLeft : !canScrollRight}
          aria-label={isArabic ? 'السابق' : 'Scroll right'}
          className={`absolute right-2 top-1/2 z-10 hidden md:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 transition-all duration-200 hover:bg-[#6B4423] hover:text-white hover:shadow-lg active:scale-90 md:-right-3 ${
            (isArabic ? canScrollLeft : canScrollRight) ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

      </div>

      {/* ── Mobile CTA ── */}
      <div className="mt-3 text-center md:hidden">
        <Link
          to={shopUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition hover:text-amber-700"
        >
          {isArabic ? 'تصفح الكل' : 'Browse all'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

    </section>
  );
};

// ── Lazy wrapper ──────────────────────────────────────────────────────────────
// Defers scoring + render until the section enters the viewport.
// Falls back to immediate render on SSR and browsers without IntersectionObserver.

export const RelatedProducts = memo(({ currentProduct, shopData }: Props) => {
  // Default to true when IO is unavailable (SSR, old browsers) so content always renders
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return; // already revealed, nothing to observe
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }, // start loading 200px before section scrolls into view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  if (!isVisible) {
    // Placeholder preserves approximate page height to avoid layout shift
    return <div ref={sentinelRef} className="mt-8 md:mt-10" style={{ minHeight: 360 }} aria-hidden="true" />;
  }

  return <RelatedProductsInner currentProduct={currentProduct} shopData={shopData} />;
});
