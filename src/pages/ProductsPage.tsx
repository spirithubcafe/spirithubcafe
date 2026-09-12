import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { useIsMobile } from '../hooks/use-mobile';
import { ProductCard } from '../components/products/ProductCard';
import { ProductsFilterAccordion, type FilterSectionConfig } from '../components/products/ProductsFilterAccordion';
import { PageHeader } from '../components/layout/PageHeader';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { useShopPage } from '../hooks/useShop';
import { useRegion } from '../hooks/useRegion';
import { getCategoryImageUrl } from '../lib/imageUtils';
import { productService } from '../services/productService';

type CategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

type SortOrder =
  | 'featured'
  | 'relevant'
  | 'best-selling'
  | 'alphabetical-asc'
  | 'alphabetical-desc'
  | 'price-asc'
  | 'price-desc'
  | 'date-asc'
  | 'date-desc';

type ProductCollection = 'featured' | 'premium' | 'limited';
type CoffeeFacet = 'process' | 'variety' | 'roastLevel' | 'uses' | 'origin';
type CoffeeAttributes = Partial<Record<CoffeeFacet, string>> & {
  originAr?: string;
  processAr?: string;
  varietyAr?: string;
  roastLevelAr?: string;
  usesAr?: string;
};

const countryOptions = [
  { value: 'Brazil', labelAr: 'البرازيل' },
  { value: 'Burundi', labelAr: 'بوروندي' },
  { value: 'Colombia', labelAr: 'كولومبيا' },
  { value: 'Costa Rica', labelAr: 'كوستاريكا' },
  { value: 'Ecuador', labelAr: 'الإكوادور' },
  { value: 'El Salvador', labelAr: 'السلفادور' },
  { value: 'Ethiopia', labelAr: 'إثيوبيا' },
  { value: 'Guatemala', labelAr: 'غواتيمالا' },
  { value: 'Honduras', labelAr: 'هندوراس' },
  { value: 'India', labelAr: 'الهند' },
  { value: 'Indonesia', labelAr: 'إندونيسيا' },
  { value: 'Kenya', labelAr: 'كينيا' },
  { value: 'Panama', labelAr: 'بنما' },
  { value: 'Rwanda', labelAr: 'رواندا' },
  { value: 'Yemen', labelAr: 'اليمن' },
] as const;

const coffeeUseOptions = [
  { value: 'espresso', label: 'Espresso', labelAr: 'إسبريسو', terms: ['espresso'] },
  { value: 'filter', label: 'Filter', labelAr: 'قهوة فلتر', terms: ['filter', 'pour over', 'pour-over', 'v60'] },
  { value: 'cold-brew', label: 'Cold Brew', labelAr: 'كولد برو', terms: ['cold brew'] },
  { value: 'nespresso-original', label: 'Nespresso Original', labelAr: 'نسبريسو أوريجنال', terms: ['nespresso original', 'nespresso'] },
  { value: 'milk-based', label: 'Milk Based', labelAr: 'قهوة بالحليب', terms: ['milk based', 'milk-based', 'milk'] },
] as const;

const coffeeProcessOptions = [
  { value: 'washed', label: 'Washed', labelAr: 'مغسولة', terms: ['washed'] },
  { value: 'natural', label: 'Natural', labelAr: 'طبيعية', terms: ['natural'] },
  { value: 'honey', label: 'Honey', labelAr: 'هاني', terms: ['honey'] },
  { value: 'anaerobic', label: 'Anaerobic', labelAr: 'لاهوائية', terms: ['anaerobic'] },
  { value: 'carbonic-maceration', label: 'Carbonic Maceration', labelAr: 'نقع كربوني', terms: ['carbonic maceration'] },
] as const;

const roastProfileOptions = [
  { value: 'light', label: 'Light Roast', labelAr: 'تحميص خفيف', terms: ['light'] },
  { value: 'medium', label: 'Medium Roast', labelAr: 'تحميص متوسط', terms: ['medium'] },
  { value: 'medium-dark', label: 'Medium Dark Roast', labelAr: 'تحميص متوسط داكن', terms: ['medium dark', 'medium-dark'] },
  { value: 'dark', label: 'Dark Roast', labelAr: 'تحميص داكن', terms: ['dark'] },
] as const;

const getCountriesFromOrigin = (origin?: string): string[] => {
  if (!origin) return [];
  const normalizedOrigin = origin.toLocaleLowerCase();
  return countryOptions
    .filter((country) => normalizedOrigin.includes(country.value.toLocaleLowerCase()))
    .map((country) => country.value);
};

const getCoffeeUses = (uses?: string): string[] => {
  if (!uses) return [];
  const normalizedUses = uses.toLocaleLowerCase();
  return coffeeUseOptions
    .filter((option) => option.terms.some((term) => normalizedUses.includes(term)))
    .map((option) => option.value);
};

const getCoffeeProcesses = (process?: string): string[] => {
  if (!process) return [];
  const normalizedProcess = process.toLocaleLowerCase();
  return coffeeProcessOptions
    .filter((option) => option.terms.some((term) => normalizedProcess.includes(term)))
    .map((option) => option.value);
};

const getRoastProfiles = (roastLevel?: string): string[] => {
  if (!roastLevel) return [];
  const normalizedRoastLevel = roastLevel.toLocaleLowerCase();
  return roastProfileOptions
    .filter((option) => option.terms.some((term) => normalizedRoastLevel.includes(term)))
    .map((option) => option.value);
};

const sortOptions: Array<{ value: SortOrder; label: string; labelAr: string; shortLabel: string; shortLabelAr: string }> = [
  { value: 'featured', label: 'Featured', labelAr: 'المميزة', shortLabel: 'Featured', shortLabelAr: 'المميزة' },
  { value: 'relevant', label: 'Most Relevant', labelAr: 'الأكثر صلة', shortLabel: 'Relevant', shortLabelAr: 'الصلة' },
  { value: 'best-selling', label: 'Best Selling', labelAr: 'الأكثر مبيعًا', shortLabel: 'Best Selling', shortLabelAr: 'الأكثر مبيعًا' },
  { value: 'alphabetical-asc', label: 'Alphabetically, A-Z', labelAr: 'أبجديًا، أ-ي', shortLabel: 'A-Z', shortLabelAr: 'أ-ي' },
  { value: 'alphabetical-desc', label: 'Alphabetically, Z-A', labelAr: 'أبجديًا، ي-أ', shortLabel: 'Z-A', shortLabelAr: 'ي-أ' },
  { value: 'price-asc', label: 'Price, Low to High', labelAr: 'السعر، من الأقل إلى الأعلى', shortLabel: 'Price: Low', shortLabelAr: 'السعر: أقل' },
  { value: 'price-desc', label: 'Price, High to Low', labelAr: 'السعر، من الأعلى إلى الأقل', shortLabel: 'Price: High', shortLabelAr: 'السعر: أعلى' },
  { value: 'date-asc', label: 'Date, Old to New', labelAr: 'التاريخ، من الأقدم إلى الأحدث', shortLabel: 'Oldest', shortLabelAr: 'الأقدم' },
  { value: 'date-desc', label: 'Date, New to Old', labelAr: 'التاريخ، من الأحدث إلى الأقدم', shortLabel: 'Newest', shortLabelAr: 'الأحدث' },
];

const isValidSortOrder = (value: string | null): value is SortOrder =>
  sortOptions.some((option) => option.value === value);

const parseListParam = (value: string | null): string[] => (value ? value.split(',').filter(Boolean) : []);

const parseNumberListParam = (value: string | null): number[] =>
  parseListParam(value)
    .map(Number)
    .filter((numericValue) => Number.isFinite(numericValue));

const GIFT_HINT_EN = '❤️ Gift Someone Special';
const GIFT_HINT_AR = '❤️ أهدي شخص مميز';
const LIMITED_HINT_EN = '✨ Limited Release';
const LIMITED_HINT_AR = '✨ إصدار محدود';

const isGiftOrBundleCategory = (name: string, hrefOrSlug: string): boolean => {
  const haystack = `${name} ${hrefOrSlug}`.toLowerCase();
  return (
    haystack.includes('bundle') ||
    haystack.includes('gift') ||
    haystack.includes('هدية') ||
    haystack.includes('هدايا') ||
    haystack.includes('أهدي')
  );
};

