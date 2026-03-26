/**
 * Recommendation Engine
 *
 * Pure, side-effect-free scoring logic + localStorage browsing-signal helpers.
 * Nothing in this file imports React.
 */

import type { Product as ApiProduct } from '../types/product';
import type { ShopPage, ShopProduct } from '../types/shop';
import { safeStorage } from './safeStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'spirithub_browsing_signals';
const MAX_RECENT_VIEWS = 30;
const DEFAULT_MAX_RESULTS = 4;

/** Browsing data older than this is fully discarded (14 days). */
const SIGNALS_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;
/** Soft-decay begins at 7 days; scores linearly fade to 0 by day 14. */
const SIGNALS_DECAY_START_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The only category slugs used for preference scoring and recommendation
 * boosting. Keys are normalised exactly as they appear in the API.
 */
export const ALLOWED_CATEGORIES = [
  'bundles-gift',
  'electronic-gift-cards',
  'espresso-milk-based-coffee',
  'tools-equipment',
  'filter-pour-over-coffee',
  'competition-premium-series',
  'ufo-drip-coffee-filters',
  'specialty-coffee-capsules',
] as const;

export type AllowedCategorySlug = (typeof ALLOWED_CATEGORIES)[number];

/**
 * Flavour keywords used for soft matching in tasting notes / aromatic profiles.
 * Kept lower-case; matching is done on lower-cased text.
 */
const FLAVOR_KEYWORDS = [
  'chocolate',
  'caramel',
  'vanilla',
  'nutty',
  'fruity',
  'berry',
  'citrus',
  'floral',
  'spicy',
  'earthy',
  'woody',
  'sweet',
  'bright',
  'clean',
  'smooth',
  'bold',
  'mellow',
  'honey',
  'wine',
  'jasmine',
  'peach',
  'apricot',
] as const;

/** [keyword to detect, normalised brew-type value] */
const BREW_KEYWORD_MAP: [string, string][] = [
  ['capsule', 'capsule'],
  ['nespresso', 'capsule'],
  ['ufo drip', 'ufo_drip'],
  ['drip bag', 'ufo_drip'],
  ['espresso', 'espresso'],
  ['filter', 'filter'],
  ['pour over', 'filter'],
  ['french press', 'filter'],
  ['v60', 'filter'],
  ['aeropress', 'filter'],
  ['cold brew', 'cold_brew'],
  ['moka', 'moka'],
];

/** Known coffee-producing countries / regions (lower-case). */
const KNOWN_ORIGINS = [
  'ethiopia',
  'ethiopian',
  'kenya',
  'kenya aa',
  'colombia',
  'colombian',
  'brazil',
  'brazilian',
  'yemen',
  'yemeni',
  'peru',
  'guatemalan',
  'guatemala',
  'honduras',
  'indonesia',
  'indonesian',
  'sumatra',
  'java',
  'rwanda',
  'burundi',
  'costa rica',
  'panama',
  'mexico',
  'india',
  'vietnam',
  'oman',
];

// ── Types ─────────────────────────────────────────────────────────────────────

/** Normalised signals derived from any product (works for both ApiProduct &
 *  ShopProduct so we always operate on the same shape). */
export interface ProductSignals {
  id: number;
  categoryId: number;
  /** Normalised category slug (from ShopCategory.slug), or null when unavailable. */
  categorySlug: string | null;
  /** All tag names, lower-cased and de-duplicated. */
  tagNames: string[];
  /** Normalised roast level or null when not detectable. */
  roastLevel: string | null;
  /** Matched origin keyword or null. */
  origin: string | null;
  /** Brew type or 'any' when unknown. */
  brewType: string;
  /** 'decaf' | 'regular' */
  caffeineType: 'decaf' | 'regular';
  /** Matched FLAVOR_KEYWORDS present in tasting notes / aromatic profile. */
  flavorKeywords: string[];
  /** Unix timestamp – only set when saved in recentViews. */
  viewedAt?: number;
}

