import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, PackageCheck, Mail, Clock, Sparkles, ArrowRight, Package } from 'lucide-react';
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
  const [isVisible, setIsVisible] = useState(false);
  
  // Get parameters from URL - updated to match PaymentController
  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');
  const trackingId = searchParams.get('trackingId');

  useEffect(() => {
    setIsVisible(true);

    // Clear cart after successful payment
    if (orderId) {
      localStorage.removeItem('spirithub_cart');
      sessionStorage.removeItem('spirithub_checkout_order');
      sessionStorage.removeItem('spirithub_pending_checkout');
    }

    // Advanced confetti celebration
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    // Multiple confetti bursts with different effects
    const colors = ['#10b981', '#059669', '#34d399', '#fbbf24', '#f59e0b'];
    
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: colors,
        zIndex: 9999
      });
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: colors,
        zIndex: 9999
      });
    }, 250);

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      zIndex: 9999
    });

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 page-padding-top relative overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/20 to-green-200/20 rounded-full blur-3xl"
        />
      </div>

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

      <div className="container mx-auto py-8 sm:py-12 px-4 relative z-10">
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
            >
              {/* Success Header */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className="text-center space-y-4 sm:space-y-6"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-flex items-center justify-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 sm:p-6 shadow-2xl">
                      <CheckCircle className="h-12 w-12 sm:h-20 sm:w-20 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-4 sm:space-y-6">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl sm:text-5xl lg:text-6xl font-bold text-green-800"
                  >
                    {isArabic ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto px-4"
                  >
                    {isArabic
                      ? 'شكراً لطلبك! تم استلام الدفع بنجاح وسيتم معالجة طلبك قريباً'
                      : 'Thank you for your order! Your payment was successful and your order will be processed soon'}
                  </motion.p>
                </div>
              </motion.div>

              {/* Order Information Card */}
              {orderId && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-100/50 to-transparent rounded-full blur-3xl" />
                    
                    <CardHeader className="relative border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-green-900">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        {isArabic ? 'معلومات الطلب' : 'Order Information'}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative">
                      {/* Order ID Section */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-6 sm:p-8 text-white shadow-xl">
                        <motion.div
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.1, 0.3],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                          }}
                          className="absolute -top-12 -right-12 w-48 h-48 bg-white rounded-full"
                        />
                        
                        <div className="relative space-y-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            <p className="text-xs sm:text-sm font-medium text-green-100 uppercase tracking-wider">
                              {isArabic ? 'رقم الطلب' : 'Order Number'}
                            </p>
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <p className="text-2xl sm:text-4xl font-bold tracking-wide">
                            {orderId}
                          </p>
                          
                          {trackingId && (
                            <div className="pt-4 border-t border-white/20 mt-4">
                              <p className="text-xs font-medium text-green-100 mb-1">
                                {isArabic ? 'رقم التتبع' : 'Tracking ID'}
                              </p>
                              <p className="text-sm sm:text-base font-mono bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                                {trackingId}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Steps */}
                      <div className="grid gap-3 sm:gap-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-green-50 border border-green-200"
                        >
                          <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-green-900">
                              {isArabic ? 'تم استلام الطلب' : 'Order Received'}
                            </h3>
                            <p className="text-xs sm:text-sm text-green-700 mt-1">
                              {isArabic
                                ? 'تم استلام طلبك وجاري المعالجة'
                                : 'Your order has been received and is being processed'}
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
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-blue-900">
                              {isArabic ? 'جاري التحضير' : 'Being Prepared'}
                            </h3>
                            <p className="text-xs sm:text-sm text-blue-700 mt-1">
                              {isArabic
                                ? 'سيتم تحضير طلبك خلال 24-48 ساعة'
                                : 'Your order will be prepared within 24-48 hours'}
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
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-purple-900">
                              {isArabic ? 'تحديثات البريد الإلكتروني' : 'Email Updates'}
                            </h3>
                            <p className="text-xs sm:text-sm text-purple-700 mt-1">
                              {isArabic
                                ? 'سنرسل لك تحديثات عن حالة طلبك'
                                : "We'll send you updates about your order status"}
                            </p>
                          </div>
                        </motion.div>
                      </div>

                      {/* Info Box */}
                      <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                              {isArabic
                                ? 'يمكنك متابعة حالة طلبك في أي وقت من صفحة "طلباتي" في حسابك'
                                : 'You can track your order status anytime from "My Orders" page in your account'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4"
              >
                <Button
                  onClick={() => navigate('/profile')}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  {isArabic ? 'طلباتي' : 'My Orders'}
                  <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/products')}
                  className="w-full sm:w-auto border-2 border-green-600 text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
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

export default PaymentSuccessPage;
