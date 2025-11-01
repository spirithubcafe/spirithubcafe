import React from 'react';
import { useApp } from '../hooks/useApp';
import { Shield, Lock, Eye, UserCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useApp();

  const sections = [
    {
      icon: Shield,
      title: language === 'ar' ? 'التزامنا بالخصوصية' : 'Our Privacy Commitment',
      content: language === 'ar' 
        ? 'نحن في مقهى سبيريت هب نلتزم بحماية خصوصية عملائنا وضمان أمان بياناتهم الشخصية. هذه السياسة توضح كيفية جمع واستخدام وحماية المعلومات التي نحصل عليها.'
        : 'At Spirit Hub Café, we are committed to protecting our customers\' privacy and ensuring the security of their personal data. This policy explains how we collect, use, and protect the information we obtain.'
    },
    {
      icon: Eye,
      title: language === 'ar' ? 'المعلومات التي نجمعها' : 'Information We Collect',
      content: language === 'ar' 
        ? 'نقوم بجمع المعلومات التالية: الاسم، البريد الإلكتروني، رقم الهاتف، عنوان التوصيل، تفضيلات الطعام والمشروبات، تاريخ الطلبات، وبيانات الدفع (بشكل مشفر).'
        : 'We collect the following information: name, email address, phone number, delivery address, food and beverage preferences, order history, and payment data (encrypted).'
    },
    {
      icon: UserCheck,
      title: language === 'ar' ? 'استخدام المعلومات' : 'Use of Information',
      content: language === 'ar' 
        ? 'نستخدم معلوماتك لتحسين خدماتنا، معالجة الطلبات، التواصل معك، إرسال العروض الخاصة، وضمان أمان موقعنا الإلكتروني وتطبيقنا.'
        : 'We use your information to improve our services, process orders, communicate with you, send special offers, and ensure the security of our website and application.'
    },
    {
      icon: Lock,
      title: language === 'ar' ? 'حماية البيانات' : 'Data Protection',
      content: language === 'ar' 
        ? 'نستخدم أحدث تقنيات التشفير والحماية لضمان أمان بياناتك. لا نشارك معلوماتك مع أطراف ثالثة دون موافقتك الصريحة.'
        : 'We use the latest encryption and protection technologies to ensure your data security. We do not share your information with third parties without your explicit consent.'
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Page Header */}
      <PageHeader
        title="Privacy Policy"
        titleAr="سياسة الخصوصية"
        subtitle="We respect your privacy and are committed to protecting your personal data"
        subtitleAr="نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية"
      />

      {/* Main Content */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="mb-12 text-center">
              <p className="text-lg text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'تم تحديث هذه السياسة آخر مرة في 31 أكتوبر 2025. نوصي بمراجعتها دورياً للاطلاع على أي تحديثات.'
                  : 'This policy was last updated on October 31, 2025. We recommend reviewing it periodically for any updates.'
                }
              </p>
            </div>

            {/* Policy Sections */}
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

            {/* Detailed Sections */}
            <div className="mt-16 space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'حقوقك كعميل' : 'Your Rights as a Customer'}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3">
                      {language === 'ar' ? 'الحق في الوصول' : 'Right to Access'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يحق لك طلب نسخة من جميع البيانات الشخصية التي نحتفظ بها عنك.'
                        : 'You have the right to request a copy of all personal data we hold about you.'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3">
                      {language === 'ar' ? 'الحق في التصحيح' : 'Right to Correction'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يمكنك طلب تصحيح أي معلومات غير صحيحة أو غير مكتملة.'
                        : 'You can request correction of any incorrect or incomplete information.'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3">
                      {language === 'ar' ? 'الحق في الحذف' : 'Right to Deletion'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يمكنك طلب حذف بياناتك الشخصية في ظروف معينة.'
                        : 'You can request deletion of your personal data under certain circumstances.'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700 mb-3">
                      {language === 'ar' ? 'الحق في النقل' : 'Right to Portability'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'ar' 
                        ? 'يمكنك طلب نقل بياناتك إلى مزود خدمة آخر.'
                        : 'You can request to transfer your data to another service provider.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'ملفات تعريف الارتباط' : 'Cookies'}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {language === 'ar' 
                    ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. هذه الملفات تساعدنا على فهم كيفية استخدامك للموقع وتخصيص المحتوى وفقاً لتفضيلاتك.'
                    : 'We use cookies to improve your experience on our website. These files help us understand how you use the site and customize content according to your preferences.'
                  }
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'ملفات أساسية' : 'Essential Cookies'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'ضرورية لعمل الموقع' : 'Necessary for website function'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'ملفات تحليلية' : 'Analytics Cookies'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'لتحليل الاستخدام والأداء' : 'For usage and performance analysis'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'ملفات تسويقية' : 'Marketing Cookies'}
                    </h4>
                    <p className="text-amber-700 text-sm">
                      {language === 'ar' ? 'لتخصيص الإعلانات' : 'For personalized advertising'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'التواصل معنا' : 'Contact Us'}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {language === 'ar' 
                    ? 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية أو تريد ممارسة حقوقك، يرجى التواصل معنا:'
                    : 'If you have any questions about this privacy policy or want to exercise your rights, please contact us:'
                  }
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-amber-50 rounded-lg p-6">
                    <h3 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </h3>
                    <p className="text-amber-700">privacy@spirithub.cafe</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-6">
                    <h3 className="font-semibold text-amber-800 mb-2">
                      {language === 'ar' ? 'الهاتف' : 'Phone'}
                    </h3>
                    <p className="text-amber-700">+966 11 123 4567</p>
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