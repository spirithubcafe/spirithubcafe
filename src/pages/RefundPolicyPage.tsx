import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { RotateCcw, Package, AlertTriangle, RefreshCw, Clock, Mail, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { motion } from 'framer-motion';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const RefundPolicyPage: React.FC = () => {
  const { language } = useApp();
  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'سياسة الاستبدال والاسترجاع',
            description: 'تعلم كيف تتعامل سبيريت هب كافيه مع المرتجعات، الاستبدالات، والطلبات التالفة.',
          }
        : {
            title: 'Refund & return policy',
            description: 'Learn how Spirit Hub Cafe handles returns, exchanges, and damaged orders.',
          },
    [language]
  );

  const sections = [
    {
      id: 'overview',
      icon: RotateCcw,
      title: language === 'ar' ? 'نظرة عامة' : 'Overview',
      content: language === 'ar'
        ? 'لدينا سياسة إرجاع لمدة 30 يوماً، مما يعني أن لديك 30 يوماً بعد استلام العنصر الخاص بك لطلب الإرجاع. لكي يكون مؤهلاً للإرجاع، يجب أن يكون العنصر الخاص بك في نفس الحالة التي استلمته بها، غير مستخدم أو غير ملبوس، مع العلامات، وفي عبوته الأصلية. ستحتاج أيضاً إلى الإيصال أو إثبات الشراء.'
        : 'We have a 30-day return policy, which means you have 30 days after receiving your item to request a return. To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You\'ll also need the receipt or proof of purchase.'
    },
    {
      id: 'start-return',
      icon: Mail,
      title: language === 'ar' ? 'بدء الإرجاع' : 'Starting a Return',
      content: language === 'ar'
        ? 'لبدء الإرجاع، يمكنك الاتصال بنا على info@spirithubcafe.com. إذا تم قبول إرجاعك، سنرسل لك ملصق شحن الإرجاع، بالإضافة إلى تعليمات حول كيفية ومكان إرسال الطرد الخاص بك. لن يتم قبول العناصر المرسلة إلينا دون طلب إرجاع أولاً. يمكنك دائماً الاتصال بنا لأي سؤال حول الإرجاع على info@spirithubcafe.com.'
        : 'To start a return, you can contact us at info@spirithubcafe.com. If your return is accepted, we\'ll send you a return shipping label, as well as instructions on how and where to send your package. Items sent back to us without first requesting a return will not be accepted. You can always contact us for any return question at info@spirithubcafe.com.'
    },
    {
      id: 'damages',
      icon: AlertTriangle,
      title: language === 'ar' ? 'الأضرار والمشاكل' : 'Damages and Issues',
      content: language === 'ar'
        ? 'يرجى فحص طلبك عند الاستلام والاتصال بنا على الفور إذا كان العنصر معيباً أو تالفاً أو إذا تلقيت عنصراً خاطئاً، حتى نتمكن من تقييم المشكلة وحلها بشكل صحيح.'
        : 'Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.'
    },
    {
      id: 'exceptions',
      icon: XCircle,
      title: language === 'ar' ? 'الاستثناءات / العناصر غير القابلة للإرجاع' : 'Exceptions / Non-returnable Items',
      content: language === 'ar'
        ? 'لا يمكن إرجاع أنواع معينة من العناصر، مثل السلع القابلة للتلف (مثل الطعام أو الزهور أو النباتات)، والمنتجات المخصصة (مثل الطلبات الخاصة أو العناصر الشخصية)، ومنتجات العناية الشخصية (مثل منتجات التجميل). كما أننا لا نقبل إرجاع المواد الخطرة أو السوائل القابلة للاشتعال أو الغازات. يرجى الاتصال بنا إذا كانت لديك أسئلة أو مخاوف بشأن عنصر معين. للأسف، لا يمكننا قبول الإرجاع على عناصر التخفيض أو بطاقات الهدايا.'
        : 'Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item. Unfortunately, we cannot accept returns on sale items or gift cards.'
    },
    {
      id: 'exchanges',
      icon: RefreshCw,
      title: language === 'ar' ? 'التبديل' : 'Exchanges',
      content: language === 'ar'
        ? 'أسرع طريقة لضمان حصولك على ما تريد هي إرجاع العنصر الذي لديك، وبمجرد قبول الإرجاع، قم بعملية شراء منفصلة للعنصر الجديد.'
        : 'The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.'
    },
    {
      id: 'eu-cooling',
      icon: Clock,
      title: language === 'ar' ? 'فترة التهدئة لمدة 14 يوماً في الاتحاد الأوروبي' : 'European Union 14 Day Cooling Off Period',
      content: language === 'ar'
        ? 'على الرغم من ما سبق، إذا كانت البضائع يتم شحنها إلى الاتحاد الأوروبي، فلديك الحق في إلغاء أو إرجاع طلبك خلال 14 يوماً، لأي سبب ودون تبرير. كما هو موضح أعلاه، يجب أن يكون العنصر الخاص بك في نفس الحالة التي استلمته بها، غير مستخدم أو غير ملبوس، مع العلامات، وفي عبوته الأصلية. ستحتاج أيضاً إلى الإيصال أو إثبات الشراء.'
        : 'Notwithstanding the above, if the merchandise is being shipped into the European Union, you have the right to cancel or return your order within 14 days, for any reason and without a justification. As above, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You\'ll also need the receipt or proof of purchase.'
    },
    {
      id: 'refunds',
      icon: CheckCircle,
      title: language === 'ar' ? 'المبالغ المستردة' : 'Refunds',
      content: language === 'ar'
        ? 'سنخطرك بمجرد استلامنا وفحص إرجاعك، وسنعلمك إذا تمت الموافقة على الاسترداد أم لا. إذا تمت الموافقة، سيتم استرداد المبلغ تلقائياً إلى طريقة الدفع الأصلية الخاصة بك خلال 10 أيام عمل. يرجى تذكر أنه قد يستغرق بعض الوقت حتى يقوم البنك أو شركة بطاقة الائتمان الخاصة بك بمعالجة ونشر الاسترداد أيضاً. إذا مرت أكثر من 15 يوم عمل منذ أن وافقنا على إرجاعك، يرجى الاتصال بنا على info@spirithubcafe.com.'
        : 'We will notify you once we\'ve received and inspected your return, and let you know if the refund was approved or not. If approved, you\'ll be automatically refunded on your original payment method within 10 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too. If more than 15 business days have passed since we\'ve approved your return, please contact us at info@spirithubcafe.com.'
    }
  ];

  const returnConditions = [
    {
      icon: CheckCircle,
      title: language === 'ar' ? 'العناصر القابلة للإرجاع' : 'Returnable Items',
      items: language === 'ar' 
        ? ['منتجات غير مستخدمة', 'في العبوة الأصلية', 'مع العلامات الأصلية', 'مع إثبات الشراء']
        : ['Unused products', 'In original packaging', 'With original tags', 'With proof of purchase']
    },
    {
      icon: XCircle,
      title: language === 'ar' ? 'العناصر غير القابلة للإرجاع' : 'Non-returnable Items',
      items: language === 'ar'
        ? ['السلع القابلة للتلف', 'المنتجات المخصصة', 'منتجات العناية الشخصية', 'عناصر التخفيض', 'بطاقات الهدايا']
        : ['Perishable goods', 'Custom products', 'Personal care items', 'Sale items', 'Gift cards']
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
        keywords={['Spirit Hub Cafe refund', 'سياسة الاسترجاع سبيريت هب']}
        canonical={`${siteMetadata.baseUrl}/refund`}
        type="article"
      />
      {/* Page Header */}
      <PageHeader
        title="Refund Policy"
        titleAr="سياسة الاسترداد"
        subtitle="Our commitment to your satisfaction - easy returns and refunds"
        subtitleAr="التزامنا برضاك - إرجاع واسترداد سهل"
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

            {/* Return Conditions Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {returnConditions.map((condition, idx) => {
                const IconComponent = condition.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        idx === 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          idx === 0 ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {condition.title}
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {condition.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3">
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            idx === 0 ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                {language === 'ar' ? 'عملية الاسترداد' : 'Refund Process Timeline'}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-stone-700 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'ar' ? 'طلب الإرجاع (يوم 0)' : 'Request Return (Day 0)'}
                    </h3>
                    <p className="text-gray-700">
                      {language === 'ar'
                        ? 'اتصل بنا على info@spirithubcafe.com لبدء عملية الإرجاع'
                        : 'Contact us at info@spirithubcafe.com to initiate the return process'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-stone-700 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'ar' ? 'الموافقة والشحن (1-2 أيام)' : 'Approval & Shipping (1-2 days)'}
                    </h3>
                    <p className="text-gray-700">
                      {language === 'ar'
                        ? 'استلم ملصق الشحن وأرسل العنصر إلينا'
                        : 'Receive shipping label and send the item back to us'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-stone-700 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'ar' ? 'الفحص (3-5 أيام)' : 'Inspection (3-5 days)'}
                    </h3>
                    <p className="text-gray-700">
                      {language === 'ar'
                        ? 'نفحص العنصر ونوافق على الاسترداد'
                        : 'We inspect the item and approve the refund'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-stone-700 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'ar' ? 'الاسترداد (10 أيام عمل)' : 'Refund (10 business days)'}
                    </h3>
                    <p className="text-gray-700">
                      {language === 'ar'
                        ? 'يتم استرداد المبلغ إلى طريقة الدفع الأصلية'
                        : 'Amount is refunded to your original payment method'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl shadow-2xl p-8 text-white"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">
                    {language === 'ar' ? 'هل لديك أسئلة حول الإرجاع؟' : 'Have Questions About Returns?'}
                  </h2>
                  <p className="text-stone-200 mb-4">
                    {language === 'ar'
                      ? 'فريقنا هنا لمساعدتك في أي استفسارات تتعلق بالإرجاع أو الاسترداد.'
                      : 'Our team is here to help you with any return or refund inquiries.'}
                  </p>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <a href="mailto:info@spirithubcafe.com" className="hover:text-white transition-colors text-lg">
                      info@spirithubcafe.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Last Updated */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
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
