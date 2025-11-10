import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { cn } from '../../lib/utils';
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
import { Package, Plus, Edit, Trash2, Eye, EyeOff, Search, Loader2, Star, Coffee, Layers, Image as ImageIcon, Crown } from 'lucide-react';
import { productService, productVariantService, productImageService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { resolveImageFromProductImage, getProductImageUrl } from '../../lib/imageUtils';
import { ProductAttributesDialog } from './ProductAttributesDialog';
import type {
  Product,
  Category,
  ProductVariant,
  ProductVariantCreateDto,
  ProductVariantUpdateDto,
  ProductCreateUpdateDto,
  ProductImage,
  ProductImageCreateDto,
  ProductImageUpdateDto,
} from '../../types/product';

type VariantFormData = Omit<ProductVariantCreateDto, 'productId'>;

type ImageFormData = {
  fileName: string;
  imagePath: string;
  altText?: string;
  altTextAr?: string;
  displayOrder: number;
  isMain: boolean;
  fileSize: number;
  width?: number;
  height?: number;
};

interface ProductFilters {
  categoryId?: number;
  searchTerm?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export const ProductsManagement: React.FC = () => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [skuAvailable, setSkuAvailable] = useState<boolean | null>(null);
  const [checkingSku, setCheckingSku] = useState(false);
  const [skuMessage, setSkuMessage] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const [isVariantsDialogOpen, setIsVariantsDialogOpen] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantSubmitting, setVariantSubmitting] = useState(false);
  const [variantFormVisible, setVariantFormVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantFormData, setVariantFormData] = useState<VariantFormData>({
    variantSku: '',
    weight: 0,
    weightUnit: 'g',
    price: 0,
    discountPrice: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    stockQuantity: 0,
    lowStockThreshold: 0,
    isActive: true,
    isDefault: false,
    displayOrder: 0,
  });
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantParentProduct, setVariantParentProduct] = useState<Product | null>(null);
  const [isImagesDialogOpen, setIsImagesDialogOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [imageFormVisible, setImageFormVisible] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [imageParentProduct, setImageParentProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [imageFormData, setImageFormData] = useState<ImageFormData>({
    fileName: '',
    imagePath: '',
    altText: '',
    altTextAr: '',
    displayOrder: 0,
    isMain: false,
    fileSize: 0,
    width: undefined,
    height: undefined,
  });

  // Attributes Dialog State
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = useState(false);
  const [attributesProduct, setAttributesProduct] = useState<Product | null>(null);

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

  useEffect(() => {
    if (!isDialogOpen) {
      setSkuAvailable(null);
      setSkuMessage(null);
      setSlugAvailable(null);
      setSlugMessage(null);
      setCheckingSku(false);
      setCheckingSlug(false);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    if (!formData.sku) {
      setSkuAvailable(null);
      setSkuMessage(null);
      return;
    }

    let isMounted = true;
    setCheckingSku(true);
    const handler = window.setTimeout(async () => {
      try {
        const available = await productService.checkSku(formData.sku, editingProduct?.id);
        if (!isMounted) {
          return;
        }
        setSkuAvailable(available);
        setSkuMessage(
          available ? t('admin.products.skuAvailable') : t('admin.products.skuUnavailable')
        );
      } catch (error) {
        console.error('Error checking SKU availability:', error);
        if (isMounted) {
          setSkuAvailable(null);
          setSkuMessage(t('admin.products.skuCheckError'));
        }
      } finally {
        if (isMounted) {
          setCheckingSku(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      window.clearTimeout(handler);
    };
  }, [formData.sku, editingProduct?.id, isDialogOpen, t]);

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
        const available = await productService.checkSlug(formData.slug || '', editingProduct?.id);
        if (!isMounted) {
          return;
        }
        setSlugAvailable(available);
        setSlugMessage(
          available ? t('admin.products.slugAvailable') : t('admin.products.slugUnavailable')
        );
      } catch (error) {
        console.error('Error checking product slug:', error);
        if (isMounted) {
          setSlugAvailable(null);
          setSlugMessage(t('admin.products.slugCheckError'));
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
  }, [formData.slug, editingProduct?.id, isDialogOpen, t]);

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
    navigate('/admin/products/add');
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
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
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const updateData: any = {
        sku: product.sku,
        name: product.name,
        nameAr: product.nameAr,
        slug: product.slug,
        categoryId: product.categoryId,
        isActive: !product.isActive,
        isDigital: product.isDigital,
        isFeatured: product.isFeatured,
        isOrganic: product.isOrganic,
        isFairTrade: product.isFairTrade,
        displayOrder: product.displayOrder,
        description: product.description,
        descriptionAr: product.descriptionAr,
        notes: product.notes,
        notesAr: product.notesAr,
        intensity: product.intensity || 1,
      };
      
      await productService.update(productId, updateData);
      loadData();
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const handleToggleFeatured = async (productId: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const updateData: any = {
        sku: product.sku,
        name: product.name,
        nameAr: product.nameAr,
        slug: product.slug,
        categoryId: product.categoryId,
        isActive: product.isActive,
        isDigital: product.isDigital,
        isFeatured: !product.isFeatured,
        isOrganic: product.isOrganic,
        isFairTrade: product.isFairTrade,
        displayOrder: product.displayOrder,
        description: product.description,
        descriptionAr: product.descriptionAr,
        notes: product.notes,
        notesAr: product.notesAr,
        intensity: product.intensity || 1,
      };
      
      await productService.update(productId, updateData);
      loadData();
    } catch (error) {
      console.error('Error toggling product featured status:', error);
    }
  };

  const resetVariantForm = (displayOrder: number = variants.length) => {
    setVariantFormData({
      variantSku: '',
      weight: 0,
      weightUnit: 'g',
      price: 0,
      discountPrice: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      stockQuantity: 0,
      lowStockThreshold: 0,
      isActive: true,
      isDefault: false,
      displayOrder,
    });
    setVariantFormVisible(true);
  };

  const loadVariants = async (productId: number) => {
    try {
      setVariantLoading(true);
      const variantData = await productVariantService.getByProduct(productId);
      const ordered = [...variantData].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );
      setVariants(ordered);
    } catch (error) {
      console.error('Error loading product variants:', error);
      setVariants([]);
    } finally {
      setVariantLoading(false);
    }
  };

  const handleOpenVariants = async (product: Product) => {
    setVariantParentProduct(product);
    setEditingVariant(null);
    setVariantFormVisible(false);
    setIsVariantsDialogOpen(true);
    await loadVariants(product.id);
  };

  const handleOpenAttributes = async (product: Product) => {
    // First set the product and open dialog immediately
    setAttributesProduct(product);
    setIsAttributesDialogOpen(true);
    
    try {
      // Then fetch the full product details in the background
      console.log('Fetching product details for ID:', product.id);
      const fullProduct = await productService.getById(product.id);
      console.log('Full product loaded:', fullProduct);
      // Update with full details once loaded
      setAttributesProduct(fullProduct);
    } catch (error) {
      console.error('Failed to load product details:', error);
      // Already have the basic product from the list, so dialog will show that
    }
  };

  const handleSaveAttributes = async (attributes: Partial<Product>) => {
    if (!attributesProduct) return;
    
    try {
      await productService.update(attributesProduct.id, {
        ...attributes,
        sku: attributesProduct.sku,
        name: attributesProduct.name,
        categoryId: attributesProduct.categoryId,
      } as ProductCreateUpdateDto);
      
      // Reload products to show updated data
      const filters: ProductFilters = {
        searchTerm: searchTerm || undefined,
        categoryId: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      };
      
      const productsData = await productService.getAll({
        page: currentPage,
        pageSize,
        includeInactive: true,
        ...filters
      });
      
      setProducts(productsData?.items || []);
    } catch (error) {
      console.error('Error saving product attributes:', error);
      throw error;
    }
  };

  const handleVariantCreate = () => {
    resetVariantForm(variants.length);
    setEditingVariant(null);
  };

  const handleVariantEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantFormData({
      variantSku: variant.variantSku,
      weight: variant.weight,
      weightUnit: variant.weightUnit,
      price: variant.price,
      discountPrice: variant.discountPrice,
      length: variant.length,
      width: variant.width,
      height: variant.height,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
      isDefault: variant.isDefault,
      displayOrder: variant.displayOrder,
    });
    setVariantFormVisible(true);
  };

  const handleVariantSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!variantParentProduct) {
      return;
    }

    setVariantSubmitting(true);
    try {
      if (editingVariant) {
        const updatePayload: ProductVariantUpdateDto = {
          variantSku: variantFormData.variantSku,
          weight: variantFormData.weight,
          weightUnit: variantFormData.weightUnit,
          price: variantFormData.price,
          discountPrice: variantFormData.discountPrice,
          length: variantFormData.length,
          width: variantFormData.width,
          height: variantFormData.height,
          stockQuantity: variantFormData.stockQuantity,
          lowStockThreshold: variantFormData.lowStockThreshold,
          isActive: variantFormData.isActive,
          isDefault: variantFormData.isDefault,
          displayOrder: variantFormData.displayOrder,
        };
        await productVariantService.update(editingVariant.id, updatePayload);
      } else {
        const createPayload: ProductVariantCreateDto = {
          productId: variantParentProduct.id,
          variantSku: variantFormData.variantSku,
          weight: variantFormData.weight,
          weightUnit: variantFormData.weightUnit,
          price: variantFormData.price,
          discountPrice: variantFormData.discountPrice,
          length: variantFormData.length,
          width: variantFormData.width,
          height: variantFormData.height,
          stockQuantity: variantFormData.stockQuantity,
          lowStockThreshold: variantFormData.lowStockThreshold,
          isActive: variantFormData.isActive,
          isDefault: variantFormData.isDefault,
          displayOrder: variantFormData.displayOrder,
        };
        await productVariantService.create(variantParentProduct.id, createPayload);
      }

      await loadVariants(variantParentProduct.id);
      setVariantFormVisible(false);
      setEditingVariant(null);
    } catch (error) {
      console.error('Error saving variant:', error);
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleVariantDelete = async (variantId: number) => {
    if (!variantParentProduct) {
      return;
    }

    try {
      await productVariantService.delete(variantId);
      await loadVariants(variantParentProduct.id);
    } catch (error) {
      console.error('Error deleting variant:', error);
    }
  };

  const resetImageForm = (displayOrder: number = images.length) => {
    setImageFormData({
      fileName: '',
      imagePath: '',
      altText: '',
      altTextAr: '',
      displayOrder,
      isMain: images.length === 0,
      fileSize: 0,
      width: undefined,
      height: undefined,
    });
    setImageFormVisible(true);
  };

  const loadImages = async (productId: number) => {
    try {
      setImageLoading(true);
      const imageData = await productImageService.getByProduct(productId);
      const ordered = [...imageData].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );
      setImages(ordered);
    } catch (error) {
      console.error('Error loading product images:', error);
      setImages([]);
    } finally {
      setImageLoading(false);
    }
  };

  const handleOpenImages = async (product: Product) => {
    setImageParentProduct(product);
    setEditingImage(null);
    setImageFormVisible(false);
    setIsImagesDialogOpen(true);
    await loadImages(product.id);
  };

  const handleImageCreate = () => {
    resetImageForm(images.length);
    setEditingImage(null);
  };

  const handleImageEdit = (image: ProductImage) => {
    setEditingImage(image);
    setImageFormData({
      fileName: image.fileName,
      imagePath: image.imagePath,
      altText: image.altText || '',
      altTextAr: image.altTextAr || '',
      displayOrder: image.displayOrder ?? 0,
      isMain: image.isMain,
      fileSize: image.fileSize || 0,
      width: image.width,
      height: image.height,
    });
    setImageFormVisible(true);
  };

  const handleImageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageParentProduct) {
      return;
    }

    setImageSubmitting(true);
    try {
      if (editingImage) {
        const updatePayload: ProductImageUpdateDto = {
          altText: imageFormData.altText,
          altTextAr: imageFormData.altTextAr,
          displayOrder: imageFormData.displayOrder,
        };
        await productImageService.update(editingImage.id, updatePayload);
        if (imageFormData.isMain && !editingImage.isMain) {
          await productImageService.setMain(editingImage.id);
        }
      } else {
        const createPayload: ProductImageCreateDto = {
          productId: imageParentProduct.id,
          fileName: imageFormData.fileName.trim() || `image-${Date.now()}`,
          imagePath: imageFormData.imagePath.trim(),
          altText: imageFormData.altText || undefined,
          altTextAr: imageFormData.altTextAr || undefined,
          displayOrder: imageFormData.displayOrder,
          isMain: imageFormData.isMain,
          fileSize: imageFormData.fileSize || 0,
          width: imageFormData.width,
          height: imageFormData.height,
        };
        await productImageService.create(imageParentProduct.id, createPayload);
      }

      await loadImages(imageParentProduct.id);
      setImageFormVisible(false);
      setEditingImage(null);
    } catch (error) {
      console.error('Error saving product image:', error);
    } finally {
      setImageSubmitting(false);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    if (!imageParentProduct) {
      return;
    }

    if (!window.confirm(t('admin.products.deleteImageWarning'))) {
      return;
    }

    try {
      await productImageService.delete(imageId);
      await loadImages(imageParentProduct.id);
    } catch (error) {
      console.error('Error deleting product image:', error);
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    if (!imageParentProduct) {
      return;
    }

    try {
      await productImageService.setMain(imageId);
      await loadImages(imageParentProduct.id);
    } catch (error) {
      console.error('Error updating main product image:', error);
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
    <>
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
                          onClick={() => handleOpenAttributes(product)}
                          title="Product Attributes"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Coffee className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenVariants(product)}
                          aria-label={t('admin.products.manageVariants')}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenImages(product)}
                          aria-label={t('admin.products.manageImages')}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
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
                    className={cn(
                      skuAvailable === false &&
                        'border-destructive focus-visible:ring-destructive/60',
                      skuAvailable &&
                        'border-green-500/80 focus-visible:ring-green-500/50'
                    )}
                  />
                  <div className="flex min-h-[1.25rem] items-center gap-2 text-xs">
                    {checkingSku && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                    {skuMessage && (
                      <span
                        className={cn(
                          skuAvailable === false && 'text-destructive',
                          skuAvailable === true && 'text-green-600',
                          skuAvailable === null && 'text-muted-foreground'
                        )}
                      >
                        {skuMessage}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('admin.products.slug')}</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder={t('admin.products.slugPlaceholder')}
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

    <Dialog
      open={isVariantsDialogOpen}
      onOpenChange={(open) => {
        setIsVariantsDialogOpen(open);
        if (!open) {
          setVariantParentProduct(null);
          setVariants([]);
          setVariantFormVisible(false);
          setEditingVariant(null);
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {variantParentProduct
              ? t('admin.products.variantsFor', { name: variantParentProduct.name })
              : t('admin.products.variants')}
          </DialogTitle>
        </DialogHeader>

        {variantParentProduct ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {variants.length} {t('admin.products.variants')}
                </p>
              </div>
              <Button onClick={handleVariantCreate} className="self-start sm:self-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.products.addVariant')}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.products.variantSku')}</TableHead>
                    <TableHead className="text-center">{t('admin.products.variantWeight')}</TableHead>
                    <TableHead className="text-center">{t('admin.products.variantPrice')}</TableHead>
                    <TableHead className="text-center">{t('admin.products.variantStock')}</TableHead>
                    <TableHead className="text-center">{t('admin.products.variantStatus')}</TableHead>
                    <TableHead className="text-center">{t('admin.products.variantActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variantLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : variants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        {t('admin.products.noVariants')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    variants.map((variant) => {
                      const isLowStock = variant.stockQuantity <= variant.lowStockThreshold;
                      return (
                        <TableRow
                          key={variant.id}
                          className={cn(isLowStock && 'bg-amber-50/60')}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{variant.variantSku}</span>
                              {variant.isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  {t('admin.products.defaultVariant')}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {variant.weight} {variant.weightUnit}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {variant.price.toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'OMR',
                            })}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <span
                              className={cn(
                                isLowStock ? 'text-red-600 font-medium' : 'text-foreground'
                              )}
                            >
                              {variant.stockQuantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={variant.isActive ? 'default' : 'secondary'}>
                              {variant.isActive
                                ? t('admin.products.active')
                                : t('admin.products.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVariantEdit(variant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('admin.products.deleteVariantConfirm')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('admin.products.deleteVariantWarning')} ({variant.variantSku})
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleVariantDelete(variant.id)}
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {variantFormVisible && (
              <form
                onSubmit={handleVariantSubmit}
                className="space-y-4 rounded-lg border bg-card/40 p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="variantSku">{t('admin.products.variantSku')} *</Label>
                    <Input
                      id="variantSku"
                      value={variantFormData.variantSku}
                      onChange={(event) =>
                        setVariantFormData((prev) => ({
                          ...prev,
                          variantSku: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variantWeight">{t('admin.products.variantWeight')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="variantWeight"
                        type="number"
                        value={variantFormData.weight ?? 0}
                        min="0"
                        step="0.01"
                        onChange={(event) =>
                          setVariantFormData((prev) => ({
                            ...prev,
                            weight: parseFloat(event.target.value) || 0,
                          }))
                        }
                      />
                      <Select
                        value={variantFormData.weightUnit}
                        onValueChange={(value) =>
                          setVariantFormData((prev) => ({ ...prev, weightUnit: value }))
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variantPrice">{t('admin.products.variantPrice')} *</Label>
                    <Input
                      id="variantPrice"
                      type="number"
                      min="0"
                      step="0.001"
                      value={variantFormData.price ?? 0}
                      onChange={(event) =>
                        setVariantFormData((prev) => ({
                          ...prev,
                          price: parseFloat(event.target.value) || 0,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPrice">
                      {t('admin.products.variantDiscountPrice')}
                    </Label>
                    <Input
                      id="discountPrice"
                      type="number"
                      min="0"
                      step="0.001"
                      value={variantFormData.discountPrice ?? ''}
                      onChange={(event) =>
                        setVariantFormData((prev) => ({
                          ...prev,
                          discountPrice: event.target.value
                            ? parseFloat(event.target.value)
                            : undefined,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">
                      {t('admin.products.variantStock')}
                    </Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      value={variantFormData.stockQuantity}
                      onChange={(event) =>
                        setVariantFormData((prev) => ({
                          ...prev,
                          stockQuantity: parseInt(event.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">
                      {t('admin.products.variantLowStock')}
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      value={variantFormData.lowStockThreshold}
                      onChange={(event) =>
                        setVariantFormData((prev) => ({
                          ...prev,
                          lowStockThreshold: parseInt(event.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">
                      {t('admin.products.variantOrder')}
                    </Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      min="0"
                      value={variantFormData.displayOrder ?? 0}
                      onChange={(event) =>
                        setVariantFormData((prev) => ({
                          ...prev,
                          displayOrder: parseInt(event.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="variantActive"
                      checked={variantFormData.isActive}
                      onCheckedChange={(checked) =>
                        setVariantFormData((prev) => ({ ...prev, isActive: checked }))
                      }
                    />
                    <Label htmlFor="variantActive">
                      {t('admin.products.variantActive')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="variantDefault"
                      checked={variantFormData.isDefault}
                      onCheckedChange={(checked) =>
                        setVariantFormData((prev) => ({ ...prev, isDefault: checked }))
                      }
                    />
                    <Label htmlFor="variantDefault">
                      {t('admin.products.variantDefault')}
                    </Label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setVariantFormVisible(false);
                      setEditingVariant(null);
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={variantSubmitting}>
                    {variantSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingVariant ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('admin.products.noProductSelected')}
          </p>
        )}
      </DialogContent>
    </Dialog>

    <Dialog
      open={isImagesDialogOpen}
      onOpenChange={(open) => {
        setIsImagesDialogOpen(open);
        if (!open) {
          setImageParentProduct(null);
          setImages([]);
          setImageFormVisible(false);
          setEditingImage(null);
          setImageFormData({
            fileName: '',
            imagePath: '',
            altText: '',
            altTextAr: '',
            displayOrder: 0,
            isMain: false,
            fileSize: 0,
            width: undefined,
            height: undefined,
          });
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {imageParentProduct
              ? t('admin.products.imagesFor', { name: imageParentProduct.name })
              : t('admin.products.images')}
          </DialogTitle>
        </DialogHeader>

        {imageParentProduct ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {images.length} {t('admin.products.images')}
                </p>
              </div>
              <Button onClick={handleImageCreate} className="self-start sm:self-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.products.addImage')}
              </Button>
            </div>

            {imageLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
                {t('admin.products.noImages')}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {images.map((image) => {
                  const previewUrl =
                    resolveImageFromProductImage(image) ?? getProductImageUrl(image?.imagePath);
                  return (
                  <Card
                    key={image.id}
                    className={cn(image.isMain && 'border-amber-500')}
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                        <img
                          src={previewUrl}
                          alt={image.altText || image.fileName}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = '/images/products/default-product.webp';
                          }}
                        />
                        {image.isMain && (
                          <Badge className="absolute top-2 left-2 bg-amber-600 text-white">
                            {t('admin.products.imageMain')}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{image.fileName}</p>
                        <p className="text-muted-foreground break-words">{image.imagePath}</p>
                        {image.altText && (
                          <p className="text-muted-foreground">{image.altText}</p>
                        )}
                        {image.altTextAr && (
                          <p className="text-muted-foreground" dir="rtl">
                            {image.altTextAr}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t('admin.products.imageDisplayOrder')}: {image.displayOrder ?? 0}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImageEdit(image)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetMainImage(image.id)}
                          disabled={image.isMain}
                        >
                          <Crown className="mr-1 h-4 w-4" />
                          {t('admin.products.setAsMain')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleImageDelete(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}

            {imageFormVisible && (
              <form
                onSubmit={handleImageSubmit}
                className="space-y-4 rounded-lg border bg-card/40 p-4"
              >
                <h4 className="text-base font-semibold">
                  {editingImage ? t('admin.products.editImage') : t('admin.products.addImage')}
                </h4>

                {!editingImage && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="imagePath">{t('admin.products.imagePath')} *</Label>
                        <Input
                          id="imagePath"
                          value={imageFormData.imagePath}
                          onChange={(event) =>
                            setImageFormData((prev) => ({
                              ...prev,
                              imagePath: event.target.value,
                            }))
                          }
                          placeholder={t('admin.products.imageUrlPlaceholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fileName">{t('admin.products.imageFileName')} *</Label>
                        <Input
                          id="fileName"
                          value={imageFormData.fileName}
                          onChange={(event) =>
                            setImageFormData((prev) => ({
                              ...prev,
                              fileName: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="fileSize">{t('admin.products.imageFileSize')}</Label>
                        <Input
                          id="fileSize"
                          type="number"
                          value={imageFormData.fileSize}
                          onChange={(event) =>
                            setImageFormData((prev) => ({
                              ...prev,
                              fileSize: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageWidth">{t('admin.products.imageWidth')}</Label>
                        <Input
                          id="imageWidth"
                          type="number"
                          value={imageFormData.width ?? ''}
                          onChange={(event) =>
                            setImageFormData((prev) => ({
                              ...prev,
                              width: event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageHeight">{t('admin.products.imageHeight')}</Label>
                        <Input
                          id="imageHeight"
                          type="number"
                          value={imageFormData.height ?? ''}
                          onChange={(event) =>
                            setImageFormData((prev) => ({
                              ...prev,
                              height: event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="imageAlt">{t('admin.products.imageAlt')}</Label>
                    <Input
                      id="imageAlt"
                      value={imageFormData.altText || ''}
                      onChange={(event) =>
                        setImageFormData((prev) => ({
                          ...prev,
                          altText: event.target.value,
                        }))
                      }
                      placeholder={t('admin.products.imageAltPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageAltAr">{t('admin.products.imageAltAr')}</Label>
                    <Input
                      id="imageAltAr"
                      value={imageFormData.altTextAr || ''}
                      onChange={(event) =>
                        setImageFormData((prev) => ({
                          ...prev,
                          altTextAr: event.target.value,
                        }))
                      }
                      placeholder={t('admin.products.imageAltArPlaceholder')}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="imageDisplayOrder">
                      {t('admin.products.imageDisplayOrder')}
                    </Label>
                    <Input
                      id="imageDisplayOrder"
                      type="number"
                      value={imageFormData.displayOrder}
                      onChange={(event) =>
                        setImageFormData((prev) => ({
                          ...prev,
                          displayOrder: Number(event.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3">
                    <Switch
                      id="imageIsMain"
                      checked={imageFormData.isMain}
                      onCheckedChange={(checked) =>
                        setImageFormData((prev) => ({
                          ...prev,
                          isMain: checked,
                        }))
                      }
                    />
                    <Label htmlFor="imageIsMain" className="font-medium">
                      {t('admin.products.imageMain')}
                    </Label>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t('admin.products.imageFormHint')}
                </p>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImageFormVisible(false);
                      setEditingImage(null);
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={imageSubmitting}>
                    {imageSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingImage ? t('common.update') : t('common.create')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>

    {/* Product Attributes Dialog */}
    <ProductAttributesDialog
      product={attributesProduct}
      open={isAttributesDialogOpen}
      onOpenChange={setIsAttributesDialogOpen}
      onSave={handleSaveAttributes}
    />
  </>
  );
};
