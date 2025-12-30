import React, { useEffect, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, DollarSign, Package, Users, ShoppingCart, TrendingDown, Repeat, Calendar, BarChart } from 'lucide-react';
import { orderService } from '../../services';
import type { Order } from '../../types/order';
import { SalesChart } from './SalesChart';
import { TopProducts } from './TopProducts';
import { TrafficSources } from './TrafficSources';
import { CustomerAnalytics } from './CustomerAnalytics';
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

  // Count unique customers from paid orders only
  const paidOrdersForCustomers = orders.filter(o => o.paymentStatus === 'Paid');
  const uniqueCustomers = new Set(
    paidOrdersForCustomers.map(o => o.userId || o.email).filter(id => id)
  ).size;

  // Calculate KPIs
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
  const averageOrderValue = paidOrders.length > 0 
    ? paidOrders.reduce((sum, o) => sum + o.totalAmount, 0) / paidOrders.length 
    : 0;

  const revenuePerCustomer = uniqueCustomers > 0 
    ? totalRevenue / uniqueCustomers 
    : 0;

  // Calculate orders per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  const ordersPerDay = recentOrders.length / 30;

  // Calculate previous 30 days for comparison
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const previousPeriodOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
  });
  const previousOrdersPerDay = previousPeriodOrders.length / 30;
  const ordersPerDayChange = previousOrdersPerDay > 0 
    ? ((ordersPerDay - previousOrdersPerDay) / previousOrdersPerDay) * 100 
    : 0;

  // Calculate returning customers
  const customerOrderCounts = new Map<string, number>();
  orders.forEach(o => {
    if (o.userId) {
      customerOrderCounts.set(o.userId, (customerOrderCounts.get(o.userId) || 0) + 1);
    }
  });
  const returningCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
  const returningCustomerRate = uniqueCustomers > 0 
    ? (returningCustomers / uniqueCustomers) * 100 
    : 0;

  // Conversion rate (orders / store visits)
  const conversionRate = storeVisits > 0 
    ? (totalOrders / storeVisits) * 100 
    : 0;

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

      {/* Hero Metrics - Most Important KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {loading ? '...' : `OMR ${totalRevenue.toFixed(3)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? 'من جميع الطلبات المدفوعة' : 'From all paid orders'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'إجمالي الطلبات' : 'Total Orders'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {loading ? '...' : totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? `${uniqueCustomers} عملاء (طلبات مدفوعة)` : `${uniqueCustomers} customers (paid orders)`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'المنتجات المباعة' : 'Products Sold'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {loading ? '...' : totalProductsSold}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic ? 'إجمالي الوحدات' : 'Total units'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          {isArabic ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
        </h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isArabic ? 'متوسط قيمة الطلب' : 'Average Order Value'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `OMR ${averageOrderValue.toFixed(3)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'الطلبات المدفوعة فقط' : 'Paid orders only'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isArabic ? 'الإيرادات لكل عميل' : 'Revenue per Customer'}
              </CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `OMR ${revenuePerCustomer.toFixed(3)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'الولاء والتكرار' : 'Loyalty & repeat'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isArabic ? 'الطلبات يومياً' : 'Orders per Day'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${ordersPerDay.toFixed(1)} / day`}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {loading ? '' : ordersPerDayChange !== 0 && (
                  <>
                    {ordersPerDayChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={ordersPerDayChange > 0 ? 'text-green-600' : 'text-red-600'}>
                      {ordersPerDayChange > 0 ? '+' : ''}{ordersPerDayChange.toFixed(0)}%
                    </span>
                    <span>{isArabic ? 'مقارنة بالـ 30 يوم السابقة' : 'vs previous 30 days'}</span>
                  </>
                )}
                {loading || ordersPerDayChange === 0 ? (isArabic ? 'متوسط آخر 30 يوم' : 'Last 30 days avg') : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isArabic ? 'معدل التحويل' : 'Conversion Rate'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${conversionRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'فعالية الموقع' : 'Website effectiveness'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isArabic ? 'العملاء العائدون' : 'Returning Customers'}
              </CardTitle>
              <Repeat className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${returningCustomerRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'قوة العلامة التجارية' : 'Brand strength'}
              </p>
            </CardContent>
          </Card>
        </div>
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

          {/* Two Column Layout - Customer Analytics and Top Products */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Customer Analytics */}
            <CustomerAnalytics orders={orders} isArabic={isArabic} />

            {/* Top Products */}
            <TopProducts orders={orders} isArabic={isArabic} limit={10} />
          </div>

          {/* Traffic Sources - Full Width */}
          <TrafficSources isArabic={isArabic} />
        </>
      )}
    </div>
  );
};
