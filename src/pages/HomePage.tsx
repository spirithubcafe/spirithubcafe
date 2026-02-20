import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { SustainabilitySection } from '../components/sections/SustainabilitySection';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { CategoriesSection } from '../components/sections/CategoriesSection';
import { ShopCategoriesSection } from '../components/sections/ShopCategoriesSection';
import { CoffeeSelectionSection } from '../components/sections/CoffeeSelectionSection';
import { Seo } from '../components/seo/Seo';
import { useApp } from '../hooks/useApp';
import { siteMetadata } from '../config/siteMetadata';
import { BestSellers } from '@/components/sections/BestSellers';

const ANNOUNCEMENT_BAR_HEIGHT = 40; // px

const HomePage: React.FC = () => {
  const { language } = useApp();

  // Push the fixed navigation down while the announcement bar is visible
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--announcement-bar-height', `${ANNOUNCEMENT_BAR_HEIGHT}px`);
    return () => {
      root.style.setProperty('--announcement-bar-height', '0px');
    };
  }, []);

  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'SpiritHub Roastery | قهوة مختصة وكبسولات في عمان والسعودية',
            description:
              'اطلب قهوة مختصة فاخرة، كبسولات، وقهوة فلتر. محمصة بعناية في مسقط عمان • الآن نخدم الخبر، السعودية. اشتري حبوب قهوة مختصة محمصة طازجة يومياً.',
          }
        : {
            title: 'SpiritHub Roastery | Specialty Coffee & Capsules in Oman & Saudi',
            description:
              'Premium specialty coffee, capsules, and filter brews. Roasted with care in Oman • Now serving Khobar, Saudi Arabia. Buy specialty coffee beans, order capsules online, expert roastery.',
          },
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
        email: 'info@spirithubcafe.com',
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

  return (
    <>
      <Seo
        title={seoCopy.title}
        description={seoCopy.description}
        keywords={[
          'specialty coffee Oman',
          'coffee roastery Muscat',
          'Spirit Hub Cafe',
          'سبيريت هب',
          'قهوة مختصة',
        ]}
        structuredData={structuredData}
      />
      <h1 className="sr-only">{seoCopy.title}</h1>
      {/* Announcement bar – fixed above the navbar */}
      <div
        className="fixed left-0 right-0 z-[55] w-full overflow-hidden bg-[#681e15] group"
        style={{ top: 'var(--region-banner-height, 0px)', height: `${ANNOUNCEMENT_BAR_HEIGHT}px` }}
        dir="ltr"
      >
        <div className="flex h-full items-center">
          <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                <Link
                  to="/om/shop"
                  className="inline-block px-10 text-sm font-medium text-white hover:underline"
                >
                  🚚 Free shipping on Bundles &amp; Gift
                </Link>
                <Link
                  to="/om/shop"
                  className="inline-block px-10 text-sm font-medium text-white hover:underline"
                  dir="rtl"
                >
                  🚚 شحن مجاني على الباقات والهدايا
                </Link>
              </React.Fragment>
            ))}
          </div>
          <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap" aria-hidden>
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                <Link
                  to="/om/shop"
                  className="inline-block px-10 text-sm font-medium text-white hover:underline"
                  tabIndex={-1}
                >
                  🚚 Free shipping on Bundles &amp; Gift
                </Link>
                <Link
                  to="/om/shop"
                  className="inline-block px-10 text-sm font-medium text-white hover:underline"
                  dir="rtl"
                  tabIndex={-1}
                >
                  🚚 شحن مجاني على الباقات والهدايا
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <ProfessionalHeroSlider />
      <BestSellers />
      <SustainabilitySection />

      <FeaturedProducts /> 
      <CoffeeSelectionSection />
      <CategoriesSection />
      <ShopCategoriesSection />
     
    </>
  );
};

export default HomePage;
