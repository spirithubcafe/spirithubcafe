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
            title: 'أفضل محمصة قهوة مختصة في مسقط، عمان',
            description:
              'سبيريت هب كافيه - محمصة القهوة المختصة الرائدة في مسقط. قهوة طازجة محمصة يومياً، حبوب أحادية المصدر، خلطات حرفية فاخرة، معدات تحضير القهوة، اشتراكات شهرية، وتدريب باريستا محترف. اكتشف تجربة القهوة الأصيلة مع الضيافة العربية في عمان.',
          }
        : {
            title: 'Premium Coffee Roastery in Muscat',
            description:
              'Spirit Hub Cafe - Muscat\'s leading specialty coffee roastery. Daily fresh roasted beans, single-origin coffee, artisan blends, brewing equipment, monthly subscriptions & professional barista training. Experience authentic coffee culture with Arabic hospitality in Oman.',
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
      <h1 className="sr-only">{seoCopy.title}</h1>
      <ProfessionalHeroSlider />
      <SustainabilitySection />

      <FeaturedProducts /> 
      <CoffeeSelectionSection />
      <CategoriesSection />
     
    </>
  );
};

export default HomePage;
