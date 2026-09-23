import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Loader2, Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
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

  if (error && !configuration) {
    return <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">{error}</div>;
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-stone-900 text-white shadow-xl">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 p-6 text-start sm:p-8">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400"><Sparkles className="h-4 w-4" />{t('customBundle.eyebrow')}</div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t('customBundle.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-300">{t('customBundle.subtitle')}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950">{open ? t('customBundle.close') : t('customBundle.open')}</span>
      </button>
      {open && (
        <div className="border-t border-white/10 bg-stone-50 p-4 text-stone-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h3 className="font-bold">{selectedCount === 0 ? t('customBundle.choose') : t('customBundle.progress', { count: selectedCount, max: Math.min(configuration?.maximumQuantity ?? 3, 3) })}</h3><p className="text-sm text-stone-500">{selectedCount === 1 ? t('customBundle.addSecond') : t('customBundle.selectHint')}</p></div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-amber-600" />}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {configuration?.eligibleProducts.map((product) => (
              <article key={product.productId} className="overflow-hidden rounded-2xl border bg-white">
                <img src={getProductImageUrl(product.mainImage?.imagePath)} alt={isArabic ? product.nameAr || product.name : product.name} className="h-36 w-full object-cover" />
                <div className="p-4"><h4 className="font-bold">{isArabic ? product.nameAr || product.name : product.name}</h4>
                  <div className="mt-3 space-y-2">{product.variants.map((variant) => { const quantity = selectedByVariant.get(variant.productVariantId) ?? 0; return (
                    <div key={variant.productVariantId} className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 p-2 text-sm">
                      <div><div>{variant.weight} {variant.weightUnit}</div><div className="font-semibold text-amber-700">{money(variant.price)}</div></div>
                      <div className="flex items-center gap-2"><Button type="button" size="icon" variant="outline" disabled={!quantity} onClick={() => changeSelection(product.productId, variant.productVariantId, -1)}><Minus className="h-4 w-4" /></Button><span className="w-5 text-center font-bold">{quantity}</span><Button type="button" size="icon" disabled={!variant.isAvailable || !canAddBundleSelection(selectedCount, configuration?.maximumQuantity ?? 3) || (quantity > 0 && !configuration?.allowDuplicateVariants)} onClick={() => changeSelection(product.productId, variant.productVariantId, 1)}><Plus className="h-4 w-4" /></Button></div>
                    </div>); })}</div>
                </div>
              </article>
            ))}
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {quote && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-bold"><Gift className="h-5 w-5 text-amber-700" />{t('customBundle.benefit', { discount: quote.discountPercentage, gifts: quote.complimentaryGift.quantity })}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm"><div><span className="block text-stone-500">{t('customBundle.coffeeSubtotal')}</span>{money(quote.coffeeSubtotal)}</div><div><span className="block text-stone-500">{t('customBundle.savings')}</span>-{money(quote.bundleDiscountAmount)}</div><div><span className="block text-stone-500">{t('customBundle.bundleSubtotal')}</span><strong>{money(quote.postDiscountBundleSubtotal)}</strong></div></div>
          </div>}
          <div className="sticky bottom-3 mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-stone-200"><span className="text-sm font-semibold">{t('customBundle.progress', { count: selectedCount, max: Math.min(configuration?.maximumQuantity ?? 3, 3) })}</span><Button type="button" disabled={!quote || loading} onClick={addBundle}><ShoppingBag className="me-2 h-4 w-4" />{t('customBundle.add')}</Button></div>
        </div>
      )}
    </section>
  );
};
