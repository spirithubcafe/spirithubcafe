import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Truck, Clock3, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useApp } from '../hooks/useApp';
import { useCart } from '../hooks/useCart';
import type { CheckoutOrder } from '../types/checkout';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

const PENDING_ORDER_STORAGE_KEY = 'spirithub_pending_checkout';
const LAST_SUCCESS_STORAGE_KEY = 'spirithub_last_success_order';

interface PaymentLocationState {
  order?: CheckoutOrder;
  orderId?: string;
}

export const PaymentPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentTimer = useRef<number | null>(null);

  useEffect(() => {
    const state = (location.state as PaymentLocationState) || {};

    if (state.order) {
      setOrder(state.order);
      sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(state.order));
      return;
    }

    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: CheckoutOrder = JSON.parse(stored);
        setOrder(parsed);
        return;
      } catch {
        sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      }
    }

    navigate('/checkout', { replace: true });
  }, [location.state, navigate]);

  const currencyLabel = isArabic ? 'ر.ع' : 'OMR';
  const formatCurrency = (value: number) => `${value.toFixed(3)} ${currencyLabel}`;

  const recipientLabel = useMemo(() => {
    if (!order) return '';
    if (order.checkoutDetails.isGift) {
      return order.checkoutDetails.recipientName || (isArabic ? 'المُستلِم' : 'Recipient');
    }
    return order.checkoutDetails.fullName;
  }, [order, isArabic]);

  const handlePayment = (simulateFailure = false) => {
    if (!order) return;

    if (simulateFailure) {
      navigate('/payment/failure', { state: { orderId: order.id } });
      return;
    }

    setIsProcessing(true);

    if (paymentTimer.current) {
      window.clearTimeout(paymentTimer.current);
    }

    paymentTimer.current = window.setTimeout(() => {
      clearCart();
      sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
      sessionStorage.setItem(LAST_SUCCESS_STORAGE_KEY, JSON.stringify(order));
      navigate('/payment/success', { state: { orderId: order.id } });
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (paymentTimer.current) {
        window.clearTimeout(paymentTimer.current);
      }
    };
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Seo
          title={language === 'ar' ? 'الدفع' : 'Payment'}
          description={
            language === 'ar'
              ? 'نقوم بإعداد تفاصيل الدفع الخاصة بك.'
              : 'Preparing your secure payment session.'
          }
          canonical={`${siteMetadata.baseUrl}/payment`}
          noindex
          robots="noindex, nofollow"
        />
        <PageHeader
          title="Payment"
          titleAr="الدفع"
          subtitle="Fetching your order details..."
          subtitleAr="جاري تحميل تفاصيل الطلب..."
        />
        <div className="container mx-auto py-16 text-center space-y-6">
          <p className="text-gray-600">
            {isArabic ? 'نقوم بإحضار تفاصيل الطلب، يرجى الانتظار أو العودة إلى صفحة الشراء.' : 'We are preparing your payment details. Please wait or return to checkout.'}
          </p>
          <Button variant="outline" onClick={() => navigate('/checkout')}>
            {isArabic ? 'العودة إلى صفحة الشراء' : 'Back to Checkout'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Seo
        title={language === 'ar' ? 'الدفع' : 'Payment'}
        description={
          language === 'ar'
            ? 'أكمل عملية الدفع لطلب سبيريت هب كافيه.'
            : 'Complete the secure payment for your Spirit Hub Cafe order.'
        }
        canonical={`${siteMetadata.baseUrl}/payment`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Payment"
        titleAr="الدفع"
        subtitle="Complete your secure payment to confirm the order."
        subtitleAr="قم بإكمال عملية الدفع الآمنة لتأكيد الطلب."
      />

      <div className="container mx-auto py-12 space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.7fr,1fr]">
          <div className="space-y-6">
            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                  {isArabic ? 'ملخص الدفع' : 'Payment Overview'}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? 'نقوم بحماية بياناتك باستخدام بوابة دفع مشفرة بنسبة 256 بت.'
                    : 'We protect your data with 256-bit encrypted payment gateways.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border bg-gray-50/80 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    {isArabic ? 'رقم الطلب' : 'Order ID'}: {order.id}
                  </p>
                  <p>
                    {isArabic ? 'سيتم توصيل الطلب إلى' : 'Deliver to'}: {recipientLabel}
                  </p>
                  <p>
                    {isArabic ? 'طريقة الشحن' : 'Shipping'}: {isArabic ? order.shippingMethod.nameAr : order.shippingMethod.name} —{' '}
                    {isArabic ? order.shippingMethod.etaAr : order.shippingMethod.eta}
                  </p>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
                      <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {isArabic ? 'الكمية' : 'Qty'}: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span>{formatCurrency(order.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
                    <span>
                      {order.totals.shipping === 0
                        ? isArabic ? 'مجاني' : 'Free'
                        : formatCurrency(order.totals.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>{isArabic ? 'المجموع الكلي' : 'Total'}</span>
                    <span>{formatCurrency(order.totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                  {isArabic ? 'اختر وسيلة الدفع' : 'Choose payment method'}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? 'حالياً نقبل الدفع عبر البطاقات البنكية والتحويل البنكي. سيتم إضافة مزيد من الخيارات قريباً.'
                    : 'We currently accept card payments and bank transfers. More options are coming soon.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{isArabic ? 'بطاقة بنكية (فيزا/ماستركارد)' : 'Debit/Credit Card'}</p>
                      <p className="text-sm text-gray-500">
                        {isArabic ? 'دفع آمن فوري مع تأكيد لحظي.' : 'Instant secure payment with immediate confirmation.'}
                      </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-gray-200 p-4">
                  <p className="font-semibold">{isArabic ? 'تحويل بنكي' : 'Bank Transfer'}</p>
                  <p className="text-sm text-gray-500">
                    {isArabic ? 'سنتواصل معك لإرسال بيانات الحساب عند اختيار هذا الخيار.' : 'We will share our bank details after you confirm this option.'}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    onClick={() => handlePayment(false)}
                    disabled={isProcessing}
                  >
                    {isArabic ? 'ادفع الآن' : 'Pay Securely'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePayment(true)}
                  >
                    {isArabic ? 'محاكاة فشل الدفع' : 'Simulate Failed Payment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Truck className="w-5 h-5 text-amber-600" />
                  {isArabic ? 'عنوان التوصيل' : 'Delivery Address'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <p>{order.checkoutDetails.isGift ? order.checkoutDetails.recipientName : order.checkoutDetails.fullName}</p>
                <p>{order.checkoutDetails.isGift ? order.checkoutDetails.recipientPhone : order.checkoutDetails.phone}</p>
                <p>
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientAddress : order.checkoutDetails.address}
                </p>
                <p>
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientCity : order.checkoutDetails.city}, {' '}
                  {order.checkoutDetails.isGift ? order.checkoutDetails.recipientCountry : order.checkoutDetails.country}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-amber-100 bg-amber-50/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Clock3 className="w-5 h-5" />
                  {isArabic ? 'وقت التسليم المتوقع' : 'Estimated delivery'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-900">
                <p>{isArabic ? order.shippingMethod.etaAr : order.shippingMethod.eta}</p>
                {order.checkoutDetails.isGift && (
                  <p className="mt-2">
                    {isArabic
                      ? 'سنخبر المستلم بأن الطلب هدية ولن نذكر الأسعار في الفاتورة.'
                      : 'We will let the recipient know it is a gift and hide prices on the slip.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-red-100 bg-red-50/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  {isArabic ? 'مشكلة في الدفع؟' : 'Having trouble paying?'}
                </CardTitle>
                <CardDescription className="text-red-900/80">
                  {isArabic
                    ? 'إذا واجهت أي مشكلة في عملية الدفع يمكنك العودة لتعديل بيانات الطلب.'
                    : 'If something goes wrong you can return to checkout and adjust your order.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/checkout')}>
                  {isArabic ? 'العودة إلى صفحة الشراء' : 'Return to Checkout'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
