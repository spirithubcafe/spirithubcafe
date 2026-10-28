import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';
import { useApp } from '../../hooks/useApp';
import { homepageContainerClassName, homepageSectionClassName } from './homepageSectionSpacing';
import { HomeSectionHeader } from './HomeSectionHeader';

export const SustainabilitySection: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const location = useLocation();
  const regionPrefix = location.pathname.startsWith('/sa') ? '/sa' : '/om';


  return (
    <section
      className={homepageSectionClassName('bg-[#fbfbf9]')}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className={homepageContainerClassName()}>
        <div className="flex flex-col gap-6 sm:gap-9 lg:flex-row lg:items-center lg:gap-12">
          {/* Story image linking to the About page */}
          <Link
            to={`${regionPrefix}/about`}
            className="group relative block h-[clamp(280px,82vw,320px)] w-full overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200/70 sm:aspect-[4/3] sm:h-auto lg:w-1/2"
          >
            <img
              src="/images/about/specialty-coffee-beans-roastery-oman-spirithub-oman-transparent.webp"
              alt={isArabic ? 'رحلتنا من الحبة إلى الكوب' : 'Our journey from bean to cup'}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full scale-[1.2] object-contain transition-transform duration-700 sm:scale-100 sm:group-hover:scale-[1.02]"
            />
          </Link>

          {/* Copy */}
          <div className="lg:w-1/2">
            <HomeSectionHeader
              className="mb-0 sm:mb-0"
              eyebrow={isArabic ? 'فلسفتنا' : 'Our Philosophy'}
              title={isArabic ? 'الاستدامة، الجودة، الالتزام' : 'Sustainability, Quality, Commitment'}
            />
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-stone-600 sm:text-base sm:leading-7">
              {isArabic
                ? 'نؤمن بأن للقهوة المختصة أثرًا يتجاوز جودة المذاق، بدءًا من اختيار حبوب من مصادر مسؤولة، وصولًا إلى دعم المزارعين والمجتمعات التي تقف وراء كل فنجان.'
                : 'We believe exceptional coffee begins with responsible sourcing. From carefully selected origins to the people behind every harvest, we are committed to quality, sustainability and lasting relationships.'}
            </p>
            <Link
              to={`${regionPrefix}/about`}
              className="group mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-stone-900 px-5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c69c6d] focus-visible:ring-offset-2"
            >
              {isArabic ? 'اعرف المزيد' : 'Our Story'}
              <AnimatedIcon name="arrow-right" className={`size-4 ${isArabic ? '-scale-x-100' : ''}`} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
