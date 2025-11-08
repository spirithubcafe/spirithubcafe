import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowLeftCircle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useApp } from '../hooks/useApp';
import type { CheckoutOrder } from '../types/checkout';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

const PENDING_ORDER_STORAGE_KEY = 'spirithub_pending_checkout';

export const PaymentFailurePage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: CheckoutOrder = JSON.parse(stored);
        setOrder(parsed);
      } catch {
        sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Seo
        title={isArabic ? 'فشل الدفع' : 'Payment failed'}
        description={
          isArabic
            ? 'لم يكتمل الدفع. حاول مجدداً أو اختر طريقة أخرى.'
            : 'Your payment could not be completed. Try again or use another method.'
        }
        canonical={`${siteMetadata.baseUrl}/payment/failure`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Payment Failed"
        titleAr="عملية الدفع فشلت"
        subtitle="We could not confirm your payment. Please try again or use another method."
        subtitleAr="لم نتمكن من تأكيد عملية الدفع. يرجى المحاولة مرة أخرى أو استخدام طريقة أخرى."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-center">
        <AlertOctagon className="mx-auto h-16 w-16 text-red-500" />
        <div>
          <h2 className="text-3xl font-semibold text-red-800">
            {isArabic ? 'حدث خطأ أثناء عملية الدفع' : 'Something went wrong during payment'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isArabic
              ? 'لم يتم خصم أي مبلغ من بطاقتك. بإمكانك إعادة المحاولة أو تعديل بيانات الطلب.'
              : 'No money was deducted from your card. You can retry the payment or review your order details.'}
          </p>
        </div>

        {order && (
          <Card className="text-left shadow-xl border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-red-800">
                <ArrowLeftCircle className="w-6 h-6" />
                {isArabic ? 'تفاصيل الطلب المعلّق' : 'Pending order details'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'رقم الطلب' : 'Order ID'}: {order.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                {isArabic ? 'طريقة الشحن' : 'Shipping'}: {isArabic ? order.shippingMethod.nameAr : order.shippingMethod.name}
              </p>
              <p>
                {isArabic ? 'سيتم التوصيل إلى' : 'Deliver to'}: {order.checkoutDetails.isGift ? order.checkoutDetails.recipientName : order.checkoutDetails.fullName}
              </p>
              <p>
                {isArabic
                  ? 'عند نجاح عملية الدفع، سنستأنف تجهيز الطلب مباشرةً.'
                  : 'As soon as the payment succeeds, we will resume preparing your order.'}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => navigate('/payment')}>
            {isArabic ? 'إعادة المحاولة' : 'Try Payment Again'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/checkout')}>
            {isArabic ? 'تعديل بيانات الطلب' : 'Edit Order Details'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