/** Browsing history & preference signals stored in localStorage. */
export interface BrowsingSignals {
  /** Last N product views (most-recent first). */
  recentViews: ProductSignals[];
  /** tag → total view-count across all viewed products. */
  tagFrequency: Record<string, number>;
  /** origin → view-count. */
  originFrequency: Record<string, number>;
  /** brew-type → view-count (excludes 'any'). */
  brewTypeFrequency: Record<string, number>;
  /** roast-level → view-count. */
  roastFrequency: Record<string, number>;
  /** Category IDs where user has added to cart (most recent first, max 10). */
  cartedCategoryIds: number[];
  /**
   * Category preference scores for the 8 allowed categories.
   * page view = +1 | card click = +2 | add to cart = +4
   */
  categoryScores: Record<string, number>;
  lastUpdated: number;
}

/** Scored product returned by scoreRecommendation. */
export interface ScoredProduct {
  product: ShopProduct;
  /** Combined total score. */
  score: number;
  /** Content-similarity sub-score. */
  similarityScore: number;
  /** Personalisation sub-score (browsing history). */
  personalScore: number;
  /** Popularity sub-score. */
  popularityScore: number;
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function detectBrewType(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, type] of BREW_KEYWORD_MAP) {
    if (lower.includes(kw)) return type;
  }
  return 'any';
}

function detectCaffeineType(text: string): 'decaf' | 'regular' {
  return text.toLowerCase().includes('decaf') ? 'decaf' : 'regular';
}

function detectOrigin(text: string): string | null {
  const lower = text.toLowerCase();
  return KNOWN_ORIGINS.find((o) => lower.includes(o)) ?? null;
}

function detectRoastLevel(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('light')) return 'light';
  if (lower.includes('medium-dark') || lower.includes('medium dark')) return 'medium-dark';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('dark')) return 'dark';
  return null;
}

// ── Signal extraction ─────────────────────────────────────────────────────────

/** Extract normalised signals from a full ApiProduct (used for the current
 *  product being viewed). */
export function extractSignalsFromApiProduct(
  product: ApiProduct,
  categorySlug?: string | null,
): ProductSignals {
  const tagNames: string[] = [
    ...(product.topTags ?? []),
    ...(product.bottomTags ?? []),
  ].map((t) => t.name.toLowerCase());

  if (product.tags) {
    for (const raw of product.tags.split(',')) {
      const cleaned = raw.trim().toLowerCase();
      if (cleaned) tagNames.push(cleaned);
    }
  }

  const searchText = [
    product.name,
    product.tastingNotes ?? '',
    product.aromaticProfile ?? '',
    product.roastLevel ?? '',
    product.origin ?? '',
    product.category?.name ?? '',
    ...tagNames,
  ]
    .join(' ')
    .toLowerCase();

  return {
    id: product.id,
    categoryId: product.categoryId,
    categorySlug: categorySlug ?? null,
    tagNames: [...new Set(tagNames)],
    // Prefer explicit field; fall back to text search
    roastLevel:
      detectRoastLevel(product.roastLevel ?? '') ?? detectRoastLevel(searchText),
    origin:
      detectOrigin(product.origin ?? '') ?? detectOrigin(searchText),
    brewType: detectBrewType(searchText),
    caffeineType: detectCaffeineType(searchText),
    flavorKeywords: FLAVOR_KEYWORDS.filter((kw) => searchText.includes(kw)),
  };
}

/** Extract normalised signals from a ShopProduct (available only for
 *  candidate scoring – tasting notes + tags only, no origin/roast fields). */
export function extractSignalsFromShopProduct(
  product: ShopProduct,
  categorySlug?: string | null,
): ProductSignals {
  const tagNames = [
    ...(product.topTags ?? []),
    ...(product.bottomTags ?? []),
  ].map((t) => t.name.toLowerCase());

  const searchText = [
    product.name,
    product.tastingNotes ?? '',
    product.categoryName,
    ...tagNames,
  ]
    .join(' ')
    .toLowerCase();

  return {
    id: product.id,
    categoryId: product.categoryId,
    categorySlug: categorySlug ?? null,
    tagNames: [...new Set(tagNames)],
    roastLevel: detectRoastLevel(searchText),
    origin: detectOrigin(searchText),
    brewType: detectBrewType(searchText),
    caffeineType: detectCaffeineType(searchText),
    flavorKeywords: FLAVOR_KEYWORDS.filter((kw) => searchText.includes(kw)),
  };
}

// ── LocalStorage utilities ────────────────────────────────────────────────────

const EMPTY_SIGNALS: BrowsingSignals = {
  recentViews: [],
  tagFrequency: {},
  originFrequency: {},
  brewTypeFrequency: {},
  roastFrequency: {},
  cartedCategoryIds: [],
  categoryScores: {},
  lastUpdated: 0,
};

