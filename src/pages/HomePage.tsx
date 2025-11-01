import React from 'react';
import { ProfessionalHeroSlider } from '../components/layout/ProfessionalHeroSlider';
import { FeaturedProducts } from '../components/sections/FeaturedProducts';
import { CategoriesSection } from '../components/sections/CategoriesSection';

const HomePage: React.FC = () => {
  return (
    <>
      <ProfessionalHeroSlider />

      <FeaturedProducts />
      <CategoriesSection />
    </>
  );
};

export default HomePage;