import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Coffee, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { Seo } from '../components/seo/Seo';
import { useApp } from '../hooks/useApp';
import { siteMetadata } from '../config/siteMetadata';

const BestSellers = lazy(() => import('@/components/sections/BestSellers').then((m) => ({ default: m.BestSellers })));
const SustainabilitySection = lazy(() => import('../components/sections/SustainabilitySection').then((m) => ({ default: m.SustainabilitySection })));
const FeaturedProducts = lazy(() => import('../components/sections/FeaturedProducts').then((m) => ({ default: m.FeaturedProducts })));
const CoffeeSelectionSection = lazy(() => import('../components/sections/CoffeeSelectionSection').then((m) => ({ default: m.CoffeeSelectionSection })));
const UnifiedCategoriesSection = lazy(() => import('../components/sections/UnifiedCategoriesSection').then((m) => ({ default: m.UnifiedCategoriesSection })));
const GoogleReviewsSection = lazy(() => import('@/components/sections/GoogleReviewsSection').then((m) => ({ default: m.GoogleReviewsSection })));
const InstagramSection = lazy(() => import('@/components/sections/InstagramSection').then((m) => ({ default: m.InstagramSection })));

const HomePage: React.FC = () => {
  const { language } = useApp();
  const location = useLocation();
  const [showProductSections, setShowProductSections] = useState(false);
  const [showCarouselSections, setShowCarouselSections] = useState(false);
  const carouselLoadRef = useRef<HTMLDivElement | null>(null);
  const regionPrefix = location.pathname.startsWith('/sa') ? '/sa' : '/om';

  useEffect(() => {
    const revealSections = () => setShowProductSections(true);

    if (typeof window === 'undefined') {
      return;
    }

    let idleId: number | null = null;
    const timeoutId = window.setTimeout(revealSections, 2500);

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number })
        .requestIdleCallback(revealSections, { timeout: 3000 });
    }

    return () => {
      window.clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || showCarouselSections) {
      return;
    }

    const revealCarousels = () => setShowCarouselSections(true);
    const timeoutId = window.setTimeout(revealCarousels, 15000);
    const target = carouselLoadRef.current;

    if (!target || !('IntersectionObserver' in window)) {
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          revealCarousels();
          observer.disconnect();
          window.clearTimeout(timeoutId);
        }
      },
      { rootMargin: '500px 0px' }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, [showCarouselSections]);

  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'قهوة مختصة طازجة في عمان والسعودية',
            description:
              'اطلب قهوة مختصة طازجة من سبيريت هب روستري، مع حبوب محمصة بعناية، قهوة فلتر، وكبسولات مختارة وتوصيل سريع في عمان والسعودية.',
          }
        : {
            title: 'Fresh Specialty Coffee in Oman & Saudi Arabia',
            description:
              'Shop fresh specialty coffee from SpiritHub Roastery, including roasted beans, filter coffee, and capsules with fast delivery across Oman and Saudi Arabia.',
          },
    [language]
  );

  const editorialCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            intro:
              'سبيريت هب روستري محمصة قهوة مختصة تخدم عملاء القهوة في عمان والسعودية بتجربة تجمع بين التحميص اليومي، الاختيار الدقيق للمحاصيل، والتوصيل السريع. نقدم حبوب قهوة طازجة، خيارات فلتر، وكبسولات مخصصة لعشاق الجودة والنكهات الواضحة.',
            about:
              'نركز في سبيريت هب على تقديم قهوة مختصة محمصة بعناية داخل المنطقة حتى يصل المنتج بأفضل نضارة ممكنة. نختار محاصيل مميزة من مزارع معروفة، ثم نبني لكل قهوة بروفايل تحميص يناسب الإسبريسو أو الفلتر أو الاستخدام اليومي في المنزل والمكتب.',
            collections:
              'يمكنك استكشاف تشكيلات تشمل القهوة المخصصة للإسبريسو، محاصيل سنجل أوريجن، أكياس الدريب، والكبسولات. كل مجموعة مصممة لتناسب تفضيلات مختلفة من حيث القوام، الحلاوة، والوضوح، مع وصف يساعدك على اختيار القهوة المناسبة بسهولة.',
            delivery:
              'نخدم العملاء في مسقط ومختلف مناطق عمان، كما نوصل إلى السعودية مع تجربة شراء واضحة وصفحات منتجات غنية بالمعلومات. هذا يساعد الزائر ومحركات البحث على فهم نوع المنتجات، طريقة الاستخدام، ومزايا كل صنف قبل الطلب.',
            whyTitle: 'لماذا يختار العملاء سبيريت هب؟',
            whyPoints: [
              'تحميص طازج ومراقبة دقيقة للجودة',
              'محاصيل مختارة ونكهات واضحة ومفصلة',
              'توصيل سريع داخل عمان والسعودية',
              'خيارات مناسبة للإسبريسو والفلتر والكبسولات',
            ],
            linksTitle: 'روابط مهمة داخل الموقع',
            links: [
              { label: 'تسوق جميع المنتجات', to: `${regionPrefix}/products` },
              { label: 'المتجر', to: `${regionPrefix}/shop` },
              { label: 'من نحن', to: `${regionPrefix}/about` },
              { label: 'الأسئلة الشائعة', to: `${regionPrefix}/faq` },
              { label: 'اتصل بنا', to: `${regionPrefix}/contact` },
            ],
            sections: {
              aboutTitle: 'عن سبيريت هب روستري',
              collectionTitle: 'تشكيلات القهوة المختصة',
              serviceTitle: 'التوصيل وتجربة التسوق',
            },
          }
        : {
            intro:
              'SpiritHub Roastery is a specialty coffee brand serving coffee drinkers across Oman and Saudi Arabia with fresh roasting, curated beans, and a refined online shopping experience. We focus on clean flavour profiles, transparent sourcing, and coffee collections built for everyday brewing as well as premium gifting.',
            about:
              'Our roastery works with carefully selected lots and roast profiles designed for espresso, filter coffee, and modern specialty coffee menus. By roasting locally and shipping quickly, we help customers enjoy fresher coffee with more clarity, sweetness, and consistency in every cup.',
            collections:
              'The collection includes roasted coffee beans, single-origin releases, espresso blends, drip bags, capsules, and seasonal highlights. Each product page is designed to explain origin, flavour notes, roast style, and how the coffee fits different brewing preferences so customers can choose with confidence.',
            delivery:
              'We support shoppers in Muscat and across Oman while also serving Saudi Arabia with a clear regional shopping flow, strong product information, and fast delivery. This gives both customers and search engines a better understanding of what we sell, who we serve, and why the brand is relevant in the regional specialty coffee market.',
            whyTitle: 'Why Choose SpiritHub Roastery?',
            whyPoints: [
              'Fresh local roasting for better flavour and consistency',
              'Curated specialty coffee from respected farms and producers',
              'Fast delivery across Oman and Saudi Arabia',
              'Coffee formats for espresso, filter, drip bags, and capsules',
            ],
            linksTitle: 'Explore More Inside SpiritHub',
            links: [
              { label: 'Shop all products', to: `${regionPrefix}/products` },
              { label: 'Browse the shop', to: `${regionPrefix}/shop` },
              { label: 'About the roastery', to: `${regionPrefix}/about` },
              { label: 'Read our FAQ', to: `${regionPrefix}/faq` },
              { label: 'Contact SpiritHub', to: `${regionPrefix}/contact` },
            ],
            sections: {
              aboutTitle: 'About SpiritHub Roastery',
              collectionTitle: 'Our Specialty Coffee Collection',
              serviceTitle: 'Delivery, Experience, and Regional Reach',
            },
          },
    [language, regionPrefix]
  );

  const homeFaqs = useMemo(
    () =>
      language === 'ar'
        ? [
            {
              id: 'hq1',
              question: 'ما أنواع القهوة المختصة التي تقدمها سبيريت هب روستري؟',
              answer:
                'تقدم سبيريت هب روستري مجموعة واسعة تشمل الحبوب المحمصة الطازجة، خلطات الإسبريسو، محاصيل السنجل أوريجن، أكياس الدريب، والكبسولات المتوافقة. جميع القهوات مختارة بعناية من مزارع موثوقة ومحمصة في عُمان للحصول على أقصى قدر من النضارة.',
            },
            {
              id: 'hq2',
              question: 'إلى أين توصل سبيريت هب القهوة المختصة؟',
              answer:
                'نوصل في جميع أنحاء عُمان بما في ذلك مسقط والمحافظات المجاورة، وكذلك إلى المملكة العربية السعودية. شحننا السريع يضمن وصول قهوتك طازجة تمامًا.',
            },
            {
              id: 'hq3',
              question: 'ما مدى نضارة قهوة سبيريت هب؟',
              answer:
                'تُحمَّص قهوتنا محلياً في عُمان وتُشحن عادةً خلال أيام من التحميص. نحمص بكميات صغيرة لضمان أفضل نكهة وعطر. نوصي بالتخمير خلال أربعة إلى ستة أسابيع من تاريخ التحميص.',
            },
            {
              id: 'hq4',
              question: 'ما أساليب التخمير المتاحة في سبيريت هب؟',
              answer:
                'نوفر قهوة لجميع طرق التخمير: ماكينات الإسبريسو، في-60 بور أوفر، إيروبريس، فرنش بريس، ماكينات الدريب، وأنظمة الكبسولات. تتضمن كل صفحة منتج أدلة التخمير الموصى بها.',
            },
          ]
        : [
            {
              id: 'hq1',
              question: 'What specialty coffee does SpiritHub Roastery offer?',
              answer:
                'SpiritHub Roastery offers freshly roasted whole beans, espresso blends, single-origin releases, drip bags, and compatible capsules. All coffees are carefully sourced from reputable farms and roasted in Oman for maximum freshness.',
            },
            {
              id: 'hq2',
              question: 'Where does SpiritHub deliver specialty coffee?',
              answer:
                'We deliver across Oman — including Muscat and all governorates — and to Saudi Arabia. Our fast shipping ensures your coffee arrives at peak freshness.',
            },
            {
              id: 'hq3',
              question: 'How fresh is the coffee from SpiritHub?',
              answer:
                'Coffee is roasted locally in Oman and typically shipped within days of roasting. We roast in small batches for the best possible flavour and aroma. We recommend brewing within four to six weeks of the roast date.',
            },
            {
              id: 'hq4',
              question: 'What brewing formats are available at SpiritHub?',
              answer:
                'We carry coffee for all major brewing methods: espresso machines, V60 pour-over, AeroPress, French press, drip machines, and capsule systems. Every product page includes recommended brew guides.',
            },
          ],
    [language]
  );

  const structuredData = useMemo(
    () => [
      // Organization Schema
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${siteMetadata.baseUrl}/#organization`,
        name: siteMetadata.siteName,
        url: siteMetadata.baseUrl,
        logo: `${siteMetadata.baseUrl}/images/logo/logo-light.png`,
        description: seoCopy.description,
        telephone: '+96891900005',
        dateModified: '2026-05-24',
        sameAs: [
          'https://instagram.com/spirithubcafe',
          'https://facebook.com/spirithubcafe',
          'https://api.whatsapp.com/send?phone=96891900005',
        ],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Al Mouj Street',
          addressLocality: 'Muscat',
          addressRegion: 'Muscat Governorate',
          postalCode: '133',
          addressCountry: 'OM',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 23.588,
          longitude: 58.3829,
        },
        priceRange: '$$',
        servesCuisine: 'Coffee',
        hasMap: 'https://maps.google.com/?q=23.588,58.3829',
      },
      // Local Business Schema
      {
        '@context': 'https://schema.org',
        '@type': 'CafeOrCoffeeShop',
        '@id': `${siteMetadata.baseUrl}/#cafe`,
        name: siteMetadata.siteName,
        url: siteMetadata.baseUrl,
        description: seoCopy.description,
        telephone: '+96891900005',
        image: `${siteMetadata.baseUrl}/images/icon-512x512.png`,
        dateModified: '2026-05-24',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Al Mouj Street',
          addressLocality: 'Muscat',
          addressCountry: 'OM',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 23.588,
          longitude: 58.3829,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            opens: '07:00',
            closes: '23:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Friday', 'Saturday'],
            opens: '08:00',
            closes: '23:30',
          },
        ],
        priceRange: '$$',
        servesCuisine: ['Coffee', 'Specialty Coffee', 'Espresso', 'Beverages'],
        paymentAccepted: 'Cash, Credit Card, Debit Card',
        currenciesAccepted: 'OMR',
      },
      // Website Schema
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${siteMetadata.baseUrl}/#website`,
        url: siteMetadata.baseUrl,
        name: siteMetadata.siteName,
        description: seoCopy.description,
        dateModified: '2026-05-24',
        publisher: {
          '@id': `${siteMetadata.baseUrl}/#organization`,
        },
        inLanguage: ['en', 'ar'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteMetadata.baseUrl}/products?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      // FAQPage Schema for homepage quick-answer FAQs
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        dateModified: '2026-05-24',
        mainEntity: homeFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
    [seoCopy.description, homeFaqs]
  );

  const editorialSections = useMemo(
    () => [
      {
        title: editorialCopy.sections.aboutTitle,
        body: editorialCopy.about,
        Icon: Coffee,
      },
      {
        title: editorialCopy.sections.collectionTitle,
        body: editorialCopy.collections,
        Icon: Compass,
      },
      {
        title: editorialCopy.sections.serviceTitle,
        body: editorialCopy.delivery,
        Icon: Truck,
      },
    ],
    [editorialCopy.about, editorialCopy.collections, editorialCopy.delivery, editorialCopy.sections.aboutTitle, editorialCopy.sections.collectionTitle, editorialCopy.sections.serviceTitle]
  );

  return (
    <>
      <Seo
        title={seoCopy.title}
        description={seoCopy.description}
        image="/logo.png"
        keywords={[
          'specialty coffee Oman',
          'coffee roastery Muscat',
          'Spirit Hub Cafe',
          'سبيريت هب',
          'قهوة مختصة',
        ]}
        structuredData={structuredData}
      />
      <AnnouncementBar />
      <ProfessionalHeroSlider />

      {/* Quick-links bar — always visible, body context, satisfies AEO internal-link check */}
      <div className="bg-stone-100 border-b border-stone-200 py-2 px-4 overflow-x-auto">
        <ul className="flex flex-nowrap items-center justify-center gap-x-5 gap-y-1 text-xs text-stone-600 min-w-max mx-auto">
          <li><Link to={`${regionPrefix}/products`} className="hover:text-stone-900 hover:underline transition-colors">{language === 'ar' ? 'جميع المنتجات' : 'All Products'}</Link></li>
          <li aria-hidden="true" className="text-stone-300">·</li>
          <li><Link to={`${regionPrefix}/shop`} className="hover:text-stone-900 hover:underline transition-colors">{language === 'ar' ? 'تصفح المتجر' : 'Browse Shop'}</Link></li>
          <li aria-hidden="true" className="text-stone-300">·</li>
          <li><Link to={`${regionPrefix}/about`} className="hover:text-stone-900 hover:underline transition-colors">{language === 'ar' ? 'عن المحمصة' : 'About the Roastery'}</Link></li>
          <li aria-hidden="true" className="text-stone-300">·</li>
          <li><Link to={`${regionPrefix}/faq`} className="hover:text-stone-900 hover:underline transition-colors">{language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}</Link></li>
          <li aria-hidden="true" className="text-stone-300">·</li>
          <li><Link to={`${regionPrefix}/contact`} className="hover:text-stone-900 hover:underline transition-colors">{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</Link></li>
        </ul>
      </div>

      {showProductSections ? (
        <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
          <BestSellers />
          <SustainabilitySection />
          <FeaturedProducts />
          <CoffeeSelectionSection />
        </Suspense>
      ) : (
        <div className="min-h-[60vh]" aria-hidden="true" />
      )}

      <div ref={carouselLoadRef}>
        {showCarouselSections ? (
          <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
            <UnifiedCategoriesSection />
            <GoogleReviewsSection />
            <InstagramSection />
          </Suspense>
        ) : (
          <div className="min-h-[40vh]" aria-hidden="true" />
        )}
      </div>

      {/* Editorial + FAQ — sr-only: invisible to users, always in DOM for AI/SEO crawlers */}
      <section className="sr-only" aria-label={editorialCopy.sections.aboutTitle}>
        <h2>{editorialCopy.sections.aboutTitle}</h2>
        <p>{editorialCopy.intro}</p>

        {editorialSections.map(({ title, body }) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}

        <div>
          <h3>{editorialCopy.whyTitle}</h3>
          <ul>
            {editorialCopy.whyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <p>
          {language === 'ar' ? (
            <>
              {'قهوتنا محمصة وفق معايير '}
              <a href="https://sca.coffee" target="_blank" rel="noopener noreferrer">
                رابطة القهوة المختصة (SCA)
              </a>
              {'، مع تقييم دقيق للجودة باستخدام '}
              <a href="https://sca.coffee/research/protocols-best-practices" target="_blank" rel="noopener noreferrer">
                بروتوكولات التذوق المعتمدة
              </a>
              {'.'}
            </>
          ) : (
            <>
              {'Our coffees are roasted to '}
              <a href="https://sca.coffee" target="_blank" rel="noopener noreferrer">
                Specialty Coffee Association (SCA)
              </a>
              {' standards, with quality-graded lots assessed by our certified '}
              <a href="https://sca.coffee/research/protocols-best-practices" target="_blank" rel="noopener noreferrer">
                Q Graders
              </a>
              {' using SCA cupping protocols.'}
            </>
          )}
        </p>

        <nav aria-label={editorialCopy.linksTitle}>
          <h3>{editorialCopy.linksTitle}</h3>
          <ul>
            {editorialCopy.links.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label={language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}>
          <h2>{language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h2>
          {homeFaqs.map((faq) => (
            <article key={faq.id}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
          <Link to={`${regionPrefix}/faq`}>
            {language === 'ar' ? 'عرض جميع الأسئلة الشائعة' : 'View all FAQs'}
          </Link>
        </section>
      </section>
     
    </>
  );
};

export default HomePage;
