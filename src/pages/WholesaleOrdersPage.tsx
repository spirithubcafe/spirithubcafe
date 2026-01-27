import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { wholesaleOrderService } from '../services';
import { useApp } from '../hooks/useApp';
import type { WholesaleOrder, WholesaleOrderStatus, WholesalePaymentStatus } from '../types/wholesale';

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

const getPaymentLabel = (status?: string) => {
  const labels: Record<string, string> = {
    Pending: 'در انتظار',
    Paid: 'پرداخت شده',
    Failed: 'ناموفق',
    Refunded: 'مرجوع شده',
  };
  return status ? labels[status] || status : '-';
};

export const WholesaleOrdersPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<WholesaleOrderStatus | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<WholesalePaymentStatus | ''>('');

  useEffect(() => {
    void loadOrders();
  }, [page, status, paymentStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await wholesaleOrderService.getMy({
        page,
        pageSize,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
      });

      setOrders(response.data || []);
      setTotalCount(response.pagination?.totalCount ?? (response.data?.length || 0));
    } catch (error) {
      console.error('Wholesale orders load error:', error);
      toast.error(isArabic ? 'حدث خطأ أثناء تحميل طلبات الجملة.' : 'Failed to load wholesale orders.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isArabic ? 'طلباتي بالجملة' : 'My wholesale orders'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isArabic ? 'قائمة طلبات الجملة المسجلة' : 'List of submitted wholesale orders'}
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white">
          <Link to="/wholesale/orders/new">
            {isArabic ? 'إنشاء طلب جديد' : 'Create new order'}
          </Link>
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="py-4 flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">
              {isArabic ? 'حالة الطلب' : 'Order status'}
            </label>
            <select
              className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as WholesaleOrderStatus | '');
                setPage(1);
              }}
            >
              <option value="">{isArabic ? 'الكل' : 'All'}</option>
              {['New', 'Pending', 'Confirmed', 'Processing', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'].map(
                (value) => (
                  <option key={value} value={value}>
                    {getStatusLabel(value)}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">
              {isArabic ? 'حالة الدفع' : 'Payment status'}
            </label>
            <select
              className="h-10 rounded-md border border-gray-200 px-3 text-sm"
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value as WholesalePaymentStatus | '');
                setPage(1);
              }}
            >
              <option value="">{isArabic ? 'الكل' : 'All'}</option>
              {['Pending', 'Paid', 'Failed', 'Refunded'].map((value) => (
                <option key={value} value={value}>
                  {getPaymentLabel(value)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        {loading ? (
          <div className="text-sm text-gray-500">
            {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-gray-600">
              {isArabic ? 'لم يتم العثور على طلبات.' : 'No orders found.'}
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-right">{isArabic ? 'الرقم' : '#'} </th>
                  <th className="px-4 py-3 text-right">{isArabic ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-right">{isArabic ? 'العميل' : 'Customer'}</th>
                  <th className="px-4 py-3 text-right">{isArabic ? 'عدد العناصر' : 'Items'}</th>
                  <th className="px-4 py-3 text-right">{isArabic ? 'حالة الطلب' : 'Order status'}</th>
                  <th className="px-4 py-3 text-right">{isArabic ? 'حالة الدفع' : 'Payment status'}</th>
                  <th className="px-4 py-3 text-right">{isArabic ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="bg-white">
                    <td className="px-4 py-3">#{order.wholesaleOrderNumber || order.id}</td>
                    <td className="px-4 py-3">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en-US')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{order.items?.length || 0}</td>
                    <td className="px-4 py-3">{getStatusLabel(order.status)}</td>
                    <td className="px-4 py-3">{getPaymentLabel(order.paymentStatus)}</td>
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            {isArabic ? 'السابق' : 'Previous'}
          </Button>
          <span className="text-sm text-gray-600">
            {isArabic ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            {isArabic ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WholesaleOrdersPage;
