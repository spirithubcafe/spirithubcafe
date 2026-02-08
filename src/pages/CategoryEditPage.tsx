import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, Loader2, Save, Upload, X } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { shopApi } from '../services/shopApi';
import { fileUploadService } from '../services/fileUploadService';
import type { Category, CategoryCreateUpdateDto } from '../types/product';
import { cn } from '../lib/utils';
import { getCategoryImageUrl } from '../lib/imageUtils';

export const CategoryEditPage: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const quillRef = useRef<ReactQuill>(null);
  const quillRefAr = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryCreateUpdateDto>({
    name: '',
    nameAr: '',
    slug: '',
    description: '',
    descriptionAr: '',
    imagePath: '',
    isActive: true,
    isDisplayedOnHomepage: false,
    showInShop: false,
    displayOrder: 0,
    shopDisplayOrder: 0,
    taxPercentage: 0
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const shopStateRef = useRef<{ showInShop: boolean } | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      if (!id) {
        navigate('/admin/categories');
        return;
      }

      try {
        setLoading(true);
        const data = await categoryService.getById(parseInt(id));
        setCategory(data);
        setFormData({
          name: data.name,
          nameAr: data.nameAr || '',
          slug: data.slug,
          description: data.description || '',
          descriptionAr: data.descriptionAr || '',
          imagePath: data.imagePath || '',
          isActive: data.isActive,
          isDisplayedOnHomepage: data.isDisplayedOnHomepage,
          showInShop: data.showInShop ?? false,
          displayOrder: data.displayOrder,
          shopDisplayOrder: data.shopDisplayOrder ?? 0,
          taxPercentage: data.taxPercentage
        });

        try {
          const shopResponse = await shopApi.getShopPage();
          if (shopResponse.success) {
            const shopCategory = shopResponse.data.categories.find((cat) => cat.id === data.id);
            const showInShop = Boolean(shopCategory);
            const shopDisplayOrder = shopCategory?.shopDisplayOrder ?? 0;
            shopStateRef.current = { showInShop };
            setFormData(prev => ({
              ...prev,
              showInShop,
              shopDisplayOrder,
            }));
          }
        } catch (shopError) {
          console.warn('Unable to load shop visibility state:', shopError);
        }
      } catch (error) {
        console.error('Error loading category:', error);
        alert(t('admin.categories.loadError'));
        navigate('/admin/categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id, navigate, t]);

  useEffect(() => {
    if (!formData.slug || !category) {
      setSlugAvailable(null);
      setSlugMessage(null);
      return;
    }

    // If slug hasn't changed from original, consider it available
    if (formData.slug === category.slug) {
      setSlugAvailable(true);
      setSlugMessage(null);
      return;
    }

    let isMounted = true;
    setCheckingSlug(true);
    const handler = window.setTimeout(async () => {
      try {
        const available = await categoryService.checkSlug(formData.slug, category.id);
        if (!isMounted) {
          return;
        }
        setSlugAvailable(available);
        setSlugMessage(
          available ? t('admin.categories.slugAvailable') : t('admin.categories.slugUnavailable')
        );
      } catch (error) {
        console.error('Error checking slug availability:', error);
        if (isMounted) {
          setSlugAvailable(null);
          setSlugMessage(t('admin.categories.slugCheckError'));
        }
      } finally {
        if (isMounted) {
          setCheckingSlug(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(handler);
    };
  }, [formData.slug, category, t]);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      fileUploadService.validateFile(file, 5 * 1024 * 1024, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.imageUploadError'));
      return;
    }

    setUploadingImage(true);
    try {
      const preview = await fileUploadService.createPreviewUrl(file);
      setImagePreview(preview);

      const result = await fileUploadService.uploadFile(file, 'categories', 'image', 'category');
      
      if (!result.success || !result.fileUrl) {
        throw new Error(result.message || 'Upload failed');
      }

      setFormData(prev => ({ ...prev, imagePath: result.fileUrl! }));
      toast.success(t('common.imageUploadSuccess'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('common.imageUploadError'));
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagePath: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      return;
    }

    setSubmitting(true);
    
    try {
      if (slugAvailable === false) {
        setSlugMessage(t('admin.categories.slugUnavailable'));
        setSubmitting(false);
        return;
      }

      const dataToSend: CategoryCreateUpdateDto = {
        slug: formData.slug.trim(),
        name: formData.name.trim(),
        nameAr: formData.nameAr?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        descriptionAr: formData.descriptionAr?.trim() || undefined,
        imagePath: formData.imagePath?.trim() || undefined,
        isActive: formData.isActive,
        isDisplayedOnHomepage: formData.isDisplayedOnHomepage,
        showInShop: formData.showInShop,
        displayOrder: Number(formData.displayOrder),
        shopDisplayOrder: Number(formData.shopDisplayOrder),
        taxPercentage: Number(formData.taxPercentage)
      };

      await categoryService.update(category.id, dataToSend);

      if (shopStateRef.current && shopStateRef.current.showInShop !== formData.showInShop) {
        await shopApi.toggleCategoryShop(category.id);
      }
      navigate('/admin/categories');
    } catch (error: unknown) {
      console.error('Error updating category:', error);
      
      const apiError = error as { message?: string; statusCode?: number; errors?: Record<string, string[]> };
      
      if (apiError.errors) {
        const errorMessages = Object.entries(apiError.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(`${t('admin.categories.validationErrors')}\n${errorMessages}`);
      } else {
        alert(apiError.message ?? t('admin.categories.saveError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'align',
    'link'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 page-padding-top pb-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('common.loading')}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 page-padding-top pb-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="leading-none font-semibold text-2xl">{t('admin.categories.edit')}</h1>
              <Button variant="outline" onClick={() => navigate('/admin/categories')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('admin.categories.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={t('admin.categories.namePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">{t('admin.categories.nameAr')}</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                    placeholder={t('admin.categories.nameArPlaceholder')}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">{t('admin.categories.slug')} *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder={t('admin.categories.slugPlaceholder')}
                  required
                  className={cn(
                    slugAvailable === false &&
                      'border-destructive focus-visible:ring-destructive/60',
                    slugAvailable &&
                      'border-green-500/80 focus-visible:ring-green-500/50'
                  )}
                />
                <div className="flex min-h-[1.25rem] items-center gap-2 text-xs">
                  {checkingSlug && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                  {slugMessage && (
                    <span
                      className={cn(
                        slugAvailable === false && 'text-destructive',
                        slugAvailable === true && 'text-green-600',
                        slugAvailable === null && 'text-muted-foreground'
                      )}
                    >
                      {slugMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Description with Rich Text Editor */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('admin.categories.description')}</Label>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder={t('admin.categories.descriptionPlaceholder')}
                  className="bg-white"
                />
              </div>

              {/* Description Arabic with Rich Text Editor */}
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t('admin.categories.descriptionAr')}</Label>
                <ReactQuill
                  ref={quillRefAr}
                  theme="snow"
                  value={formData.descriptionAr}
                  onChange={(value) => setFormData(prev => ({ ...prev, descriptionAr: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder={t('admin.categories.descriptionArPlaceholder')}
                  className="bg-white"
                  style={{ direction: 'rtl' }}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="imageUpload">{t('admin.categories.image')}</Label>
                
                <div className="flex items-start gap-3">
                  {/* Upload Button and Remove */}
                  <div className="flex-1 space-y-2">
                    <input
                      id="imageUpload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      title={t('admin.categories.imageUpload')}
                      aria-label={t('admin.categories.imageUpload')}
                      className="hidden"
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex-1"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            {t('common.uploading')}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-3 w-3" />
                            {t('common.uploadImage')}
                          </>
                        )}
                      </Button>
                      
                      {formData.imagePath && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleRemoveImage}
                          disabled={uploadingImage}
                          title={t('common.delete')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Manual URL Input (Optional) */}
                    <Input
                      value={formData.imagePath}
                      onChange={(e) => setFormData(prev => ({ ...prev, imagePath: e.target.value }))}
                      placeholder={t('admin.categories.imagePlaceholder')}
                      disabled={uploadingImage}
                      className="text-sm"
                    />
                  </div>
                  
                  {/* Small Square Preview */}
                  {(imagePreview || formData.imagePath) && (
                    <div className="relative h-20 w-20 shrink-0 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-50">
                      <img
                        src={imagePreview || getCategoryImageUrl(formData.imagePath)}
                        alt="Category preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/categories/default-category.webp';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Display Order and Tax Percentage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">{t('admin.categories.displayOrder')}</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopDisplayOrder">{t('admin.categories.shopDisplayOrder')}</Label>
                  <Input
                    id="shopDisplayOrder"
                    type="number"
                    value={formData.shopDisplayOrder || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, shopDisplayOrder: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxPercentage">{t('admin.categories.taxPercentage')}</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">{t('admin.categories.active')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showInShop"
                    checked={Boolean(formData.showInShop)}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showInShop: checked }))}
                  />
                  <Label htmlFor="showInShop" className="cursor-pointer">{t('admin.categories.showInShop')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDisplayedOnHomepage"
                    checked={formData.isDisplayedOnHomepage}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDisplayedOnHomepage: checked }))}
                  />
                  <Label htmlFor="isDisplayedOnHomepage" className="cursor-pointer">{t('admin.categories.showOnHomepage')}</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/categories')}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting || slugAvailable === false}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.update')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
