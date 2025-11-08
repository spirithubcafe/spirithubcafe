import React, { useMemo } from 'react';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { SustainabilitySection } from '../components/sections/SustainabilitySection';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { CategoriesSection } from '../components/sections/CategoriesSection';
import { CoffeeSelectionSection } from '../components/sections/CoffeeSelectionSection';
import { Seo } from '../components/seo/Seo';
import { useApp } from '../hooks/useApp';
import { siteMetadata } from '../config/siteMetadata';

const HomePage: React.FC = () => {
  const { language } = useApp();

  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'قهوة مختصة محمصة في عمان',
            description:
              'اكتشف سبيريت هب كافيه في مسقط حيث نحمص القهوة المختصة بعناية ونقدم تجارب ضيافة عربية معاصرة وكورسات التذوق واشتراكات القهوة الطازجة.',
          }
        : {
            title: 'Specialty coffee roasted in Oman',
            description:
              'Spirit Hub Cafe curates single-origin beans, slow roasts in Muscat, and serves signature drinks, brew gear, and subscription boxes across Oman.',
          },
    [language]
  );

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CafeOrCoffeeShop',
      name: siteMetadata.siteName,
      url: siteMetadata.baseUrl,
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
        addressCountry: 'OM',
      },
    }),
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
      <ProfessionalHeroSlider />
      <SustainabilitySection />

      <FeaturedProducts /> 
      <CoffeeSelectionSection />
      <CategoriesSection />
     
    </>
  );
};

export default HomePage;
