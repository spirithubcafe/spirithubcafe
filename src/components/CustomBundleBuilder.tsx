import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Gift, Loader2, Minus, Package, Plus, Search, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { customBundleService, CustomBundleApiError } from '../services/customBundleService';
import { canAddBundleSelection, customBundleErrorMessage } from '../lib/customBundle';
import { getProductImageUrl } from '../lib/imageUtils';
import { useCart } from '../hooks/useCart';
import { useRegion } from '../hooks/useRegion';
import { formatPrice } from '../lib/regionUtils';
import type { CustomBundleConfiguration, CustomBundleQuote, CustomBundleSelectionItem } from '../types/customBundle';

const INITIAL_VISIBLE_PRODUCTS = 6;

// SpiritHub classifies specific lots (Brazil, Ethiopia Hartume, Colombia Decaf) as espresso-suited; the rest are filter.
const ESPRESSO_KEYWORDS = /brazil|hartume|decaf|برازيل|هارتومي|ديكاف/i;
const isEspressoProduct = (product: Pick<CustomBundleConfiguration['eligibleProducts'][number], 'name' | 'nameAr' | 'origin' | 'tastingNotes' | 'tastingNotesAr'>) =>
  ESPRESSO_KEYWORDS.test(`${product.name} ${product.nameAr ?? ''} ${product.origin ?? ''} ${product.tastingNotes ?? ''} ${product.tastingNotesAr ?? ''}`);

// Splits a translated string on __B__...__/B__ markers to bold the wrapped portion (e.g. the discount %).
const renderWithBold = (text: string) => {
  const match = text.match(/^(.*)__B__(.*)__\/B__(.*)$/s);
  if (!match) return text;
  const [, before, bold, after] = match;
  return <>{before}<strong className="font-extrabold text-white">{bold}</strong>{after}</>;
};

