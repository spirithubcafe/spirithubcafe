import { useRegion } from '../../hooks/useRegion';

interface PriceDisplayProps {
  price: number;
  className?: string;
  showCurrency?: boolean;
}

/**
 * Component to display price with correct currency based on region
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  className = '', 
  showCurrency = true 
}) => {
  const { currentRegion } = useRegion();

  const formattedPrice = new Intl.NumberFormat(currentRegion.locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  return (
    <span className={className}>
      {showCurrency && <span className="currency-symbol">{currentRegion.currencySymbol} </span>}
      {formattedPrice}
    </span>
  );
};

/**
 * Hook to format price with region-specific currency
 */
export const usePrice = () => {
  const { currentRegion } = useRegion();

  const formatPrice = (price: number, showCurrency: boolean = true): string => {
    const formattedPrice = new Intl.NumberFormat(currentRegion.locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

    if (showCurrency) {
      return `${currentRegion.currencySymbol} ${formattedPrice}`;
    }

    return formattedPrice;
  };

  const formatPriceWithCurrency = (price: number): string => {
    return new Intl.NumberFormat(currentRegion.locale, {
      style: 'currency',
      currency: currentRegion.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return {
    formatPrice,
    formatPriceWithCurrency,
    currency: currentRegion.currency,
    currencySymbol: currentRegion.currencySymbol,
  };
};
