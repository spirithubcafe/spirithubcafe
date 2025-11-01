import React from 'react';
import { useApp } from '../hooks/useApp';
import { Truck, Clock, MapPin, Package, AlertCircle, CheckCircle, Mail, Phone } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { motion } from 'framer-motion';

export const DeliveryPolicyPage: React.FC = () => {
  const { language } = useApp();

  const sections = [
    {
      id: 'processing',
      icon: Clock,
      title: language === 'ar' ? '1. وقت معالجة الطلب' : '1. Order Processing Time',
      content: language === 'ar'
        ? 'تتم معالجة الطلبات خلال 1-2 يوم عمل بعد تأكيد الدفع. أيام العمل لا تشمل عطلات نهاية الأسبوع والعطلات الرسمية. خلال مواسم الذروة أو العروض الترويجية، قد تكون أوقات معالجة الطلبات أطول قليلاً.'
        : 'Orders are processed within 1-2 business days after payment confirmation. Business days exclude weekends and public holidays. During peak seasons or promotions, order processing times may be slightly extended.'
    },
    {
      id: 'methods',
      icon: Truck,
      title: language === 'ar' ? '2. طرق الشحن' : '2. Shipping Methods',
      content: language === 'ar'
        ? 'نقدم خيارات شحن متعددة عند الدفع، بما في ذلك الشحن القياسي والشحن السريع. يتم حساب تكاليف الشحن بناءً على طريقة الشحن المختارة والوجهة والوزن الإجمالي للطلب.'
        : 'We offer multiple shipping options at checkout, including standard and expedited shipping. Shipping costs are calculated based on the shipping method selected, destination, and the total weight of the order.'
    },
    {
      id: 'destinations',
      icon: MapPin,
      title: language === 'ar' ? '3. وجهات الشحن' : '3. Shipping Destinations',
      content: language === 'ar'
        ? 'نقوم حالياً بالشحن فقط إلى دول مجلس التعاون الخليجي. نعمل باستمرار على توسيع تغطية الشحن لدينا للوصول إلى المزيد من العملاء.'
        : 'We currently only ship to GCC countries. We are continuously working to expand our shipping coverage to reach more customers.'
    },
    {
      id: 'delivery-times',
      icon: Clock,
      title: language === 'ar' ? '4. أوقات التسليم المقدرة' : '4. Estimated Delivery Times',
      content: language === 'ar'
        ? 'تختلف أوقات التسليم المقدرة بناءً على طريقة الشحن والوجهة. عادة ما يستغرق الشحن القياسي 3-5 أيام عمل، بينما يتم التسليم السريع خلال 1-2 يوم عمل. يرجى ملاحظة أن العوامل الخارجية مثل التخليص الجمركي أو الظروف الجوية أو الظروف غير المتوقعة قد تؤثر على أوقات التسليم.'
        : 'Estimated delivery times vary based on the shipping method and destination. Standard shipping usually takes 3-5 business days, while expedited shipping delivers within 1-2 business days. Please note that external factors like customs clearance, weather conditions, or unforeseen circumstances may impact delivery times.'
    },
    {
      id: 'tracking',
      icon: Package,
      title: language === 'ar' ? '5. تتبع الطلب' : '5. Order Tracking',
      content: language === 'ar'
        ? 'بمجرد شحن طلبك، ستتلقى رسالة بريد إلكتروني تأكيد الشحن تحتوي على رقم التتبع. يمكنك تتبع حالة شحنتك عن طريق إدخال رقم التتبع المقدم على موقعنا الإلكتروني أو موقع شركة الشحن.'
        : 'Once your order is shipped, you will receive a shipping confirmation email with a tracking number. You can track the status of your shipment by entering the provided tracking number on our website or the carrier\'s website.'
    },
    {
      id: 'issues',
      icon: AlertCircle,
      title: language === 'ar' ? '6. مشاكل التسليم' : '6. Delivery Issues',
      content: language === 'ar'
        ? 'إذا تأخر طلبك أو واجهت أي مشاكل في التسليم، يرجى الاتصال بدعم العملاء لدينا على الفور. سنساعدك في تتبع طلبك وحل أي مخاوف.'
        : 'If your order is delayed or you experience any delivery issues, please contact our customer support immediately. We will assist you in tracking your order and resolving any concerns.'
    },
    {
      id: 'undeliverable',
      icon: AlertCircle,
      title: language === 'ar' ? '7. الطرود غير القابلة للتسليم' : '7. Undeliverable Packages',
      content: language === 'ar'
        ? 'من مسؤولية العميل تقديم معلومات شحن دقيقة وكاملة أثناء الدفع. إذا تم إرجاع الطرد إلينا كغير قابل للتسليم بسبب عنوان غير صحيح، سيكون العميل مسؤولاً عن رسوم الشحن الإضافية لإعادة إرسال الطرد.'
        : 'It is the customer\'s responsibility to provide accurate and complete shipping information during checkout. If a package is returned to us as undeliverable due to an incorrect address, the customer will be responsible for additional shipping charges to resend the package.'
    },
    {
      id: 'international',
      icon: MapPin,
      title: language === 'ar' ? '8. الشحن الدولي' : '8. International Shipping',
      content: language === 'ar'
        ? 'بالنسبة للطلبات الدولية إلى عُمان، يكون العملاء مسؤولين عن أي رسوم جمركية أو ضرائب أو رسوم تفرضها الدولة المقصد.'
        : 'For international orders to Oman, customers are responsible for any customs duties, taxes, or fees imposed by the destination country.'
    },
    {
      id: 'updates',
      icon: CheckCircle,
      title: language === 'ar' ? '9. تحديثات الشحن' : '9. Shipping Updates',
      content: language === 'ar'
        ? 'سنبقيك على اطلاع بحالة طلبك من خلال تحديثات منتظمة عبر البريد الإلكتروني، بما في ذلك تأكيد الطلب وتتبع الشحن وتأكيد التسليم.'
        : 'We will keep you informed about your order\'s status with regular email updates, including order confirmation, shipment tracking, and delivery confirmation.'
    }
  ];

 

  return (
    <div className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Page Header */}
      <PageHeader
        title="Delivery Policy"
        titleAr="سياسة التوصيل"
        subtitle="We deliver the finest coffee and desserts right to your door"
        subtitleAr="نوصل لك أجود أنواع القهوة والحلويات إلى باب منزلك"
      />

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <p className="text-lg text-gray-700 leading-relaxed">
                {language === 'ar'
                  ? 'شكراً لاختيارك مقهى Spirit Hub لاحتياجاتك من القهوة. يرجى قضاء لحظة لمراجعة سياسة الشحن لدينا لفهم كيفية معالجة وتسليم طلباتك.'
                  : 'Thank you for choosing Spirithub Cafe for your coffee needs. Please take a moment to review our shipping policy to understand how we handle the processing and delivery of your orders.'}
              </p>
            </motion.div>

            {/* Policy Sections */}
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-stone-700 to-stone-900 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {section.title}
                      </h2>
                      <p className="text-gray-700 leading-relaxed text-justify">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl shadow-2xl p-8 text-white"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">
                  {language === 'ar' ? 'لديك أسئلة حول الشحن؟' : 'Have Questions About Shipping?'}
                </h2>
                <p className="text-stone-200 mb-6">
                  {language === 'ar'
                    ? 'نقدر عملك في مقهى Spirit Hub. إذا كان لديك أي أسئلة أو مخاوف بشأن سياسة الشحن لدينا، فلا تتردد في التواصل مع فريق دعم العملاء لدينا. رضاك هو أولويتنا، ونحن ملتزمون بضمان تسليم طلباتك في الوقت المناسب وبكفاءة.'
                    : 'We appreciate your business at Spirithub Cafe. Should you have any questions or concerns regarding our shipping policy, feel free to reach out to our customer support team. Your satisfaction is our priority, and we are committed to ensuring your orders are delivered in a timely and efficient manner.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Mail className="w-5 h-5" />
                  <a href="mailto:info@spirithubcafe.com" className="hover:text-white transition-colors text-lg">
                    info@spirithubcafe.com
                  </a>
                </div>
                <div className="flex items-center justify-center gap-3 mt-3">
                  <Phone className="w-5 h-5" />
                  <a href="tel:+96872726999" className="hover:text-white transition-colors text-lg">
                    +968 7272 6999
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Last Updated */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-center text-gray-600 text-sm"
            >
              <p>
                {language === 'ar' ? 'آخر تحديث: نوفمبر 2025' : 'Last updated: November 2025'}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
         