/**
 * Apply time-based decay to browsing signals.
 *
 * - Age ≥ 14 days → full reset; localStorage entry is removed.
 * - Age 7–14 days → all numeric scores linearly decayed toward 0.
 * - Age < 7 days  → unchanged (individual views older than 14 days are
 *                   still pruned via their `viewedAt` timestamp).
 */
function applySignalDecay(signals: BrowsingSignals, now: number): BrowsingSignals {
  const age = now - signals.lastUpdated;

  // Hard expiry: wipe everything
  if (age >= SIGNALS_EXPIRY_MS) {
    safeStorage.removeItem(STORAGE_KEY);
    return { ...EMPTY_SIGNALS };
  }

  // Always prune individual views whose own timestamp has expired
  const cutoff = now - SIGNALS_EXPIRY_MS;
  const recentViews = signals.recentViews.filter(
    (v) => v.viewedAt == null || v.viewedAt > cutoff,
  );

  // No decay needed yet
  if (age < SIGNALS_DECAY_START_MS) {
    return recentViews.length === signals.recentViews.length
      ? signals
      : { ...signals, recentViews };
  }

  // Soft decay: linear 1 → 0 over the 7–14 day window
  const decayFactor =
    1 - (age - SIGNALS_DECAY_START_MS) / (SIGNALS_EXPIRY_MS - SIGNALS_DECAY_START_MS);

  const decayMap = (map: Record<string, number>): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(map)) {
      const decayed = v * decayFactor;
      if (decayed > 0.01) result[k] = decayed;
    }
    return result;
  };

  return {
    ...signals,
    recentViews,
    tagFrequency: decayMap(signals.tagFrequency),
    originFrequency: decayMap(signals.originFrequency),
    brewTypeFrequency: decayMap(signals.brewTypeFrequency),
    roastFrequency: decayMap(signals.roastFrequency),
    categoryScores: decayMap(signals.categoryScores),
  };
}

/** Load browsing signals from localStorage (safe even in SSR / private mode). */
export function loadBrowsingSignals(): BrowsingSignals {
  const stored = safeStorage.getJson<BrowsingSignals>(STORAGE_KEY);
  if (!stored) return { ...EMPTY_SIGNALS };

  const signals: BrowsingSignals = {
    ...EMPTY_SIGNALS,
    ...stored,
    // Coerce arrays to guard against storage corruption
    recentViews: Array.isArray(stored.recentViews) ? stored.recentViews : [],
    cartedCategoryIds: Array.isArray(stored.cartedCategoryIds)
      ? stored.cartedCategoryIds
      : [],
    categoryScores:
      stored.categoryScores && typeof stored.categoryScores === 'object'
        ? stored.categoryScores
        : {},
  };

  return applySignalDecay(signals, Date.now());
}

/** Record a product view and update frequency maps in localStorage.
 *  Pass `categorySlug` (from ShopCategory.slug) when available. */
export function trackProductView(
  signals: ProductSignals,
  categorySlug?: string | null,
): void {
  const current = loadBrowsingSignals();
  const now = Date.now();
  const slug = categorySlug ?? signals.categorySlug;

  // Deduplicate: remove prior entry for same product, push newest to front
  const recentViews = current.recentViews.filter((v) => v.id !== signals.id);
  recentViews.unshift({ ...signals, viewedAt: now });
  if (recentViews.length > MAX_RECENT_VIEWS) recentViews.length = MAX_RECENT_VIEWS;

  const tagFrequency = { ...current.tagFrequency };
  for (const tag of signals.tagNames) {
    tagFrequency[tag] = (tagFrequency[tag] ?? 0) + 1;
  }

  const originFrequency = { ...current.originFrequency };
  if (signals.origin) {
    originFrequency[signals.origin] = (originFrequency[signals.origin] ?? 0) + 1;
  }

  const brewTypeFrequency = { ...current.brewTypeFrequency };
  if (signals.brewType !== 'any') {
    brewTypeFrequency[signals.brewType] =
      (brewTypeFrequency[signals.brewType] ?? 0) + 1;
  }

  const roastFrequency = { ...current.roastFrequency };
  if (signals.roastLevel) {
    roastFrequency[signals.roastLevel] =
      (roastFrequency[signals.roastLevel] ?? 0) + 1;
  }

  // Category preference: +1 for page view (allowed categories only)
  const categoryScores = { ...current.categoryScores };
  if (slug && (ALLOWED_CATEGORIES as readonly string[]).includes(slug)) {
    categoryScores[slug] = (categoryScores[slug] ?? 0) + 1;
  }

  safeStorage.setJson(STORAGE_KEY, {
    recentViews,
    tagFrequency,
    originFrequency,
    brewTypeFrequency,
    roastFrequency,
    cartedCategoryIds: current.cartedCategoryIds,
    categoryScores,
    lastUpdated: now,
  });
}

