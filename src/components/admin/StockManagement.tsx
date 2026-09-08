import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../hooks/useApp';
import { cn } from '../../lib/utils';
import { getProductImageUrl } from '../../lib/imageUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Boxes,
  Search,
  Loader2,
  Plus,
  Minus,
  AlertTriangle,
  PackageX,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { productVariantService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import type { Category, VariantStockOverviewItem, VariantStockSummary } from '../../types/product';

type StockFilter = 'all' | 'lowStock' | 'outOfStock';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

const getStockStatus = (item: VariantStockOverviewItem) => {
  if (item.stockQuantity <= 0) {
    return { label: 'Out of Stock', className: 'border-red-500/40 text-red-600 bg-red-50' };
  }
  if (item.stockQuantity <= item.lowStockThreshold) {
    return { label: 'Low Stock', className: 'border-amber-500/40 text-amber-600 bg-amber-50' };
  }
  return { label: 'In Stock', className: 'border-emerald-500/40 text-emerald-600 bg-emerald-50' };
};

export const StockManagement: React.FC = () => {
  const { t } = useApp();
  const [items, setItems] = useState<VariantStockOverviewItem[]>([]);
  const [summary, setSummary] = useState<VariantStockSummary>({
    totalVariants: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  // Per-row draft state so admins can type a value before it's saved
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
  const [addDrafts, setAddDrafts] = useState<Record<number, string>>({});
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);

  useEffect(() => {
    categoryService
      .getAll({ includeInactive: true })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Debounce free-text search so we don't fire a request on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const loadStockOverview = useCallback(async () => {
    try {
      setLoading(true);
      const result = await productVariantService.getStockOverview({
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        categoryId: selectedCategory === 'all' ? undefined : Number(selectedCategory),
        lowStockOnly: stockFilter === 'lowStock',
        outOfStockOnly: stockFilter === 'outOfStock',
        includeInactive: true,
      });
      setItems(result.items);
      setSummary(result.summary);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load stock overview'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, stockFilter]);

  useEffect(() => {
    loadStockOverview();
  }, [loadStockOverview]);

  const handleSetStock = async (variantId: number) => {
    const draft = stockDrafts[variantId];
    if (draft === undefined) {
      return;
    }
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }

    try {
      setSavingVariantId(variantId);
      await productVariantService.updateStock(variantId, { stockQuantity: Math.round(parsed) });
      setItems((prev) =>
        prev.map((item) =>
          item.variantId === variantId ? { ...item, stockQuantity: Math.round(parsed) } : item
        )
      );
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      toast.success('Stock updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update stock'));
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleAdjustStock = async (variantId: number, sign: 1 | -1) => {
    const draft = addDrafts[variantId];
    const amount = Number(draft);
    if (!draft || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a quantity to add or remove');
      return;
    }

    try {
      setSavingVariantId(variantId);
      const newQuantity = await productVariantService.adjustStock(variantId, {
        adjustment: sign * Math.round(amount),
      });
      setItems((prev) =>
        prev.map((item) => (item.variantId === variantId ? { ...item, stockQuantity: newQuantity } : item))
      );
      setAddDrafts((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      toast.success(sign === 1 ? `Added ${amount} to stock` : `Removed ${amount} from stock`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to adjust stock'));
    } finally {
      setSavingVariantId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Boxes className="h-6 w-6" />
          <span>Stock Management</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitor and update coffee stock across every product variant in one place.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setStockFilter('all');
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              stockFilter === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
            )}
          >
            <div className="text-2xl font-semibold">{summary.totalVariants}</div>
            <div className="text-sm text-muted-foreground">Total variants</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setStockFilter('lowStock');
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              stockFilter === 'lowStock' ? 'border-amber-500 bg-amber-50' : 'hover:bg-muted/40'
            )}
          >
            <div className="flex items-center gap-2 text-2xl font-semibold text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {summary.lowStockCount}
            </div>
            <div className="text-sm text-muted-foreground">Low stock</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setStockFilter('outOfStock');
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              stockFilter === 'outOfStock' ? 'border-red-500 bg-red-50' : 'hover:bg-muted/40'
            )}
          >
            <div className="flex items-center gap-2 text-2xl font-semibold text-red-600">
              <PackageX className="h-5 w-5" />
              {summary.outOfStockCount}
            </div>
            <div className="text-sm text-muted-foreground">Out of stock</div>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="flex w-full items-center gap-2 sm:w-72">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product name, SKU or variant SKU"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('common.loading')}</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[160px]">Set stock</TableHead>
                  <TableHead className="min-w-[220px]">Add / remove stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No variants found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const status = getStockStatus(item);
                    const isSaving = savingVariantId === item.variantId;
                    return (
                      <TableRow key={item.variantId} className={cn(!item.productIsActive && 'opacity-60')}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImageUrl(item.mainImagePath)}
                              alt={item.productName}
                              className="h-10 w-10 shrink-0 rounded-md border object-cover"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{item.productName}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {item.productSku} · {item.categoryName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {item.weight}
                            {item.weightUnit}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.variantSku}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.stockQuantity} in stock · threshold {item.lowStockThreshold}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              className="w-20"
                              value={stockDrafts[item.variantId] ?? item.stockQuantity}
                              onChange={(e) =>
                                setStockDrafts((prev) => ({ ...prev, [item.variantId]: e.target.value }))
                              }
                              disabled={isSaving}
                            />
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Save stock quantity"
                              title="Save stock quantity"
                              disabled={isSaving || stockDrafts[item.variantId] === undefined}
                              onClick={() => handleSetStock(item.variantId)}
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              placeholder="Qty"
                              className="w-20"
                              value={addDrafts[item.variantId] ?? ''}
                              onChange={(e) =>
                                setAddDrafts((prev) => ({ ...prev, [item.variantId]: e.target.value }))
                              }
                              disabled={isSaving}
                            />
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Add stock"
                              title="Add stock"
                              disabled={isSaving}
                              onClick={() => handleAdjustStock(item.variantId, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Remove stock"
                              title="Remove stock"
                              disabled={isSaving}
                              onClick={() => handleAdjustStock(item.variantId, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('common.previous')}</span>
            </Button>
            <span className="flex items-center justify-center px-2 text-xs text-muted-foreground sm:px-4 sm:text-sm">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">{t('common.next')}</span>
              <ChevronRight className="h-4 w-4 sm:ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
