import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle, PackageCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useApp } from '../hooks/useApp';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const PaymentSuccessPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get parameters from URL - updated to match PaymentController
  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');
  const trackingId = searchParams.get('trackingId');

  useEffect(() => {
    // Log all URL parameters for debugging
    console.log('=== PaymentSuccessPage Debug ===');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));
    console.log('Order ID:', orderId);
    console.log('Tracking ID:', trackingId);
    console.log('================================');

    // Clear cart after successful payment
    if (orderId) {
      localStorage.removeItem('spirithub_cart');
      sessionStorage.removeItem('spirithub_checkout_order');
      sessionStorage.removeItem('spirithub_pending_checkout');
    }

    // Trigger confetti celebration
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [orderId, trackingId, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white page-padding-top">
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
        subtitle="Thank you for your order! Your payment was successful."
        subtitleAr="شكراً لطلبك! تم استلام الدفع بنجاح."
      />

      <div className="container mx-auto py-12 px-4 text-center space-y-8 max-w-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isArabic ? 'تم استلام طلبك بنجاح!' : 'Order Received Successfully!'}
            </h2>
            <p className="text-lg text-gray-600">
              {isArabic
                ? 'سيتم معالجة طلبك قريباً وسنرسل لك تحديثات عبر البريد الإلكتروني'
                : 'Your order will be processed soon and we will send you updates via email'}
            </p>
          </div>
        </div>

        {orderId && (
          <Card className="text-left shadow-xl border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                <PackageCheck className="w-6 h-6 text-green-500" />
                {isArabic ? 'معلومات الطلب' : 'Order Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-linear-to-br from-green-50 to-emerald-50 p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {isArabic ? 'رقم الطلب' : 'Order Number'}
                </p>
                <p className="text-2xl font-bold text-green-700 mb-4">
                  {orderId}
                </p>
                {trackingId && (
                  <div className="mb-4 pb-4 border-b border-green-200">
                    <p className="text-xs text-gray-600 mb-1">
                      {isArabic ? 'رقم التتبع' : 'Tracking ID'}
                    </p>
                    <p className="text-sm font-mono text-green-600">
                      {trackingId}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{isArabic ? 'تم استلام الطلب وجاري المعالجة' : 'Order received and being processed'}</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 py-4">
                {isArabic 
                  ? 'يمكنك متابعة حالة طلبك من صفحة "طلباتي"' 
                  : 'You can track your order status from "My Orders" page'}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate('/profile')} className="bg-amber-600 hover:bg-amber-700">
            {isArabic ? 'طلباتي' : 'My Orders'}
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