/**
 * Record a product card click (+2 to category preference score).
 * Call this from any product card onClick handler.
 */
export function trackProductCardClick(categorySlug: string | null | undefined): void {
  if (!categorySlug) return;
  if (!(ALLOWED_CATEGORIES as readonly string[]).includes(categorySlug)) return;
  const current = loadBrowsingSignals();
  const categoryScores = { ...current.categoryScores };
  categoryScores[categorySlug] = (categoryScores[categorySlug] ?? 0) + 2;
  safeStorage.setJson(STORAGE_KEY, {
    ...current,
    categoryScores,
    lastUpdated: Date.now(),
  });
}

/** Record that the user added a product (by category) to their cart.
 *  Accepts both numeric categoryId (legacy) and the slug for the new
 *  preference score (+4).
 */
export function trackCartAdd(
  categoryId: number,
  categorySlug?: string | null,
): void {
  const current = loadBrowsingSignals();
  const cartedCategoryIds = [
    categoryId,
    ...current.cartedCategoryIds.filter((id) => id !== categoryId),
  ].slice(0, 10);

  // Category preference: +4 for add-to-cart (allowed categories only)
  const categoryScores = { ...current.categoryScores };
  if (categorySlug && (ALLOWED_CATEGORIES as readonly string[]).includes(categorySlug)) {
    categoryScores[categorySlug] = (categoryScores[categorySlug] ?? 0) + 4;
  }

  safeStorage.setJson(STORAGE_KEY, {
    ...current,
    cartedCategoryIds,
    categoryScores,
    lastUpdated: Date.now(),
  });
}

// ── Preference helpers ────────────────────────────────────────────────────────

/**
 * Returns the user's normalised category preference scores for the 8 allowed
 * categories, sorted highest-to-lowest.
 *
 * Useful for analytics, debugging, or personalised hero banners.
 *
 * @example
 * const prefs = getUserCategoryPreferences();
 * // => [['tools-equipment', 12], ['filter-pour-over-coffee', 7], ...]
 */
export function getUserCategoryPreferences(): [string, number][] {
  const { categoryScores } = loadBrowsingSignals();
  return (ALLOWED_CATEGORIES as readonly string[])
    .map((slug) => [slug, categoryScores[slug] ?? 0] as [string, number])
    .sort((a, b) => b[1] - a[1]);
}

/**
 * Standalone ranking helper: sorts scored candidates, guarantees at least one
 * slot for each of the user's top preferred categories, then fills remaining
 * slots with the highest-scoring remaining products.
 *
 * Algorithm:
 *   Phase 1 — Preference guarantees
 *     • Identify allowed categories where the user has a positive
 *       `categoryScores` value, sorted highest-to-lowest.
 *     • Reserve up to floor(maxResults / 2) guaranteed slots — one per
 *       top preferred category — choosing each category's best-scored product.
 *
 *   Phase 2 — Fill remaining slots
 *     • Walk the full score-sorted list (skipping already-selected products).
 *     • Apply a per-category cap of ceil(maxResults / 2) so no single
 *       category dominates the remaining slots.
 *
 *   Phase 3 — Back-fill
 *     • If slots still remain (rare, e.g. very few candidates), fill from
 *       any leftover deferred products regardless of the cap.
 *
 * Exposed separately so it can be reused in future recommendation sections.
 */
