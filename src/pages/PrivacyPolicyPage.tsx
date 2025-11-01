import React from 'react';
import { useApp } from '../hooks/useApp';
import { Shield, Lock, Eye, UserCheck, Cookie, Users, Globe, FileText, Mail, Phone } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { motion } from 'framer-motion';

export const PrivacyPolicyPage: React.FC = () => {
  const { language } = useApp();

  const sections = [
    {
      id: 'introduction',
      icon: Shield,
      title: language === 'ar' ? 'مقدمة' : 'Introduction',
      content: language === 'ar'
        ? 'تصف سياسة الخصوصية هذه كيفية قيام SPIRITHUB ROASTERY ("الموقع" أو "نحن" أو "خاصتنا") بجمع واستخدام والكشف عن معلوماتك الشخصية عند زيارة خدماتنا أو استخدامها أو إجراء عملية شراء من spirithubcafe.com ("الموقع") أو التواصل معنا بطريقة أخرى (بشكل جماعي، "الخدمات"). لأغراض سياسة الخصوصية هذه، "أنت" و"خاصتك" تعني أنت كمستخدم للخدمات، سواء كنت عميلاً أو زائراً للموقع أو فرداً آخر تم جمع معلوماته وفقاً لسياسة الخصوصية هذه.'
        : 'This Privacy Policy describes how SPIRITHUB ROASTERY (the "Site", "we", "us", or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from spirithubcafe.com (the "Site") or otherwise communicate with us (collectively, the "Services"). For purposes of this Privacy Policy, "you" and "your" means you as the user of the Services, whether you are a customer, website visitor, or another individual whose information we have collected pursuant to this Privacy Policy.'
    },
    {
      id: 'agreement',
      icon: FileText,
      title: language === 'ar' ? 'الموافقة على السياسة' : 'Agreement to Policy',
      content: language === 'ar'
        ? 'يرجى قراءة سياسة الخصوصية هذه بعناية. باستخدام والوصول إلى أي من الخدمات، فإنك توافق على جمع واستخدام والكشف عن معلوماتك كما هو موضح في سياسة الخصوصية هذه. إذا كنت لا توافق على سياسة الخصوصية هذه، يرجى عدم استخدام أو الوصول إلى أي من الخدمات.'
        : 'Please read this Privacy Policy carefully. By using and accessing any of the Services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or access any of the Services.'
    },
    {
      id: 'changes',
      icon: FileText,
      title: language === 'ar' ? 'التغييرات على سياسة الخصوصية' : 'Changes to This Privacy Policy',
      content: language === 'ar'
        ? 'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر، بما في ذلك لتعكس التغييرات في ممارساتنا أو لأسباب تشغيلية أو قانونية أو تنظيمية أخرى. سننشر سياسة الخصوصية المنقحة على الموقع، ونحدث تاريخ "آخر تحديث" ونتخذ أي خطوات أخرى مطلوبة بموجب القانون المعمول به.'
        : 'We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site, update the "Last updated" date and take any other steps required by applicable law.'
    },
    {
      id: 'collection',
      icon: Eye,
      title: language === 'ar' ? 'كيف نجمع ونستخدم معلوماتك الشخصية' : 'How We Collect and Use Your Personal Information',
      content: language === 'ar'
        ? 'لتقديم الخدمات، نقوم بجمع معلومات شخصية عنك من مجموعة متنوعة من المصادر. تختلف المعلومات التي نجمعها ونستخدمها اعتماداً على كيفية تفاعلك معنا. بالإضافة إلى الاستخدامات المحددة المذكورة أدناه، قد نستخدم المعلومات التي نجمعها عنك للتواصل معك، وتقديم الخدمات، والامتثال لأي التزامات قانونية معمول بها، وإنفاذ أي شروط خدمة معمول بها، وحماية أو الدفاع عن الخدمات وحقوقنا وحقوق مستخدمينا أو الآخرين.'
        : 'To provide the Services, we collect and have collected over the past 12 months personal information about you from a variety of sources, as set out below. The information that we collect and use varies depending on how you interact with us. In addition to the specific uses set out below, we may use information we collect about you to communicate with you, provide the Services, comply with any applicable legal obligations, enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.'
    },
    {
      id: 'direct-info',
      icon: UserCheck,
      title: language === 'ar' ? 'المعلومات التي نجمعها مباشرة منك' : 'Information We Collect Directly from You',
      content: language === 'ar'
        ? 'قد تتضمن المعلومات التي ترسلها مباشرة من خلال خدماتنا: تفاصيل الاتصال الأساسية بما في ذلك الاسم والعنوان ورقم الهاتف والبريد الإلكتروني. معلومات الطلب بما في ذلك الاسم وعنوان الفواتير وعنوان الشحن وتأكيد الدفع والبريد الإلكتروني ورقم الهاتف. معلومات الحساب بما في ذلك اسم المستخدم وكلمة المرور وأسئلة الأمان. معلومات التسوق بما في ذلك العناصر التي تشاهدها وتضعها في عربة التسوق أو تضيفها إلى قائمة الرغبات. معلومات دعم العملاء بما في ذلك المعلومات التي تختار تضمينها في الاتصالات معنا.'
        : 'Information that you directly submit to us through our Services may include: Basic contact details including your name, address, phone number, email. Order information including your name, billing address, shipping address, payment confirmation, email address, phone number. Account information including your username, password, security questions. Shopping information including the items you view, put in your cart or add to your wishlist. Customer support information including the information you choose to include in communications with us.'
    },
    {
      id: 'cookies',
      icon: Cookie,
      title: language === 'ar' ? 'المعلومات التي نجمعها من خلال ملفات تعريف الارتباط' : 'Information We Collect through Cookies',
      content: language === 'ar'
        ? 'نجمع أيضاً تلقائياً معلومات معينة حول تفاعلك مع الخدمات ("بيانات الاستخدام"). للقيام بذلك، قد نستخدم ملفات تعريف الارتباط والبكسلات والتقنيات المماثلة ("ملفات تعريف الارتباط"). قد تتضمن بيانات الاستخدام معلومات حول كيفية الوصول إلى موقعنا واستخدامه وحسابك، بما في ذلك معلومات الجهاز ومعلومات المتصفح ومعلومات حول اتصال الشبكة وعنوان IP الخاص بك ومعلومات أخرى تتعلق بتفاعلك مع الخدمات. مثل العديد من المواقع، نستخدم ملفات تعريف الارتباط على موقعنا لتشغيل وتحسين موقعنا وخدماتنا بما في ذلك لتذكر إجراءاتك وتفضيلاتك.'
        : 'We also automatically collect certain information about your interaction with the Services ("Usage Data"). To do this, we may use cookies, pixels and similar technologies ("Cookies"). Usage Data may include information about how you access and use our Site and your account, including device information, browser information, information about your network connection, your IP address and other information regarding your interaction with the Services. Like many websites, we use Cookies on our Site. We use Cookies to power and improve our Site and our Services (including to remember your actions and preferences).'
    },
    {
      id: 'third-party-info',
      icon: Users,
      title: language === 'ar' ? 'المعلومات التي نحصل عليها من أطراف ثالثة' : 'Information We Obtain from Third Parties',
      content: language === 'ar'
        ? 'قد نحصل على معلومات عنك من أطراف ثالثة، بما في ذلك من البائعين ومقدمي الخدمات الذين قد يجمعون المعلومات نيابة عنا، مثل: الشركات التي تدعم موقعنا وخدماتنا، مثل WooCommerce. معالجات الدفع الخاصة بنا، الذين يجمعون معلومات الدفع (مثل الحساب المصرفي أو معلومات بطاقة الائتمان أو الخصم وعنوان الفواتير) لمعالجة دفعتك من أجل تنفيذ طلباتك وتزويدك بالمنتجات أو الخدمات التي طلبتها. أي معلومات نحصل عليها من أطراف ثالثة سيتم التعامل معها وفقاً لسياسة الخصوصية هذه.'
        : 'Finally, we may obtain information about you from third parties, including from vendors and service providers who may collect information on our behalf, such as: Companies who support our Site and Services, such as WooCommerce. Our payment processors, who collect payment information (e.g., bank account, credit or debit card information, billing address) to process your payment in order to fulfill your orders and provide you with products or services you have requested. Any information we obtain from third parties will be treated in accordance with this Privacy Policy.'
    },
    {
      id: 'use',
      icon: Shield,
      title: language === 'ar' ? 'كيف نستخدم معلوماتك الشخصية' : 'How We Use Your Personal Information',
      content: language === 'ar'
        ? 'تقديم المنتجات والخدمات: نستخدم معلوماتك الشخصية لتزويدك بالخدمات، بما في ذلك معالجة مدفوعاتك، وتنفيذ طلباتك، وإرسال إشعارات إليك تتعلق بحسابك ومشترياتك وإرجاعاتك وتبادلاتك أو المعاملات الأخرى. التسويق والإعلان: نستخدم معلوماتك الشخصية لأغراض التسويق والترويج، مثل إرسال اتصالات تسويقية وإعلانية وترويجية عبر البريد الإلكتروني أو الرسائل النصية أو البريد العادي وإظهار إعلانات المنتجات أو الخدمات. الأمان ومنع الاحتيال: نستخدم معلوماتك الشخصية للكشف عن النشاط الاحتيالي أو غير القانوني أو الضار المحتمل أو التحقيق فيه أو اتخاذ إجراء بشأنه. التواصل معك: نستخدم معلوماتك الشخصية لتزويدك بدعم العملاء وتحسين خدماتنا.'
        : 'Providing Products and Services: We use your personal information to provide you with the Services in order to perform our contract with you, including to process your payments, fulfill your orders, to send notifications to you related to your account, purchases, returns, exchanges or other transactions. Marketing and Advertising: We use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you advertisements for products or services. Security and Fraud Prevention: We use your personal information to detect, investigate or take action regarding possible fraudulent, illegal or malicious activity. Communicating with you: We use your personal information to provide you with customer support and improve our Services.'
    },
    {
      id: 'disclosure',
      icon: Users,
      title: language === 'ar' ? 'كيف نكشف عن المعلومات الشخصية' : 'How We Disclose Personal Information',
      content: language === 'ar'
        ? 'في ظروف معينة، قد نكشف عن معلوماتك الشخصية لأطراف ثالثة لأغراض مشروعة تخضع لسياسة الخصوصية هذه. قد تشمل هذه الظروف: مع البائعين أو أطراف ثالثة أخرى الذين يقدمون خدمات نيابة عنا (مثل إدارة تكنولوجيا المعلومات، ومعالجة الدفع، وتحليلات البيانات، ودعم العملاء، والتخزين السحابي، والتنفيذ والشحن). مع شركاء الأعمال والتسويق، بما في ذلك WooCommerce، لتقديم الخدمات والإعلان لك. عندما توجه أو تطلب منا أو توافق على الكشف عن معلومات معينة لأطراف ثالثة. مع الشركات التابعة لنا أو داخل مجموعتنا المؤسسية.'
        : 'In certain circumstances, we may disclose your personal information to third parties for legitimate purposes subject to this Privacy Policy. Such circumstances may include: With vendors or other third parties who perform services on our behalf (e.g., IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping). With business and marketing partners, including WooCommerce, to provide services and advertise to you. When you direct, request us or otherwise consent to our disclosure of certain information to third parties. With our affiliates or otherwise within our corporate group.'
    },
    {
      id: 'security',
      icon: Lock,
      title: language === 'ar' ? 'الأمان والاحتفاظ بمعلوماتك' : 'Security and Retention of Your Information',
      content: language === 'ar'
        ? 'يرجى العلم أنه لا توجد تدابير أمنية مثالية أو منيعة، ولا يمكننا ضمان "الأمان المثالي". بالإضافة إلى ذلك، قد لا تكون أي معلومات ترسلها إلينا آمنة أثناء النقل. نوصي بعدم استخدام القنوات غير الآمنة لتوصيل معلومات حساسة أو سرية لنا. تعتمد المدة التي نحتفظ فيها بمعلوماتك الشخصية على عوامل مختلفة، مثل ما إذا كنا بحاجة إلى المعلومات للحفاظ على حسابك، أو تقديم الخدمات، أو الامتثال للالتزامات القانونية، أو حل النزاعات أو إنفاذ العقود والسياسات الأخرى المعمول بها.'
        : 'Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee "perfect security." In addition, any information you send to us may not be secure while in transit. We recommend that you do not use unsecure channels to communicate sensitive or confidential information to us. How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide the Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.'
    },
    {
      id: 'rights',
      icon: UserCheck,
      title: language === 'ar' ? 'حقوقك وخياراتك' : 'Your Rights and Choices',
      content: language === 'ar'
        ? 'اعتماداً على المكان الذي تعيش فيه، قد يكون لديك بعض أو جميع الحقوق التالية فيما يتعلق بمعلوماتك الشخصية: حق الوصول/المعرفة - يمكنك طلب الوصول إلى المعلومات الشخصية التي نحتفظ بها عنك. حق الحذف - يمكنك طلب حذف المعلومات الشخصية التي نحتفظ بها عنك. حق التصحيح - يمكنك طلب تصحيح المعلومات الشخصية غير الدقيقة. حق النقل - يمكنك طلب الحصول على نسخة من معلوماتك الشخصية ونقلها إلى طرف ثالث. تقييد المعالجة - يمكنك طلب إيقاف أو تقييد معالجة معلوماتك الشخصية. سحب الموافقة - حيث نعتمد على الموافقة لمعالجة معلوماتك الشخصية، يمكنك سحب هذه الموافقة. لن نميز ضدك لممارسة أي من هذه الحقوق.'
        : 'Depending on where you live, you may have some or all of the rights listed below in relation to your personal information: Right to Access/Know - You may have a right to request access to personal information that we hold about you. Right to Delete - You may have a right to request that we delete personal information we maintain about you. Right to Correct - You may have a right to request that we correct inaccurate personal information we maintain about you. Right of Portability - You may have a right to receive a copy of the personal information we hold about you and to request that we transfer it to a third party. Restriction of Processing - You may have the right to ask us to stop or restrict our processing of personal information. Withdrawal of Consent - Where we rely on consent to process your personal information, you may have the right to withdraw this consent. We will not discriminate against you for exercising any of these rights.'
    },
    {
      id: 'children',
      icon: Shield,
      title: language === 'ar' ? 'بيانات الأطفال' : 'Children\'s Data',
      content: language === 'ar'
        ? 'لا تهدف الخدمات إلى استخدامها من قبل الأطفال، ولا نجمع عن قصد أي معلومات شخصية عن الأطفال. إذا كنت والد أو وصي طفل قدم لنا معلوماته الشخصية، يمكنك الاتصال بنا باستخدام تفاصيل الاتصال المذكورة أدناه لطلب حذفها. اعتباراً من تاريخ سريان سياسة الخصوصية هذه، ليس لدينا معرفة فعلية بأننا "نشارك" أو "نبيع" (كما هو محدد في القانون المعمول به) معلومات شخصية لأفراد تقل أعمارهم عن 16 عاماً.'
        : 'The Services are not intended to be used by children, and we do not knowingly collect any personal information about children. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted. As of the Effective Date of this Privacy Policy, we do not have actual knowledge that we "share" or "sell" (as those terms are defined in applicable law) personal information of individuals under 16 years of age.'
    },
    {
      id: 'international',
      icon: Globe,
      title: language === 'ar' ? 'المستخدمون الدوليون' : 'International Users',
      content: language === 'ar'
        ? 'يرجى ملاحظة أننا قد ننقل ونخزن ونعالج معلوماتك الشخصية خارج البلد الذي تعيش فيه، بما في ذلك الولايات المتحدة. تتم معالجة معلوماتك الشخصية أيضاً من قبل الموظفين ومقدمي الخدمات والشركاء الخارجيين في هذه البلدان. إذا قمنا بنقل معلوماتك الشخصية خارج أوروبا، فسنعتمد على آليات النقل المعترف بها مثل البنود التعاقدية القياسية للمفوضية الأوروبية.'
        : 'Please note that we may transfer, store and process your personal information outside the country you live in, including the United States. Your personal information is also processed by staff and third party service providers and partners in these countries. If we transfer your personal information out of Europe, we will rely on recognized transfer mechanisms like the European Commission\'s Standard Contractual Clauses.'
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
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
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
              transition={{ duration: 0.6, delay: 1.4 }}
              className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl shadow-2xl p-8 text-white"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">
                    {language === 'ar' ? 'اتصل بنا' : 'Contact'}
                  </h2>
                  <div className="space-y-3 text-stone-200">
                    <p>
                      {language === 'ar'
                        ? 'إذا كان لديك أي أسئلة حول ممارسات الخصوصية لدينا أو سياسة الخصوصية هذه، أو إذا كنت ترغب في ممارسة أي من الحقوق المتاحة لك:'
                        : 'Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you:'}
                    </p>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" />
                      <a href="tel:+96872726999" className="hover:text-white transition-colors">
                        +968 7272 6999
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <a href="mailto:info@spirithubcafe.com" className="hover:text-white transition-colors">
                        info@spirithubcafe.com
                      </a>
                    </div>
                    <p className="pt-2">
                      <strong>AL JALSA AL RAQIA LLC</strong><br />
                      Al Mouj Muscat, 121<br />
                      Seeb, Oman
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Last Updated */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.5 }}
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