import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/* ------------------------------------------------------------------ */
/*  Country Data                                                       */
/* ------------------------------------------------------------------ */

export interface Country {
  code: string;      // ISO 3166-1 alpha-2
  name: string;      // English name
  nameAr: string;    // Arabic name
  dialCode: string;  // e.g. "+968"
  flag: string;      // emoji flag
  maxDigits: number; // max phone digits (without country code)
  startsWith?: string; // optional: phone must start with this digit
  isGCC: boolean;
}

const GCC_COUNTRIES: Country[] = [
  { code: 'OM', name: 'Oman',                  nameAr: 'عُمان',               dialCode: '+968', flag: '🇴🇲', maxDigits: 8,  startsWith: '9', isGCC: true },
  { code: 'AE', name: 'United Arab Emirates',   nameAr: 'الإمارات',            dialCode: '+971', flag: '🇦🇪', maxDigits: 9,  startsWith: '5', isGCC: true },
  { code: 'SA', name: 'Saudi Arabia',           nameAr: 'السعودية',            dialCode: '+966', flag: '🇸🇦', maxDigits: 9,  startsWith: '5', isGCC: true },
  { code: 'QA', name: 'Qatar',                  nameAr: 'قطر',                 dialCode: '+974', flag: '🇶🇦', maxDigits: 8,  isGCC: true },
  { code: 'KW', name: 'Kuwait',                 nameAr: 'الكويت',              dialCode: '+965', flag: '🇰🇼', maxDigits: 8,  isGCC: true },
  { code: 'BH', name: 'Bahrain',                nameAr: 'البحرين',             dialCode: '+973', flag: '🇧🇭', maxDigits: 8,  isGCC: true },
];

