import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Package, Plus, Edit, Trash2, Eye, EyeOff, Search, Loader2, Star, Coffee } from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import type { Product, Category } from '../../types/product';

// Based on OpenAPI ProductCreateUpdateDto schema
interface ProductCreateUpdateDto {
  sku: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  notes?: string;
  notesAr?: string;
  aromaticProfile?: string;
  aromaticProfileAr?: string;
  intensity?: number;
  compatibility?: string;
  compatibilityAr?: string;
  uses?: string;
  usesAr?: string;
  isActive: boolean;
  isDigital: boolean;
  isFeatured: boolean;
  isOrganic: boolean;
  isFairTrade: boolean;
  imageAlt?: string;
  imageAltAr?: string;
  launchDate?: string;
  expiryDate?: string;
  displayOrder: number;
  origin?: string;
  tastingNotes?: string;
  tastingNotesAr?: string;
  brewingInstructions?: string;
  brewingInstructionsAr?: string;
  roastLevel?: string;
  roastLevelAr?: string;
  process?: string;
  processAr?: string;
  variety?: string;
  varietyAr?: string;
  altitude?: number;
  farm?: string;
  farmAr?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string;
  slug?: string;
  categoryId: number;
  mainImageId?: number;
}

interface ProductFilters {
  categoryId?: number;
  searchTerm?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export const ProductsManagement: React.FC = () => {
  const { t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

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
    isOrganic: false,
    isFairTrade: false,
    imageAlt: '',
    imageAltAr: '',
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
    categoryId: 0
  });

  useEffect(() => {
    const loadDataAsync = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesData = await categoryService.getAll({ includeInactive: false });
        setCategories(categoriesData);

        // Build filters
        const filters: ProductFilters = {
          searchTerm: searchTerm || undefined,
          categoryId: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
          isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
        };

        // Load products using OpenAPI endpoint: GET /api/Products
        const productsData = await productService.getAll({
          page: currentPage,
          pageSize,
          includeInactive: true,
          ...filters
        });

        setProducts(productsData?.items || []);
        setTotalPages(Math.ceil((productsData?.totalCount || 0) / pageSize));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDataAsync();
  }, [currentPage, searchTerm, selectedCategory, statusFilter, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const categoriesData = await categoryService.getAll({ includeInactive: false });
      setCategories(categoriesData);

      // Build filters
      const filters: ProductFilters = {
        searchTerm: searchTerm || undefined,
        categoryId: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      };

      // Load products using OpenAPI endpoint: GET /api/Products
      const productsData = await productService.getAll({
        page: currentPage,
        pageSize,
        includeInactive: true,
        ...filters
      });

      setProducts(productsData?.items || []);
      setTotalPages(Math.ceil((productsData?.totalCount || 0) / pageSize));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setFormData({
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
      isOrganic: false,
      isFairTrade: false,
      imageAlt: '',
      imageAltAr: '',
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
      categoryId: categories[0]?.id || 0
    });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      nameAr: product.nameAr || '',
      description: product.description || '',
      descriptionAr: product.descriptionAr || '',
      notes: product.notes || '',
      notesAr: product.notesAr || '',
      aromaticProfile: product.aromaticProfile || '',
      aromaticProfileAr: product.aromaticProfileAr || '',
      intensity: product.intensity || 1,
      compatibility: product.compatibility || '',
      compatibilityAr: product.compatibilityAr || '',
      uses: product.uses || '',
      usesAr: product.usesAr || '',
      isActive: product.isActive,
      isDigital: product.isDigital || false,
      isFeatured: product.isFeatured || false,
      isOrganic: product.isOrganic || false,
      isFairTrade: product.isFairTrade || false,
      imageAlt: product.imageAlt || '',
      imageAltAr: product.imageAltAr || '',
      displayOrder: product.displayOrder || 0,
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
      categoryId: product.categoryId
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingProduct) {
        // PUT /api/Products/{id}
        await productService.update(editingProduct.id, formData);
      } else {
        // POST /api/Products
        await productService.create(formData);
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      // DELETE /api/Products/{id}
      await productService.delete(productId);
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleToggleActive = async (productId: number) => {
    try {
      // PATCH /api/Products/{id}/toggle-active
      await productService.toggleActive(productId);
      loadData();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleToggleFeatured = async (productId: number) => {
    try {
      // PATCH /api/Products/{id}/toggle-featured
      await productService.toggleFeatured(productId);
      loadData();
    } catch (error) {
      console.error('Error toggling product featured status:', error);
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
          <Package className="h-6 w-6" />
          <span>{t('admin.products.title')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.products.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.products.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.products.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('admin.products.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.products.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('admin.products.active')}</SelectItem>
                <SelectItem value="inactive">{t('admin.products.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.products.add')}
          </Button>
        </div>

        {/* Products Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.products.name')}</TableHead>
                <TableHead>{t('admin.products.sku')}</TableHead>
                <TableHead>{t('admin.products.category')}</TableHead>
                <TableHead className="text-center">{t('admin.products.status')}</TableHead>
                <TableHead className="text-center">{t('admin.products.featured')}</TableHead>
                <TableHead className="text-center">{t('admin.products.organic')}</TableHead>
                <TableHead className="text-center">{t('admin.products.intensity')}</TableHead>
                <TableHead className="text-center">{t('admin.products.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('admin.products.noProducts')}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.nameAr && (
                          <div className="text-sm text-muted-foreground" dir="rtl">
                            {product.nameAr}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      {categories.find(c => c.id === product.categoryId)?.name || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? t('admin.products.active') : t('admin.products.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.isFeatured && (
                        <Star className="h-4 w-4 text-yellow-500 mx-auto fill-current" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.isOrganic && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {t('admin.products.organic')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Coffee className="h-4 w-4 mr-1" />
                        {product.intensity || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(product.id)}
                        >
                          {product.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(product.id)}
                        >
                          <Star className={`h-4 w-4 ${product.isFeatured ? 'text-yellow-500 fill-current' : ''}`} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.products.deleteConfirm')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.products.deleteWarning')} "{product.name}"
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-4">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t('admin.products.edit') : t('admin.products.add')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">{t('admin.products.sku')} *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder={t('admin.products.skuPlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('admin.products.slug')}</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder={t('admin.products.slugPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('admin.products.category')} *</Label>
                  <Select
                    value={formData.categoryId.toString()}
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

              {/* Status Switches */}
              <div className="flex flex-wrap gap-6">
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
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">{t('admin.products.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('admin.products.descriptionPlaceholder')}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">{t('admin.products.descriptionAr')}</Label>
                  <Textarea
                    id="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                    placeholder={t('admin.products.descriptionArPlaceholder')}
                    rows={4}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Coffee Specific Fields */}
              <div className="grid grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="origin">{t('admin.products.origin')}</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                    placeholder={t('admin.products.originPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roastLevel">{t('admin.products.roastLevel')}</Label>
                  <Input
                    id="roastLevel"
                    value={formData.roastLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, roastLevel: e.target.value }))}
                    placeholder={t('admin.products.roastLevelPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};