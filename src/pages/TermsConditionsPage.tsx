import React from 'react';
import { useApp } from '../hooks/useApp';
import { FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';

export const TermsConditionsPage: React.FC = () => {
  const { language } = useApp();

  const sections = [
    {
      icon: CheckCircle,
      title: language === 'ar' ? 'قبول الشروط' : 'Acceptance of Terms',
      content: language === 'ar' 
        ? 'باستخدام موقعنا الإلكتروني أو تطبيقنا أو زيارة مقهانا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا.'
        : 'By using our website, app, or visiting our café, you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use our services.'
    },
    {
      icon: FileText,
      title: language === 'ar' ? 'الخدمات المقدمة' : 'Services Provided',
      content: language === 'ar' 
        ? 'نحن نقدم خدمات المقهى التي تشمل المشروبات الساخنة والباردة، الحلويات، الوجبات الخفيفة، خدمة الطلب عبر الإنترنت، وخدمة التوصيل. قد نقوم بتعديل أو إيقاف أي من هذه الخدمات دون إشعار مسبق.'
        : 'We provide café services including hot and cold beverages, desserts, light meals, online ordering, and delivery services. We may modify or discontinue any of these services without prior notice.'
    },
    {
      icon: Scale,
      title: language === 'ar' ? 'الأسعار والدفع' : 'Pricing and Payment',
      content: language === 'ar' 
        ? 'جميع الأسعار معروضة بالريال العُماني وتشمل الضريبة المضافة. نحتفظ بالحق في تغيير الأسعار في أي وقت. الدفع مطلوب عند الطلب أو عند الاستلام للطلبات النقدية.'
        : 'All prices are displayed in Omani Rials and include VAT. We reserve the right to change prices at any time. Payment is required upon ordering or upon delivery for cash orders.'
    },
    {
      icon: AlertTriangle,
      title: language === 'ar' ? 'المسؤولية' : 'Liability',
      content: language === 'ar' 
        ? 'نحن نبذل قصارى جهدنا لضمان جودة منتجاتنا وخدماتنا، لكننا لا نتحمل المسؤولية عن أي أضرار غير مباشرة أو عرضية. في حالة وجود أي مشكلة، يرجى التواصل معنا فوراً.'
        : 'We strive to ensure the quality of our products and services, but we are not liable for any indirect or incidental damages. In case of any issues, please contact us immediately.'
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-r from-amber-900 to-orange-800 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <FileText className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-white mb-4">
              {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed">
              {language === 'ar' 
                ? 'الشروط والأحكام التي تحكم استخدام خدمات مقهى سبيريت هب'
                : 'Terms and conditions governing the use of Spirit Hub Café services'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="mb-12 text-center">
              <p className="text-lg text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'تم تحديث هذه الشروط آخر مرة في 31 أكتوبر 2025. تسري هذه الشروط على جميع العملاء والمستخدمين.'
                  : 'These terms were last updated on October 31, 2025. These terms apply to all customers and users.'
                }
              </p>
            </div>

            {/* Main Sections */}
            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-8 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full p-3 flex-shrink-0">
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
                      <p className="text-gray-600 leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Terms */}
            <div className="mt-16 space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'سياسة الإلغاء والاسترداد' : 'Cancellation and Refund Policy'}
                </h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-amber-500 pl-6">
                    <h3 className="text-lg font-semibold text-amber-700 mb-2">
                      {language === 'ar' ? 'الطلبات عبر الإنترنت' : 'Online Orders'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يمكن إلغاء الطلبات خلال 5 دقائق من التأكيد. بعد بدء التحضير، لا يمكن الإلغاء إلا في حالات استثنائية.'
                        : 'Orders can be cancelled within 5 minutes of confirmation. After preparation begins, cancellation is only possible in exceptional cases.'
                      }
                    </p>
                  </div>
                  <div className="border-l-4 border-amber-500 pl-6">
                    <h3 className="text-lg font-semibold text-amber-700 mb-2">
                      {language === 'ar' ? 'سياسة الاسترداد' : 'Refund Policy'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'الاسترداد متاح في حالة وجود عيب في المنتج أو خطأ في الطلب. يتم الاسترداد خلال 3-5 أيام عمل.'
                        : 'Refunds are available in case of product defects or order errors. Refunds are processed within 3-5 business days.'
                      }
                    </p>
                  </div>
                  <div className="border-l-4 border-amber-500 pl-6">
                    <h3 className="text-lg font-semibold text-amber-700 mb-2">
                      {language === 'ar' ? 'رسوم التوصيل' : 'Delivery Fees'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'رسوم التوصيل غير قابلة للاسترداد إلا في حالة إلغاء الطلب من قبلنا أو تأخير التوصيل أكثر من ساعة.'
                        : 'Delivery fees are non-refundable except when orders are cancelled by us or delivery is delayed more than one hour.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'استخدام الموقع والتطبيق' : 'Website and App Usage'}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3">
                      {language === 'ar' ? 'الاستخدام المسموح' : 'Permitted Use'}
                    </h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• {language === 'ar' ? 'تصفح المنتجات وتقديم الطلبات' : 'Browse products and place orders'}</li>
                      <li>• {language === 'ar' ? 'إنشاء حساب شخصي' : 'Create personal account'}</li>
                      <li>• {language === 'ar' ? 'تتبع حالة الطلبات' : 'Track order status'}</li>
                      <li>• {language === 'ar' ? 'التواصل مع خدمة العملاء' : 'Contact customer service'}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3">
                      {language === 'ar' ? 'الاستخدام المحظور' : 'Prohibited Use'}
                    </h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• {language === 'ar' ? 'إساءة استخدام النظام' : 'System abuse'}</li>
                      <li>• {language === 'ar' ? 'إنشاء حسابات وهمية' : 'Create fake accounts'}</li>
                      <li>• {language === 'ar' ? 'نشر محتوى غير لائق' : 'Post inappropriate content'}</li>
                      <li>• {language === 'ar' ? 'محاولة اختراق النظام' : 'Attempt system hacking'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'معلومات الحساسية والحمية' : 'Allergy and Dietary Information'}
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">
                        {language === 'ar' ? 'تنبيه هام' : 'Important Notice'}
                      </h3>
                      <p className="text-red-700 text-sm">
                        {language === 'ar' 
                          ? 'يرجى إبلاغنا بأي حساسية غذائية عند تقديم الطلب. لا نضمن عدم التلوث المتقاطع مع المواد المسببة للحساسية.'
                          : 'Please inform us of any food allergies when placing your order. We cannot guarantee the absence of cross-contamination with allergens.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'مسببات الحساسية الشائعة' : 'Common Allergens'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'الحليب، المكسرات، الجلوتين' : 'Milk, nuts, gluten'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'خيارات نباتية' : 'Vegan Options'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'متوفرة وموضحة في القائمة' : 'Available and marked in menu'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'خالي من الجلوتين' : 'Gluten-Free'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'خيارات محدودة متاحة' : 'Limited options available'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'التواصل والشكاوى' : 'Contact and Complaints'}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {language === 'ar' 
                    ? 'إذا كانت لديك أي أسئلة حول هذه الشروط أو أي شكوى، يرجى التواصل معنا:'
                    : 'If you have any questions about these terms or any complaints, please contact us:'
                  }
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </h4>
                    <p className="text-amber-700 text-sm">legal@spirithub.cafe</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'الهاتف' : 'Phone'}
                    </h4>
                    <p className="text-amber-700 text-sm">+966 11 123 4567</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'العنوان' : 'Address'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'الرياض، السعودية' : 'Riyadh, Saudi Arabia'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};