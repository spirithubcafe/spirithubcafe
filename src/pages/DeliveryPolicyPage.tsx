import React from 'react';
import { useApp } from '../hooks/useApp';
import { Truck, Clock, MapPin, CreditCard, Package, AlertCircle } from 'lucide-react';

export const DeliveryPolicyPage: React.FC = () => {
  const { language } = useApp();

  const deliveryAreas = [
    {
      area: language === 'ar' ? 'صور' : 'Sur',
      time: language === 'ar' ? 'قريباً' : 'Coming Soon',
      fee: '14 ' + (language === 'ar' ? 'ريال عماني' : 'OMR'),
      available: false
    },
    {
      area: language === 'ar' ? 'صلالة' : 'Salalah',
      time: '25-35 ' + (language === 'ar' ? 'دقيقة' : 'minutes'),
      fee: '8 ' + (language === 'ar' ? 'ريال عماني' : 'OMR'),
      available: true
    },
    {
      area: language === 'ar' ? 'صحار' : 'Sohar',
      time: '30-40 ' + (language === 'ar' ? 'دقيقة' : 'minutes'),
      fee: '10 ' + (language === 'ar' ? 'ريال عماني' : 'OMR'),
      available: true
    },
    {
      area: language === 'ar' ? 'نزوى' : 'Nizwa',
      time: '35-45 ' + (language === 'ar' ? 'دقيقة' : 'minutes'),
      fee: '12 ' + (language === 'ar' ? 'ريال عماني' : 'OMR'),
      available: true
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-r from-amber-900 to-orange-800 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <Truck className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4">
              {language === 'ar' ? 'سياسة التوصيل' : 'Delivery Policy'}
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed">
              {language === 'ar' 
                ? 'نوصل لك أجود أنواع القهوة والحلويات إلى باب منزلك'
                : 'We deliver the finest coffee and desserts right to your door'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Areas */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'مناطق التوصيل' : 'Delivery Areas'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {deliveryAreas.map((area, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{area.area}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-gray-600">{area.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-gray-600">{area.fee}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {language === 'ar' ? 'متاح' : 'Available'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Process */}
      <div className="py-16 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'كيف يعمل التوصيل؟' : 'How Does Delivery Work?'}
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {language === 'ar' ? 'اختر طلبك' : 'Choose Your Order'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'ar' ? 'تصفح القائمة واختر منتجاتك المفضلة' : 'Browse menu and select your favorites'}
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {language === 'ar' ? 'ادفع بأمان' : 'Pay Securely'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'ar' ? 'اختر طريقة الدفع المناسبة لك' : 'Choose your preferred payment method'}
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {language === 'ar' ? 'نحضر طلبك' : 'We Prepare'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'ar' ? 'فريقنا يحضر طلبك بعناية فائقة' : 'Our team prepares your order with utmost care'}
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">4</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">
                  {language === 'ar' ? 'نوصل لك' : 'We Deliver'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'ar' ? 'نوصل طلبك إلى باب منزلك' : 'We deliver to your doorstep'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Terms */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'شروط التوصيل' : 'Delivery Terms'}
          </h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {language === 'ar' ? 'أوقات التوصيل' : 'Delivery Hours'}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {language === 'ar' ? 'السبت - الأربعاء: 7:00 ص - 11:30 م' : 'Saturday - Wednesday: 7:00 AM - 11:30 PM'}
                    </p>
                    <p className="text-gray-600">
                      {language === 'ar' ? 'الخميس - الجمعة: 7:00 ص - 12:30 ص' : 'Thursday - Friday: 7:00 AM - 12:30 AM'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Package className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {language === 'ar' ? 'الحد الأدنى للطلب' : 'Minimum Order'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'الحد الأدنى للطلب 20 ريال عماني. للطلبات أقل من 20 ريال عماني، يُضاف رسم إضافي 4 ريال عماني.'
                        : 'Minimum order is 20 OMR. For orders under 20 OMR, an additional fee of 4 OMR applies.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CreditCard className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'نقبل الدفع بالبطاقات الائتمانية، مدى، أبل باي، الدفع عند التسليم (نقداً).'
                        : 'We accept credit cards, Mada, Apple Pay, and cash on delivery.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-2">
                      {language === 'ar' ? 'تأخير التوصيل' : 'Delivery Delays'}
                    </h3>
                    <p className="text-red-700">
                      {language === 'ar' 
                        ? 'في حالة تأخير التوصيل أكثر من 15 دقيقة عن الوقت المحدد، سنقوم بالتواصل معك وتقديم خصم 20% على طلبك التالي.'
                        : 'If delivery is delayed more than 15 minutes from the estimated time, we will contact you and offer a 20% discount on your next order.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Truck className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {language === 'ar' ? 'تتبع الطلب' : 'Order Tracking'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يمكنك تتبع طلبك مباشرة من خلال التطبيق أو الموقع. ستصلك إشعارات عند كل مرحلة من مراحل التحضير والتوصيل.'
                        : 'You can track your order directly through the app or website. You will receive notifications at each stage of preparation and delivery.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {language === 'ar' ? 'دقة العنوان' : 'Address Accuracy'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يرجى التأكد من دقة العنوان ورقم الهاتف. أي تأخير بسبب عنوان خاطئ لن نتحمل مسؤوليته.'
                        : 'Please ensure address and phone number accuracy. We are not responsible for delays due to incorrect addresses.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Services */}
      <div className="py-16 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'خدمات خاصة' : 'Special Services'}
          </h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'توصيل سريع' : 'Express Delivery'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar' 
                  ? 'توصيل في 15 دقيقة مقابل رسوم إضافية 8 ريال عماني'
                  : 'Delivery in 15 minutes for an additional 8 OMR'
                }
              </p>
              <div className="text-green-600 font-semibold">+8 {language === 'ar' ? 'ريال عماني' : 'OMR'}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'تغليف فاخر' : 'Premium Packaging'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar' 
                  ? 'تغليف فاخر للمناسبات الخاصة والهدايا'
                  : 'Premium packaging for special occasions and gifts'
                }
              </p>
              <div className="text-purple-600 font-semibold">+6 {language === 'ar' ? 'ريال عماني' : 'OMR'}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'طلب مجدول' : 'Scheduled Order'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar' 
                  ? 'احجز طلبك لوقت محدد حتى 3 أيام مقدماً'
                  : 'Schedule your order up to 3 days in advance'
                }
              </p>
              <div className="text-blue-600 font-semibold">{language === 'ar' ? 'مجاني' : 'Free'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact for Delivery */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {language === 'ar' ? 'هل لديك استفسار حول التوصيل؟' : 'Have a Delivery Question?'}
            </h2>
            <p className="text-gray-600 mb-8">
              {language === 'ar' 
                ? 'فريق خدمة العملاء متاح للإجابة على جميع استفساراتك حول التوصيل'
                : 'Our customer service team is available to answer all your delivery questions'
              }
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-2">
                  {language === 'ar' ? 'خدمة عملاء التوصيل' : 'Delivery Support'}
                </h3>
                <p className="text-amber-700">+966 11 123 4567</p>
                <p className="text-amber-600 text-sm mt-1">
                  {language === 'ar' ? 'متاح 24/7' : 'Available 24/7'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-2">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </h3>
                <p className="text-amber-700">delivery@spirithub.cafe</p>
                <p className="text-amber-600 text-sm mt-1">
                  {language === 'ar' ? 'رد خلال ساعة' : 'Response within 1 hour'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};