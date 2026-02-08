interface Props {
  minPrice: number | null;
  maxPrice: number | null;
  currency?: string;
}

export const PriceDisplay = ({
  minPrice,
  maxPrice,
  currency = 'OMR',
}: Props) => {
  const formatPrice = (price: number) => `${price.toFixed(3)} ${currency}`;

  if (minPrice === null || minPrice === undefined) {
    return <span className="text-sm text-stone-400">Price unavailable</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {minPrice === maxPrice || maxPrice === null || maxPrice === undefined ? (
        <span className="text-base font-semibold text-stone-900">
          {formatPrice(minPrice)}
        </span>
      ) : (
        <span className="text-base font-semibold text-stone-900">
          {formatPrice(minPrice)} – {formatPrice(maxPrice)}
        </span>
      )}
    </div>
  );
};
