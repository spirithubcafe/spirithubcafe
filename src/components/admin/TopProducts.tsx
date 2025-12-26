import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Package, TrendingUp } from 'lucide-react';
import type { Order } from '../../types/order';
import {
  getTopProducts,
  exportTopProductsToCSV,
  downloadCSV,
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
  const topProducts = getTopProducts(orders, limit);

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
        {topProducts.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'لا توجد بيانات متاحة' : 'No data available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Rank Badge */}
                <div className="flex-shrink-0">
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
                  <div className="flex-shrink-0">
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="h-10 w-10 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isArabic && product.productNameAr
                      ? product.productNameAr
                      : product.productName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {isArabic ? 'الكمية:' : 'Qty:'} {product.quantitySold}
                    </span>
                    <span>
                      {isArabic ? 'الطلبات:' : 'Orders:'} {product.orderCount}
                    </span>
                  </div>
                </div>

                {/* Revenue */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold">OMR {product.revenue.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? 'الإيرادات' : 'Revenue'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
