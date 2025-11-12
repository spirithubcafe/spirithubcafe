import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeftCircle, ShoppingCart } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useApp } from '../hooks/useApp';
import type { CheckoutOrder } from '../types/checkout';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

const PENDING_ORDER_STORAGE_KEY = 'spirithub_pending_checkout';

export const PaymentCancelledPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  
  // Get parameters from URL - updated to match PaymentController
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Log all URL parameters for debugging
    console.log('=== PaymentCancelledPage Debug ===');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Order ID:', orderId);
    console.log('================================');

    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOrder(parsed);
        console.log('Loaded pending order:', parsed);
      } catch (err) {
        console.error('Error parsing pending order:', err);
      }
    }
  }, [searchParams, orderId]);

  const handleRetryPayment = () => {
    if (order) {
      sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(order));
      navigate('/checkout');
    } else {
      navigate('/cart');
    }
  };

  const handleEditOrder = () => {
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-orange-50 to-white page-padding-top">
      <Seo
        title={isArabic ? 'تم إلغاء الدفع' : 'Payment cancelled'}
        description={
          isArabic
            ? 'تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى.'
            : 'Payment was cancelled. You can try again.'
        }
        canonical={`${siteMetadata.baseUrl}/checkout/payment-cancelled`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Payment Cancelled"
        titleAr="تم إلغاء الدفع"
        subtitle="You cancelled the payment process. Your cart is still available."
        subtitleAr="لقد ألغيت عملية الدفع. سلة التسوق الخاصة بك لا تزال متاحة."
      />

      <div className="container mx-auto py-16 text-center space-y-8">
        <XCircle className="mx-auto h-16 w-16 text-orange-500" />
        <div>
          <h2 className="text-3xl font-semibold text-orange-800">
            {isArabic ? 'تم إلغاء عملية الدفع' : 'Payment was cancelled'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isArabic
              ? 'لم يتم خصم أي مبلغ من بطاقتك. يمكنك المحاولة مرة أخرى أو تعديل طلبك.'
              : 'No money was deducted from your card. You can try again or modify your order.'}
          </p>
        </div>

        {/* Debug Information */}
        {orderId && (
          <Card className="text-left border-amber-200 bg-amber-50 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-amber-900">
                {isArabic ? 'معلومات الطلب' : 'Order Information'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isArabic ? 'رقم الطلب الملغى' : 'Cancelled order ID'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="font-semibold text-amber-900">{isArabic ? 'رقم الطلب:' : 'Order ID:'}</span>
                <span className="font-mono text-amber-700">{orderId}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {order && (
          <Card className="text-left shadow-xl border-orange-100 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-orange-800">
                <ShoppingCart className="w-6 h-6" />
                {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'طلبك لا يزال محفوظاً' : 'Your order is still saved'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {isArabic ? 'الكمية:' : 'Qty:'} {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {item.price.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{isArabic ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="text-orange-700">
                    {order.totals.total.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center max-w-md mx-auto">
          <Button
            onClick={handleRetryPayment}
            className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
          >
            <ArrowLeftCircle className="w-4 h-4" />
            {isArabic ? 'المحاولة مرة أخرى' : 'Try Again'}
          </Button>
          <Button variant="outline" onClick={handleEditOrder}>
            {isArabic ? 'تعديل الطلب' : 'Edit Order'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            {isArabic ? 'مواصلة التسوق' : 'Continue Shopping'}
          </Button>
        </div>
      </div>
    </div>
  );
};
