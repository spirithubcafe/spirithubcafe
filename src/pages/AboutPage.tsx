import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { motion } from 'framer-motion';
import { Award, Coffee, Heart, Shield } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const { language } = useApp();
  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'عن سبيريت هب - محمصة القهوة المختصة الرائدة في عمان',
            description:
              'تعرف على قصة سبيريت هب كافيه، محمصة القهوة المختصة في مسقط. فريق من خبراء Q Graders المعتمدين، مصادر حبوب قهوة عالية الجودة من المزارع المستدامة، تحميص حرفي يومي، وبناء مجتمع قهوة نابض بالحياة في عمان.',
          }
        : {
            title: 'About Spirit Hub Cafe - Muscat\'s Specialty Coffee Experts',
            description:
              'Learn about Spirit Hub Cafe, Muscat\'s premier specialty coffee roastery. Q Grader certified experts, sustainably sourced high-elevation beans, artisan daily roasting, and building Oman\'s vibrant coffee community since our founding.',
          },
    [language]
  );

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url: `${siteMetadata.baseUrl}/about`,
      name: seoCopy.title,
      description: seoCopy.description,
      inLanguage: language === 'ar' ? 'ar' : 'en',
    }),
    [language, seoCopy.description, seoCopy.title]
  );

  const sections = [
    {
      id: 'mission',
      title: 'Our Commitment to Quality',
      titleAr: 'التزامنا بالجودة',
      subtitle: 'OUR MISSION',
      subtitleAr: 'مهمتنا',
      content: (
        <>
          At SPIRIT HUB Coffee, we take great care in selecting only the finest specialty coffees to be part of our exclusive blend. Our team of experienced{' '}
          <a 
            href="https://sca.coffee/research/protocols-best-practices" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-700 underline transition-colors"
          >
            Q Graders
          </a>{' '}
          and Roasters carefully manage each roast to create a unique selection of flavors and aromas designed to delight even the most discerning coffee lovers.
          {'\n\n'}
          We believe that quality is paramount, which is why we strictly adhere to the highest protocols and quality controls during cupping and testing. This ensures that every cup of SPIRIT HUB Coffee meets our high standards and delivers a truly exceptional taste experience.
          {'\n\n'}
          Our commitment extends beyond the coffee itself. We are dedicated to providing our customers with the best possible service and experience. Whether you are enjoying a cup at one of our cafés or brewing a fresh pot at home, we want you to be completely satisfied with your SPIRIT HUB Coffee journey.
          {'\n\n'}
          In short, at SPIRIT HUB Coffee, we are passionate about coffee and devoted to offering only the finest experiences. We invite you to{' '}
          <Link 
            to="/products" 
            className="text-amber-600 hover:text-amber-700 underline transition-colors"
          >
            explore our exclusive selection
          </Link>{' '}
          and taste the difference for yourself.
        </>
      ),
      contentAr: `في سبيريت هب للقهوة، نولي اهتماماً كبيراً باختيار أجود أنواع القهوة المتخصصة فقط لتكون جزءاً من مزيجنا الحصري. يدير فريقنا من المتذوقين والمحمصين ذوي الخبرة كل عملية تحميص بعناية لإنشاء مجموعة فريدة من النكهات والروائح المصممة لإسعاد حتى أكثر محبي القهوة تميزاً.

نؤمن بأن الجودة هي الأهم، ولهذا السبب نلتزم بشدة بأعلى البروتوكولات وضوابط الجودة أثناء التذوق والاختبار. هذا يضمن أن كل فنجان من قهوة سبيريت هب يلبي معاييرنا العالية ويقدم تجربة طعم استثنائية حقاً.

يمتد التزامنا إلى ما هو أبعد من القهوة نفسها. نحن ملتزمون بتزويد عملائنا بأفضل خدمة وتجربة ممكنة. سواء كنت تستمتع بفنجان في أحد مقاهينا أو تحضر إبريقاً طازجاً في المنزل، نريدك أن تكون راضياً تماماً عن رحلتك مع قهوة سبيريت هب.

باختصار، في سبيريت هب للقهوة، نحن شغوفون بالقهوة ومكرسون لتقديم أفضل التجارب فقط. ندعوك لتجربة مزيجنا الحصري وتذوق الفرق بنفسك.`,
      image: '/images/about/1.webp',
      imagePosition: 'right' as const,
      icon: Award,
    },
    {
      id: 'quality',
      title: 'The Art of Coffee',
      titleAr: 'فن القهوة',
      subtitle: 'QUALITY',
      subtitleAr: 'الجودة',
      content: `Coffee, a beloved beverage worldwide, is enjoyed by millions every day. Its flavor and aroma depend on key factors such as the bean type, roasting method, and brewing process.

Many roasters ensure the highest standards by closely following harvesting seasons. This allows them to select the freshest, highest-quality beans, which are then carefully roasted to highlight their unique flavors and aromas.

The roasting process is considered an art. Skilled roasters control temperature, time, and airflow to craft the perfect roast profile and bring out the best characteristics in each batch of beans.

After roasting, coffee beans naturally contain high levels of CO2, which can affect flavor and aroma. To allow this gas to dissipate and the flavors to fully develop, it is recommended that coffee rests for 7 to 10 days before brewing.

By following these steps, roasters produce exceptional coffee rich in flavor and aroma. So when you savor your next cup, take a moment to appreciate the care, craft, and dedication behind that perfect brew.`,
      contentAr: `القهوة، المشروب المحبوب في جميع أنحاء العالم، يستمتع بها الملايين كل يوم. يعتمد طعمها ورائحتها على عوامل رئيسية مثل نوع الحبوب وطريقة التحميص وعملية التحضير.

يضمن العديد من المحمصين أعلى المعايير من خلال متابعة مواسم الحصاد عن كثب. يتيح لهم ذلك اختيار أحدث الحبوب وأعلى جودة، والتي يتم تحميصها بعناية لإبراز نكهاتها وروائحها الفريدة.

تعتبر عملية التحميص فناً. يتحكم المحمصون المهرة في درجة الحرارة والوقت وتدفق الهواء لصياغة ملف التحميص المثالي وإخراج أفضل الخصائص في كل دفعة من الحبوب.

بعد التحميص، تحتوي حبوب القهوة بشكل طبيعي على مستويات عالية من ثاني أكسيد الكربون، والتي يمكن أن تؤثر على النكهة والرائحة. للسماح لهذا الغاز بالتبدد وتطوير النكهات بالكامل، يوصى بأن تستريح القهوة لمدة 7 إلى 10 أيام قبل التحضير.

من خلال اتباع هذه الخطوات، ينتج المحمصون قهوة استثنائية غنية بالنكهة والرائحة. لذلك عندما تتذوق فنجانك التالي، خذ لحظة لتقدير العناية والحرفة والتفاني وراء هذا المشروب المثالي.`,
      image: '/images/about/2.webp',
      imagePosition: 'left' as const,
      icon: Coffee,
    },
    {
      id: 'accountability',
      title: 'Accountability and Transparency',
      titleAr: 'المساءلة والشفافية',
      subtitle: 'ACCOUNTABILITY',
      subtitleAr: 'المساءلة',
      content: (
        <>
          Accountability and transparency are crucial for building trust and maintaining a positive reputation in business. At SPIRIT HUB Coffee, we take pride in sharing information and educating our community, customers, and clients about our unique coffee.
          {'\n\n'}
          By sharing this information, we aim to create openness and trust, fostering strong and lasting relationships with our audience. Excitingly, we publish details about our coffee on various media platforms, such as our website, social media, and newsletter.
          {'\n\n'}
          Moreover, our commitment extends beyond information sharing to being accountable for our actions and decisions. This entails taking responsibility for the quality of our coffee, as well as addressing our environmental and social impact.
          {'\n\n'}
          Transparent and accountable practices enable us to build a positive reputation and nurture long-term relationships with our customers and clients. Proudly presenting SPIRIT HUB Coffee to the world, we eagerly anticipate sharing our unique coffee with the community. Have questions or want to learn more?{' '}
          <Link 
            to="/contact" 
            className="text-amber-600 hover:text-amber-700 underline transition-colors"
          >
            Get in touch with us
          </Link>
          .
        </>
      ),
      contentAr: `المساءلة والشفافية أمران بالغا الأهمية لبناء الثقة والحفاظ على سمعة إيجابية في الأعمال. في سبيريت هب للقهوة، نفخر بمشاركة المعلومات وتثقيف مجتمعنا وعملائنا وعملائنا حول قهوتنا الفريدة.

من خلال مشاركة هذه المعلومات، نهدف إلى خلق الانفتاح والثقة، وتعزيز العلاقات القوية والدائمة مع جمهورنا. بحماس، ننشر تفاصيل حول قهوتنا على منصات إعلامية مختلفة، مثل موقعنا الإلكتروني ووسائل التواصل الاجتماعي والنشرة الإخبارية.

علاوة على ذلك، يمتد التزامنا إلى ما هو أبعد من مشاركة المعلومات ليشمل المساءلة عن أفعالنا وقراراتنا. وهذا يستلزم تحمل المسؤولية عن جودة قهوتنا، بالإضافة إلى معالجة تأثيرنا البيئي والاجتماعي.

تمكننا الممارسات الشفافة والمسؤولة من بناء سمعة إيجابية ورعاية علاقات طويلة الأمد مع عملائنا وعملائنا. بفخر نقدم قهوة سبيريت هب للعالم، ونتطلع بشغف لمشاركة قهوتنا الفريدة مع المجتمع.`,
      image: '/images/about/3.webp',
      imagePosition: 'right' as const,
      icon: Shield,
    },
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
        keywords={['about Spirit Hub Cafe', 'coffee roastery story', 'قصة سبيريت هب']}
        structuredData={structuredData}
        type="article"
        canonical={`${siteMetadata.baseUrl}/about`}
      />
      {/* Page Header */}
      <PageHeader
        title="About Us"
        titleAr="من نحن"
        subtitle="Discover our story, passion, and commitment to exceptional coffee"
        subtitleAr="اكتشف قصتنا وشغفنا والتزامنا بالقهوة الاستثنائية"
      />

      <div className="container mx-auto px-4 py-16 space-y-24">
        {/* Section 1: Mission - Image Right */}
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            className={`flex flex-col ${
              section.imagePosition === 'right' 
                ? 'lg:flex-row' 
                : 'lg:flex-row-reverse'
            } gap-12 items-center`}
          >
            {/* Text Content */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-stone-700 to-stone-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-600 tracking-wider mb-1">
                    {language === 'ar' ? section.subtitleAr : section.subtitle}
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                    {language === 'ar' ? section.titleAr : section.title}
                  </h2>
                </div>
              </div>
              <div className="prose prose-lg max-w-none">
                {typeof (language === 'ar' ? section.contentAr : section.content) === 'string' ? (
                  ((language === 'ar' ? section.contentAr : section.content) as string)
                    .split('\n\n')
                    .map((paragraph: string, i: number) => (
                      <p key={i} className="text-gray-700 leading-relaxed text-justify mb-4">
                        {paragraph}
                      </p>
                    ))
                ) : (
                  <div className="text-gray-700 leading-relaxed text-justify space-y-4">
                    {language === 'ar' ? section.contentAr : section.content}
                  </div>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 + 0.2 }}
                className="relative rounded-3xl overflow-hidden shadow-2xl"
              >
                <img
                  src={section.image}
                  alt={language === 'ar' ? section.titleAr : section.title}
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Part 4: Values Box */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-3xl shadow-2xl p-12 text-white"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-center">
                {language === 'ar' ? 'قيمنا' : 'VALUES'}
              </h2>
            </div>
            
            <div className="text-center space-y-4">
              <h3 className="text-2xl lg:text-3xl font-bold">
                {language === 'ar' 
                  ? 'سبيريت هب للتحميص والقهوة المتخصصة' 
                  : 'SPIRIT HUB ROASTERY & SPECIALTY COFFEE'}
              </h3>
              <p className="text-lg text-stone-200">
                {language === 'ar'
                  ? 'تأسست في عُمان • تُدار محلياً • مستوحاة عالمياً'
                  : 'Established in Oman • Locally Operated • Globally Inspired'}
              </p>
            </div>

            <div className="prose prose-lg prose-invert max-w-none">
              {(language === 'ar' 
                ? `تأسست سبيريت هب للتحميص والقهوة المتخصصة في عُمان، وهي مكرسة لرفع مستوى تجربة القهوة لعملائها. مع التركيز القوي على القهوة المتخصصة، يسلط فريقنا الضوء على النكهات والروائح الفريدة لكل دفعة، مما يضمن أن كل فنجان يحكي قصة.

نحن نقدر بعمق العمل الشاق للمزارعين الذين يزرعون ويحصدون حبوبنا. من خلال إظهار تفانيهم، تعترف سبيريت هب بمساهماتهم الأساسية في صناعة القهوة العالمية.

يتجاوز شغفنا التقدير - نؤكد على علم القهوة. من دقة التحميص إلى إتقان التحضير، يتم دراسة كل خطوة بعناية لتقديم تجربة مميزة لا تُنسى.

كشركة تعمل حصرياً من قبل فريق عماني، تدعم سبيريت هب بفخر الاقتصاد المحلي والمجتمع، مما يساعد على تعزيز أساس القهوة المتخصصة في عُمان.

سبيريت هب أكثر من مجرد محمصة - إنها التزام بالجودة والاستدامة والمجتمع. كل فنجان يعكس التفاني في التميز، والمزارعين الذين يجعلون ذلك ممكناً، وروح عُمان.`
                : `Founded in Oman, SPIRIT HUB Roastery & Specialty Coffee is dedicated to elevating the coffee experience for its customers. With a strong focus on specialty coffee, our team highlights the unique flavors and aromas of each batch, ensuring every cup tells a story.

We deeply value the hard work of farmers who cultivate and harvest our beans. By showcasing their dedication, SPIRIT HUB recognizes their essential contributions to the global coffee industry.

Our passion goes beyond appreciation—we emphasize the science of coffee. From roasting precision to brewing mastery, every step is carefully studied to deliver a distinctive and memorable experience.

As a business exclusively operated by an Omani team, SPIRIT HUB proudly supports the local economy and community, helping strengthen the foundation of specialty coffee in Oman.

SPIRIT HUB is more than a roastery—it is a commitment to quality, sustainability, and community. Every cup reflects dedication to excellence, the farmers who make it possible, and the spirit of Oman.`
              ).split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-stone-100 leading-relaxed text-justify mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
     
