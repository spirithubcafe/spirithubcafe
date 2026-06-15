import { useRegion } from '../../hooks/useRegion';
import { useTranslation } from 'react-i18next';
import { formatPrice as formatRegionalPrice } from '../../lib/regionUtils';

interface PriceDisplayProps {
  price: number;
  className?: string;
  showCurrency?: boolean;
}

/**
 * Component to display price with correct currency based on region and language
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  className = '', 
  showCurrency = true 
}) => {
  const { currentRegion } = useRegion();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <span className={className}>
      {showCurrency
        ? formatRegionalPrice(price, currentRegion.code, isArabic)
        : price.toFixed(3)}
    </span>
  );
};

/**
 * Hook to format price with region-specific currency and language
 */
export const usePrice = () => {
  const { currentRegion } = useRegion();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const formatPrice = (price: number, showCurrency: boolean = true): string => {
    return showCurrency
      ? formatRegionalPrice(price, currentRegion.code, isArabic)
      : price.toFixed(3);
  };

  const formatPriceWithCurrency = (price: number): string => {
    return formatRegionalPrice(price, currentRegion.code, isArabic);
  };

  return {
    formatPrice,
    formatPriceWithCurrency,
    currency: currentRegion.currency,
    currencySymbol: currentRegion.currencySymbol,
  };
};
