import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Coffee,
  ImageOff,
  Loader2,
  RefreshCw,
  Save,
  Search,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { getProductImageUrl } from '../../lib/imageUtils';
import {
  buildBundleUpdatePayload,
  getInitialSelectedVariantIds,
  getInitialSettingsDraft,
  groupVariantsByProduct,
  toggleVariantSelection,
  validateBundlePayload,
} from '../../lib/bundleAdminUtils';
import type { BundleSettingsDraft } from '../../lib/bundleAdminUtils';
import { bundleAdminService } from '../../services/bundleAdminService';
import { categoryService } from '../../services/categoryService';
import { productVariantService } from '../../services/productService';
import { BUILD_YOUR_OWN_COFFEE_CODE } from '../../types/bundleAdmin';
import type { BundleDefinitionDto } from '../../types/bundleAdmin';
import type { Category, VariantStockOverviewItem } from '../../types/product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { Separator } from '../ui/separator';

const BRANCH = 'om';
const STOCK_OVERVIEW_PAGE_SIZE = 200;
const STOCK_OVERVIEW_MAX_PAGES = 25;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/** Loads every variant (all categories, including inactive) so eligibility never hides rows. */
const loadFullVariantPool = async (): Promise<VariantStockOverviewItem[]> => {
  const all: VariantStockOverviewItem[] = [];
  for (let page = 1; page <= STOCK_OVERVIEW_MAX_PAGES; page++) {
    const result = await productVariantService.getStockOverview({
      page,
      pageSize: STOCK_OVERVIEW_PAGE_SIZE,
      includeInactive: true,
    });
    all.push(...result.items);
    if (page >= (result.totalPages || 1)) break;
  }
  return all;
};

