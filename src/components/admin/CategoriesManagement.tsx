import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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
                          onClick={() => handleEditCategory(category.id)}
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
      </CardContent>
    </Card>
  );
};
