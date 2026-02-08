import type { ShopProduct } from '../../types/shop';
import { useApp } from '../../hooks/useApp';

interface Props {
  product: ShopProduct;
}

export const ProductBadges = ({ product }: Props) => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const badges: Array<{ label: string; className: string }> = [];

  if (product.isFeatured) {
    badges.push({ label: isArabic ? 'مميز' : 'Featured', className: 'bg-amber-500 text-white' });
  }
  if (product.isLimited) {
    badges.push({ label: isArabic ? 'محدود' : 'Limited', className: 'bg-red-500 text-white' });
  }
  if (product.isPremium) {
    badges.push({ label: isArabic ? 'فاخر' : 'Premium', className: 'bg-stone-900 text-white' });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
};