const OTHER_COUNTRIES: Country[] = [
  { code: 'IQ', name: 'Iraq',                   nameAr: 'العراق',              dialCode: '+964', flag: '🇮🇶', maxDigits: 10, isGCC: false },
  { code: 'JO', name: 'Jordan',                 nameAr: 'الأردن',              dialCode: '+962', flag: '🇯🇴', maxDigits: 9,  isGCC: false },
  { code: 'LB', name: 'Lebanon',                nameAr: 'لبنان',               dialCode: '+961', flag: '🇱🇧', maxDigits: 8,  isGCC: false },
  { code: 'EG', name: 'Egypt',                  nameAr: 'مصر',                 dialCode: '+20',  flag: '🇪🇬', maxDigits: 10, isGCC: false },
  { code: 'SY', name: 'Syria',                  nameAr: 'سوريا',               dialCode: '+963', flag: '🇸🇾', maxDigits: 9,  isGCC: false },
  { code: 'PS', name: 'Palestine',              nameAr: 'فلسطين',              dialCode: '+970', flag: '🇵🇸', maxDigits: 9,  isGCC: false },
  { code: 'YE', name: 'Yemen',                  nameAr: 'اليمن',               dialCode: '+967', flag: '🇾🇪', maxDigits: 9,  isGCC: false },
  { code: 'LY', name: 'Libya',                  nameAr: 'ليبيا',               dialCode: '+218', flag: '🇱🇾', maxDigits: 10, isGCC: false },
  { code: 'TN', name: 'Tunisia',                nameAr: 'تونس',                dialCode: '+216', flag: '🇹🇳', maxDigits: 8,  isGCC: false },
  { code: 'DZ', name: 'Algeria',                nameAr: 'الجزائر',             dialCode: '+213', flag: '🇩🇿', maxDigits: 9,  isGCC: false },
  { code: 'MA', name: 'Morocco',                nameAr: 'المغرب',              dialCode: '+212', flag: '🇲🇦', maxDigits: 9,  isGCC: false },
  { code: 'SD', name: 'Sudan',                  nameAr: 'السودان',             dialCode: '+249', flag: '🇸🇩', maxDigits: 9,  isGCC: false },
  { code: 'SO', name: 'Somalia',                nameAr: 'الصومال',             dialCode: '+252', flag: '🇸🇴', maxDigits: 8,  isGCC: false },
  { code: 'MR', name: 'Mauritania',             nameAr: 'موريتانيا',           dialCode: '+222', flag: '🇲🇷', maxDigits: 8,  isGCC: false },
  { code: 'DJ', name: 'Djibouti',               nameAr: 'جيبوتي',              dialCode: '+253', flag: '🇩🇯', maxDigits: 8,  isGCC: false },
  { code: 'KM', name: 'Comoros',                nameAr: 'جزر القمر',           dialCode: '+269', flag: '🇰🇲', maxDigits: 7,  isGCC: false },
  { code: 'TR', name: 'Turkey',                 nameAr: 'تركيا',               dialCode: '+90',  flag: '🇹🇷', maxDigits: 10, isGCC: false },
  { code: 'IR', name: 'Iran',                   nameAr: 'إيران',               dialCode: '+98',  flag: '🇮🇷', maxDigits: 10, isGCC: false },
  { code: 'PK', name: 'Pakistan',               nameAr: 'باكستان',             dialCode: '+92',  flag: '🇵🇰', maxDigits: 10, isGCC: false },
  { code: 'IN', name: 'India',                  nameAr: 'الهند',               dialCode: '+91',  flag: '🇮🇳', maxDigits: 10, isGCC: false },
  { code: 'BD', name: 'Bangladesh',             nameAr: 'بنغلاديش',            dialCode: '+880', flag: '🇧🇩', maxDigits: 10, isGCC: false },
  { code: 'LK', name: 'Sri Lanka',              nameAr: 'سريلانكا',            dialCode: '+94',  flag: '🇱🇰', maxDigits: 9,  isGCC: false },
  { code: 'NP', name: 'Nepal',                  nameAr: 'نيبال',               dialCode: '+977', flag: '🇳🇵', maxDigits: 10, isGCC: false },
  { code: 'PH', name: 'Philippines',            nameAr: 'الفلبين',             dialCode: '+63',  flag: '🇵🇭', maxDigits: 10, isGCC: false },
  { code: 'ID', name: 'Indonesia',              nameAr: 'إندونيسيا',           dialCode: '+62',  flag: '🇮🇩', maxDigits: 12, isGCC: false },
  { code: 'ET', name: 'Ethiopia',               nameAr: 'إثيوبيا',             dialCode: '+251', flag: '🇪🇹', maxDigits: 9,  isGCC: false },
  { code: 'KE', name: 'Kenya',                  nameAr: 'كينيا',               dialCode: '+254', flag: '🇰🇪', maxDigits: 9,  isGCC: false },
  { code: 'NG', name: 'Nigeria',                nameAr: 'نيجيريا',             dialCode: '+234', flag: '🇳🇬', maxDigits: 10, isGCC: false },
  { code: 'GB', name: 'United Kingdom',         nameAr: 'المملكة المتحدة',     dialCode: '+44',  flag: '🇬🇧', maxDigits: 10, isGCC: false },
  { code: 'US', name: 'United States',          nameAr: 'الولايات المتحدة',    dialCode: '+1',   flag: '🇺🇸', maxDigits: 10, isGCC: false },
  { code: 'DE', name: 'Germany',                nameAr: 'ألمانيا',             dialCode: '+49',  flag: '🇩🇪', maxDigits: 11, isGCC: false },
  { code: 'FR', name: 'France',                 nameAr: 'فرنسا',               dialCode: '+33',  flag: '🇫🇷', maxDigits: 9,  isGCC: false },
  { code: 'CN', name: 'China',                  nameAr: 'الصين',               dialCode: '+86',  flag: '🇨🇳', maxDigits: 11, isGCC: false },
];

export const ALL_COUNTRIES: Country[] = [...GCC_COUNTRIES, ...OTHER_COUNTRIES];

