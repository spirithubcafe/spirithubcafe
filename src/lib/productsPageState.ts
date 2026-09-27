export type ProductsViewState = 'loading' | 'error' | 'filter-empty' | 'empty' | 'results';

export interface ProductsViewStateInput {
  loading: boolean;
  error: string | null;
  /** Total loaded catalog size (pre-filter). */
  productCount: number;
  /** Size after customer filters (search/category/facets/etc.) are applied. */
  filteredCount: number;
  hasActiveFilters: boolean;
}

/**
 * Decides which empty/loading/error/results state the Shop grid should show.
 * A failed fetch must never be presented as a genuine empty catalog: it only
 * resolves to 'error' when there is nothing valid left to display; otherwise
 * previously loaded products keep showing while the error is surfaced elsewhere.
 */
export const resolveProductsViewState = ({
  loading,
  error,
  productCount,
  filteredCount,
  hasActiveFilters,
}: ProductsViewStateInput): ProductsViewState => {
  if (loading && productCount === 0) {
    return 'loading';
  }

  if (error && productCount === 0) {
    return 'error';
  }

  if (filteredCount === 0) {
    return hasActiveFilters ? 'filter-empty' : 'empty';
  }

  return 'results';
};
