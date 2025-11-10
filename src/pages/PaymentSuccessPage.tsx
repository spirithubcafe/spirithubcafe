import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, PackageCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useApp } from '../hooks/useApp';
import type { CheckoutOrder } from '../types/checkout';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

const LAST_SUCCESS_STORAGE_KEY = 'spirithub_last_success_order';

interface PaymentSuccessLocationState {
  orderId?: string;
  serverOrderId?: number;
}

export const PaymentSuccessPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<CheckoutOrder & { serverOrderId?: number } | null>(null);

  useEffect(() => {
    const state = (location.state as PaymentSuccessLocationState) || {};
    const stored = sessionStorage.getItem(LAST_SUCCESS_STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed: CheckoutOrder & { serverOrderId?: number } = JSON.parse(stored);
        setOrder(parsed);
      } catch {
        sessionStorage.removeItem(LAST_SUCCESS_STORAGE_KEY);
      }
    }
  }, [location.state]);

  const currencyLabel = isArabic ? 'ر.ع' : 'OMR';
  const formatCurrency = (value: number) => `${value.toFixed(3)} ${currencyLabel}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <Seo
        title={isArabic ? 'تم الدفع بنجاح' : 'Payment successful'}
        description={
          isArabic
            ? 'تم تأكيد طلبك من سبيريت هب كافيه. يمكنك تتبع الشحنة من لوحة الطلبات.'
            : 'Your Spirit Hub Cafe order is confirmed. Track the shipment from your orders dashboard.'
        }
        canonical={`${siteMetadata.baseUrl}/payment/success`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Payment Successful"
        titleAr="تم الدفع بنجاح"
        subtitle="Thank you for trusting Spirit Hub. Your order is confirmed."
        subtitleAr="شكراً لثقتك بسبيريت هب. تم تأكيد طلبك بنجاح."
      />

      <div className="container mx-auto py-16 text-center space-y-8">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <div>
          <h2 className="text-3xl font-semibold">
            {isArabic ? 'تم استقبال طلبك!' : 'Your order is on its way!'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isArabic
              ? 'سنرسل لك رسالة تأكيد عبر البريد الإلكتروني مع تفاصيل الفاتورة ومعلومات التتبع.'
              : 'We have sent you an email confirmation with the invoice and tracking details.'}
          </p>
        </div>

        {order && (
          <Card className="text-left shadow-xl border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                <PackageCheck className="w-6 h-6 text-green-500" />
                {isArabic ? 'تفاصيل الطلب' : 'Order details'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'رقم الطلب' : 'Order ID'}: {order.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                <p>{isArabic ? 'سيتم التسليم إلى' : 'Deliver to'}: {order.checkoutDetails.isGift ? order.checkoutDetails.recipientName : order.checkoutDetails.fullName}</p>
                <p>
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientAddress : order.checkoutDetails.address}, {' '}
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientCity : order.checkoutDetails.city}
                </p>
                <p>{isArabic ? order.shippingMethod.nameAr : order.shippingMethod.name}</p>
              </div>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-semibold text-amber-600">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                <span>{formatCurrency(order.totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate('/orders')} className="bg-amber-600 hover:bg-amber-700">
            {isArabic ? 'عرض الطلبات' : 'View Orders'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/products')}>
            {isArabic ? 'مواصلة التسوق' : 'Continue Shopping'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