export function rankRecommendedProducts(
  scored: ScoredProduct[],
  browsing: BrowsingSignals,
  maxResults: number = DEFAULT_MAX_RESULTS,
): ShopProduct[] {
  const sorted = [...scored].sort(
    (a, b) =>
      b.score - a.score || a.product.displayOrder - b.product.displayOrder,
  );

  // ── Phase 1: guarantee one slot per top-preferred category ─────────────────

  // Max number of slots we'll reserve for preference guarantees
  const maxGuaranteedSlots = Math.floor(maxResults / 2);

  // Group best-scored product per categorySlug (slug → top ScoredProduct)
  const bestBySlug = new Map<string, ScoredProduct>();
  for (const s of sorted) {
    const slug = s.product.categorySlug;
    if (slug && !bestBySlug.has(slug)) bestBySlug.set(slug, s);
  }

  // Preferred slugs = allowed categories with a positive user score, best first
  const preferredSlugs = (ALLOWED_CATEGORIES as readonly string[])
    .filter((slug) => (browsing.categoryScores[slug] ?? 0) > 0)
    .sort((a, b) => (browsing.categoryScores[b] ?? 0) - (browsing.categoryScores[a] ?? 0));

  const selectedIds = new Set<number>();
  const selected: ScoredProduct[] = [];
  const categoryCounts = new Map<number, number>();

  for (const slug of preferredSlugs) {
    if (selected.length >= maxGuaranteedSlots) break;
    const best = bestBySlug.get(slug);
    if (!best || selectedIds.has(best.product.id)) continue;
    selected.push(best);
    selectedIds.add(best.product.id);
    categoryCounts.set(
      best.product.categoryId,
      (categoryCounts.get(best.product.categoryId) ?? 0) + 1,
    );
  }

  // ── Phase 2: fill remaining slots with highest-scoring products ────────────

  const maxPerCategory = Math.max(1, Math.ceil(maxResults / 2));
  const deferred: ScoredProduct[] = [];

  for (const s of sorted) {
    if (selected.length >= maxResults) break;
    if (selectedIds.has(s.product.id)) continue;
    const catId = s.product.categoryId;
    const count = categoryCounts.get(catId) ?? 0;
    if (count < maxPerCategory) {
      selected.push(s);
      selectedIds.add(s.product.id);
      categoryCounts.set(catId, count + 1);
    } else {
      deferred.push(s);
    }
  }

  // ── Phase 3: back-fill if slots still remain ───────────────────────────────

  for (const s of deferred) {
    if (selected.length >= maxResults) break;
    if (!selectedIds.has(s.product.id)) selected.push(s);
  }

  return selected.map((s) => s.product);
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Score a single ShopProduct candidate against the currently viewed product
 * and the user's accumulated browsing signals.
 *
 * Score breakdown (approximate maxima):
 *   Similarity  — up to ~46 pts  (category, roast, origin, brew, caffeine, flavour, tags)
 *   Personalisation — up to ~21 pts  (history, tag freq, origin/brew/roast pref, cart)
 *   Popularity  — up to  ~8 pts  (rating, review count, featured, premium)
 */
export function scoreRecommendation(
  candidate: ShopProduct,
  currentSignals: ProductSignals,
  browsing: BrowsingSignals,
): ScoredProduct {
  const cs = extractSignalsFromShopProduct(candidate, candidate.categorySlug ?? null);
  let similarity = 0;
  let personal = 0;
  let popularity = 0;

  // ── Similarity ─────────────────────────────────────────────────────────────

  if (cs.categoryId === currentSignals.categoryId) similarity += 10;

  if (cs.roastLevel && cs.roastLevel === currentSignals.roastLevel) similarity += 8;

  if (cs.origin && cs.origin === currentSignals.origin) similarity += 7;

  if (cs.brewType !== 'any' && cs.brewType === currentSignals.brewType) similarity += 6;

  if (cs.caffeineType === currentSignals.caffeineType) similarity += 5;

  // Flavour keyword overlap — capped at +10
  const currentFlavorSet = new Set(currentSignals.flavorKeywords);
  const flavorOverlap = cs.flavorKeywords.filter((kw) => currentFlavorSet.has(kw)).length;
  similarity += Math.min(flavorOverlap * 2, 10);

  // Tag name overlap — capped at +6
  const currentTagSet = new Set(currentSignals.tagNames);
  const tagOverlapCount = cs.tagNames.filter((t) => currentTagSet.has(t)).length;
  similarity += Math.min(tagOverlapCount * 1.5, 6);

  // ── Personalisation ────────────────────────────────────────────────────────

  // How many times user has viewed this category (capped at +5)
  const categoryViewCount = browsing.recentViews.filter(
    (v) => v.categoryId === cs.categoryId,
  ).length;
  personal += Math.min(categoryViewCount, 5);

  // Recently viewed same category (extra recency bonus for top-5 views)
  if (browsing.recentViews.slice(0, 5).some((v) => v.categoryId === cs.categoryId)) {
    personal += 3;
  }

  // Frequent tag match — capped at +6
  let tagPersonalScore = 0;
  for (const tag of cs.tagNames) {
    const freq = browsing.tagFrequency[tag] ?? 0;
    if (freq > 0) tagPersonalScore += Math.min(freq, 3) * 0.8;
  }
  personal += Math.min(tagPersonalScore, 6);

  // Preferred origin — capped at +4
  if (cs.origin) {
    const originFreq = browsing.originFrequency[cs.origin] ?? 0;
    if (originFreq > 0) personal += Math.min(originFreq * 1.5, 4);
  }

  // Preferred brew type — capped at +3
  if (cs.brewType !== 'any') {
    personal += Math.min(browsing.brewTypeFrequency[cs.brewType] ?? 0, 3);
  }

  // Preferred roast level — capped at +3
  if (cs.roastLevel) {
    personal += Math.min(browsing.roastFrequency[cs.roastLevel] ?? 0, 3);
  }

  // User has previously carted something from this category
  if (browsing.cartedCategoryIds.includes(cs.categoryId)) personal += 4;

  // Category preference score boost — normalised to 0–6 so it nudges
  // ranking without overpowering product similarity.
  const slug = cs.categorySlug;
  if (slug && (ALLOWED_CATEGORIES as readonly string[]).includes(slug)) {
    const catScore = browsing.categoryScores[slug] ?? 0;
    const maxCatScore = Math.max(1, ...Object.values(browsing.categoryScores));
    personal += (catScore / maxCatScore) * 6;
  }

  // ── Popularity ─────────────────────────────────────────────────────────────

  const rating = candidate.averageRating ?? 0;
  if (rating >= 4.5) popularity += 3;
  else if (rating >= 4.0) popularity += 2;
  else if (rating >= 3.0) popularity += 1;

  const reviewCount = candidate.reviewCount ?? 0;
  if (reviewCount >= 10) popularity += 2;
  else if (reviewCount >= 5) popularity += 1;

  if (candidate.isFeatured) popularity += 2;
  if (candidate.isPremium) popularity += 1;

  return {
    product: candidate,
    score: similarity + personal + popularity,
    similarityScore: similarity,
    personalScore: personal,
    popularityScore: popularity,
  };
}

// ── Main recommendation function ──────────────────────────────────────────────

/**
 * Return the top `maxResults` recommended ShopProducts for the given
 * ApiProduct, using the shop catalogue and user's browsing signals.
 *
 * Candidates must:
 *   • not be the current product
 *   • have a valid price > 0  (proxy for in-stock / visible)
 *
 * Category slugs from ShopCategory are stamped onto each candidate so that
 * the preference score (ALLOWED_CATEGORIES) can influence ranking.
 */
export function getRecommendations(
  currentProduct: ApiProduct,
  shopData: ShopPage | null,
  browsing: BrowsingSignals,
  maxResults: number = DEFAULT_MAX_RESULTS,
): ShopProduct[] {
  if (!shopData?.categories?.length) return [];

  // Find the current product's category slug so trackProductView can use it
  const currentCatSlug =
    shopData.categories.find((c) => c.id === currentProduct.categoryId)?.slug ?? null;

  const currentSignals = extractSignalsFromApiProduct(currentProduct, currentCatSlug);

  // Collect candidates — deduplicated, exclude current, priced only
  // Stamp categorySlug from ShopCategory so scoring can use it
  const seen = new Set<number>([currentProduct.id]);
  const candidates: ShopProduct[] = [];

  for (const cat of shopData.categories) {
    for (const p of cat.products ?? []) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      if ((p.minPrice ?? 0) <= 0) continue;
      // Attach slug to the product object for use in scoring
      (p as ShopProduct & { categorySlug?: string }).categorySlug = cat.slug;
      candidates.push(p);
    }
  }

  // Score each candidate
  const scored = candidates.map((p) =>
    scoreRecommendation(p, currentSignals, browsing),
  );

  // Re-rank with category preference boost and return top N
  return rankRecommendedProducts(scored, browsing, maxResults);
}
