import { OMANI_RIAL_SYMBOL } from '../../lib/regionUtils';

interface OmaniRialPriceProps {
  amount: number;
  isArabic: boolean;
  className?: string;
  amountClassName?: string;
  symbolClassName?: string;
}

export const OmaniRialPrice = ({
  amount,
  isArabic,
  className = '',
  amountClassName = '',
  symbolClassName = '',
}: OmaniRialPriceProps) => (
  <span
    dir={isArabic ? 'rtl' : 'ltr'}
    className={`inline-flex items-baseline gap-0.5 [unicode-bidi:isolate] ${className}`}
    aria-label={`${amount.toFixed(3)} OMR`}
  >
    <span
      aria-hidden="true"
      className={`relative -top-px text-[0.85em] font-normal leading-none ${symbolClassName}`}
    >
      {OMANI_RIAL_SYMBOL}
    </span>
    <span dir="ltr" className={amountClassName}>{amount.toFixed(3)}</span>
  </span>
);
