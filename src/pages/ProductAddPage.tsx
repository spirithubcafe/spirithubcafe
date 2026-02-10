import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { HtmlEditor } from '../components/ui/html-editor';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import type { ProductCreateUpdateDto, Category, Product } from '../types/product';
import { cn } from '../lib/utils';

interface ProductFormPageProps {
  mode?: 'create' | 'edit';
  productId?: number;
}

const mapProductToFormData = (product: Product): ProductCreateUpdateDto => ({
  sku: product.sku || '',
  name: product.name || '',
  nameAr: product.nameAr || '',
  description: product.description || '',
  descriptionAr: product.descriptionAr || '',
  notes: product.notes || '',
  notesAr: product.notesAr || '',
  aromaticProfile: product.aromaticProfile || '',
  aromaticProfileAr: product.aromaticProfileAr || '',
  intensity: product.intensity ?? 1,
  compatibility: product.compatibility || '',
  compatibilityAr: product.compatibilityAr || '',
  uses: product.uses || '',
  usesAr: product.usesAr || '',
  isActive: product.isActive,
  isDigital: product.isDigital,
  isFeatured: product.isFeatured,
  isLimited: product.isLimited ?? false,
  isPremium: product.isPremium ?? false,
  isOrganic: product.isOrganic,
  isFairTrade: product.isFairTrade,
  imageAlt: product.imageAlt || '',
  imageAltAr: product.imageAltAr || '',
  launchDate: product.launchDate,
  expiryDate: product.expiryDate,
  displayOrder: product.displayOrder ?? 0,
  origin: product.origin || '',
  tastingNotes: product.tastingNotes || '',
  tastingNotesAr: product.tastingNotesAr || '',
  brewingInstructions: product.brewingInstructions || '',
  brewingInstructionsAr: product.brewingInstructionsAr || '',
  roastLevel: product.roastLevel || '',
  roastLevelAr: product.roastLevelAr || '',
  process: product.process || '',
  processAr: product.processAr || '',
  variety: product.variety || '',
  varietyAr: product.varietyAr || '',
  altitude: product.altitude,
  farm: product.farm || '',
  farmAr: product.farmAr || '',
  metaTitle: product.metaTitle || '',
  metaDescription: product.metaDescription || '',
  metaKeywords: product.metaKeywords || '',
  tags: product.tags || '',
  slug: product.slug || '',
  categoryId: product.categoryId || 0,
  mainImageId: product.mainImageId,
});

