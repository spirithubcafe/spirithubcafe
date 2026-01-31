import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeftCircle, Home } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useApp } from '../hooks/useApp';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const PaymentErrorPage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get parameters from URL
  const message = searchParams.get('message');
  const errorCode = searchParams.get('code');



  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-white page-padding-top">
      <Seo
        title={isArabic ? 'خطأ في الدفع' : 'Payment error'}
        description={
          isArabic
            ? 'حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.'
            : 'An error occurred while processing payment. Please try again.'
        }
        canonical={`${siteMetadata.baseUrl}/checkout/payment-error`}
        noindex
        robots="noindex, nofollow"
      />
      <PageHeader
        title="Payment Error"
        titleAr="خطأ في الدفع"
        subtitle="An unexpected error occurred during payment processing."
        subtitleAr="حدث خطأ غير متوقع أثناء معالجة الدفع."
      />

      <div className="container mx-auto py-16 text-center space-y-8">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
        <div>
          <h2 className="text-3xl font-semibold text-red-800">
            {isArabic ? 'عذراً، حدث خطأ' : 'Sorry, an error occurred'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isArabic
              ? 'واجهنا مشكلة أثناء معالجة طلبك. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'
              : 'We encountered a problem processing your request. Please try again or contact support.'}
          </p>
        </div>

        {/* Error Information */}
        {(message || errorCode) && (
          <Card className="text-left border-red-200 bg-red-50 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-900">
                {isArabic ? 'تفاصيل الخطأ' : 'Error Details'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isArabic ? 'معلومات فنية للمطورين' : 'Technical information for developers'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {errorCode && (
                <div className="flex flex-wrap gap-2">
                  <span className="font-semibold text-red-900">{isArabic ? 'رمز الخطأ:' : 'Error Code:'}</span>
                  <span className="font-mono text-red-700">{errorCode}</span>
                </div>
              )}
              {message && (
                <div>
                  <div className="font-semibold text-red-900 mb-2">
                    {isArabic ? 'رسالة الخطأ:' : 'Error Message:'}
                  </div>
                  <div className="bg-white p-3 rounded border border-red-200 text-red-800">
                    {decodeURIComponent(message)}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-red-300">
                <div className="font-semibold text-red-900 mb-2">
                  {isArabic ? 'URL الكامل:' : 'Full URL:'}
                </div>
                <div className="font-mono text-xs break-all bg-white p-3 rounded border border-red-200 text-red-800">
                  {window.location.href}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Information */}
        <Card className="text-left shadow-xl border-gray-200 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isArabic ? 'ماذا يمكنك فعله؟' : 'What can you do?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                1
              </div>
              <p>
                {isArabic
                  ? 'حاول تحديث الصفحة والمحاولة مرة أخرى'
                  : 'Try refreshing the page and trying again'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                2
              </div>
              <p>
                {isArabic
                  ? 'تحقق من اتصالك بالإنترنت'
                  : 'Check your internet connection'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                3
              </div>
              <p>
                {isArabic
                  ? 'إذا استمرت المشكلة، اتصل بفريق الدعم'
                  : 'If the problem persists, contact our support team'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center max-w-md mx-auto">
          <Button
            onClick={() => navigate('/cart')}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <ArrowLeftCircle className="w-4 h-4" />
            {isArabic ? 'العودة إلى السلة' : 'Back to Cart'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/contact')}>
            {isArabic ? 'اتصل بنا' : 'Contact Support'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            {isArabic ? 'الصفحة الرئيسية' : 'Home'}
          </Button>
        </div>
      </div>
    </div>
  );
};
