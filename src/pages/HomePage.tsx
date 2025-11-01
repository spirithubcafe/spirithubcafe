import React from 'react';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { SustainabilitySection } from '../components/sections/SustainabilitySection';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { CategoriesSection } from '../components/sections/CategoriesSection';

const HomePage: React.FC = () => {
  return (
    <>
      <ProfessionalHeroSlider />
      <SustainabilitySection />

      <FeaturedProducts />
      <CategoriesSection />
    </>
  );
};

export default HomePage;