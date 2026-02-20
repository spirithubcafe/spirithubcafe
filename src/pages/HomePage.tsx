import React, { useMemo } from 'react';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { SustainabilitySection } from '../components/sections/SustainabilitySection';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { CategoriesSection } from '../components/sections/CategoriesSection';
import { ShopCategoriesSection } from '../components/sections/ShopCategoriesSection';
import { CoffeeSelectionSection } from '../components/sections/CoffeeSelectionSection';
import { Seo } from '../components/seo/Seo';
import { useApp } from '../hooks/useApp';
import { siteMetadata } from '../config/siteMetadata';
import { BestSellers } from '@/components/sections/BestSellers';

const HomePage: React.FC = () => {
  const { language } = useApp();

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
      <AnnouncementBar />
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
