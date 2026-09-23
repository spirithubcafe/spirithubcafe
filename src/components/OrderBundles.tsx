import { Gift, Package } from 'lucide-react';
import type { CustomBundle } from '../types/order';

interface OrderBundlesProps {
  bundles?: CustomBundle[];
  isArabic: boolean;
  renderPrice: (amount: number) => React.ReactNode;
}

export const OrderBundles = ({ bundles, isArabic, renderPrice }: OrderBundlesProps) => {
  if (!bundles?.length) return null;
  return <div className="space-y-4">{bundles.map((bundle) => (
    <section key={bundle.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="flex items-center gap-2 font-bold text-stone-900"><Package className="h-4 w-4 text-amber-700" />{isArabic ? 'اصنع حزمتك من القهوة' : 'Build Your Own Coffee Bundle'}</h3><p className="text-xs text-stone-500">{bundle.bundleName} · {bundle.selectedBagQuantity === 2 ? (isArabic ? 'ثنائية' : 'Duo') : (isArabic ? 'ثلاثية' : 'Trio')}</p></div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">-{bundle.discountPercentage}%</span>
      </div>
      <div className="mt-4 space-y-2">{[...bundle.components].sort((a, b) => a.sequence - b.sequence).map((component) => (
        <div key={component.orderItemId} className="flex justify-between gap-3 text-sm">
          <div><span className="font-medium">{component.productName}</span>{component.variantInfo && <span className="text-stone-500"> · {component.variantInfo}</span>}<span> × {component.quantity}</span>{component.isComplimentaryGift && <span className="ms-2 inline-flex items-center gap-1 text-emerald-700"><Gift className="h-3 w-3" />{isArabic ? 'مجاني' : 'Complimentary'}</span>}</div>
          <span>{component.isComplimentaryGift ? renderPrice(0) : renderPrice(component.postBundleSubtotal)}</span>
        </div>
      ))}</div>
      <div className="mt-4 space-y-1 border-t border-amber-200 pt-3 text-sm"><div className="flex justify-between"><span>{isArabic ? 'مجموع القهوة' : 'Coffee subtotal'}</span><span>{renderPrice(bundle.coffeeSubtotal)}</span></div><div className="flex justify-between text-emerald-700"><span>{isArabic ? 'خصم الحزمة' : 'Bundle discount'}</span><span>-{renderPrice(bundle.bundleDiscountAmount)}</span></div><div className="flex justify-between font-bold"><span>{isArabic ? 'مجموع الحزمة' : 'Bundle subtotal'}</span><span>{renderPrice(bundle.finalBundleSubtotal)}</span></div></div>
    </section>
  ))}</div>;
};