export const ProductAddPage: React.FC<ProductFormPageProps> = ({
  mode = 'create',
  productId,
}) => {
  const { t } = useApp();
  const navigate = useNavigate();
  const params = useParams<{ productId?: string }>();
  const routeProductId = params.productId ? Number(params.productId) : undefined;
  const resolvedProductId =
    typeof productId === 'number'
      ? productId
      : typeof routeProductId === 'number' && !Number.isNaN(routeProductId)
        ? routeProductId
        : undefined;
  const isEditMode = mode === 'edit' || typeof resolvedProductId === 'number';
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState<ProductCreateUpdateDto>({
    sku: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    notes: '',
    notesAr: '',
    aromaticProfile: '',
    aromaticProfileAr: '',
    intensity: 1,
    compatibility: '',
    compatibilityAr: '',
    uses: '',
    usesAr: '',
    isActive: true,
    isDigital: false,
    isFeatured: false,
    isLimited: false,
    isPremium: false,
    isOrganic: false,
    isFairTrade: false,
    imageAlt: '',
    imageAltAr: '',
    launchDate: undefined,
    expiryDate: undefined,
    displayOrder: 0,
    origin: '',
    tastingNotes: '',
    tastingNotesAr: '',
    brewingInstructions: '',
    brewingInstructionsAr: '',
    roastLevel: '',
    roastLevelAr: '',
    process: '',
    processAr: '',
    variety: '',
    varietyAr: '',
    altitude: undefined,
    farm: '',
    farmAr: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    tags: '',
    slug: '',
    categoryId: 0,
    mainImageId: undefined,
  });

  const [skuAvailable, setSkuAvailable] = useState<boolean | null>(null);
  const [checkingSku, setCheckingSku] = useState(false);
  const [skuMessage, setSkuMessage] = useState<string | null>(null);

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!formData.sku) {
      setSkuAvailable(null);
      setSkuMessage(null);
      return;
    }

    let isMounted = true;
    setCheckingSku(true);
    const handler = window.setTimeout(async () => {
      try {
        const available = await productService.checkSku(formData.sku, resolvedProductId);
        if (!isMounted) return;
        setSkuAvailable(available);
        setSkuMessage(available ? t('admin.products.skuAvailable') : t('admin.products.skuUnavailable'));
      } catch (error) {
        console.error('Error checking SKU availability:', error);
        if (isMounted) {
          setSkuAvailable(null);
          setSkuMessage(t('admin.products.skuCheckError'));
        }
      } finally {
        if (isMounted) setCheckingSku(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(handler);
    };
  }, [formData.sku, resolvedProductId, t]);

  useEffect(() => {
    if (!formData.slug) {
      setSlugAvailable(null);
      setSlugMessage(null);
      return;
    }

    let isMounted = true;
    setCheckingSlug(true);
    const handler = window.setTimeout(async () => {
      try {
        const available = await productService.checkSlug(formData.slug!, resolvedProductId);
        if (!isMounted) return;
        setSlugAvailable(available);
        setSlugMessage(available ? t('admin.products.slugAvailable') : t('admin.products.slugUnavailable'));
      } catch (error) {
        console.error('Error checking slug availability:', error);
        if (isMounted) {
          setSlugAvailable(null);
          setSlugMessage(t('admin.products.slugCheckError'));
        }
      } finally {
        if (isMounted) setCheckingSlug(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(handler);
    };
  }, [formData.slug, resolvedProductId, t]);

  useEffect(() => {
    if (!isEditMode) {
      setIsInitializing(false);
      return;
    }

    if (!resolvedProductId) {
      setLoadError(t('admin.products.loadFailed'));
      setIsInitializing(false);
      return;
    }

    let isMounted = true;
    const fetchProduct = async () => {
      setIsInitializing(true);
      setLoadError(null);
      try {
        const product = await productService.getById(resolvedProductId);
        if (!isMounted) return;
        setFormData(mapProductToFormData(product));
        setSkuAvailable(true);
        setSlugAvailable(true);
      } catch (error) {
        console.error('Error loading product:', error);
        if (isMounted) {
          setLoadError(t('admin.products.loadFailed'));
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [isEditMode, resolvedProductId, t]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll({ includeInactive: false });
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (skuAvailable === false) {
        setSkuMessage(t('admin.products.skuUnavailable'));
        setSubmitting(false);
        return;
      }

      if (slugAvailable === false) {
        setSlugMessage(t('admin.products.slugUnavailable'));
        setSubmitting(false);
        return;
      }

      if (isEditMode && resolvedProductId) {
        await productService.update(resolvedProductId, formData);
      } else {
        await productService.create(formData);
      }
      navigate('/admin/products');
    } catch (error: unknown) {
      console.error('Error saving product:', error);
      const apiError = error as { message?: string; errors?: Record<string, string[]> };
      
      if (apiError.errors) {
        const errorMessages = Object.entries(apiError.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(`${t('admin.products.validationErrors')}\n${errorMessages}`);
      } else {
        alert(apiError.message ?? t('admin.products.saveError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? t('admin.products.edit') : t('admin.products.add');
  const submitLabel = isEditMode ? t('common.update') : t('common.create');

  if (isEditMode && isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center text-muted-foreground space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (isEditMode && loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{loadError}</p>
            <Button onClick={() => navigate('/admin/products')} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-padding-top pb-8">
      <div className="container mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="leading-none font-semibold text-2xl">{pageTitle}</h1>
              <Button variant="outline" onClick={() => navigate('/admin/products')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('admin.products.basicInfo')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">{t('admin.products.sku')} *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder={t('admin.products.skuPlaceholder')}
                      required
                      className={cn(
                        skuAvailable === false && 'border-destructive',
                        skuAvailable && 'border-green-500'
                      )}
                    />
                    <div className="flex min-h-5 items-center gap-2 text-xs">
                      {checkingSku && <Loader2 className="h-3 w-3 animate-spin" />}
                      {skuMessage && (
                        <span className={cn(
                          skuAvailable === false && 'text-destructive',
                          skuAvailable === true && 'text-green-600'
                        )}>
                          {skuMessage}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{t('admin.products.category')} *</Label>
                    <Select
                      value={formData.categoryId?.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.products.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('admin.products.name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={t('admin.products.namePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAr">{t('admin.products.nameAr')}</Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                      placeholder={t('admin.products.nameArPlaceholder')}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">{t('admin.products.slug')} *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder={t('admin.products.slugPlaceholder')}
                    required
                    className={cn(
                      slugAvailable === false && 'border-destructive',
                      slugAvailable && 'border-green-500'
                    )}
                  />
                  <div className="flex min-h-5 items-center gap-2 text-xs">
                    {checkingSlug && <Loader2 className="h-3 w-3 animate-spin" />}
                    {slugMessage && (
                      <span className={cn(
                        slugAvailable === false && 'text-destructive',
                        slugAvailable === true && 'text-green-600'
                      )}>
                        {slugMessage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('admin.products.description')}</Label>
                  <HtmlEditor
                    value={formData.description}
                    onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Product description..."
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('admin.products.descriptionAr')}</Label>
                  <HtmlEditor
                    value={formData.descriptionAr}
                    onChange={(value) => setFormData(prev => ({ ...prev, descriptionAr: value }))}
                    placeholder="وصف المنتج..."
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('admin.products.notes')}</Label>
                  <HtmlEditor
                    value={formData.notes}
                    onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                    placeholder="Additional notes..."
                    dir="ltr"
                    minHeight="150px"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('admin.products.notesAr')}</Label>
                  <HtmlEditor
                    value={formData.notesAr}
                    onChange={(value) => setFormData(prev => ({ ...prev, notesAr: value }))}
                    placeholder="ملاحظات إضافية..."
                    dir="rtl"
                    minHeight="150px"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('admin.products.settings')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">{t('admin.products.active')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                    />
                    <Label htmlFor="isFeatured">{t('admin.products.featured')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPremium"
                      checked={formData.isPremium}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked }))}
                    />
                    <Label htmlFor="isPremium">{t('admin.products.premium')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isLimited"
                      checked={formData.isLimited}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isLimited: checked }))}
                    />
                    <Label htmlFor="isLimited">{t('admin.products.limited')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isOrganic"
                      checked={formData.isOrganic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOrganic: checked }))}
                    />
                    <Label htmlFor="isOrganic">{t('admin.products.organic')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFairTrade"
                      checked={formData.isFairTrade}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFairTrade: checked }))}
                    />
                    <Label htmlFor="isFairTrade">{t('admin.products.fairTrade')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDigital"
                      checked={formData.isDigital}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDigital: checked }))}
                    />
                    <Label htmlFor="isDigital">{t('admin.products.digital')}</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">{t('admin.products.displayOrder')}</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intensity">{t('admin.products.intensity')}</Label>
                    <Input
                      id="intensity"
                      type="number"
                      value={formData.intensity}
                      onChange={(e) => setFormData(prev => ({ ...prev, intensity: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting || skuAvailable === false || slugAvailable === false}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {submitLabel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
