import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { FileText, CheckCircle, ShoppingCart, Truck, RotateCcw, Copyright, Shield, Scale, Mail, Phone, Globe } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { motion } from 'framer-motion';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const TermsConditionsPage: React.FC = () => {
  const { language } = useApp();
  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'الشروط والأحكام',
            description:
              'تعرف على شروط استخدام موقع سبيريت هب كافيه وسياسات الطلب والشحن والمرتجعات.',
          }
        : {
            title: 'Terms & conditions',
            description:
              'Review Spirit Hub Cafe’s terms for ordering, shipping, refunds, and site usage.',
          },
    [language]
  );

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'TermsAndConditions',
      url: `${siteMetadata.baseUrl}/terms`,
      inLanguage: language === 'ar' ? 'ar' : 'en',
      description: seoCopy.description,
    }),
    [language, seoCopy.description]
  );

  const sections = [
    {
      id: 'welcome',
      icon: FileText,
      title: language === 'ar' ? 'مرحباً بك في SPIRITHUB' : 'Welcome to SPIRITHUB',
      content: language === 'ar'
        ? 'قبل أن تبدأ رحلتك عبر عالم حبوب البن الرائع لدينا، يرجى أخذ لحظة للتعرف على الشروط والأحكام الخاصة بنا. باستخدام موقعنا الإلكتروني، فإنك توافق على الالتزام بالشروط التالية. إذا كنت لا توافق على هذه الشروط، يرجى الامتناع عن استخدام موقعنا.'
        : 'Welcome to SPIRITHUB! Before you embark on a journey through the delightful world of our coffee beans, please take a moment to familiarize yourself with our Terms and Conditions. By accessing or using our website, you agree to comply with and be bound by the following terms. If you do not agree with these terms, please refrain from using our website.'
    },
    {
      id: 'general',
      icon: CheckCircle,
      title: language === 'ar' ? '1. عام' : '1. General',
      content: language === 'ar'
        ? 'أ. قبول الشروط: باستخدام موقعنا الإلكتروني، فإنك توافق على الالتزام بهذه الشروط والأحكام. ب. قيود العمر: يجب أن تكون 18 عاماً أو أكبر لإجراء عمليات شراء على موقعنا. ج. دقة المعلومات: نسعى جاهدين لتقديم معلومات دقيقة ومحدثة، لكننا لا نستطيع ضمان اكتمال أو دقة المحتوى.'
        : 'a. Acceptance of Terms: By using our website, you agree to be bound by these Terms and Conditions. b. Age Restriction: You must be 18 years or older to make purchases on our website. c. Accuracy of Information: We strive to provide accurate and up-to-date information, but we cannot guarantee the completeness or accuracy of the content.'
    },
    {
      id: 'ordering',
      icon: ShoppingCart,
      title: language === 'ar' ? '2. الطلب والدفع' : '2. Ordering and Payment',
      content: language === 'ar'
        ? 'أ. تأكيد الطلب: بعد تقديم الطلب، ستتلقى رسالة بريد إلكتروني للتأكيد. هذا بمثابة إقرار بطلبك ولكنه لا يشكل قبولاً. ب. التسعير: الأسعار عرضة للتغيير دون إشعار. نحتفظ بالحق في رفض أو إلغاء أي طلب وفقاً لتقديرنا. ج. الدفع: تتم معالجة جميع المدفوعات بشكل آمن. نحن لا نخزن تفاصيل بطاقة الائتمان ولا نشارك معلومات العملاء مع أطراف ثالثة.'
        : 'a. Order Confirmation: After placing an order, you will receive an email confirmation. This serves as acknowledgment of your order but does not constitute acceptance. b. Pricing: Prices are subject to change without notice. We reserve the right to refuse or cancel any order at our discretion. c. Payment: All payments are processed securely. We do not store credit card details and do not share customer information with third parties.'
    },
    {
      id: 'shipping',
      icon: Truck,
      title: language === 'ar' ? '3. الشحن والتوصيل' : '3. Shipping and Delivery',
      content: language === 'ar'
        ? 'أ. رسوم الشحن: يتم احتساب رسوم الشحن عند الخروج وهي مسؤولية العميل. ب. أوقات التسليم: بينما نبذل قصارى جهدنا لضمان التسليم في الوقت المناسب، فإننا لسنا مسؤولين عن التأخير الناجم عن شركات الشحن الخارجية. ج. الطلبات الدولية: العملاء مسؤولون عن أي رسوم جمركية أو ضرائب مرتبطة بالطلبات الدولية.'
        : 'a. Shipping Fees: Shipping fees are calculated at checkout and are the responsibility of the customer. b. Delivery Times: While we make every effort to ensure timely delivery, we are not responsible for delays caused by third-party shipping carriers. c. International Orders: Customers are responsible for any customs fees or taxes associated with international orders.'
    },
    {
      id: 'returns',
      icon: RotateCcw,
      title: language === 'ar' ? '4. الإرجاع والاسترداد' : '4. Returns and Refunds',
      content: language === 'ar'
        ? 'أ. سياسة الإرجاع: إذا لم تكن راضياً عن عملية الشراء، يرجى الرجوع إلى سياسة الإرجاع الخاصة بنا للحصول على معلومات حول الإرجاع والاستبدال. ب. عملية الاسترداد: سيتم معالجة المبالغ المستردة وفقاً لسياسة الإرجاع الخاصة بنا.'
        : 'a. Returns Policy: If you are not satisfied with your purchase, please refer to our Returns Policy for information on returns and exchanges. b. Refund Process: Refunds will be processed in accordance with our Returns Policy.'
    },
    {
      id: 'intellectual',
      icon: Copyright,
      title: language === 'ar' ? '5. الملكية الفكرية' : '5. Intellectual Property',
      content: language === 'ar'
        ? 'أ. حقوق النشر: جميع المحتويات على موقعنا هي ملك لـ SPIRITHUB ROASTERY ومحمية بموجب قوانين حقوق النشر. ب. العلامات التجارية: جميع العلامات التجارية وعلامات الخدمة والأسماء التجارية هي ملك لـ SPIRITHUB ROASTERY.'
        : 'a. Copyright: All content on our website is the property of SPIRITHUB ROASTERY and is protected by copyright laws. b. Trademarks: All trademarks, service marks, and trade names are the property of SPIRITHUB ROASTERY.'
    },
    {
      id: 'privacy',
      icon: Shield,
      title: language === 'ar' ? '6. سياسة الخصوصية' : '6. Privacy Policy',
      content: language === 'ar'
        ? 'أ. الخصوصية: تحدد سياسة الخصوصية الخاصة بنا كيفية جمع واستخدام وحماية معلوماتك الشخصية. ب. ملفات تعريف الارتباط: باستخدام موقعنا، فإنك توافق على استخدام ملفات تعريف الارتباط وفقاً لسياسة ملفات تعريف الارتباط الخاصة بنا.'
        : 'a. Privacy: Our Privacy Policy outlines how we collect, use, and protect your personal information. b. Cookies: By using our website, you consent to the use of cookies in accordance with our Cookie Policy.'
    },
    {
      id: 'governing',
      icon: Scale,
      title: language === 'ar' ? '7. القانون الحاكم' : '7. Governing Law',
      content: language === 'ar'
        ? 'تخضع هذه الشروط والأحكام وتفسر وفقاً لقوانين سلطنة عُمان. ستخضع أي نزاعات للاختصاص الحصري لمحاكم سلطنة عُمان.'
        : 'These Terms and Conditions are governed by and construed in accordance with the laws of the Sultanate of Oman. Any disputes will be subject to the exclusive jurisdiction of the courts of the Sultanate of Oman.'
    }
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      <Seo
        title={seoCopy.title}
        description={seoCopy.description}
        keywords={['Spirit Hub Cafe terms', 'الشروط والأحكام سبيريت هب']}
        canonical={`${siteMetadata.baseUrl}/terms`}
        structuredData={structuredData}
      />
      {/* Page Header */}
      <PageHeader
        title="Terms & Conditions"
        titleAr="الشروط والأحكام"
        subtitle="Terms and conditions governing the use of Spirit Hub Café services"
        subtitleAr="الشروط والأحكام التي تحكم استخدام خدمات مقهى سبيريت هب"
      />

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
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

            {/* Closing Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl shadow-2xl p-8 text-white text-center"
            >
              <h2 className="text-2xl font-bold mb-4">
                {language === 'ar' ? 'شكراً لاختيارك SPIRITHUB' : 'Thank You for Choosing SPIRITHUB'}
              </h2>
              <p className="text-stone-200 mb-6">
                {language === 'ar'
                  ? 'شكراً لاختيارك SPIRITHUB لاحتياجاتك من حبوب البن! نأمل أن تستمتع بتجربة القهوة معنا. إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في الاتصال بنا.'
                  : 'Thank you for choosing SPIRITHUB for your coffee bean needs! We hope you enjoy your coffee experience with us. If you have any questions or concerns, please don\'t hesitate to contact us.'}
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
            </motion.div>

            {/* Related Policies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {language === 'ar' ? 'سياسات ذات صلة' : 'Related Policies'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Link
                  to="/privacy"
                  className="group p-6 rounded-xl border-2 border-gray-200 hover:border-amber-600 transition-all duration-300"
                >
                  <Shield className="w-10 h-10 text-amber-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600">
                    {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {language === 'ar'
                      ? 'تعرف على كيفية حماية معلوماتك الشخصية'
                      : 'Learn how we protect your personal information'}
                  </p>
                </Link>
                <Link
                  to="/refund"
                  className="group p-6 rounded-xl border-2 border-gray-200 hover:border-amber-600 transition-all duration-300"
                >
                  <RotateCcw className="w-10 h-10 text-amber-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600">
                    {language === 'ar' ? 'سياسة الاسترداد' : 'Refund Policy'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {language === 'ar'
                      ? 'معرفة كيفية التعامل مع الإرجاع والاستبدال'
                      : 'Understand our returns and exchanges process'}
                  </p>
                </Link>
                <Link
                  to="/delivery"
                  className="group p-6 rounded-xl border-2 border-gray-200 hover:border-amber-600 transition-all duration-300"
                >
                  <Globe className="w-10 h-10 text-amber-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600">
                    {language === 'ar' ? 'سياسة التوصيل' : 'Delivery Policy'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {language === 'ar'
                      ? 'تحقق من جداول الشحن وخيارات التسليم'
                      : 'Check shipping schedules and delivery options'}
                  </p>
                </Link>
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
              
