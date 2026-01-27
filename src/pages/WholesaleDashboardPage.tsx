import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { wholesaleOrderService } from '../services';
import { useApp } from '../hooks/useApp';
import type { WholesaleOrder } from '../types/wholesale';

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    Pending: 'در انتظار',
    New: 'جدید',
    Confirmed: 'تأیید شده',
    Processing: 'در حال پردازش',
    Preparing: 'در حال آماده‌سازی',
    Shipped: 'ارسال شده',
    Delivered: 'تحویل داده شده',
    Cancelled: 'لغو شده',
  };
  return status ? labels[status] || status : '-';
};

export const WholesaleDashboardPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState<WholesaleOrder[]>([]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await wholesaleOrderService.getMy({ page: 1, pageSize: 1000 });
      const orders = response.data || [];

      const pendingStatuses = new Set(['Pending', 'New']);
      const pendingOrders = orders.filter((order) => pendingStatuses.has(order.status)).length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.manualPrice || 0), 0);

      setStats({
        totalOrders: response.pagination?.totalCount ?? orders.length,
        pendingOrders,
        totalSpent,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Wholesale dashboard load error:', error);
      toast.error(isArabic ? 'حدث خطأ أثناء تحميل لوحة الجملة.' : 'Failed to load wholesale dashboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isArabic ? 'لوحة الجملة' : 'Wholesale dashboard'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isArabic
              ? 'إدارة طلبات الجملة وإنشاء طلب جديد'
              : 'Manage wholesale orders and create a new order'}
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
          <Link to="/wholesale/orders/new">
            {isArabic ? 'إنشاء طلب جديد' : 'Create new order'}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {isArabic ? 'إجمالي الطلبات' : 'Total orders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-gray-900">
            {loading ? '...' : stats.totalOrders}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {isArabic ? 'طلبات قيد الانتظار' : 'Pending orders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-gray-900">
            {loading ? '...' : stats.pendingOrders}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {isArabic ? 'إجمالي الطلبات (تقديري)' : 'Total value (estimated)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-gray-900">
            {loading
              ? '...'
              : `${stats.totalSpent.toLocaleString(isArabic ? 'ar' : 'en-US')} ${isArabic ? 'ر.ع' : 'OMR'}`}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isArabic ? 'الطلبات الأخيرة' : 'Recent orders'}
          </h2>
          <Link className="text-sm text-amber-600 hover:text-amber-700" to="/wholesale/orders">
            {isArabic ? 'عرض الكل' : 'View all'}
          </Link>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-500">
              {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : recentOrders.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-gray-600">
                {isArabic ? 'لا توجد طلبات بعد.' : 'No orders yet.'}
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-right">{isArabic ? 'رقم الطلب' : 'Order #'} </th>
                    <th className="px-4 py-3 text-right">{isArabic ? 'التاريخ' : 'Date'}</th>
                    <th className="px-4 py-3 text-right">{isArabic ? 'الحالة' : 'Status'}</th>
                    <th className="px-4 py-3 text-right">{isArabic ? 'المبلغ' : 'Amount'}</th>
                    <th className="px-4 py-3 text-right">{isArabic ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="bg-white">
                      <td className="px-4 py-3">#{order.wholesaleOrderNumber || order.id}</td>
                      <td className="px-4 py-3">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en-US')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">{getStatusLabel(order.status)}</td>
                      <td className="px-4 py-3">
                        {(order.manualPrice || 0).toLocaleString(isArabic ? 'ar' : 'en-US')} {isArabic ? 'ر.ع' : 'OMR'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/wholesale/orders/${order.id}`}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          {isArabic ? 'التفاصيل' : 'Details'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WholesaleDashboardPage;
