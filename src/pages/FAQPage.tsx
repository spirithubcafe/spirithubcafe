import React, { useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { PageHeader } from '../components/layout/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ShoppingCart, Package, RefreshCw, LogIn, Key, CreditCard } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

interface FAQItem {
  id: string;
  icon: React.ElementType;
  question: string;
  questionAr: string;
  answer: string[];
  answerAr: string[];
}

export const FAQPage: React.FC = () => {
  const { language } = useApp();
  const [openItems, setOpenItems] = useState<string[]>(['1']);
  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'الأسئلة الشائعة',
            description:
              'أجوبة واضحة حول الطلبات، الشحن، الحسابات، وطرق الدفع في سبيريت هب كافيه.',
          }
        : {
            title: 'Frequently asked questions',
            description:
              'Clear answers about ordering, shipping, accounts, and payments at Spirit Hub Cafe.',
          },
    [language]
  );

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const faqs: FAQItem[] = [
    {
      id: '1',
      icon: ShoppingCart,
      question: 'How to Place an Order',
      questionAr: 'كيفية تقديم طلب',
      answer: [
        'Visit our website and browse through our delightful selection of coffee products.',
        'Select your desired items and add them to your cart.',
        'Proceed to checkout, where you can review your order and provide necessary details.',
        'Complete the payment process to finalize your order.'
      ],
      answerAr: [
        'قم بزيارة موقعنا وتصفح مجموعتنا الرائعة من منتجات القهوة.',
        'اختر المنتجات المطلوبة وأضفها إلى سلة التسوق.',
        'انتقل إلى صفحة الدفع، حيث يمكنك مراجعة طلبك وتقديم التفاصيل اللازمة.',
        'أكمل عملية الدفع لإنهاء طلبك.'
      ]
    },
    {
      id: '2',
      icon: Package,
      question: 'How to Check Order Status',
      questionAr: 'كيفية التحقق من حالة الطلب',
      answer: [
        'Log in to your account on our website.',
        'Navigate to the "Order History" section to view the status of your recent and past orders.',
        'You will find detailed information, including order processing, shipping, and delivery status.'
      ],
      answerAr: [
        'قم بتسجيل الدخول إلى حسابك على موقعنا.',
        'انتقل إلى قسم "سجل الطلبات" لعرض حالة طلباتك الأخيرة والسابقة.',
        'ستجد معلومات تفصيلية، بما في ذلك معالجة الطلب وحالة الشحن والتسليم.'
      ]
    },
    {
      id: '3',
      icon: RefreshCw,
      question: 'How to Claim a Refund',
      questionAr: 'كيفية المطالبة باسترداد المبلغ',
      answer: [
        'In case of any issues with your order, contact our customer support within 30 days of receiving your order.',
        'Provide order details and a clear explanation of the issue.',
        'Our customer support team will guide you through the refund process.'
      ],
      answerAr: [
        'في حالة وجود أي مشاكل في طلبك، اتصل بفريق الدعم خلال 30 يومًا من استلام طلبك.',
        'قدم تفاصيل الطلب وشرحًا واضحًا للمشكلة.',
        'سيوجهك فريق الدعم خلال عملية الاسترداد.'
      ]
    },
    {
      id: '4',
      icon: LogIn,
      question: 'How to Login',
      questionAr: 'كيفية تسجيل الدخول',
      answer: [
        'Click on the "Login" or "Account" button on the top right corner of our website.',
        'Enter your registered email address and password.',
        'If you are a new user, you can sign up during the checkout process or by clicking the "Sign Up" link.'
      ],
      answerAr: [
        'انقر على زر "تسجيل الدخول" أو "الحساب" في الزاوية العلوية اليمنى من موقعنا.',
        'أدخل عنوان بريدك الإلكتروني المسجل وكلمة المرور.',
        'إذا كنت مستخدمًا جديدًا، يمكنك التسجيل أثناء عملية الدفع أو بالنقر على رابط "إنشاء حساب".'
      ]
    },
    {
      id: '5',
      icon: Key,
      question: 'How to Reset Password',
      questionAr: 'كيفية إعادة تعيين كلمة المرور',
      answer: [
        'On the login page, click on the "Forgot Password" or "Reset Password" link.',
        'Enter the email address associated with your account.',
        'Follow the instructions sent to your email to reset your password securely.'
      ],
      answerAr: [
        'في صفحة تسجيل الدخول، انقر على رابط "نسيت كلمة المرور" أو "إعادة تعيين كلمة المرور".',
        'أدخل عنوان البريد الإلكتروني المرتبط بحسابك.',
        'اتبع التعليمات المرسلة إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور بأمان.'
      ]
    },
    {
      id: '6',
      icon: CreditCard,
      question: 'Card Was Debited, But User Didn\'t Receive Order Receipt',
      questionAr: 'تم خصم المبلغ من البطاقة، لكن المستخدم لم يستلم إيصال الطلب',
      answer: [
        'Check your email, including the spam folder, for the order confirmation and receipt.',
        'Log in to your account and navigate to the "Order History" section to confirm the status and details of your order.',
        'If you still haven\'t received the receipt, please contact our customer support with your order details for assistance.'
      ],
      answerAr: [
        'تحقق من بريدك الإلكتروني، بما في ذلك مجلد البريد العشوائي، للحصول على تأكيد الطلب والإيصال.',
        'قم بتسجيل الدخول إلى حسابك وانتقل إلى قسم "سجل الطلبات" لتأكيد حالة وتفاصيل طلبك.',
        'إذا لم تستلم الإيصال بعد، يرجى الاتصال بفريق الدعم مع تفاصيل طلبك للحصول على المساعدة.'
      ]
    }
  ];

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: language === 'ar' ? faq.questionAr : faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: (language === 'ar' ? faq.answerAr : faq.answer).join('\n'),
        },
      })),
    }),
    [faqs, language]
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${
        language === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      <Seo
        title={seoCopy.title}
        description={seoCopy.description}
        keywords={['Spirit Hub Cafe FAQ', 'coffee order help', 'الأسئلة الشائعة سبيريت هب']}
        canonical={`${siteMetadata.baseUrl}/faq`}
        structuredData={structuredData}
      />
      {/* Page Header */}
      <PageHeader
        title="Frequently Asked Questions"
        titleAr="الأسئلة الشائعة"
        subtitle="Find answers to common questions about ordering, account management, and support"
        subtitleAr="اعثر على إجابات للأسئلة الشائعة حول الطلب وإدارة الحساب والدعم"
      />

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 text-center bg-white rounded-2xl shadow-xl p-8"
            >
              <HelpCircle className="w-16 h-16 text-stone-700 mx-auto mb-4" />
              <p className="text-lg text-gray-700 leading-relaxed">
                {language === 'ar' 
                  ? 'إذا كان لديك أي أسئلة أو مخاوف إضافية لم يتم تناولها في هذه الأسئلة الشائعة، فلا تتردد في التواصل مع فريق دعم العملاء لدينا من خلال قنوات الاتصال المتاحة. نسعى لضمان أن تكون تجربتك مع مقهى Spirit Hub سلسة وممتعة.'
                  : 'If you have any additional questions or concerns not addressed in this FAQ, feel free to reach out to our customer support team through the provided contact channels. We strive to ensure your experience with Spirit Hub Cafe is smooth and enjoyable.'}
              </p>
            </motion.div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openItems.includes(faq.id);
                const IconComponent = faq.icon;
                
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-stone-700 to-stone-900 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            Q{faq.id}: {language === 'ar' ? faq.questionAr : faq.question}
                          </h3>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-6 h-6 text-stone-600" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2">
                            <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl p-6">
                              <p className="font-semibold text-stone-900 mb-4">
                                A{faq.id}:
                              </p>
                              <div className="space-y-3">
                                {(language === 'ar' ? faq.answerAr : faq.answer).map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                                    className="flex items-start gap-3 text-gray-700"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 bg-stone-700 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="flex-1 leading-relaxed">{item}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Contact Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl shadow-2xl p-8 text-center text-white"
            >
              <h3 className="text-2xl font-bold mb-4">
                {language === 'ar' ? 'لا تزال بحاجة إلى مساعدة؟' : 'Still Need Help?'}
              </h3>
              <p className="text-stone-200 mb-6">
                {language === 'ar' 
                  ? 'فريق الدعم لدينا موجود دائمًا لمساعدتك. تواصل معنا!'
                  : 'Our support team is always here to help you. Get in touch!'}
              </p>
              <a
                href="/contact"
                className="inline-block bg-white text-stone-900 font-bold px-8 py-3 rounded-lg hover:bg-stone-100 transition-colors"
              >
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
