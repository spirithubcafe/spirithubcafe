import React, { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, DollarSign, Package, Users, ShoppingCart, Eye } from 'lucide-react';
import { orderService } from '../../services';
import type { Order } from '../../types/order';
import { SalesChart } from './SalesChart';
import { TopProducts } from './TopProducts';
import { TrafficSources } from './TrafficSources';
import { getVisitorCount } from '../../lib/visitorTracking';

export const ReportsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeVisits, setStoreVisits] = useState(0);

  useEffect(() => {
    loadData();
    loadStoreVisits();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // First, get all orders
      const response = await orderService.getAll({
        page: 1,
        pageSize: 1000, // Get all orders for statistics
      });
      const ordersList = response?.items || response || [];
      const ordersArray = Array.isArray(ordersList) ? ordersList : [];
      
      // For paid orders, fetch detailed information including items
      const paidOrders = ordersArray.filter(o => o.paymentStatus === 'Paid');
      const detailedOrders = await Promise.all(
        paidOrders.slice(0, 100).map(async (order) => { // Limit to 100 for performance
          try {
            const detailResponse = await orderService.getById(order.id);
            return detailResponse;
          } catch (error) {
            console.error(`Error loading details for order ${order.id}:`, error);
            return order; // Return basic order if detail fetch fails
          }
        })
      );
      
      // Combine: detailed paid orders + other orders without items
      const unpaidOrders = ordersArray.filter(o => o.paymentStatus !== 'Paid');
      const allOrders = [...detailedOrders, ...unpaidOrders];
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading data:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreVisits = () => {
    // Get visitor count from tracking utility
    setStoreVisits(getVisitorCount());
  };

  // Calculate statistics from real data
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrders = orders.length;

  const totalProductsSold = orders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => {
      const itemsCount = o.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
      return sum + itemsCount;
    }, 0);

  const uniqueCustomers = new Set(orders.map(o => o.userId)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? 'التقارير والتحليلات' : 'Reports & Analytics'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'رؤى الأعمال والإحصائيات' : 'Business insights and statistics'}
          </p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `OMR ${totalRevenue.toFixed(3)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'الطلبات' : 'Orders'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : totalOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'المنتجات المباعة' : 'Products Sold'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : totalProductsSold}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'عملاء' : 'Customers'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : uniqueCustomers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'زيارات المتجر' : 'Store Visits'}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storeVisits.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isArabic ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </p>
        </div>
      ) : (
        <>
          {/* Sales Chart - Full Width */}
          <SalesChart orders={orders} isArabic={isArabic} />

          {/* Two Column Layout */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Products */}
            <TopProducts orders={orders} isArabic={isArabic} limit={10} />
            
            {/* Traffic Sources */}
            <TrafficSources isArabic={isArabic} />
          </div>
        </>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'الطلبات الأخيرة' : 'Recent Orders'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'لا توجد طلبات' : 'No orders yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    order.status === 'Delivered' ? 'bg-green-500' :
                    order.status === 'Processing' ? 'bg-blue-500' :
                    order.status === 'Pending' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isArabic ? `طلب رقم ${order.orderNumber}` : `Order ${order.orderNumber}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.status} • OMR {order.totalAmount.toFixed(3)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
