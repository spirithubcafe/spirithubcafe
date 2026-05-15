import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass, Coffee, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { SustainabilitySection } from '../components/sections/SustainabilitySection';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { UnifiedCategoriesSection } from '../components/sections/UnifiedCategoriesSection';
import { CoffeeSelectionSection } from '../components/sections/CoffeeSelectionSection';
import { Seo } from '../components/seo/Seo';
import { useApp } from '../hooks/useApp';
import { siteMetadata } from '../config/siteMetadata';
import { BestSellers } from '@/components/sections/BestSellers';
import { InstagramSection } from '@/components/sections/InstagramSection';
import { GoogleReviewsSection } from '@/components/sections/GoogleReviewsSection';

const HomePage: React.FC = () => {
  const { language } = useApp();
  const location = useLocation();
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const regionPrefix = location.pathname.startsWith('/sa') ? '/sa' : '/om';

  useEffect(() => {
    const revealSections = () => setShowDeferredSections(true);

    if (typeof window === 'undefined') {
      return;
    }

    let idleId: number | null = null;
    const timeoutId = window.setTimeout(revealSections, 1200);

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number })
        .requestIdleCallback(revealSections, { timeout: 1500 });
    }

    return () => {
      window.clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);

  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'قهوة مختصة في عمان والسعودية',
            description:
              'اطلب قهوة مختصة طازجة من سبيريت هب. حبوب محمصة بعناية، قهوة فلتر، وكبسولات مع توصيل سريع في عمان والسعودية.',
          }
        : {
            title: 'Specialty Coffee in Oman & Saudi Arabia',
            description:
              'Shop fresh specialty coffee from SpiritHub Roastery. Explore roasted beans, filter coffee, and capsules with fast delivery across Oman and Saudi Arabia.',
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
    ],
    [seoCopy.description]
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
      <p className="sr-only">{seoCopy.title}</p>
      <AnnouncementBar />
      <ProfessionalHeroSlider />
      {showDeferredSections ? (
        <>
          <BestSellers />
          <SustainabilitySection />
          <FeaturedProducts />
          <CoffeeSelectionSection />
          <UnifiedCategoriesSection />
          <GoogleReviewsSection />
          <InstagramSection />
          <section className="relative overflow-hidden border-y border-stone-200 bg-white py-12 md:py-16">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 top-12 h-56 w-56 rounded-full bg-stone-300/35 blur-2xl"
              initial={{ opacity: 0, y: 32, scale: 0.92 }}
              whileInView={{ opacity: 1, y: -20, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 bottom-6 h-64 w-64 rounded-full bg-white/70 blur-3xl"
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 18, scale: 1.04 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 1.25, ease: 'easeOut' }}
            />

            <div className="container relative mx-auto px-4">
              <motion.div
                className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_80px_rgba(78,52,35,0.12)] backdrop-blur-xl md:p-8 lg:p-10"
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <div className="relative overflow-hidden rounded-[1.6rem] border border-stone-200 bg-stone-900 px-5 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] md:px-7 md:py-8">
                  <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
                  <motion.div
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl"
                    animate={{ y: [0, -12, 0], x: [0, -8, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl space-y-4">
                      <p className="max-w-3xl text-base leading-8 text-white/90 md:text-lg">
                        {editorialCopy.intro}
                      </p>
                    </div>

                    <div className="grid w-full max-w-xl gap-3 text-sm text-white/90 lg:min-w-[320px] lg:max-w-[360px]">
                      <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-white/60">Roasted</div>
                        <div className="mt-2 text-base font-semibold text-white">Fresh weekly</div>
                      </div>
                      <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-white/60">Coverage</div>
                        <div className="mt-2 text-base font-semibold text-white">Oman + Saudi</div>
                      </div>
                      <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-white/60">Formats</div>
                        <div className="mt-2 text-base font-semibold text-white">Beans, filter, capsules</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5">
                  {editorialSections.map(({ title, body, Icon }, index) => (
                    <motion.article
                      key={title}
                      className="group relative overflow-hidden rounded-[1.6rem] border border-stone-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(97,66,42,0.08)] transition-transform duration-300 hover:-translate-y-1 md:p-6"
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.55, delay: index * 0.08, ease: 'easeOut' }}
                    >
                      <div className="absolute inset-x-6 top-0 h-px bg-stone-200" />
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-lg shadow-stone-900/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-3">
                          <h2 className="text-xl font-semibold tracking-tight text-stone-950 md:text-[1.6rem]">
                            {title}
                          </h2>
                          <p className="max-w-none text-sm leading-7 text-stone-700 md:text-base">
                            {body}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>

                <motion.div
                  className="mt-6 grid gap-6 rounded-[1.7rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(97,66,42,0.08)] md:grid-cols-1 md:p-8"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-stone-950 md:text-[1.45rem]">
                      {editorialCopy.whyTitle}
                    </h3>
                    <ul className="grid gap-3 text-sm leading-7 text-stone-700 md:text-base">
                      {editorialCopy.whyPoints.map((point, index) => (
                        <motion.li
                          key={point}
                          className="flex gap-3 rounded-2xl border border-stone-200/70 bg-white/80 px-4 py-3"
                          initial={{ opacity: 0, x: -14 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.3 }}
                          transition={{ duration: 0.45, delay: 0.08 * index, ease: 'easeOut' }}
                        >
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-600 shadow-[0_0_0_5px_rgba(217,119,6,0.12)]" aria-hidden="true" />
                          <span>{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <nav aria-label={editorialCopy.linksTitle} className="space-y-4">
                    <h3 className="text-lg font-semibold text-stone-950 md:text-[1.45rem]">
                      {editorialCopy.linksTitle}
                    </h3>
                    <div className="grid gap-3">
                      {editorialCopy.links.map((link, index) => (
                        <motion.div
                          key={link.to}
                          initial={{ opacity: 0, x: 14 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.3 }}
                          transition={{ duration: 0.45, delay: 0.06 * index, ease: 'easeOut' }}
                        >
                          <Link
                            to={link.to}
                            className="group flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 text-sm font-medium text-stone-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/70 hover:text-stone-950 md:text-base"
                          >
                            <span>{link.label}</span>
                            <ArrowUpRight className="h-4 w-4 text-stone-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-700" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </nav>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </>
      ) : (
        <div className="min-h-[60vh]" aria-hidden="true" />
      )}
     
    </>
  );
};

export default HomePage;
