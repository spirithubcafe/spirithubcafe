import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Package, TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';
import type { Order } from '../../types/order';
import type { Product } from '../../types/product';
import { productService } from '../../services';
import {
  getTopProducts,
  exportTopProductsToCSV,
  downloadCSV,
  type TopProduct,
} from '../../lib/analyticsUtils';

interface TopProductsProps {
  orders: Order[];
  isArabic?: boolean;
  limit?: number;
}

export const TopProducts: React.FC<TopProductsProps> = ({
  orders,
  isArabic = false,
  limit = 10,
}) => {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [productsData, setProductsData] = useState<Map<number, Product>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopProducts();
  }, [orders, limit]);

  const loadTopProducts = async () => {
    setLoading(true);
    try {
      const products = getTopProducts(orders, limit);
      setTopProducts(products);

      // Fetch product details for stock information
      const productIds = products.map(p => p.productId);
      const productDetails = await Promise.all(
        productIds.map(async (id) => {
          try {
            return await productService.getById(id);
          } catch (error) {
            console.error(`Error loading product ${id}:`, error);
            return null;
          }
        })
      );

      const productMap = new Map<number, Product>();
      productDetails.forEach(p => {
        if (p) productMap.set(p.id, p);
      });
      setProductsData(productMap);
    } catch (error) {
      console.error('Error loading top products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (productId: number) => {
    const product = productsData.get(productId);
    if (!product?.variants || product.variants.length === 0) {
      return { status: 'unknown', quantity: 0, threshold: 0, label: '?' };
    }

    // Sum stock across all variants
    const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
    const avgThreshold = product.variants.reduce((sum, v) => sum + v.lowStockThreshold, 0) / product.variants.length;

    if (totalStock === 0) {
      return { 
        status: 'out', 
        quantity: totalStock, 
        threshold: avgThreshold,
        label: isArabic ? 'نفذ' : 'Out' 
      };
    } else if (totalStock <= avgThreshold) {
      return { 
        status: 'low', 
        quantity: totalStock, 
        threshold: avgThreshold,
        label: isArabic ? 'منخفض' : 'Low' 
      };
    } else {
      return { 
        status: 'ok', 
        quantity: totalStock, 
        threshold: avgThreshold,
        label: isArabic ? 'متاح' : 'OK' 
      };
    }
  };

  const handleExport = () => {
    const csv = exportTopProductsToCSV(topProducts);
    const filename = `top-products-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {isArabic ? 'المنتجات الأكثر مبيعاً' : 'Top Selling Products'}
          </CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {isArabic ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          </div>
        ) : topProducts.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'لا توجد بيانات متاحة' : 'No data available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {topProducts.map((product, index) => {
              const stockStatus = getStockStatus(product.productId);
              
              return (
                <div
                  key={product.productId}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Product Image */}
                  {product.productImage && (
                    <div className="flex-shrink-0 pt-1">
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="h-12 w-12 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Product Info & Metrics */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Product Name */}
                    <p className="text-sm font-semibold truncate">
                      {isArabic && product.productNameAr
                        ? product.productNameAr
                        : product.productName}
                    </p>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Revenue */}
                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {isArabic ? 'الإيرادات' : 'Revenue'}
                          </span>
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            {product.revenue.toFixed(3)}
                          </span>
                        </div>
                      </div>

                      {/* Margin */}
                      <div className="bg-green-50 dark:bg-green-950/20 rounded px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {isArabic ? 'الهامش' : 'Margin'}
                          </span>
                          <span className="font-bold text-green-700 dark:text-green-400">
                            {product.margin ? `${product.margin}%` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Stock Status */}
                      <div 
                        className={`rounded px-2 py-1.5 ${
                          stockStatus.status === 'out'
                            ? 'bg-red-50 dark:bg-red-950/20'
                            : stockStatus.status === 'low'
                            ? 'bg-amber-50 dark:bg-amber-950/20'
                            : 'bg-blue-50 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-muted-foreground">
                            {isArabic ? 'المخزون' : 'Stock'}
                          </span>
                          <div className="flex items-center gap-1">
                            {stockStatus.status === 'low' && (
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                            )}
                            {stockStatus.status === 'out' && (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span 
                              className={`font-bold ${
                                stockStatus.status === 'out'
                                  ? 'text-red-700 dark:text-red-400'
                                  : stockStatus.status === 'low'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-blue-700 dark:text-blue-400'
                              }`}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Velocity */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {isArabic ? 'يومياً' : '/day'}
                          </span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">
                            {product.velocity.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span>
                        {isArabic ? 'الكمية:' : 'Qty:'} <span className="font-medium">{product.quantitySold}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {isArabic ? 'الطلبات:' : 'Orders:'} <span className="font-medium">{product.orderCount}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {isArabic ? 'السعر:' : 'Avg:'} <span className="font-medium">OMR {product.avgPrice.toFixed(3)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