export const CustomBundleBuilder = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');
  const { currentRegion } = useRegion();
  const { addCustomBundle, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [configuration, setConfiguration] = useState<CustomBundleConfiguration>();
  const [selections, setSelections] = useState<CustomBundleSelectionItem[]>([]);
  const [quote, setQuote] = useState<CustomBundleQuote>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [brewFilter, setBrewFilter] = useState<'all' | 'filter' | 'espresso'>('all');
  const [showAll, setShowAll] = useState(false);
  const quoteRequest = useRef(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    customBundleService.getConfiguration()
      .then((value) => active && setConfiguration(value))
      .catch((reason) => active && setError(customBundleErrorMessage(reason instanceof CustomBundleApiError ? reason.code : undefined, isArabic)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isArabic]);

  const selectedCount = selections.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    if (!configuration || selectedCount < configuration.minimumQuantity) {
      setQuote(undefined);
      return;
    }
    const requestId = ++quoteRequest.current;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(undefined);
      customBundleService.quote({
        definitionId: configuration.definitionId,
        configurationVersion: configuration.configurationVersion,
        items: selections,
      }).then((value) => {
        if (requestId === quoteRequest.current) setQuote(value);
      }).catch((reason) => {
        if (requestId === quoteRequest.current) {
          setQuote(undefined);
          setError(customBundleErrorMessage(reason instanceof CustomBundleApiError ? reason.code : undefined, isArabic));
        }
      }).finally(() => requestId === quoteRequest.current && setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [configuration, isArabic, selectedCount, selections]);

  const selectedByVariant = useMemo(() => new Map(selections.map((item) => [item.productVariantId, item.quantity])), [selections]);

  const changeSelection = (productId: number, productVariantId: number, delta: number) => {
    if (!configuration) return;
    const current = selectedByVariant.get(productVariantId) ?? 0;
    if (delta > 0 && !canAddBundleSelection(selectedCount, configuration.maximumQuantity)) return;
    if (delta > 0 && current > 0 && !configuration.allowDuplicateVariants) return;
    setSelections((previous) => {
      const existing = previous.find((item) => item.productVariantId === productVariantId);
      if (!existing && delta > 0) return [...previous, { productId, productVariantId, quantity: 1 }];
      const quantity = (existing?.quantity ?? 0) + delta;
      return quantity <= 0
        ? previous.filter((item) => item.productVariantId !== productVariantId)
        : previous.map((item) => item.productVariantId === productVariantId ? { ...item, quantity } : item);
    });
  };

  const addBundle = () => {
    if (!configuration || !quote) return;
    addCustomBundle({
      id: `custom-bundle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      selection: {
        definitionId: configuration.definitionId,
        configurationVersion: configuration.configurationVersion,
        items: selections.map((item) => ({ ...item })),
      },
      quote,
      addedAt: new Date().toISOString(),
    });
    setSelections([]);
    setQuote(undefined);
    toast.success(t('customBundle.added'));
    openCart();
  };

  const money = (amount: number) => formatPrice(amount, currentRegion.code, isArabic);

  const maxCount = Math.min(configuration?.maximumQuantity ?? 3, 3);
  const minCount = configuration ? Math.min(configuration.minimumQuantity, maxCount) : maxCount;
  const hasRange = minCount > 0 && minCount !== maxCount;
  const isComplete = selectedCount >= minCount;

  const topDiscount = useMemo(() => {
    const tiers = configuration?.tiers ?? [];
    if (!tiers.length) return undefined;
    return tiers.find((tier) => tier.requiredQuantity === maxCount)?.discountPercentage
      ?? Math.max(...tiers.map((tier) => tier.discountPercentage));
  }, [configuration?.tiers, maxCount]);

  const headlineLine2 = topDiscount !== undefined
    ? t('customBundle.headlineLine2WithDiscount', { discount: topDiscount })
    : t('customBundle.headlineLine2NoDiscount');

  const simpleSubtitleText = hasRange
    ? t('customBundle.simpleSubtitleRange', { min: minCount, max: maxCount })
    : t('customBundle.simpleSubtitle', { max: maxCount });

  const benefitBagsText = hasRange
    ? t('customBundle.benefitBagsRange', { min: minCount, max: maxCount })
    : t('customBundle.benefitBags', { max: maxCount });

  const filteredProducts = useMemo(() => {
    const products = configuration?.eligibleProducts ?? [];
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const isSelected = product.variants.some((variant) => selectedByVariant.has(variant.productVariantId));
      if (isSelected) return true;
      if (brewFilter === 'espresso' && !isEspressoProduct(product)) return false;
      if (brewFilter === 'filter' && isEspressoProduct(product)) return false;
      if (!query) return true;
      const haystack = [product.name, product.nameAr, product.origin, product.tastingNotes, product.tastingNotesAr]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [configuration?.eligibleProducts, search, brewFilter, selectedByVariant]);

  const visibleProducts = showAll ? filteredProducts : filteredProducts.slice(0, INITIAL_VISIBLE_PRODUCTS);
  const hasMoreProducts = filteredProducts.length > visibleProducts.length;

  if (error && !configuration) {
    return <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">{error}</div>;
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl">
      <div className="relative">
        <button type="button" onClick={() => setOpen((value) => !value)} className="group relative flex w-full flex-col items-start gap-4 overflow-hidden p-5 pb-4 text-start sm:flex-row sm:flex-nowrap sm:items-start sm:justify-between sm:gap-6 sm:p-10">
          <div className="relative z-10 pe-9 sm:max-w-xl sm:pe-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400"><Sparkles className="h-4 w-4" />{t('customBundle.eyebrow')}</div>
            <h2 className="text-xl! font-extrabold leading-tight sm:text-4xl!">
              <span className="block">{t('customBundle.headlineLine1')}</span>
              <span className="block">{renderWithBold(headlineLine2)}</span>
            </h2>
            {isArabic && <p className="mt-1 text-sm font-semibold text-amber-300">{t('customBundle.titleTagline')}</p>}
            <p className="mt-2 max-w-md text-sm text-stone-300 sm:text-base">{simpleSubtitleText}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-stone-400 sm:text-sm">
              <span>{benefitBagsText}</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>{t('customBundle.benefitMixOrigins')}</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>{t('customBundle.benefitMixSizes')}</span>
            </div>
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute -end-4 -bottom-4 hidden opacity-60 sm:flex sm:items-end">
            <ShoppingBag className="h-14 w-14 -rotate-12 text-amber-500/40" />
            <Package className="-mx-4 h-16 w-16 rotate-3 text-amber-400/50" />
            <ShoppingBag className="h-14 w-14 rotate-12 text-amber-500/40" />
          </div>

          <span className={`relative z-10 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-amber-500 px-6 py-3 text-sm font-extrabold text-stone-950 shadow-lg shadow-amber-500/20 transition-all group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-amber-500/30 sm:h-12 sm:w-auto sm:px-8 sm:text-base ${open ? 'hidden sm:inline-flex' : 'inline-flex'}`}>
            {open ? t('customBundle.close') : t('customBundle.open')}
            {!open && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 sm:h-5 sm:w-5" />}
          </span>
        </button>
        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('customBundle.closeAriaLabel')}
            className="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {open && (
        <div className="border-t border-white/10 bg-stone-50 p-4 text-stone-900 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
            <div>
              <h3 className={`text-base font-extrabold sm:text-xl ${isComplete ? 'text-emerald-600' : 'text-stone-900'}`}>
                {hasRange ? t('customBundle.chooseBagsRange', { min: minCount, max: maxCount }) : t('customBundle.chooseBags', { max: maxCount })}
                <span className="mx-2 text-stone-300">→</span>
                {hasRange ? t('customBundle.selectedCount', { count: selectedCount }) : t('customBundle.selectedOf', { count: selectedCount, max: maxCount })}
                {isComplete && <span className="ms-1">✓</span>}
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                {selectedCount === 0
                  ? t('customBundle.selectHint')
                  : selectedCount < minCount
                    ? t('customBundle.addMore', { remaining: minCount - selectedCount })
                    : selectedCount < maxCount
                      ? t('customBundle.readyOptionalMore', { max: maxCount })
                      : t('customBundle.readyToAdd')}
              </p>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-amber-600" />}
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('customBundle.searchPlaceholder')}
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 ps-9 pe-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {search.trim() && (
            <p className="mb-3 text-xs text-stone-500">{t('customBundle.resultsCount', { count: filteredProducts.length })}</p>
          )}

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setBrewFilter('all')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${brewFilter === 'all' ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}
            >
              {t('customBundle.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setBrewFilter('filter')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${brewFilter === 'filter' ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}
            >
              {t('customBundle.filterFilter')}
            </button>
            <button
              type="button"
              onClick={() => setBrewFilter('espresso')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${brewFilter === 'espresso' ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}
            >
              {t('customBundle.filterEspresso')}
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-center text-sm text-stone-500">{t('customBundle.noResults')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const productSelectedCount = product.variants.reduce((sum, variant) => sum + (selectedByVariant.get(variant.productVariantId) ?? 0), 0);
                return (
                  <article
                    key={product.productId}
                    className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition ${productSelectedCount > 0 ? 'border-amber-300 ring-2 ring-amber-200' : 'border-stone-200'}`}
                  >
                    <img src={getProductImageUrl(product.mainImage?.imagePath)} alt={isArabic ? product.nameAr || product.name : product.name} className="h-24 w-full shrink-0 object-cover sm:h-36" />
                    <div className="flex flex-1 flex-col p-2 sm:p-4">
                      <h4 className="line-clamp-1 text-sm font-bold break-words sm:text-base">{isArabic ? product.nameAr || product.name : product.name}</h4>
                      {(isArabic ? product.tastingNotesAr || product.tastingNotes : product.tastingNotes) && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-amber-600">{isArabic ? product.tastingNotesAr || product.tastingNotes : product.tastingNotes}</p>
                      )}
                      <div className="mt-auto space-y-1 pt-2 sm:space-y-1.5">{product.variants.map((variant) => { const quantity = selectedByVariant.get(variant.productVariantId) ?? 0; const selected = quantity > 0; return (
                        <div key={variant.productVariantId} className={`flex flex-wrap items-center justify-between gap-1.5 rounded-xl p-1.5 text-xs transition sm:gap-2 sm:p-2 sm:text-sm ${selected ? 'bg-amber-50 ring-1 ring-amber-300' : 'bg-stone-50'}`}>
                          <div className="font-semibold">
                            <span>{variant.weight} {variant.weightUnit}</span><span className="mx-1 text-stone-400">·</span><span className="text-amber-700">{money(variant.price)}</span>
                            {selected && <Check className="ms-1 inline h-3 w-3 text-emerald-600" aria-label={t('customBundle.selected')} />}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Button type="button" size="icon-lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-100" disabled={!quantity} onClick={() => changeSelection(product.productId, variant.productVariantId, -1)}><Minus className="size-5" /></Button>
                            <span className="w-5 text-center font-bold">{quantity}</span>
                            <Button type="button" size="icon-lg" disabled={!variant.isAvailable || !canAddBundleSelection(selectedCount, configuration?.maximumQuantity ?? 3) || (quantity > 0 && !configuration?.allowDuplicateVariants)} onClick={() => changeSelection(product.productId, variant.productVariantId, 1)}><Plus className="size-5" /></Button>
                          </div>
                        </div>); })}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {hasMoreProducts && (
            <button type="button" onClick={() => setShowAll(true)} className="mx-auto mt-4 block w-full rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 sm:w-auto">
              {t('customBundle.showMore')}
            </button>
          )}

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {quote && <div className="mb-20 mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 md:mb-0">
            <div className="flex items-center gap-2 font-bold"><Gift className="h-5 w-5 text-amber-700" />{t('customBundle.benefit', { discount: quote.discountPercentage, gifts: quote.complimentaryGift.quantity })}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm"><div><span className="block text-stone-500">{t('customBundle.coffeeSubtotal')}</span>{money(quote.coffeeSubtotal)}</div><div><span className="block text-stone-500">{t('customBundle.savings')}</span>-{money(quote.bundleDiscountAmount)}</div><div><span className="block text-stone-500">{t('customBundle.bundleSubtotal')}</span><strong>{money(quote.postDiscountBundleSubtotal)}</strong></div></div>
          </div>}
          <div className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-2 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-stone-200 sm:gap-4 md:static md:inset-x-auto md:sticky md:bottom-3 md:z-auto md:mt-5">
            <span className={`text-xs font-bold sm:text-sm ${isComplete ? 'text-emerald-600' : 'text-stone-700'}`}>
              <span className="hidden sm:inline">
                {hasRange ? t('customBundle.chooseBagsRange', { min: minCount, max: maxCount }) : t('customBundle.chooseBags', { max: maxCount })}
                <span className="mx-1.5 text-stone-300">→</span>
              </span>
              {hasRange ? t('customBundle.selectedCount', { count: selectedCount }) : t('customBundle.selectedOf', { count: selectedCount, max: maxCount })}
              {isComplete && <span className="ms-1">✓</span>}
            </span>
            <Button
              type="button"
              disabled={!quote || loading}
              onClick={addBundle}
              className={quote && !loading ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 font-bold shadow-md' : ''}
            >
              <ShoppingBag className="me-2 h-4 w-4" />{t('customBundle.add')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
