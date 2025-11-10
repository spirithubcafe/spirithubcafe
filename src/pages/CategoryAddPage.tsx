import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import type { CategoryCreateUpdateDto } from '../types/product';
import { cn } from '../lib/utils';

export const CategoryAddPage: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const quillRefAr = useRef<ReactQuill>(null);
  const [formData, setFormData] = useState<CategoryCreateUpdateDto>({
    name: '',
    nameAr: '',
    slug: '',
    description: '',
    descriptionAr: '',
    imagePath: '',
    isActive: true,
    isDisplayedOnHomepage: false,
    displayOrder: 0,
    taxPercentage: 0
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);

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
        const available = await categoryService.checkSlug(formData.slug);
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
  }, [formData.slug, t]);

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
        displayOrder: Number(formData.displayOrder),
        taxPercentage: Number(formData.taxPercentage)
      };

      await categoryService.create(dataToSend);
      navigate('/admin/categories');
    } catch (error: unknown) {
      console.error('Error creating category:', error);
      
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>{t('admin.categories.add')}</span>
              </CardTitle>
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

              {/* Image Path */}
              <div className="space-y-2">
                <Label htmlFor="imagePath">{t('admin.categories.image')}</Label>
                <Input
                  id="imagePath"
                  value={formData.imagePath}
                  onChange={(e) => setFormData(prev => ({ ...prev, imagePath: e.target.value }))}
                  placeholder={t('admin.categories.imagePlaceholder')}
                />
              </div>

              {/* Display Order and Tax Percentage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {t('common.create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
