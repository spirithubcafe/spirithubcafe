import { useRegion } from '../../hooks/useRegion';
import { useTranslation } from 'react-i18next';

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

  const formattedPrice = price.toFixed(3);
  
  // Show currency symbol for Arabic, currency code for English
  const currencyDisplay = isArabic ? currentRegion.currencySymbol : currentRegion.currency;

  return (
    <span className={className}>
      {formattedPrice}
      {showCurrency && <span className="currency-symbol"> {currencyDisplay}</span>}
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
    const formattedPrice = price.toFixed(3);
    const currencyDisplay = isArabic ? currentRegion.currencySymbol : currentRegion.currency;

    if (showCurrency) {
      return `${formattedPrice} ${currencyDisplay}`;
    }

    return formattedPrice;
  };

  const formatPriceWithCurrency = (price: number): string => {
    const formattedPrice = price.toFixed(3);
    const currencyDisplay = isArabic ? currentRegion.currencySymbol : currentRegion.currency;
    return `${formattedPrice} ${currencyDisplay}`;
  };

  return {
    formatPrice,
    formatPriceWithCurrency,
    currency: currentRegion.currency,
    currencySymbol: currentRegion.currencySymbol,
  };
};
