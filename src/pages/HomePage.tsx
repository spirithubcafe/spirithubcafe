import React from 'react';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { CategoriesSection } from '../components/sections/CategoriesSection';
import { AboutSection } from '../components/sections/AboutSection';
import { AuthStatusCard } from '../components/auth/AuthStatusCard';

const HomePage: React.FC = () => {
  return (
    <>
      <ProfessionalHeroSlider />

      {/* Auth Status Card for testing */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 flex justify-center">
          <AuthStatusCard />
        </div>
      </section>

      <FeaturedProducts />
      <CategoriesSection />
      <AboutSection />
    </>
  );
};

export default HomePage;