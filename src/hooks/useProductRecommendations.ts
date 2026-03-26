import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product as ApiProduct } from '../types/product';
import type { ShopPage, ShopProduct } from '../types/shop';
import {
  loadBrowsingSignals,
  trackProductView,
  trackProductCardClick,
  trackCartAdd,
  extractSignalsFromApiProduct,
  getRecommendations,
  type BrowsingSignals,
} from '../lib/recommendationEngine';

export interface UseProductRecommendationsResult {
  recommendations: ShopProduct[];
  /** Call when the user adds a product to cart to improve future recommendations. */
  onCartAdd: (categoryId: number, categorySlug?: string | null) => void;
  /** Call on product card click to record a +2 category preference signal. */
  onProductCardClick: (categorySlug: string | null | undefined) => void;
}

/**
 * Loads browsing signals from localStorage, tracks the current product view,
 * and returns a ranked list of recommended ShopProducts.
 *
 * Guest users: signals are automatically persisted to localStorage so
 * personalisation improves across sessions.
 *
 * Logged-in users: the same localStorage pipeline is used today; the hook is
 * designed so that a future `browsing` prop can be passed in from a backend
 * API response to override/augment the local signals.
 */
export function useProductRecommendations(
  currentProduct: ApiProduct | null,
  shopData: ShopPage | null,
): UseProductRecommendationsResult {
  const [browsing, setBrowsing] = useState<BrowsingSignals>(() =>
    loadBrowsingSignals(),
  );

  // Prevent double-tracking if currentProduct reference changes without the id
  // changing (e.g. re-renders before data is fully loaded).
  const trackedIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentProduct) return;
    if (trackedIdRef.current === currentProduct.id) return;

    trackedIdRef.current = currentProduct.id;
    const signals = extractSignalsFromApiProduct(currentProduct);

    // Resolve the category slug from shopData so the preference score is stored
    const categorySlug =
      shopData?.categories?.find((c) => c.id === currentProduct.categoryId)?.slug ?? null;

    trackProductView(signals, categorySlug);
    // Re-read the updated state so recommendations reflect the new view
    setBrowsing(loadBrowsingSignals());
  }, [currentProduct, shopData]);

  const onCartAdd = useCallback(
    (categoryId: number, categorySlug?: string | null) => {
      trackCartAdd(categoryId, categorySlug);
      setBrowsing(loadBrowsingSignals());
    },
    [],
  );

  const onProductCardClick = useCallback(
    (categorySlug: string | null | undefined) => {
      trackProductCardClick(categorySlug);
      // No need to re-fetch recommendations: card click signal affects next page load
    },
    [],
  );

  const recommendations =
    currentProduct && shopData
      ? getRecommendations(currentProduct, shopData, browsing)
      : [];

  return { recommendations, onCartAdd, onProductCardClick };
}
