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
  const formatAmount = (price: number) => price.toFixed(3);

  const renderPrice = (price: number) => (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-base font-bold text-stone-900">{formatAmount(price)}</span>
      <span className="text-xs font-medium text-stone-500">{currency}</span>
    </span>
  );

  if (minPrice === null || minPrice === undefined) {
    return <span className="text-sm text-stone-400">Price unavailable</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {minPrice === maxPrice || maxPrice === null || maxPrice === undefined ? (
        renderPrice(minPrice)
      ) : (
        <span className="inline-flex items-center gap-2">
          {renderPrice(minPrice)}
          <span className="text-sm text-stone-400">–</span>
          {renderPrice(maxPrice)}
        </span>
      )}
    </div>
  );
};
