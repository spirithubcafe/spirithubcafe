import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, ShoppingCart, RefreshCw, ArrowLeft, Package, CreditCard, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  const [isVisible, setIsVisible] = useState(false);
  
  const orderId = searchParams.get('orderId');

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
  }, [searchParams, orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 page-padding-top relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl"
        />
      </div>

      <Seo
        title={isArabic ? 'تم إلغاء الدفع' : 'Payment cancelled'}
        description={isArabic ? 'تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى.' : 'Payment was cancelled. You can try again.'}
        canonical={`${siteMetadata.baseUrl}/checkout/payment-cancelled`}
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
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2, delay: 0.5 }}
                  className="inline-flex items-center justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full blur-2xl opacity-40" />
                    <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-full p-4 sm:p-6 shadow-2xl">
                      <XCircle className="h-12 w-12 sm:h-20 sm:w-20 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-2 sm:space-y-3">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent"
                  >
                    {isArabic ? 'تم إلغاء الدفع' : 'Payment Cancelled'}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto px-4"
                  >
                    {isArabic ? 'لقد ألغيت عملية الدفع. لا تقلق، سلة التسوق الخاصة بك لا تزال محفوظة' : "You cancelled the payment process. Don't worry, your cart is still saved"}
                  </motion.p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-orange-100/50 to-transparent rounded-full blur-3xl" />
                  
                  <CardHeader className="relative border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-orange-900">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Info className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      {isArabic ? 'ماذا حدث؟' : 'What Happened?'}
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
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-green-900">
                            {isArabic ? 'سلتك محفوظة' : 'Your Cart is Safe'}
                          </h3>
                          <p className="text-xs sm:text-sm text-green-700 mt-1">
                            {isArabic ? 'جميع المنتجات في سلة التسوق الخاصة بك لا تزال محفوظة' : 'All products in your shopping cart are still saved'}
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
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-blue-900">
                            {isArabic ? 'لم يتم خصم أي مبلغ' : 'No Charges Made'}
                          </h3>
                          <p className="text-xs sm:text-sm text-blue-700 mt-1">
                            {isArabic ? 'لم يتم خصم أي مبلغ من بطاقتك أو حسابك البنكي' : 'No money was deducted from your card or bank account'}
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
                            {isArabic ? 'يمكنك المحاولة مرة أخرى' : 'You Can Try Again'}
                          </h3>
                          <p className="text-xs sm:text-sm text-purple-700 mt-1">
                            {isArabic ? 'يمكنك إعادة محاولة الدفع في أي وقت تريد' : 'You can retry the payment anytime you want'}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {orderId && (
                      <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                        <div className="text-center space-y-2">
                          <p className="text-xs sm:text-sm font-medium text-amber-900">
                            {isArabic ? 'رقم الطلب الملغى' : 'Cancelled Order ID'}
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-amber-700 font-mono">{orderId}</p>
                        </div>
                      </div>
                    )}

                    {order && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="w-5 h-5 text-gray-700" />
                          <h3 className="font-semibold text-gray-900">
                            {isArabic ? 'تفاصيل طلبك' : 'Your Order Details'}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 text-sm">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                <p className="text-xs text-gray-600">{isArabic ? 'الكمية:' : 'Qty:'} {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-gray-900 ml-4">
                                {item.price.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                              </p>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-600 text-center pt-2">
                              {isArabic ? `و ${order.items.length - 3} منتجات أخرى` : `and ${order.items.length - 3} more items`}
                            </p>
                          )}
                          <div className="pt-3 mt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-900">{isArabic ? 'الإجمالي:' : 'Total:'}</span>
                              <span className="text-lg font-bold text-orange-600">
                                {order.totals.total.toFixed(3)} {isArabic ? 'ر.ع.' : 'OMR'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4"
              >
                <Button
                  onClick={() => navigate('/checkout')}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  {isArabic ? 'إعادة المحاولة' : 'Try Again'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/products')}
                  className="w-full sm:w-auto border-2 border-orange-600 text-orange-700 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
                  {isArabic ? 'مواصلة التسوق' : 'Continue Shopping'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;
