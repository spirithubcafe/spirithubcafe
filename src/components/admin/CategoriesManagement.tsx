import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import {
  Grid3X3,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Loader2,
  Package,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import type { Category, CategoryCreateUpdateDto } from '../../types/product';

export const CategoriesManagement: React.FC = () => {
  const { t } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
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
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      setSlugAvailable(null);
      setSlugMessage(null);
      setCheckingSlug(false);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    if (!formData.slug) {
      setSlugAvailable(null);
      setSlugMessage(null);
      return;
    }

    let isMounted = true;
    setCheckingSlug(true);
    const handler = window.setTimeout(async () => {
      try {
        const available = await categoryService.checkSlug(
          formData.slug,
          editingCategory?.id
        );
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
  }, [formData.slug, editingCategory?.id, isDialogOpen, t]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Using the OpenAPI endpoint: GET /api/Categories
      const data = await categoryService.getAll({ includeInactive: true });
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      nameAr: '',
      slug: '',
      description: '',
      descriptionAr: '',
      imagePath: '',
      isActive: true,
      isDisplayedOnHomepage: false,
      displayOrder: categories.length,
      taxPercentage: 0
    });
    setSlugAvailable(null);
    setSlugMessage(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr || '',
      slug: category.slug,
      description: category.description || '',
      descriptionAr: category.descriptionAr || '',
      imagePath: category.imagePath || '',
      isActive: category.isActive,
      isDisplayedOnHomepage: category.isDisplayedOnHomepage,
      displayOrder: category.displayOrder,
      taxPercentage: category.taxPercentage
    });
    setSlugAvailable(null);
    setSlugMessage(null);
    setIsDialogOpen(true);
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

      // Ensure all required fields are present and valid
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

      console.log('[CategoriesManagement] Submitting data:', dataToSend);

      if (editingCategory) {
        // PUT /api/Categories/{id}
        await categoryService.update(editingCategory.id, dataToSend);
      } else {
        // POST /api/Categories
        await categoryService.create(dataToSend);
      }
      setIsDialogOpen(false);
      loadCategories();
    } catch (error: unknown) {
      console.error('Error saving category:', error);
      
      const apiError = error as { message?: string; statusCode?: number; errors?: Record<string, string[]>; response?: unknown };
      console.error('Error details:', {
        message: apiError.message,
        statusCode: apiError.statusCode,
        errors: apiError.errors,
        response: apiError.response
      });
      
      // Show error message to user
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

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // DELETE /api/Categories/{id}
      await categoryService.delete(categoryId);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleActive = async (categoryId: number) => {
    try {
      // PATCH /api/Categories/{id}/toggle-active
      await categoryService.toggleActive(categoryId);
      loadCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
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

  const handleReorderCategory = async (categoryId: number, direction: 'up' | 'down') => {
    const ordered = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const currentIndex = ordered.findIndex((category) => category.id === categoryId);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }

    setReordering(true);
    try {
      const [movedCategory] = ordered.splice(currentIndex, 1);
      ordered.splice(targetIndex, 0, movedCategory);

      const orderMap = ordered.reduce<Record<number, number>>((map, category, index) => {
        map[category.id] = index;
        return map;
      }, {});

      await categoryService.reorder(orderMap);
      await loadCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
    } finally {
      setReordering(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      category.name.toLowerCase().includes(normalizedSearch) ||
      (category.nameAr && category.nameAr.toLowerCase().includes(normalizedSearch)) ||
      category.slug.toLowerCase().includes(normalizedSearch)
    );
  });

  const sortedCategories = useMemo(
    () =>
      [...filteredCategories].sort((a, b) => a.displayOrder - b.displayOrder),
    [filteredCategories]
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('common.loading')}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Grid3X3 className="h-6 w-6" />
          <span>{t('admin.categories.title')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.categories.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Button onClick={handleCreateCategory}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.categories.add')}
          </Button>
        </div>

        {/* Categories Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.categories.name')}</TableHead>
                <TableHead>{t('admin.categories.nameAr')}</TableHead>
                <TableHead>{t('admin.categories.slug')}</TableHead>
                <TableHead className="text-center">{t('admin.categories.status')}</TableHead>
                <TableHead className="text-center">{t('admin.categories.homepage')}</TableHead>
                <TableHead className="text-center">{t('admin.categories.products')}</TableHead>
                <TableHead className="text-center">{t('admin.categories.order')}</TableHead>
                <TableHead className="text-center">{t('admin.categories.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('admin.categories.noCategories')}
                  </TableCell>
                </TableRow>
              ) : (
                sortedCategories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.nameAr || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? t('admin.categories.active') : t('admin.categories.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {category.isDisplayedOnHomepage ? (
                        <Eye className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{category.productCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-sm">{category.displayOrder}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorderCategory(category.id, 'up')}
                            disabled={reordering || index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorderCategory(category.id, 'down')}
                            disabled={reordering || index === sortedCategories.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(category.id)}
                        >
                          {category.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.categories.deleteConfirm')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.categories.deleteWarning')} "{category.name}"
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t('admin.categories.edit') : t('admin.categories.add')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">{t('admin.categories.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('admin.categories.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">{t('admin.categories.descriptionAr')}</Label>
                  <Textarea
                    id="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                    placeholder={t('admin.categories.descriptionArPlaceholder')}
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagePath">{t('admin.categories.image')}</Label>
                <Input
                  id="imagePath"
                  value={formData.imagePath}
                  onChange={(e) => setFormData(prev => ({ ...prev, imagePath: e.target.value }))}
                  placeholder={t('admin.categories.imagePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">{t('admin.categories.active')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDisplayedOnHomepage"
                    checked={formData.isDisplayedOnHomepage}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDisplayedOnHomepage: checked }))}
                  />
                  <Label htmlFor="isDisplayedOnHomepage">{t('admin.categories.showOnHomepage')}</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
