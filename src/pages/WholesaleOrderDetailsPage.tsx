import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

const getPaymentLabel = (status?: string) => {
  const labels: Record<string, string> = {
    Pending: 'در انتظار',
    Paid: 'پرداخت شده',
    Failed: 'ناموفق',
    Refunded: 'مرجوع شده',
  };
  return status ? labels[status] || status : '-';
};

export const WholesaleOrderDetailsPage: React.FC = () => {
  const { id } = useParams();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<WholesaleOrder | null>(null);

  useEffect(() => {
    void loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await wholesaleOrderService.getById(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Wholesale order details error:', error);
      toast.error(isArabic ? 'تعذر تحميل تفاصيل الطلب.' : 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isArabic ? 'تفاصيل طلب الجملة' : 'Wholesale order details'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isArabic ? 'عرض معلومات الطلب كاملة' : 'View full order information'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/wholesale/orders">{isArabic ? 'العودة إلى القائمة' : 'Back to list'}</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-gray-500">
          {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
        </div>
      ) : !order ? (
        <Card className="mt-6">
          <CardContent className="py-6 text-center text-sm text-gray-600">
            {isArabic ? 'لم يتم العثور على الطلب.' : 'Order not found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isArabic ? 'معلومات الطلب' : 'Order information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{isArabic ? 'رقم الطلب:' : 'Order #:'}</span>{' '}
                <span className="text-gray-900">#{order.wholesaleOrderNumber || order.id}</span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'تاريخ الإنشاء:' : 'Created at:'}</span>{' '}
                <span className="text-gray-900">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en-US')
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'حالة الطلب:' : 'Order status:'}</span>{' '}
                <span className="text-gray-900">{getStatusLabel(order.status)}</span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'حالة الدفع:' : 'Payment status:'}</span>{' '}
                <span className="text-gray-900">{getPaymentLabel(order.paymentStatus)}</span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'المبلغ النهائي:' : 'Final amount:'}</span>{' '}
                <span className="text-gray-900">
                  {(order.manualPrice || 0).toLocaleString(isArabic ? 'ar' : 'en-US')} {isArabic ? 'ر.ع' : 'OMR'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'طريقة الشحن:' : 'Shipping method:'}</span>{' '}
                <span className="text-gray-900">
                  {order.shippingMethod === 2
                    ? (isArabic ? 'توصيل (Nool)' : 'Delivery (Nool)')
                    : (isArabic ? 'استلام' : 'Pickup')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isArabic ? 'معلومات العميل' : 'Customer information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{isArabic ? 'اسم العميل:' : 'Customer name:'}</span>{' '}
                <span className="text-gray-900">{order.customerName}</span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'اسم المقهى:' : 'Cafe name:'}</span>{' '}
                <span className="text-gray-900">{order.cafeName}</span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'البريد الإلكتروني:' : 'Email:'}</span>{' '}
                <span className="text-gray-900">{order.customerEmail}</span>
              </div>
              <div>
                <span className="text-gray-500">{isArabic ? 'الهاتف:' : 'Phone:'}</span>{' '}
                <span className="text-gray-900">{order.customerPhone}</span>
              </div>
              {order.address && (
                <div className="md:col-span-2">
                  <span className="text-gray-500">{isArabic ? 'العنوان:' : 'Address:'}</span>{' '}
                  <span className="text-gray-900">{order.address}</span>
                </div>
              )}
              {order.city && (
                <div>
                  <span className="text-gray-500">{isArabic ? 'المدينة:' : 'City:'}</span>{' '}
                  <span className="text-gray-900">{order.city}</span>
                </div>
              )}
              {order.notes && (
                <div className="md:col-span-2">
                  <span className="text-gray-500">{isArabic ? 'ملاحظات:' : 'Notes:'}</span>{' '}
                  <span className="text-gray-900">{order.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isArabic ? 'عناصر الطلب' : 'Order items'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-right">{isArabic ? 'المنتج' : 'Product'}</th>
                      <th className="px-4 py-3 text-right">{isArabic ? 'التنوع' : 'Variant'}</th>
                      <th className="px-4 py-3 text-right">{isArabic ? 'الكمية' : 'Quantity'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id} className="bg-white">
                        <td className="px-4 py-3">{item.productName}</td>
                        <td className="px-4 py-3">{item.variantInfo || '-'}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WholesaleOrderDetailsPage;
