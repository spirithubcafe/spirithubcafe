import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, ArrowLeftCircle, RefreshCw, HelpCircle, CreditCard, ShieldAlert, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason');
  const message = searchParams.get('message');

  useEffect(() => {
    setIsVisible(true);

    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOrder(parsed);
      } catch (err) {
        console.error('Error parsing pending order:', err);
      }
    }
  }, [searchParams, orderId, reason, message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 page-padding-top relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-10 w-96 h-96 bg-red-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.3, 1, 1.3], opacity: [0.15, 0.1, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl"
        />
      </div>

      <Seo
        title={isArabic ? 'فشل الدفع' : 'Payment failed'}
        description={isArabic ? 'لم يكتمل الدفع. حاول مجدداً أو اختر طريقة أخرى.' : 'Your payment could not be completed. Try again or use another method.'}
        canonical={`${siteMetadata.baseUrl}/payment/failure`}
        noindex
        robots="noindex, nofollow"
      />

      <div className="container mx-auto py-8 sm:py-12 px-4 relative z-10">
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center space-y-4 sm:space-y-6"
              >
                <motion.div
                  animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.6, repeat: 3, delay: 0.5 }}
                  className="inline-flex items-center justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-red-500 to-rose-600 rounded-full p-4 sm:p-6 shadow-2xl">
                      <AlertOctagon className="h-12 w-12 sm:h-20 sm:w-20 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-2 sm:space-y-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent"
                  >
                    {isArabic ? 'فشل الدفع' : 'Payment Failed'}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto px-4"
                  >
                    {isArabic ? 'حدث خطأ أثناء معالجة عملية الدفع. لا تقلق، يمكنك المحاولة مرة أخرى' : 'Something went wrong while processing your payment. No worries, you can try again'}
                  </motion.p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-100/50 to-transparent rounded-full blur-3xl" />
                  
                  <CardHeader className="relative border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50">
                    <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-red-900">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      </div>
                      {isArabic ? 'ماذا يحدث الآن؟' : "What's Happening?"}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                    <div className="grid gap-3 sm:gap-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200"
                      >
                        <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-green-900">
                            {isArabic ? 'لم يتم خصم أي مبلغ' : 'No Money Deducted'}
                          </h3>
                          <p className="text-xs sm:text-sm text-green-700 mt-1">
                            {isArabic ? 'لم يتم خصم أي مبلغ من بطاقتك أو حسابك البنكي' : 'No money was deducted from your card or bank account'}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200"
                      >
                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                          <ArrowLeftCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-blue-900">
                            {isArabic ? 'طلبك محفوظ' : 'Your Order is Saved'}
                          </h3>
                          <p className="text-xs sm:text-sm text-blue-700 mt-1">
                            {isArabic ? 'تفاصيل طلبك لا تزال محفوظة ويمكنك إعادة المحاولة' : 'Your order details are still saved and you can retry'}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-purple-50 border border-purple-200"
                      >
                        <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                            {isArabic ? 'حاول مرة أخرى' : 'Try Another Method'}
                          </h3>
                          <p className="text-xs sm:text-sm text-purple-700 mt-1">
                            {isArabic ? 'يمكنك المحاولة مرة أخرى أو استخدام طريقة دفع مختلفة' : 'You can try again or use a different payment method'}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {(orderId || reason || message) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="p-4 sm:p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <HelpCircle className="w-5 h-5 text-amber-600" />
                          <h3 className="font-semibold text-amber-900">
                            {isArabic ? 'معلومات إضافية' : 'Additional Information'}
                          </h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          {orderId && (
                            <div className="flex flex-wrap gap-2">
                              <span className="font-medium text-amber-900">{isArabic ? 'رقم الطلب:' : 'Order ID:'}</span>
                              <span className="font-mono text-amber-700">{orderId}</span>
                            </div>
                          )}
                          {reason && (
                            <div className="flex flex-wrap gap-2">
                              <span className="font-medium text-amber-900">{isArabic ? 'السبب:' : 'Reason:'}</span>
                              <span className="text-amber-700">{reason}</span>
                            </div>
                          )}
                          {message && (
                            <div className="flex flex-wrap gap-2">
                              <span className="font-medium text-amber-900">{isArabic ? 'الرسالة:' : 'Message:'}</span>
                              <span className="text-amber-700">{message}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {order && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <ArrowLeftCircle className="w-5 h-5 text-gray-700" />
                          <h3 className="font-semibold text-gray-900">
                            {isArabic ? 'تفاصيل الطلب المعلّق' : 'Pending Order Details'}
                          </h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">{isArabic ? 'رقم الطلب:' : 'Order ID:'}</span> {order.id}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">{isArabic ? 'طريقة الشحن:' : 'Shipping:'}</span>{' '}
                            {isArabic ? order.shippingMethod.nameAr : order.shippingMethod.name}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">{isArabic ? 'سيتم التوصيل إلى:' : 'Deliver to:'}</span>{' '}
                            {order.checkoutDetails.isGift ? order.checkoutDetails.recipientName : order.checkoutDetails.fullName}
                          </p>
                          <div className="pt-3 mt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                              {isArabic ? 'عند نجاح عملية الدفع، سنستأنف تجهيز الطلب مباشرةً' : 'Once payment succeeds, we will resume preparing your order immediately'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200">
                      <h3 className="font-semibold text-indigo-900 mb-3 text-sm sm:text-base">
                        {isArabic ? 'هل تحتاج إلى مساعدة؟' : 'Need Help?'}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-indigo-700">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{isArabic ? 'اتصل بنا' : 'Call us'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-700">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span>{isArabic ? 'راسلنا عبر البريد' : 'Email us'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4"
              >
                <Button
                  onClick={() => navigate('/payment')}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  {isArabic ? 'إعادة المحاولة' : 'Try Payment Again'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/checkout')}
                  className="w-full sm:w-auto border-2 border-red-600 text-red-700 hover:bg-red-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isArabic ? 'تعديل بيانات الطلب' : 'Edit Order Details'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
