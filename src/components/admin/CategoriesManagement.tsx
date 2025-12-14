import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
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
  MoreHorizontal,
} from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import type { Category } from '../../types/product';

export const CategoriesManagement: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll({ includeInactive: true });
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('spirithub_cache'));
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${keys.length} cache entries`);
    alert('Cache cleared successfully! The page will refresh to load fresh data.');
    window.location.reload();
  };

  const handleCreateCategory = () => {
    navigate('/admin/categories/add');
  };

  const handleEditCategory = (categoryId: number) => {
    navigate(`/admin/categories/edit/${categoryId}`);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await categoryService.delete(categoryId);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleActive = async (categoryId: number) => {
    try {
      await categoryService.toggleActive(categoryId);
      loadCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
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
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.categories.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleClearCache} 
              variant="outline"
              className="w-full sm:w-auto"
              title="Clear cache and refresh data"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button onClick={handleCreateCategory} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.categories.add')}
            </Button>
          </div>
        </div>

        {/* Mobile list */}
        <div className="md:hidden space-y-3">
          {sortedCategories.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              {t('admin.categories.noCategories')}
            </div>
          ) : (
            sortedCategories.map((category, index) => (
              <div
                key={category.id}
                className={`rounded-lg border bg-card p-4 ${
                  category.isActive ? '' : 'bg-muted/30 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{category.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {category.nameAr || '-'}
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground truncate">
                      {category.slug}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive
                        ? t('admin.categories.active')
                        : t('admin.categories.inactive')}
                    </Badge>
                    {category.isDisplayedOnHomepage ? (
                      <div className="flex items-center gap-1 text-xs text-green-700">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Homepage</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-4 w-4" />
                        <span className="sr-only">Not on homepage</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{category.productCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{category.displayOrder}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleReorderCategory(category.id, 'up')}
                      disabled={reordering || index === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleReorderCategory(category.id, 'down')}
                      disabled={reordering || index === sortedCategories.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={t('admin.categories.actions')}
                        title={t('admin.categories.actions')}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleEditCategory(category.id)}>
                        <Edit className="h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleToggleActive(category.id)}>
                        {category.isActive ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        {category.isActive ? t('admin.categories.active') : t('admin.categories.inactive')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block w-full min-w-0 max-w-full rounded-md border">
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
                  <TableRow
                    key={category.id}
                    className={category.isActive ? '' : 'bg-muted/30 text-muted-foreground'}
                  >
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('admin.categories.actions')}
                            title={t('admin.categories.actions')}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditCategory(category.id)}>
                            <Edit className="h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleToggleActive(category.id)}>
                            {category.isActive ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                            {category.isActive ? t('admin.categories.active') : t('admin.categories.inactive')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