export function getCountryByCode(code: string): Country | undefined {
  return ALL_COUNTRIES.find((c) => c.code === code);
}

export function getCountryByDialCode(dialCode: string): Country | undefined {
  return ALL_COUNTRIES.find((c) => c.dialCode === dialCode);
}

export function getDefaultCountry(): Country {
  return GCC_COUNTRIES[0]; // Oman
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CountryCodePickerProps {
  value: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
  isArabic?: boolean;
  compact?: boolean; // only show flag + dial code, no name
  className?: string;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  value,
  onChange,
  disabled = false,
  isArabic = false,
  compact = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search when popover opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setSearch('');
    }
  }, [open]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return { gcc: GCC_COUNTRIES, other: OTHER_COUNTRIES };
    const q = search.trim().toLowerCase();
    const matchFn = (c: Country) =>
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q);

    return {
      gcc: GCC_COUNTRIES.filter(matchFn),
      other: OTHER_COUNTRIES.filter(matchFn),
    };
  }, [search]);

  const handleSelect = (country: Country) => {
    onChange(country);
    setOpen(false);
  };

  const hasResults = filteredCountries.gcc.length > 0 || filteredCountries.other.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            compact ? 'min-w-[90px]' : 'min-w-[140px]',
            className,
          )}
        >
          <span className="text-base leading-none">{value.flag}</span>
          <span className="font-medium tabular-nums" dir="ltr">{value.dialCode}</span>
          {!compact && (
            <span className="text-muted-foreground text-xs truncate max-w-[80px]">
              {isArabic ? value.nameAr : value.code}
            </span>
          )}
          <ChevronDown className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={isArabic ? 'end' : 'start'}
        sideOffset={4}
        className="w-72 rounded-xl p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isArabic ? 'ابحث عن دولة...' : 'Search country...'}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            dir={isArabic ? 'rtl' : 'ltr'}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Country List */}
        <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
          {!hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {isArabic ? 'لا توجد نتائج' : 'No results found'}
            </div>
          )}

          {/* GCC Section */}
          {filteredCountries.gcc.length > 0 && (
            <div>
              <div className="px-3 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isArabic ? 'دول الخليج' : 'GCC Countries'}
                </span>
              </div>
              {filteredCountries.gcc.map((country) => (
                <CountryRow
                  key={country.code}
                  country={country}
                  isSelected={value.code === country.code}
                  isArabic={isArabic}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* Divider */}
          {filteredCountries.gcc.length > 0 && filteredCountries.other.length > 0 && (
            <div className="mx-3 my-1 border-t border-border" />
          )}

          {/* Other Countries Section */}
          {filteredCountries.other.length > 0 && (
            <div>
              <div className="px-3 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isArabic ? 'دول أخرى' : 'Other Countries'}
                </span>
              </div>
              {filteredCountries.other.map((country) => (
                <CountryRow
                  key={country.code}
                  country={country}
                  isSelected={value.code === country.code}
                  isArabic={isArabic}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ------------------------------------------------------------------ */
/*  Country Row                                                        */
/* ------------------------------------------------------------------ */

interface CountryRowProps {
  country: Country;
  isSelected: boolean;
  isArabic: boolean;
  onSelect: (country: Country) => void;
}

const CountryRow: React.FC<CountryRowProps> = ({ country, isSelected, isArabic, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(country)}
    className={cn(
      'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
      'hover:bg-accent/60',
      isSelected && 'bg-accent text-accent-foreground',
    )}
  >
    <span className="text-lg leading-none">{country.flag}</span>
    <div className="flex flex-1 items-center justify-between min-w-0">
      <span className={cn('truncate', isArabic && 'font-cairo')}>
        {isArabic ? country.nameAr : country.name}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground" dir="ltr">
        {country.dialCode}
      </span>
    </div>
    {isSelected && (
      <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
    )}
  </button>
);

export default CountryCodePicker;
