import type { SortBy } from '../../types/shop';

interface Props {
  value?: SortBy;
  ascending: boolean;
  onChange: (value: SortBy | undefined) => void;
  onToggleDirection: () => void;
  isArabic?: boolean;
}

const options: Array<{ value: SortBy | undefined; label: string; labelAr: string }> = [
  { value: undefined, label: 'Default', labelAr: 'الافتراضي' },
  { value: 'name', label: 'Name', labelAr: 'الاسم' },
  { value: 'price', label: 'Price', labelAr: 'السعر' },
  { value: 'rating', label: 'Rating', labelAr: 'التقييم' },
  { value: 'newest', label: 'Newest', labelAr: 'الأحدث' },
  { value: 'featured', label: 'Featured', labelAr: 'المميز' },
];

export const SortDropdown = ({ value, ascending, onChange, onToggleDirection, isArabic }: Props) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={value || ''}
        onChange={(event) => {
          const next = event.target.value as SortBy;
          onChange(next || undefined);
        }}
        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value || ''}>
            {isArabic ? option.labelAr : option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggleDirection}
        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm"
      >
        {ascending ? (isArabic ? 'تصاعدي ↑' : 'Ascending ↑') : isArabic ? 'تنازلي ↓' : 'Descending ↓'}
      </button>
    </div>
  );
};