const isCompetitionPremiumCategory = (name: string, hrefOrSlug: string): boolean => {
  const haystack = `${name} ${hrefOrSlug}`.toLowerCase();
  return (
    haystack.includes('competition premium') ||
    haystack.includes('premium series') ||
    haystack.includes('series') ||
    haystack.includes('منافسة') ||
    haystack.includes('محدود')
  );
};

// Cache for category order to avoid repeated string normalization
const categoryOrderCache = new Map<string, number>();

const getPreferredCategoryOrder = (name: string): number => {
  if (categoryOrderCache.has(name)) {
    return categoryOrderCache.get(name)!;
  }

  const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
  let order = 1000;

  if (normalizedName.includes('espresso') && normalizedName.includes('milk-based')) order = 0;
  else if (normalizedName.includes('filter') && normalizedName.includes('pour-over')) order = 10;
  else if (normalizedName.includes('competition') && normalizedName.includes('premium')) order = 20;
  else if (normalizedName.includes('ufo') && normalizedName.includes('drip')) order = 30;
  else if (normalizedName.includes('spirithub') && normalizedName.includes('capsule')) order = 40;

  categoryOrderCache.set(name, order);
  return order;
};

const DeferredProductGroup = ({
  children,
  eager,
  productCount,
}: {
  children: ReactNode;
  eager: boolean;
  productCount: number;
}) => {
  const [shouldRender, setShouldRender] = useState(eager);
  const groupRef = useRef<HTMLDivElement>(null);
  const canRender = eager || shouldRender;

  useEffect(() => {
    if (canRender) return;

    const group = groupRef.current;
    if (!group || !('IntersectionObserver' in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      {
        rootMargin: window.matchMedia('(max-width: 767px)').matches
          ? '100px 0px'
          : '900px 0px',
      },
    );

    observer.observe(group);
    return () => observer.disconnect();
  }, [canRender]);

  const placeholderStyle = {
    '--product-count': Math.max(productCount, 1),
  } as CSSProperties;

  return (
    <div ref={groupRef} className="products-product-group space-y-6">
      {canRender ? (
        children
      ) : (
        <div
          className="products-product-group-placeholder"
          style={placeholderStyle}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

interface ProductsPageProps {
  hidePageChrome?: boolean;
}

export const ProductsPage = ({ hidePageChrome = false }: ProductsPageProps) => {
  const { i18n } = useTranslation();
  const {
    products,
    allCategories,
    loading,
    language,
    fetchProducts,
    fetchCategories,
  } = useApp();
  const { currentRegion } = useRegion();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobileViewport = useIsMobile();
  // Preserve the region prefix (/om or /sa) so navigate() stays on the same
  // route instance and never causes a ProductsPage remount.
  const regionPrefix = pathname.startsWith('/sa') ? '/sa' : '/om';
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || 'all');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<ProductCollection[]>(() =>
    parseListParam(searchParams.get('collections')).filter(
      (value): value is ProductCollection => value === 'featured' || value === 'premium' || value === 'limited',
    ),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => parseNumberListParam(searchParams.get('tags')));
  const [selectedCoffeeFacets, setSelectedCoffeeFacets] = useState<Partial<Record<CoffeeFacet, string[]>>>(() => {
    const facetsFromUrl: Partial<Record<CoffeeFacet, string[]>> = {};
    (['origin', 'uses', 'process', 'variety', 'roastLevel'] as CoffeeFacet[]).forEach((facetKey) => {
      const values = parseListParam(searchParams.get(facetKey));
      if (values.length > 0) facetsFromUrl[facetKey] = values;
    });
    return facetsFromUrl;
  });
  const [productAttributeOverrides, setProductAttributeOverrides] = useState<Record<string, CoffeeAttributes>>({});
  const [loadingCoffeeFacets, setLoadingCoffeeFacets] = useState(false);
  const hasLoadedCoffeeFacetsRef = useRef(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const sortFromUrl = searchParams.get('sort');
    return isValidSortOrder(sortFromUrl) ? sortFromUrl : 'alphabetical-asc';
  });
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(() => {
    const viewFromUrl = searchParams.get('view');
    return viewFromUrl === '2' || viewFromUrl === '3' || viewFromUrl === '4' ? (Number(viewFromUrl) as 2 | 3 | 4) : 4;
  });
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false);
  const [shouldLoadShopCategories, setShouldLoadShopCategories] = useState(false);
  const browseCategoriesSectionRef = useRef<HTMLDivElement>(null);
  const browseCategoriesRef = useRef<HTMLDivElement>(null);
  const { shopData } = useShopPage(shouldLoadShopCategories);

  const isArabic = i18n.language === 'ar';
  const getCategoryDisplayName = useCallback(
    (category: { name: string; nameAr?: string }) =>
      isArabic ? category.nameAr || category.name : category.name,
    [isArabic],
  );

  const coffeeProducts = products;
  const isProductsLoading = loading && coffeeProducts.length === 0;
  const filterableCoffeeProducts = useMemo(
    () => coffeeProducts.map((product) => ({ ...product, ...productAttributeOverrides[product.id] })),
    [coffeeProducts, productAttributeOverrides],
  );

  // Homepage data loading is intentionally deferred. If the user navigates
  // here before that work starts, request the missing route data immediately.
  useEffect(() => {
    if (products.length === 0) {
      void fetchProducts();
    }
    if (allCategories.length === 0) {
      void fetchCategories();
    }
  }, [allCategories.length, fetchCategories, fetchProducts, products.length]);

  // Keep filters usable when the categories request is delayed or unavailable.
  // Product list responses already include enough category data to build a fallback.
  const coffeeCategories = useMemo(() => {
    const mergedCategories = new Map(
      allCategories.map((category) => [category.id, category] as const),
    );

    coffeeProducts.forEach((product, index) => {
      const categoryName = (isArabic ? product.categoryAr || product.category : product.category)?.trim();
      const categoryId = product.categoryId || product.categorySlug || categoryName;
      if (!categoryName || !categoryId || mergedCategories.has(categoryId)) return;

      mergedCategories.set(categoryId, {
        id: categoryId,
        slug: product.categorySlug,
        name: product.category || categoryName,
        nameAr: product.categoryAr,
        description: '',
        image: product.image || '',
        displayOrder: allCategories.length > 0
          ? 1000 + index
          : index,
      });
    });

    return [...mergedCategories.values()].sort((a, b) => {
      // Build sort keys once per comparison
      const aKey = `${a.name} ${a.slug || ''}`;
      const bKey = `${b.name} ${b.slug || ''}`;

      const preferredOrderDifference =
        getPreferredCategoryOrder(aKey) -
        getPreferredCategoryOrder(bKey);

      if (preferredOrderDifference !== 0) return preferredOrderDifference;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  }, [allCategories, coffeeProducts, isArabic]);

  const canonicalUrl = useMemo(() => {
    // Use region-prefixed URL: /om for Oman (canonical), no prefix for SA
    const regionPath = regionPrefix === '/sa' ? '' : '/om';
    // Canonical URL never includes category query params (avoid duplicate content)
    return `${siteMetadata.baseUrl}${regionPath}/products`;
  }, [regionPrefix]);

  // Handle category change; URL query params are synchronized by the
  // centralized filter-sync effect further below.
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update selected category when URL changes
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory('all');
    }
    // NOTE: no scroll-to-top here — that would scroll the sticky filter bar
    // off-screen whenever a category is selected.
  }, [categoryFromUrl]);

  // Normalize selected category to a known category ID when allCategories change
  useEffect(() => {
    if (selectedCategory === 'all') {
      return;
    }

    const matchBySlug = coffeeCategories.find((cat) => cat.slug === selectedCategory);
    if (matchBySlug && selectedCategory !== matchBySlug.id) {
      setSelectedCategory(matchBySlug.id);
    }
  }, [coffeeCategories, selectedCategory]);

  // Get current category details
  const currentCategory = useMemo(() => {
    if (selectedCategory === 'all') {
      return null;
    }

    return (
      coffeeCategories.find((cat) => cat.id === selectedCategory) ||
      coffeeCategories.find((cat) => cat.slug === selectedCategory) ||
      null
    );
  }, [selectedCategory, coffeeCategories]);
  const currentCategoryDisplayName = currentCategory
    ? getCategoryDisplayName(currentCategory)
    : '';

  const availableProductTags = useMemo(() => {
    const tags = new Map<number, { id: number; name: string; nameAr?: string }>();
    filterableCoffeeProducts.forEach((product) => {
      [...(product.topTags ?? []), ...(product.bottomTags ?? [])].forEach((tag) => {
        tags.set(tag.id, tag);
      });
    });

    return [...tags.values()].sort((firstTag, secondTag) =>
      (isArabic ? firstTag.nameAr || firstTag.name : firstTag.name).localeCompare(
        isArabic ? secondTag.nameAr || secondTag.name : secondTag.name,
        isArabic ? 'ar' : 'en',
      ),
    );
  }, [filterableCoffeeProducts, isArabic]);

  const availableCoffeeFacets = useMemo(() => {
    const getOptions = (
      getValue: (product: typeof filterableCoffeeProducts[number]) => string | undefined,
      getArabicValue: (product: typeof filterableCoffeeProducts[number]) => string | undefined,
    ) => {
      const values = new Map<string, string>();
      filterableCoffeeProducts.forEach((product) => {
        const value = getValue(product)?.trim();
        if (!value) return;
        values.set(value, isArabic ? getArabicValue(product)?.trim() || value : value);
      });
      return [...values.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((firstOption, secondOption) => firstOption.label.localeCompare(secondOption.label, isArabic ? 'ar' : 'en'));
    };

    return [
      {
        key: 'origin' as const,
        label: isArabic ? 'بلد المنشأ' : 'Country of Origin',
        options: countryOptions
          .filter((country) => filterableCoffeeProducts.some((product) => getCountriesFromOrigin(product.origin).includes(country.value)))
          .map((country) => ({ value: country.value, label: isArabic ? country.labelAr : country.value })),
      },
      {
        key: 'uses' as const,
        label: isArabic ? 'الأفضل لـ' : 'Best for',
        options: coffeeUseOptions
          .filter((option) => filterableCoffeeProducts.some((product) => getCoffeeUses(product.uses).includes(option.value)))
          .map((option) => ({ value: option.value, label: isArabic ? option.labelAr : option.label })),
      },
      {
        key: 'process' as const,
        label: isArabic ? 'معالجة القهوة' : 'Coffee Process',
        options: coffeeProcessOptions
          .filter((option) => filterableCoffeeProducts.some((product) => getCoffeeProcesses(product.process).includes(option.value)))
          .map((option) => ({ value: option.value, label: isArabic ? option.labelAr : option.label })),
      },
      { key: 'variety' as const, label: isArabic ? 'نوع القهوة' : 'Coffee Variety', options: getOptions((product) => product.variety, (product) => product.varietyAr) },
      {
        key: 'roastLevel' as const,
        label: isArabic ? 'درجة التحميص' : 'Roast Profile',
        options: roastProfileOptions
          .filter((option) => filterableCoffeeProducts.some((product) => getRoastProfiles(product.roastLevel).includes(option.value)))
          .map((option) => ({ value: option.value, label: isArabic ? option.labelAr : option.label })),
      },
    ].filter((facet) => facet.options.length > 0);
  }, [filterableCoffeeProducts, isArabic]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const activeCategoryId =
      currentCategory?.id ??
      (selectedCategory !== 'all' && /^\d+$/.test(selectedCategory) ? selectedCategory : null);
    const activeCategorySlug =
      currentCategory?.slug ??
      (selectedCategory !== 'all' && !/^\d+$/.test(selectedCategory) ? selectedCategory : null);
    const activeCategoryName = currentCategory
      ? getCategoryDisplayName(currentCategory).trim().toLowerCase()
      : null;

    const matchingProducts = filterableCoffeeProducts.filter((product) => {
      // Business rule: never show inactive products publicly.
      if (product.isActive === false) {
        return false;
      }

      // If the product has no active variants, it should not appear in the listing.
      if (product.isOrderable === false) {
        return false;
      }

      // Filter by category using categoryId when available
      const matchesCategory =
        selectedCategory === 'all' ||
        (activeCategoryId && product.categoryId === activeCategoryId) ||
        (activeCategorySlug && product.categorySlug === activeCategorySlug) ||
        (activeCategoryName &&
          ((product.category && product.category.trim().toLowerCase() === activeCategoryName) ||
            (product.categoryAr && product.categoryAr.trim().toLowerCase() === activeCategoryName)));

      if (!matchesCategory) {
        return false;
      }

      const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
      if (
        normalizedSearchTerm &&
        !(product._searchText || `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase()).includes(normalizedSearchTerm)
      ) {
        return false;
      }

      if (
        selectedCollections.length > 0 &&
        !selectedCollections.some((collection) => {
          if (collection === 'featured') return product.featured;
          if (collection === 'premium') return product.isPremium;
          return product.isLimited;
        })
      ) {
        return false;
      }

      if (
        selectedTagIds.length > 0 &&
        ![...(product.topTags ?? []), ...(product.bottomTags ?? [])].some((tag) =>
          selectedTagIds.includes(tag.id),
        )
      ) {
        return false;
      }

      const matchesCoffeeFacets = (Object.entries(selectedCoffeeFacets) as Array<[CoffeeFacet, string[]]>).every(
        ([facet, selectedValues]) => {
          if (selectedValues.length === 0) return true;
          if (facet === 'origin') {
            return getCountriesFromOrigin(product.origin).some((country) => selectedValues.includes(country));
          }
          if (facet === 'uses') {
            return getCoffeeUses(product.uses).some((use) => selectedValues.includes(use));
          }
          if (facet === 'process') {
            return getCoffeeProcesses(product.process).some((process) => selectedValues.includes(process));
          }
          if (facet === 'roastLevel') {
            return getRoastProfiles(product.roastLevel).some((roastProfile) => selectedValues.includes(roastProfile));
          }
          return selectedValues.includes(product[facet] || '');
        },
      );

      if (!matchesCoffeeFacets) {
        return false;
      }

      return true;
    });

    const alphabeticalComparison = (firstProduct: typeof matchingProducts[number], secondProduct: typeof matchingProducts[number]) =>
      firstProduct.name.localeCompare(secondProduct.name, isArabic ? 'ar' : 'en', { sensitivity: 'base' });

    switch (sortOrder) {
      case 'featured':
        return [...matchingProducts].sort((firstProduct, secondProduct) =>
          Number(Boolean(secondProduct.featured)) - Number(Boolean(firstProduct.featured)) ||
          alphabeticalComparison(firstProduct, secondProduct),
        );
      case 'alphabetical-asc':
        return [...matchingProducts].sort(alphabeticalComparison);
      case 'alphabetical-desc':
        return [...matchingProducts].sort((firstProduct, secondProduct) =>
          alphabeticalComparison(secondProduct, firstProduct),
        );
      case 'price-asc':
        return [...matchingProducts].sort((firstProduct, secondProduct) => firstProduct.price - secondProduct.price);
      case 'price-desc':
        return [...matchingProducts].sort((firstProduct, secondProduct) => secondProduct.price - firstProduct.price);
      default:
        return matchingProducts;
    }
  }, [filterableCoffeeProducts, selectedCategory, currentCategory, getCategoryDisplayName, isArabic, searchTerm, selectedCollections, selectedTagIds, selectedCoffeeFacets, sortOrder]);

  // Group products by category when "All" is selected
  const productsByCategory = useMemo(() => {
    if (selectedCategory !== 'all') {
      return null;
    }

    const grouped = new Map<string, typeof filteredProducts>();
    
    filteredProducts.forEach((product) => {
      const categoryId = product.categoryId || 'uncategorized';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(product);
    });

    // coffeeCategories is already normalized into the preferred storefront order.
    // Do not sort by displayOrder again: fallback categories derive that value from
    // product arrival order, which can differ on a cold/Incognito request.
    const sortedCategories = coffeeCategories
      .map(cat => ({
        category: cat,
        products: grouped.get(cat.id) || []
      }))
      .filter(item => item.products.length > 0);

    const matchedCategoryIds = new Set(sortedCategories.map(({ category }) => category.id));

    // Keep products visible when category metadata is missing or stale.
    grouped.forEach((categoryProducts, categoryId) => {
      if (categoryId === 'uncategorized' || matchedCategoryIds.has(categoryId)) {
        return;
      }

      const firstProduct = categoryProducts[0];
      sortedCategories.push({
        category: {
          id: categoryId,
          name: firstProduct?.category || 'Uncategorized',
          nameAr: firstProduct?.categoryAr,
          slug: firstProduct?.categorySlug,
          description: '',
          image: '',
        },
        products: categoryProducts,
      });
    });

    // Add uncategorized products if any
    const uncategorized = grouped.get('uncategorized');
    if (uncategorized && uncategorized.length > 0) {
      sortedCategories.push({
        category: {
          id: 'uncategorized',
          name: isArabic ? 'غير مصنف' : 'Uncategorized',
          slug: 'uncategorized',
          description: '',
          image: '',
        },
        products: uncategorized
      });
    }

    return sortedCategories;
  }, [selectedCategory, filteredProducts, coffeeCategories, isArabic]);

  const seoContent = useMemo(() => {
    if (currentCategory && selectedCategory !== 'all') {
      return language === 'ar'
        ? {
            title: `اشتري ${currentCategoryDisplayName} | قهوة مختصة SpiritHub عمان والسعودية`,
            description: `اطلب ${currentCategoryDisplayName} من محمصة SpiritHub. قهوة مختصة محمصة طازجة، كبسولات، توصيل سريع في مسقط والخبر. اشتري الآن حبوب قهوة فاخرة.`,
          }
        : {
            title: `Buy ${currentCategoryDisplayName} | Specialty Coffee SpiritHub Oman & Saudi`,
            description: `Order ${currentCategoryDisplayName} from SpiritHub Roastery. Fresh roasted specialty coffee, capsules, fast delivery in Muscat & Khobar. Buy premium coffee beans online now.`,
          };
    }
    return language === 'ar'
      ? {
          title: 'اشتري قهوة مختصة وكبسولات | محمصة SpiritHub عمان والسعودية',
          description: 'اطلب الآن: حبوب قهوة مختصة محمصة طازجة، كبسولات متوافقة، معدات تحضير احترافية. توصيل سريع في مسقط عمان والخبر السعودية. محمصة متخصصة.',
        }
      : {
          title: 'Buy Specialty Coffee & Capsules | SpiritHub Roastery Oman & Saudi',
          description: 'Order now: fresh roasted specialty coffee beans, compatible capsules, professional brewing equipment. Fast delivery in Muscat Oman and Khobar Saudi Arabia. Expert roastery.',
        };
  }, [currentCategory, currentCategoryDisplayName, language, selectedCategory]);

  const structuredData = useMemo(() => {
    const regionPath = regionPrefix === '/sa' ? '' : '/om';
    const homeUrl = `${siteMetadata.baseUrl}${regionPath}`;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: language === 'ar' ? 'الرئيسية' : 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: language === 'ar' ? 'المنتجات' : 'Products', item: canonicalUrl },
          ...(currentCategory?.name
            ? [{ '@type': 'ListItem' as const, position: 3, name: currentCategoryDisplayName, item: canonicalUrl }]
            : []),
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        url: canonicalUrl,
        name: seoContent.title,
        description: seoContent.description,
        inLanguage: language === 'ar' ? 'ar' : 'en',
        numberOfItems: filteredProducts.length,
        publisher: {
          '@type': 'Organization',
          name: 'Spirit Hub Cafe',
          url: siteMetadata.baseUrl,
        },
      },
    ];
  }, [canonicalUrl, filteredProducts.length, language, seoContent.description, seoContent.title, regionPrefix, currentCategory, currentCategoryDisplayName]);

  // Category options
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const allOption: CategoryOption = {
      id: 'all',
      name: isArabic ? 'جميع القهوة' : 'All Coffee',
    };

    const mappedCategories = coffeeCategories.map<CategoryOption>((category) => ({
      id: category.id,
      name: getCategoryDisplayName(category),
      slug: category.slug,
    }));

    return [allOption, ...mappedCategories];
  }, [coffeeCategories, getCategoryDisplayName, isArabic]);

  // Reusable predicates shared between the main product filter and the
  // per-option "available product" counts shown in each accordion section.
  const productPassesSearch = useCallback(
    (product: typeof filterableCoffeeProducts[number]) => {
      const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
      if (!normalizedSearchTerm) return true;
      return (
        product._searchText || `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase()
      ).includes(normalizedSearchTerm);
    },
    [searchTerm],
  );

  const productPassesCategory = useCallback(
    (product: typeof filterableCoffeeProducts[number], categoryId: string) => {
      if (categoryId === 'all') return true;
      const candidateCategory =
        coffeeCategories.find((cat) => cat.id === categoryId) ??
        coffeeCategories.find((cat) => cat.slug === categoryId) ??
        null;
      const candidateCategoryId = candidateCategory?.id ?? (/^\d+$/.test(categoryId) ? categoryId : null);
      const candidateCategorySlug = candidateCategory?.slug ?? (!/^\d+$/.test(categoryId) ? categoryId : null);
      const candidateCategoryName = candidateCategory
        ? getCategoryDisplayName(candidateCategory).trim().toLowerCase()
        : null;

      return Boolean(
        (candidateCategoryId && product.categoryId === candidateCategoryId) ||
          (candidateCategorySlug && product.categorySlug === candidateCategorySlug) ||
          (candidateCategoryName &&
            ((product.category && product.category.trim().toLowerCase() === candidateCategoryName) ||
              (product.categoryAr && product.categoryAr.trim().toLowerCase() === candidateCategoryName))),
      );
    },
    [coffeeCategories, getCategoryDisplayName],
  );

  const productPassesCollections = useCallback(
    (product: typeof filterableCoffeeProducts[number], collections: ProductCollection[]) => {
      if (collections.length === 0) return true;
      return collections.some((collection) => {
        if (collection === 'featured') return product.featured;
        if (collection === 'premium') return product.isPremium;
        return product.isLimited;
      });
    },
    [],
  );

  const productPassesTags = useCallback(
    (product: typeof filterableCoffeeProducts[number], tagIds: number[]) => {
      if (tagIds.length === 0) return true;
      return [...(product.topTags ?? []), ...(product.bottomTags ?? [])].some((tag) => tagIds.includes(tag.id));
    },
    [],
  );

  const productPassesFacets = useCallback(
    (product: typeof filterableCoffeeProducts[number], facets: Partial<Record<CoffeeFacet, string[]>>, excludeKey?: CoffeeFacet) =>
      (Object.entries(facets) as Array<[CoffeeFacet, string[] | undefined]>).every(([facetKey, selectedValues]) => {
        if (facetKey === excludeKey) return true;
        if (!selectedValues || selectedValues.length === 0) return true;
        if (facetKey === 'origin') return getCountriesFromOrigin(product.origin).some((value) => selectedValues.includes(value));
        if (facetKey === 'uses') return getCoffeeUses(product.uses).some((value) => selectedValues.includes(value));
        if (facetKey === 'process') return getCoffeeProcesses(product.process).some((value) => selectedValues.includes(value));
        if (facetKey === 'roastLevel') return getRoastProfiles(product.roastLevel).some((value) => selectedValues.includes(value));
        return selectedValues.includes(product[facetKey] || '');
      }),
    [],
  );

  const getFacetOptionValue = useCallback(
    (product: typeof filterableCoffeeProducts[number], facetKey: CoffeeFacet, value: string) => {
      if (facetKey === 'origin') return getCountriesFromOrigin(product.origin).includes(value);
      if (facetKey === 'uses') return getCoffeeUses(product.uses).includes(value);
      if (facetKey === 'process') return getCoffeeProcesses(product.process).includes(value);
      if (facetKey === 'roastLevel') return getRoastProfiles(product.roastLevel).includes(value);
      return (product.variety ?? '').trim() === value;
    },
    [],
  );

  // Faceted "available product" counts: for each option, count products that
  // match every OTHER active filter plus that specific option (not the
  // filter's own current selection), so counts stay accurate as users refine.
  const filterCounts = useMemo(() => {
    const activeProducts = filterableCoffeeProducts.filter(
      (product) => product.isActive !== false && product.isOrderable !== false,
    );

    const baseForCategory = activeProducts.filter(
      (product) =>
        productPassesSearch(product) &&
        productPassesCollections(product, selectedCollections) &&
        productPassesTags(product, selectedTagIds) &&
        productPassesFacets(product, selectedCoffeeFacets),
    );
    const categoryCounts = new Map<string, number>(
      categoryOptions.map((option) => [
        option.id,
        option.id === 'all' ? baseForCategory.length : baseForCategory.filter((product) => productPassesCategory(product, option.id)).length,
      ]),
    );

    const baseForOthers = activeProducts.filter(
      (product) => productPassesCategory(product, selectedCategory) && productPassesSearch(product),
    );

    const baseForCollections = baseForOthers.filter(
      (product) => productPassesTags(product, selectedTagIds) && productPassesFacets(product, selectedCoffeeFacets),
    );
    const collectionCounts: Record<ProductCollection, number> = {
      featured: baseForCollections.filter((product) => product.featured).length,
      premium: baseForCollections.filter((product) => product.isPremium).length,
      limited: baseForCollections.filter((product) => product.isLimited).length,
    };

    const baseForTags = baseForOthers.filter(
      (product) => productPassesCollections(product, selectedCollections) && productPassesFacets(product, selectedCoffeeFacets),
    );
    const tagCounts = new Map<number, number>(
      availableProductTags.map((tag) => [
        tag.id,
        baseForTags.filter((product) => [...(product.topTags ?? []), ...(product.bottomTags ?? [])].some((t) => t.id === tag.id)).length,
      ]),
    );

    const facetOptionCounts = {} as Record<CoffeeFacet, Map<string, number>>;
    (['origin', 'uses', 'process', 'variety', 'roastLevel'] as CoffeeFacet[]).forEach((facetKey) => {
      const base = baseForOthers.filter(
        (product) =>
          productPassesCollections(product, selectedCollections) &&
          productPassesTags(product, selectedTagIds) &&
          productPassesFacets(product, selectedCoffeeFacets, facetKey),
      );
      const facetOptions = availableCoffeeFacets.find((facet) => facet.key === facetKey)?.options ?? [];
      const map = new Map<string, number>();
      facetOptions.forEach((option) => {
        map.set(option.value, base.filter((product) => getFacetOptionValue(product, facetKey, option.value)).length);
      });
      facetOptionCounts[facetKey] = map;
    });

    return { categoryCounts, collectionCounts, tagCounts, facetOptionCounts };
  }, [
    filterableCoffeeProducts,
    categoryOptions,
    availableProductTags,
    availableCoffeeFacets,
    selectedCategory,
    selectedCollections,
    selectedTagIds,
    selectedCoffeeFacets,
    productPassesSearch,
    productPassesCategory,
    productPassesCollections,
    productPassesTags,
    productPassesFacets,
    getFacetOptionValue,
  ]);

  const productsGridClassName = {
    2: 'grid grid-cols-1 min-[361px]:grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2',
    3: 'grid grid-cols-1 min-[361px]:grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 min-[361px]:grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4',
  }[gridColumns];
  const activeSortOption = sortOptions.find((option) => option.value === sortOrder)!;
  const hasActiveCustomerFilters = selectedCategory !== 'all' || searchTerm.trim().length > 0 || selectedCollections.length > 0 || selectedTagIds.length > 0 || Object.values(selectedCoffeeFacets).some((values) => values.length > 0);

  const toggleCollection = (collection: ProductCollection) => {
    setSelectedCollections((currentCollections) =>
      currentCollections.includes(collection)
        ? currentCollections.filter((currentCollection) => currentCollection !== collection)
        : [...currentCollections, collection],
    );
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((currentTagIds) =>
      currentTagIds.includes(tagId)
        ? currentTagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...currentTagIds, tagId],
    );
  };

  const toggleCoffeeFacet = (facet: CoffeeFacet, value: string) => {
    setSelectedCoffeeFacets((currentFacets) => {
      const selectedValues = currentFacets[facet] ?? [];
      return {
        ...currentFacets,
        [facet]: selectedValues.includes(value)
          ? selectedValues.filter((selectedValue) => selectedValue !== value)
          : [...selectedValues, value],
      };
    });
  };

  const clearCustomerFilters = () => {
    setSearchTerm('');
    setSelectedCollections([]);
    setSelectedTagIds([]);
    setSelectedCoffeeFacets({});
    if (selectedCategory !== 'all') {
      handleCategoryChange('all');
    }
  };

  const collectionLabels: Record<ProductCollection, string> = {
    featured: isArabic ? 'المميزة' : 'Featured',
    premium: isArabic ? 'الفاخرة' : 'Premium',
    limited: isArabic ? 'إصدار محدود' : 'Limited Release',
  };

  // Shared accordion sections rendered by both the desktop sidebar and the
  // mobile filter sheet.
  const filterSections: FilterSectionConfig[] = [
    {
      key: 'category',
      title: isArabic ? 'الفئة' : 'Category',
      options: categoryOptions.map((option) => ({
        value: option.id,
        label: option.name,
        count: filterCounts.categoryCounts.get(option.id) ?? 0,
      })),
      isSelected: (value) => selectedCategory === value,
      onToggle: (value) => handleCategoryChange(selectedCategory === value ? 'all' : value),
      defaultOpen: true,
    },
    ...availableCoffeeFacets.map((facet) => ({
      key: facet.key,
      title: facet.label,
      options: facet.options.map((option) => ({
        ...option,
        count: filterCounts.facetOptionCounts[facet.key]?.get(option.value) ?? 0,
      })),
      isSelected: (value: string) => (selectedCoffeeFacets[facet.key] ?? []).includes(value),
      onToggle: (value: string) => toggleCoffeeFacet(facet.key, value),
      defaultOpen: facet.key === 'origin' || facet.key === 'uses' || facet.key === 'process',
    })),
    ...(availableProductTags.length > 0
      ? [
          {
            key: 'tags',
            title: isArabic ? 'خصائص القهوة' : 'Coffee Attributes',
            options: availableProductTags.map((tag) => ({
              value: String(tag.id),
              label: isArabic ? tag.nameAr || tag.name : tag.name,
              count: filterCounts.tagCounts.get(tag.id) ?? 0,
            })),
            isSelected: (value: string) => selectedTagIds.includes(Number(value)),
            onToggle: (value: string) => toggleTag(Number(value)),
            defaultOpen: false,
          },
        ]
      : []),
    {
      key: 'collection',
      title: isArabic ? 'المجموعة' : 'Collection',
      options: (['featured', 'premium', 'limited'] as const).map((collection) => ({
        value: collection,
        label: collectionLabels[collection],
        count: filterCounts.collectionCounts[collection],
      })),
      isSelected: (value) => selectedCollections.includes(value as ProductCollection),
      onToggle: (value) => toggleCollection(value as ProductCollection),
      defaultOpen: false,
    },
  ];

  // Removable chips shown above the product grid for every active filter.
  const activeChips: Array<{ id: string; label: string; onRemove: () => void }> = [];
  if (selectedCategory !== 'all') {
    const categoryLabel = categoryOptions.find((option) => option.id === selectedCategory)?.name;
    if (categoryLabel) {
      activeChips.push({ id: `category-${selectedCategory}`, label: categoryLabel, onRemove: () => handleCategoryChange('all') });
    }
  }
  if (searchTerm.trim()) {
    activeChips.push({
      id: 'search',
      label: `${isArabic ? 'بحث' : 'Search'}: ${searchTerm.trim()}`,
      onRemove: () => setSearchTerm(''),
    });
  }
  availableCoffeeFacets.forEach((facet) => {
    (selectedCoffeeFacets[facet.key] ?? []).forEach((value) => {
      const optionLabel = facet.options.find((option) => option.value === value)?.label ?? value;
      activeChips.push({ id: `${facet.key}-${value}`, label: optionLabel, onRemove: () => toggleCoffeeFacet(facet.key, value) });
    });
  });
  selectedTagIds.forEach((tagId) => {
    const tag = availableProductTags.find((t) => t.id === tagId);
    if (tag) {
      activeChips.push({ id: `tag-${tagId}`, label: isArabic ? tag.nameAr || tag.name : tag.name, onRemove: () => toggleTag(tagId) });
    }
  });
  selectedCollections.forEach((collection) => {
    activeChips.push({ id: `collection-${collection}`, label: collectionLabels[collection], onRemove: () => toggleCollection(collection) });
  });

  const loadCoffeeFacetAttributes = useCallback(async () => {
    if (hasLoadedCoffeeFacetsRef.current || loadingCoffeeFacets || coffeeProducts.length === 0) return;

    hasLoadedCoffeeFacetsRef.current = true;
    setLoadingCoffeeFacets(true);
    const attributeOverrides: Record<string, CoffeeAttributes> = {};

    try {
      // Product list responses intentionally omit these detail attributes. A
      // bounded concurrent batch keeps the panel responsive without saturating
      // the customer's connection.
      for (let index = 0; index < coffeeProducts.length; index += 16) {
        const productBatch = coffeeProducts.slice(index, index + 16);
        const batchResults = await Promise.all(
          productBatch.map(async (product) => {
            try {
              const { product: detail } = await productService.getByIdentifierRaw(product.id);
              if (!detail) return null;
              return [product.id, {
                origin: detail.origin,
                originAr: (detail as typeof detail & { originAr?: string }).originAr,
                process: detail.process,
                processAr: detail.processAr,
                variety: detail.variety,
                varietyAr: detail.varietyAr,
                roastLevel: detail.roastLevel,
                roastLevelAr: detail.roastLevelAr,
                uses: detail.uses,
                usesAr: detail.usesAr,
              } satisfies CoffeeAttributes] as const;
            } catch {
              return null;
            }
          }),
        );

        batchResults.forEach((result) => {
          if (result) attributeOverrides[result[0]] = result[1];
        });
        setProductAttributeOverrides((currentOverrides) => ({
          ...currentOverrides,
          ...attributeOverrides,
        }));
      }
    } finally {
      setLoadingCoffeeFacets(false);
    }
  }, [coffeeProducts, loadingCoffeeFacets]);

  const handleToggleFilters = () => {
    if (isMobileViewport) {
      setIsMobileFiltersOpen(true);
    } else {
      setIsDesktopSidebarOpen((open) => !open);
    }
  };

  // Coffee attribute detail data isn't in the list response; load it once
  // products are available so facet options and counts can populate.
  useEffect(() => {
    if (coffeeProducts.length > 0) {
      void loadCoffeeFacetAttributes();
    }
  }, [coffeeProducts.length, loadCoffeeFacetAttributes]);

  // Keep URL query parameters synchronized with every active filter so a
  // filtered view can be shared and restored after a page refresh.
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedCollections.length > 0) params.set('collections', selectedCollections.join(','));
    if (selectedTagIds.length > 0) params.set('tags', selectedTagIds.join(','));
    (Object.entries(selectedCoffeeFacets) as Array<[CoffeeFacet, string[] | undefined]>).forEach(([facetKey, values]) => {
      if (values && values.length > 0) params.set(facetKey, values.join(','));
    });
    if (sortOrder !== 'alphabetical-asc') params.set('sort', sortOrder);
    if (gridColumns !== 4) params.set('view', String(gridColumns));

    const nextQuery = params.toString();
    if (nextQuery !== searchParams.toString()) {
      navigate(`${pathname}${nextQuery ? `?${nextQuery}` : ''}`, { replace: true });
    }
  }, [selectedCategory, searchTerm, selectedCollections, selectedTagIds, selectedCoffeeFacets, sortOrder, gridColumns, navigate, pathname, searchParams]);

  const browseCoffeeCategories = useMemo(
    () => [...allCategories].sort((a, b) => {
      const preferredOrderDifference =
        getPreferredCategoryOrder(`${a.name} ${a.slug || ''}`) -
        getPreferredCategoryOrder(`${b.name} ${b.slug || ''}`);
      if (preferredOrderDifference !== 0) return preferredOrderDifference;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    }),
    [allCategories],
  );

  const browseCategories = useMemo(() => {
    // This visual carousel must use real category metadata. Product-derived
    // fallback categories use a product image, which would visibly swap once
    // the category request completes.
    const coffeeItems = browseCoffeeCategories.map((category) => ({
      id: `coffee-${category.id}`,
      name: getCategoryDisplayName(category),
      image: category.image || '/images/slides/slide1.webp',
      kind: 'coffee' as const,
      categoryId: category.id,
      categorySlug: category.slug,
      href: '',
    }));

    const shopItems = (shopData?.categories ?? []).map((category) => ({
      id: `shop-${category.id}`,
      name: isArabic ? category.nameAr || category.name : category.name,
      image: getCategoryImageUrl(category.imagePath),
      kind: 'shop' as const,
      categoryId: String(category.id),
      categorySlug: category.slug,
      href: `/${currentRegion.code}/shop/${category.slug}`,
    }));

    return [...coffeeItems, ...shopItems];
  }, [browseCoffeeCategories, currentRegion.code, getCategoryDisplayName, isArabic, shopData?.categories]);

  const renderedBrowseCategories = useMemo(
    () => browseCategories,
    [browseCategories],
  );

  useEffect(() => {
    const section = browseCategoriesSectionRef.current;
    if (!section || shouldLoadShopCategories) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoadShopCategories(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoadShopCategories(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldLoadShopCategories]);

  const updateBrowseCategoryArrows = useCallback(() => {
    const viewport = browseCategoriesRef.current;
    if (!viewport) return;

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    setCanScrollCategoriesLeft(viewport.scrollLeft > 1);
    setCanScrollCategoriesRight(viewport.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const viewport = browseCategoriesRef.current;
    if (!viewport || !window.matchMedia('(min-width: 768px)').matches) return;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    const scheduleArrowUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateBrowseCategoryArrows();
      });
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        intersectionObserver.disconnect();
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = 0;
          if (isArabic) {
            viewport.scrollLeft = viewport.scrollWidth;
          }
          updateBrowseCategoryArrows();
        });

        resizeObserver = new ResizeObserver(scheduleArrowUpdate);
        resizeObserver.observe(viewport);
      },
      { rootMargin: '300px 0px' },
    );

    intersectionObserver.observe(viewport);
    viewport.addEventListener('scroll', scheduleArrowUpdate, { passive: true });

    return () => {
      intersectionObserver.disconnect();
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      viewport.removeEventListener('scroll', scheduleArrowUpdate);
      resizeObserver?.disconnect();
    };
  }, [isArabic, renderedBrowseCategories.length, updateBrowseCategoryArrows]);

  const scrollBrowseCategories = useCallback((direction: 'left' | 'right') => {
    const viewport = browseCategoriesRef.current;
    if (!viewport) return;

    viewport.scrollBy({
      left: direction === 'left' ? -viewport.clientWidth * 0.8 : viewport.clientWidth * 0.8,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      {!hidePageChrome && <AnnouncementBar />}
      <Seo
        title={seoContent.title}
        description={seoContent.description}
        keywords={[
          'specialty coffee Muscat',
          'buy coffee beans Oman',
          'fresh roasted coffee',
          'coffee roastery Muscat',
          'Nespresso capsules Oman',
          'brewing equipment',
          'single origin coffee',
          'coffee shop online Oman',
          currentCategoryDisplayName || 'Spirit Hub Cafe products',
          'قهوة مختصة مسقط',
          'شراء قهوة عمان',
          'محمصة قهوة',
        ]}
        canonical={canonicalUrl}
        structuredData={structuredData}
        type="website"
      />
      {/* Page Header */}
      {!hidePageChrome && (
        <PageHeader
          variant="products"
          title={currentCategory && selectedCategory !== 'all'
            ? currentCategoryDisplayName
            : 'Shop Specialty Coffee'
          }
          titleAr={currentCategory && selectedCategory !== 'all'
            ? currentCategoryDisplayName
            : 'منتجاتنا'
          }
          subtitle={currentCategory && selectedCategory !== 'all'
            ? (isArabic ? currentCategory.descriptionAr || currentCategory.description : currentCategory.description)
            : 'Freshly roasted in Oman & Saudi Arabia'
          }
          subtitleAr={currentCategory && selectedCategory !== 'all'
            ? (currentCategory.descriptionAr || currentCategory.description)
            : 'اكتشف مجموعتنا المميزة من القهوة والحلويات المحضرة بعناية'
          }
        />
      )}

      {/* Content Container */}
      <div className="relative">
        {/* Toolbar */}
        <div className="sticky-filter-bar products-filter-toolbar sticky flex items-center border-b border-border bg-background">
          <div className={`mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleFilters}
                aria-expanded={isMobileViewport ? isMobileFiltersOpen : isDesktopSidebarOpen}
                aria-controls="products-filter-sidebar"
                className={`gap-2 border-border text-foreground ${isArabic ? 'flex-row-reverse' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden md:inline">
                  {isDesktopSidebarOpen ? (isArabic ? 'إخفاء الفلاتر' : 'Hide Filters') : (isArabic ? 'إظهار الفلاتر' : 'Show Filters')}
                </span>
                <span className="md:hidden">
                  {isArabic ? 'الفلاتر' : 'Filters'}
                  {activeChips.length > 0 ? ` (${activeChips.length})` : ''}
                </span>
              </Button>

              <Popover open={sortOpen} onOpenChange={setSortOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={isArabic ? 'ترتيب المنتجات' : 'Sort products'}
                    className={`gap-2 border-border text-foreground ${isArabic ? 'flex-row-reverse' : ''}`}
                  >
                    <span>{isArabic ? activeSortOption.shortLabelAr : activeSortOption.shortLabel}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align={isArabic ? 'end' : 'start'} sideOffset={6} className="w-52 border-border bg-popover p-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { setSortOrder(option.value); setSortOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        sortOrder === option.value ? 'bg-amber-600 text-white' : 'text-foreground hover:bg-muted'
                      } ${isArabic ? 'flex-row-reverse' : ''}`}
                    >
                      <span className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>{isArabic ? option.labelAr : option.label}</span>
                      {sortOrder === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                {isArabic ? `${filteredProducts.length} منتج متاح` : `${filteredProducts.length} products`}
              </span>
            </div>

            <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`} role="group" aria-label={isArabic ? 'عدد أعمدة المنتجات' : 'Product grid columns'}>
              {[
                { columns: 2 as const, icon: Grid2X2, label: isArabic ? 'شبكة بعمودين' : 'Two-column grid' },
                { columns: 3 as const, icon: Grid3X3, label: isArabic ? 'شبكة بثلاثة أعمدة' : 'Three-column grid' },
                { columns: 4 as const, icon: LayoutGrid, label: isArabic ? 'شبكة بأربعة أعمدة' : 'Four-column grid' },
              ].map(({ columns, icon: Icon, label }) => (
                <button
                  key={columns}
                  type="button"
                  onClick={() => setGridColumns(columns)}
                  aria-label={label}
                  aria-pressed={gridColumns === columns}
                  className={`hidden h-8 w-8 place-items-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 md:grid ${
                    gridColumns === columns ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`mx-auto flex w-full max-w-[1440px] items-start gap-8 px-4 sm:px-6 lg:px-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
          {/* Desktop sticky sidebar */}
          {isDesktopSidebarOpen && (
            <aside
              id="products-filter-sidebar"
              aria-label={isArabic ? 'تصفية المنتجات' : 'Product filters'}
              className={`products-filter-sidebar hidden w-[300px] shrink-0 md:block ${isArabic ? 'md:border-s md:border-border' : 'md:border-e md:border-border'}`}
            >
              <div className="flex items-center justify-between px-2 py-3">
                <h2 className="text-sm font-semibold text-foreground">{isArabic ? 'الفلاتر' : 'Filters'}</h2>
                {hasActiveCustomerFilters && (
                  <button type="button" onClick={clearCustomerFilters} className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                    {isArabic ? 'مسح الكل' : 'Clear All'}
                  </button>
                )}
              </div>
              <div className="px-2 pb-3">
                <div className="relative">
                  <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={isArabic ? 'ابحث عن القهوة...' : 'Search coffee...'}
                    aria-label={isArabic ? 'البحث عن المنتجات' : 'Search products'}
                    className={`h-9 w-full rounded-md border border-border bg-background text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${isArabic ? 'pr-9 pl-2.5 text-right' : 'pl-9 pr-2.5'}`}
                  />
                </div>
              </div>
              {loadingCoffeeFacets && (
                <p className="px-2 pb-2 text-xs text-muted-foreground">
                  {isArabic ? 'جارٍ تحميل خصائص القهوة...' : 'Loading coffee attributes...'}
                </p>
              )}
              <ProductsFilterAccordion sections={filterSections} isArabic={isArabic} />
            </aside>
          )}

          {/* Products Grid */}
          <div className="products-results-container min-w-0 flex-1 py-8 md:py-10">
            {activeChips.length > 0 && (
              <div className={`mb-6 flex flex-wrap items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                {activeChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={chip.onRemove}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-amber-600 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 ${isArabic ? 'flex-row-reverse' : ''}`}
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearCustomerFilters}
                  className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {isArabic ? 'مسح الكل' : 'Clear all'}
                </button>
              </div>
            )}

            {isProductsLoading ? (
              <div className="space-y-8">
                {/* Results Count Skeleton */}
                <div className="flex justify-center">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                </div>
                {/* Product Cards Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                      <div className="aspect-square w-full animate-pulse bg-gray-100" />
                      <div className="space-y-2.5 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                        <div className="h-5 w-24 animate-pulse rounded-md bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {isArabic ? 'لم يتم العثور على منتجات' : 'No products found'}
                </h3>
                <p className="text-gray-500">
                  {isArabic
                    ? 'جرب تغيير فلاتر البحث'
                    : 'Try changing your search filters'}
                </p>
              </div>
            ) : (
              <>
                {/* Show grouped by category if "All" is selected */}
                {selectedCategory === 'all' && productsByCategory && productsByCategory.length > 0 ? (
                  <div className="space-y-16">
                    {productsByCategory.map(({ category, products: categoryProducts }, categoryIndex) => {
                      const categoryDisplayName = getCategoryDisplayName(category);
                      // Shorten category names
                      const getShortName = (name: string) => {
                        const shortNames: Record<string, string> = {
                          'Espresso Coffee': 'Espresso',
                          'Coffee Capsules': 'Capsules',
                          'Premium Coffee': 'Premium',
                          'Filter Coffee': 'Filter',
                          'Drip Coffee': 'Drip',
                        };
                        return shortNames[name] || name;
                      };

                      return (
                        <DeferredProductGroup
                          key={category.id}
                          eager={categoryIndex === 0}
                          productCount={categoryProducts.length}
                        >
                          {/* Category Section Header */}
                          <div className="flex items-center gap-4 pb-4 border-b-2 border-amber-500">
                            <div className="flex items-center gap-4 flex-1">
                              {category.image && category.id !== 'uncategorized' && (
                                <img
                                  src={category.image}
                                  alt={categoryDisplayName}
                                  width={64}
                                  height={64}
                                  loading="lazy"
                                  fetchPriority="low"
                                  decoding="async"
                                  className="w-16 h-16 rounded-lg object-cover shadow-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                  {getShortName(categoryDisplayName)}
                                </h2>
                              </div>
                            </div>
                            <button
                              onClick={() => handleCategoryChange(category.id)}
                              className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              {isArabic ? 'عرض الكل' : 'View All'}
                            </button>
                          </div>

                          {/* Category Products Grid */}
                          <div className={productsGridClassName}>
                            {categoryProducts.map((product, productIndex) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                prioritizeImage={categoryIndex === 0 && productIndex < 2}
                              />
                            ))}
                          </div>
                        </DeferredProductGroup>
                      );
                    })}
                  </div>
                ) : (
                  /* Single category view - standard grid */
                  <div className={productsGridClassName}>
                    {filteredProducts.map((product, productIndex) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        prioritizeImage={productIndex < 2}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile filter sheet */}
        <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
          <SheetContent side="bottom" className="flex h-[92dvh] w-full flex-col gap-0 rounded-t-2xl p-0 sm:max-w-full">
            <SheetHeader className={`flex-row items-center justify-between gap-2 border-b border-border p-4 text-start ${isArabic ? 'flex-row-reverse' : ''}`}>
              <SheetTitle>{isArabic ? 'الفلاتر' : 'Filters'}</SheetTitle>
              <SheetDescription className="sr-only">
                {isArabic ? 'تصفية وترتيب قائمة المنتجات.' : 'Filter and refine the product list.'}
              </SheetDescription>
              {hasActiveCustomerFilters && (
                <button
                  type="button"
                  onClick={clearCustomerFilters}
                  className={`text-xs font-semibold text-amber-600 hover:text-amber-700 ${isArabic ? 'me-8' : 'me-8'}`}
                >
                  {isArabic ? 'مسح الكل' : 'Clear All'}
                </button>
              )}
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={isArabic ? 'ابحث عن القهوة...' : 'Search coffee...'}
                    aria-label={isArabic ? 'البحث عن المنتجات' : 'Search products'}
                    className={`h-11 w-full rounded-md border border-border bg-background text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${isArabic ? 'pr-9 pl-2.5 text-right' : 'pl-9 pr-2.5'}`}
                  />
                </div>
              </div>
              {loadingCoffeeFacets && (
                <p className="px-4 pb-2 text-xs text-muted-foreground">
                  {isArabic ? 'جارٍ تحميل خصائص القهوة...' : 'Loading coffee attributes...'}
                </p>
              )}
              <ProductsFilterAccordion sections={filterSections} isArabic={isArabic} />
            </div>
            <SheetFooter className="border-t border-border p-4">
              <Button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="h-11 w-full bg-amber-600 text-white hover:bg-amber-700"
              >
                {isArabic ? `عرض ${filteredProducts.length} منتج` : `Show ${filteredProducts.length} Products`}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

      {/* All Categories Section */}
      <div ref={browseCategoriesSectionRef} className="products-categories-section bg-[#fbfbf9] py-8">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isArabic ? 'تصفح جميع الفئات' : 'BROWSE ALL CATEGORIES'}
            </h2>
          </div>

          <div className="relative mx-auto max-w-[1320px]">
            <div className="products-category-edge products-category-edge-left" />
            <div className="products-category-edge products-category-edge-right" />

            <button
              type="button"
              aria-label={isArabic ? 'التمرير لليسار' : 'Scroll left'}
              onClick={() => scrollBrowseCategories('left')}
              disabled={!canScrollCategoriesLeft}
              className="products-category-nav products-category-nav-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={isArabic ? 'التمرير لليمين' : 'Scroll right'}
              onClick={() => scrollBrowseCategories('right')}
              disabled={!canScrollCategoriesRight}
              className="products-category-nav products-category-nav-right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div ref={browseCategoriesRef} dir="ltr" className="products-category-viewport overflow-x-auto">
              <div className={`products-category-track flex pb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {renderedBrowseCategories.map((category) => {
              const isActive = category.kind === 'coffee' && (selectedCategory === category.categoryId || selectedCategory === category.categorySlug);
              const cardClassName = 'products-category-slide group block min-w-0 shrink-0 h-full cursor-pointer text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60';
              const cardBody = (
                <div className={`h-full overflow-hidden rounded-2xl border bg-[#fffdf9] shadow-[0_10px_30px_rgba(0,0,0,0.035)] transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(0,0,0,0.075)] ${
                  isActive
                    ? 'border-amber-500 shadow-md'
                    : 'border-[#dfe4dd] group-hover:border-[#d2d8d1]'
                }`}>
                  <div className="relative overflow-hidden aspect-[4/5]">
                    <img
                      src={category.image}
                      alt={category.name}
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/slides/slide1.webp';
                      }}
                    />

                    <div className={`absolute inset-0 transition-all duration-300 ${
                      isActive
                        ? 'bg-amber-500/10'
                        : 'bg-black/0 group-hover:bg-black/5'
                    }`} />
                  </div>

                  <div className="flex min-h-[84px] flex-col justify-center bg-[#fffdf9] px-3.5 py-3">
                    <h3
                      dir={isArabic ? 'rtl' : 'ltr'}
                      className={`w-full truncate whitespace-nowrap text-[0.98rem] font-semibold leading-7 tracking-tight transition-colors duration-200 ${isArabic ? 'text-right pe-1' : 'text-center'} ${
                      isActive
                        ? 'text-amber-600'
                        : 'text-gray-900 group-hover:text-amber-600'
                      }`}
                    >
                      {category.name}
                    </h3>
                    {isCompetitionPremiumCategory(category.name, category.href || category.categorySlug || '') ? (
                      <p
                        dir={isArabic ? 'rtl' : 'ltr'}
                        className={`mt-1 w-full truncate whitespace-nowrap text-[0.72rem] font-semibold leading-4 text-rose-600 ${isArabic ? 'text-right pe-1' : 'text-center'}`}
                      >
                        {isArabic ? LIMITED_HINT_AR : LIMITED_HINT_EN}
                      </p>
                    ) : null}
                    {!isCompetitionPremiumCategory(category.name, category.href || category.categorySlug || '') &&
                    isGiftOrBundleCategory(category.name, category.href || category.categorySlug || '') ? (
                      <p
                        dir={isArabic ? 'rtl' : 'ltr'}
                        className={`mt-1 w-full truncate whitespace-nowrap text-[0.72rem] font-semibold leading-4 text-rose-600 ${isArabic ? 'text-right pe-1' : 'text-center'}`}
                      >
                        {isArabic ? GIFT_HINT_AR : GIFT_HINT_EN}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
              
              if (category.kind === 'shop') {
                return (
                  <Link key={category.id} to={category.href} className={cardClassName}>
                    {cardBody}
                  </Link>
                );
              }

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.categoryId)}
                  className={cardClassName}
                >
                  {cardBody}
                </button>
              );
            })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .products-category-viewport {
          cursor: grab;
          scrollbar-width: none;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          overscroll-behavior-inline: contain;
          -webkit-overflow-scrolling: touch;
        }

        .products-category-viewport::-webkit-scrollbar {
          display: none;
        }

        .products-category-viewport:active {
          cursor: grabbing;
        }

        .products-category-track {
          direction: ltr;
          margin-left: -12px;
        }

        .products-category-slide {
          flex: 0 0 min(58vw, 212px);
          margin-left: 12px;
          scroll-snap-align: start;
        }

        .products-categories-section {
          content-visibility: auto;
          contain-intrinsic-size: auto 420px;
        }

        .products-product-group {
          content-visibility: auto;
          contain-intrinsic-size: auto 620px;
        }

        .products-product-group-placeholder {
          min-height: calc(120px + var(--product-count) * 215px);
        }

        .products-category-edge {
          pointer-events: none;
          position: absolute;
          top: 0;
          z-index: 10;
          display: none;
          height: 100%;
          width: 26px;
        }

        .products-category-edge-left {
          left: 0;
          background: linear-gradient(90deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .products-category-edge-right {
          right: 0;
          background: linear-gradient(270deg, rgba(251, 251, 249, 0.78), rgba(251, 251, 249, 0));
        }

        .products-category-nav {
          position: absolute;
          top: 50%;
          z-index: 20;
          display: none;
          height: 36px;
          width: 36px;
          transform: translateY(-50%);
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(77, 91, 84, 0.14);
          border-radius: 999px;
          background: rgba(255, 253, 249, 0.88);
          color: #4b5a58;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
        }

        .products-category-nav:not(:disabled):hover {
          background: #fffdf9;
          transform: translateY(-50%) scale(1.04);
        }

        .products-category-nav:disabled {
          opacity: 0.34;
          cursor: not-allowed;
        }

        .products-category-nav-left {
          left: 8px;
        }

        .products-category-nav-right {
          right: 8px;
        }

        @media (min-width: 640px) {
          .products-category-track {
            margin-left: -14px;
          }

          .products-category-slide {
            flex-basis: 212px;
            margin-left: 14px;
          }
        }

        @media (min-width: 768px) {
          .products-product-group-placeholder {
            min-height: calc(120px + var(--product-count) * 150px);
          }

          .products-category-edge,
          .products-category-nav {
            display: flex;
          }
        }

        @media (min-width: 1024px) {
          .products-product-group-placeholder {
            min-height: calc(120px + var(--product-count) * 115px);
          }
        }
      `}</style>
      </div> {/* End Content Container */}
    </div>
  );
};