export const CustomCoffeeBundleManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [definition, setDefinition] = useState<BundleDefinitionDto | null>(null);
  const [settings, setSettings] = useState<BundleSettingsDraft | null>(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set());

  const [categories, setCategories] = useState<Category[]>([]);
  const [variantPool, setVariantPool] = useState<VariantStockOverviewItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const initialSnapshotRef = useRef<string>('');
  const appliedDefaultCategoryRef = useRef(false);

  const applyAuthoritativeDefinition = useCallback((def: BundleDefinitionDto) => {
    const draft = getInitialSettingsDraft(def);
    const selected = getInitialSelectedVariantIds(def);
    setDefinition(def);
    setSettings(draft);
    setSelectedVariantIds(selected);
    initialSnapshotRef.current = JSON.stringify(buildBundleUpdatePayload(def, draft, selected));
    setDirty(false);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      const [definitions, categoryList] = await Promise.all([
        bundleAdminService.getAll(BRANCH),
        categoryService.getAll({ includeInactive: true }).catch(() => [] as Category[]),
      ]);

      const match = definitions.find((item) => item.code === BUILD_YOUR_OWN_COFFEE_CODE);
      if (!match) {
        setNotFound(true);
        setDefinition(null);
        return;
      }

      setCategories(categoryList);
      const items = await loadFullVariantPool();
      setVariantPool(items);
      applyAuthoritativeDefinition(match);
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          isArabic ? 'فشل تحميل إعدادات باقة القهوة المخصصة' : 'Failed to load the custom coffee bundle configuration'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [applyAuthoritativeDefinition, isArabic]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Warn on tab close/refresh while there are unsaved changes (no data-router blocker exists in this app).
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const variantById = useMemo(() => {
    const map = new Map<number, VariantStockOverviewItem>();
    for (const item of variantPool) map.set(item.variantId, item);
    return map;
  }, [variantPool]);

  const groups = useMemo(() => groupVariantsByProduct(variantPool), [variantPool]);

  const coffeeCategory = useMemo(
    () => categories.find((category) => /coffee/i.test(category.slug) || /coffee/i.test(category.name)),
    [categories]
  );

  // Default the category filter to the detected coffee category once, without fighting the admin's own choice later.
  useEffect(() => {
    if (!appliedDefaultCategoryRef.current && coffeeCategory) {
      setCategoryFilter(String(coffeeCategory.id));
      appliedDefaultCategoryRef.current = true;
    }
  }, [coffeeCategory]);

  const payload = useMemo(() => {
    if (!definition || !settings) return null;
    return buildBundleUpdatePayload(definition, settings, selectedVariantIds);
  }, [definition, settings, selectedVariantIds]);

  const validationError = useMemo(() => (payload ? validateBundlePayload(payload) : null), [payload]);

  // Recompute dirty state whenever anything editable changes.
  useEffect(() => {
    if (!payload) return;
    setDirty(JSON.stringify(payload) !== initialSnapshotRef.current);
  }, [payload]);

  const term = searchTerm.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    return groups.filter((group) => {
      // Never hide a product that has an already-eligible variant, even if it doesn't match the current filters.
      const hasSelectedVariant = group.variants.some((variant) => selectedVariantIds.has(variant.variantId));
      const matchesCategory =
        categoryFilter === 'all' || String(group.categoryId) === categoryFilter || hasSelectedVariant;
      if (!matchesCategory) return false;
      if (!term) return true;
      if (group.productName.toLowerCase().includes(term)) return true;
      if (group.productNameAr?.toLowerCase().includes(term)) return true;
      if (group.productSku.toLowerCase().includes(term)) return true;
      return group.variants.some((variant) => variant.variantSku.toLowerCase().includes(term));
    });
  }, [groups, categoryFilter, term, selectedVariantIds]);

  const eligibleVariantCount = selectedVariantIds.size;
  const eligibleProductCount = useMemo(() => {
    const productIds = new Set<number>();
    selectedVariantIds.forEach((id) => {
      const row = variantById.get(id);
      if (row) productIds.add(row.productId);
    });
    return productIds.size;
  }, [selectedVariantIds, variantById]);

  const giftVariant =
    definition?.complimentaryProductVariantId != null
      ? variantById.get(definition.complimentaryProductVariantId)
      : undefined;

  const handleToggleVariant = (variant: VariantStockOverviewItem) => {
    setSelectedVariantIds((prev) => {
      const next = toggleVariantSelection(prev, variant.variantId, variant.isActive);
      if (next === prev) {
        toast.error(
          isArabic ? 'لا يمكن تفعيل صنف غير نشط في الباقة' : 'Inactive variants cannot be added to the bundle.'
        );
      }
      return next;
    });
  };

  const updateSetting = <K extends keyof BundleSettingsDraft>(key: K, value: BundleSettingsDraft[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateTier = (requiredQuantity: number, patch: { discountPercentage?: number; complimentaryQuantity?: number }) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tiers: prev.tiers.map((tier) => (tier.requiredQuantity === requiredQuantity ? { ...tier, ...patch } : tier)),
      };
    });
  };

  const handleSave = async () => {
    if (!definition || !payload) return;
    const error = validateBundlePayload(payload);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      const updated = await bundleAdminService.update(definition.id, payload, BRANCH);
      applyAuthoritativeDefinition(updated);
      toast.success(isArabic ? 'تم حفظ إعدادات الباقة بنجاح' : 'Bundle configuration saved successfully.');
    } catch (saveError) {
      // Preserve unsaved selections/settings on failure — do not silently revert the UI.
      toast.error(
        getErrorMessage(
          saveError,
          isArabic ? 'فشل حفظ إعدادات الباقة' : 'Failed to save the bundle configuration.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isArabic ? 'تعذر تحميل الصفحة' : 'Failed to load this page'}</AlertTitle>
          <AlertDescription>
            <p>{loadError}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadAll}>
              <RefreshCw className="h-4 w-4 me-2" />
              {isArabic ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (notFound || !definition || !settings) {
    return (
      <div className="p-4 sm:p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Coffee className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>
              {isArabic ? 'لم يتم العثور على إعدادات الباقة' : 'No bundle configuration found'}
            </EmptyTitle>
            <EmptyDescription>
              {isArabic
                ? `لا يوجد تعريف باقة بالكود "${BUILD_YOUR_OWN_COFFEE_CODE}" لهذا الفرع. لن يتم إنشاء واحد تلقائيًا من هذه الصفحة.`
                : `No bundle definition with code "${BUILD_YOUR_OWN_COFFEE_CODE}" exists for this branch. This page will not create one automatically.`}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={loadAll}>
              <RefreshCw className="h-4 w-4 me-2" />
              {isArabic ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? 'باقة القهوة المخصصة' : 'Custom Coffee Bundle'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? 'إدارة إعدادات وأصناف باقة "اصنع قهوتك الخاصة"'
              : 'Manage settings and eligible variants for the "Build Your Own Coffee" bundle.'}
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading || saving || !dirty || Boolean(validationError)}>
          {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
          {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'الإعدادات العامة' : 'Bundle Settings'}</CardTitle>
          <CardDescription>
            {isArabic ? 'الكود والحد الأدنى/الأقصى للكمية للقراءة فقط في هذا الإصدار.' : 'Code and quantity limits are read-only in this version.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{isArabic ? 'الكود' : 'Code'}</span>
              <p className="text-sm font-mono">{definition.code}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{isArabic ? 'الاسم' : 'Name'}</span>
              <p className="text-sm">{isArabic && definition.nameAr ? definition.nameAr : definition.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {isArabic ? 'الحد الأدنى للكمية' : 'Minimum Quantity'}
              </span>
              <p className="text-sm">{definition.minimumQuantity}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                {isArabic ? 'الحد الأقصى للكمية' : 'Maximum Quantity'}
              </span>
              <p className="text-sm">{definition.maximumQuantity}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
              <div>
                <div className="text-sm font-medium">{isArabic ? 'الباقة مفعّلة' : 'Bundle Active'}</div>
                <div className="text-xs text-muted-foreground">
                  {isArabic ? 'إظهار الباقة للعملاء في المتجر' : 'Show this bundle to customers in the storefront'}
                </div>
              </div>
              <Switch checked={settings.isActive} onCheckedChange={(checked) => updateSetting('isActive', checked)} />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
              <div>
                <div className="text-sm font-medium">{isArabic ? 'السماح بتكرار الأصناف' : 'Allow Duplicate Variants'}</div>
                <div className="text-xs text-muted-foreground">
                  {isArabic ? 'السماح للعميل باختيار نفس الصنف أكثر من مرة' : 'Let customers pick the same variant more than once'}
                </div>
              </div>
              <Switch
                checked={settings.allowDuplicateVariants}
                onCheckedChange={(checked) => updateSetting('allowDuplicateVariants', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
              <div>
                <div className="text-sm font-medium">{isArabic ? 'استبعاد المنتجات المميزة' : 'Exclude Premium Products'}</div>
                <div className="text-xs text-muted-foreground">
                  {isArabic ? 'استبعاد المنتجات المميزة من الأهلية' : 'Keep premium-flagged products out of eligibility'}
                </div>
              </div>
              <Switch
                checked={settings.excludePremiumProducts}
                onCheckedChange={(checked) => updateSetting('excludePremiumProducts', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
              <div>
                <div className="text-sm font-medium">{isArabic ? 'استبعاد المنتجات محدودة الكمية' : 'Exclude Limited Products'}</div>
                <div className="text-xs text-muted-foreground">
                  {isArabic ? 'استبعاد المنتجات محدودة الكمية من الأهلية' : 'Keep limited-edition products out of eligibility'}
                </div>
              </div>
              <Switch
                checked={settings.excludeLimitedProducts}
                onCheckedChange={(checked) => updateSetting('excludeLimitedProducts', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3 sm:col-span-2">
              <div>
                <div className="text-sm font-medium">{isArabic ? 'السماح بخصومات الكوبونات' : 'Allow Coupon Discounts'}</div>
                <div className="text-xs text-muted-foreground">
                  {isArabic ? 'السماح بتطبيق كوبونات إضافية مع خصم الباقة' : 'Allow coupon codes to stack with the bundle discount'}
                </div>
              </div>
              <Switch
                checked={settings.allowCouponDiscounts}
                onCheckedChange={(checked) => updateSetting('allowCouponDiscounts', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              {isArabic ? 'هدية الإكمال (للقراءة فقط)' : 'Complimentary Gift (read-only)'}
            </span>
            {giftVariant ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
                <img
                  src={getProductImageUrl(giftVariant.mainImagePath)}
                  alt={giftVariant.productName}
                  className="h-10 w-10 rounded-md object-cover"
                />
                <div>
                  <div className="text-sm font-medium">{giftVariant.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    {giftVariant.variantSku} &middot; {giftVariant.weight}
                    {giftVariant.weightUnit}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {definition.complimentaryProductVariantId
                  ? isArabic
                    ? `معرف الصنف: ${definition.complimentaryProductVariantId} (التفاصيل غير متاحة في هذه الشاشة)`
                    : `Variant ID: ${definition.complimentaryProductVariantId} (details unavailable in this view)`
                  : isArabic
                    ? 'لا توجد هدية إكمال محددة'
                    : 'No complimentary gift variant configured'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'شرائح الخصم' : 'Discount Tiers'}</CardTitle>
          <CardDescription>
            {isArabic ? 'تعديل نسبة الخصم وعدد الأكواب المجانية لكل شريحة كمية.' : 'Edit the discount % and complimentary cups for each quantity tier.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {settings.tiers.map((tier) => (
            <div key={tier.requiredQuantity} className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
              <div className="text-sm font-semibold">
                {isArabic ? `${tier.requiredQuantity} أكياس` : `${tier.requiredQuantity}-Bag Tier`}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">{isArabic ? 'نسبة الخصم %' : 'Discount %'}</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={tier.discountPercentage}
                    onChange={(event) =>
                      updateTier(tier.requiredQuantity, { discountPercentage: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {isArabic ? 'عدد الأكواب المجانية' : 'Complimentary Cups'}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={tier.complimentaryQuantity}
                    onChange={(event) =>
                      updateTier(tier.requiredQuantity, { complimentaryQuantity: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{isArabic ? 'المنتجات المؤهلة' : 'Eligible Products'}</CardTitle>
              <CardDescription>
                {isArabic
                  ? 'اختر الأصناف المسموح بها ضمن الباقة. لا يوجد حد أقصى لعدد المنتجات المؤهلة.'
                  : 'Choose which variants may be picked in the bundle. There is no maximum on eligible products.'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {isArabic ? `الأصناف المؤهلة: ${eligibleVariantCount}` : `Eligible variants: ${eligibleVariantCount}`}
              </Badge>
              <Badge variant="outline">
                {isArabic
                  ? `منتجات القهوة المؤهلة: ${eligibleProductCount}`
                  : `Eligible coffee products: ${eligibleProductCount}`}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={isArabic ? 'ابحث بالاسم أو رمز المنتج...' : 'Search by product name or SKU...'}
                className="ps-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={isArabic ? 'كل الفئات' : 'All categories'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'كل الفئات' : 'All categories'}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {isArabic && category.nameAr ? category.nameAr : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {visibleGroups.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>{isArabic ? 'لا توجد نتائج' : 'No products found'}</EmptyTitle>
                <EmptyDescription>
                  {isArabic ? 'جرّب تعديل البحث أو الفئة المحددة.' : 'Try adjusting your search or category filter.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-3">
              {visibleGroups.map((group) => (
                <div key={group.productId} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-3">
                    {group.mainImagePath ? (
                      <img
                        src={getProductImageUrl(group.mainImagePath)}
                        alt={isArabic && group.productNameAr ? group.productNameAr : group.productName}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {isArabic && group.productNameAr ? group.productNameAr : group.productName}
                        </span>
                        {!group.productIsActive && (
                          <Badge variant="outline" className="border-red-500/40 text-red-600">
                            {isArabic ? 'غير نشط' : 'Inactive'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {group.productSku} &middot; {group.categoryName}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.variants.map((variant) => {
                      const checked = selectedVariantIds.has(variant.variantId);
                      return (
                        <label
                          key={variant.variantId}
                          className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2 hover:bg-accent/30"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggleVariant(variant)}
                            disabled={!variant.isActive && !checked}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {variant.weight}
                              {variant.weightUnit}
                              {!variant.isActive && (
                                <Badge variant="outline" className="border-red-500/40 text-[10px] text-red-600">
                                  {isArabic ? 'غير نشط' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {variant.variantSku} &middot; {variant.price.toFixed(3)} &middot;{' '}
                              {isArabic ? `المخزون: ${variant.stockQuantity}` : `Stock: ${variant.stockQuantity}`}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomCoffeeBundleManagement;
