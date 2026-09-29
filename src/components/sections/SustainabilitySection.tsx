import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

export const SustainabilitySection: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section className="-mt-2 bg-white pt-0 pb-4 sm:mt-0 sm:pt-3" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 sm:gap-9 lg:flex-row lg:items-center lg:gap-12">
          {/* Story image linking to the About page */}
          <Link
            to="/about"
            className="group relative block h-[clamp(280px,82vw,320px)] w-full overflow-hidden rounded-3xl bg-white [box-shadow:0_10px_24px_rgba(0,0,0,0.10)] sm:aspect-[4/3] sm:h-auto sm:shadow-lg lg:w-1/2"
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
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
              {isArabic ? 'فلسفتنا' : 'Our Philosophy'}
            </div>
            <h2 className="text-2xl font-bold leading-tight text-stone-900 sm:text-4xl">
              {isArabic ? (
                'الاستدامة، الجودة، الالتزام'
              ) : (
                <>
                  <span className="block">Sustainability, Quality,</span>
                  <span className="block">Commitment</span>
                </>
              )}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
              {isArabic
                ? 'نؤمن بأن للقهوة المختصة أثرًا يتجاوز جودة المذاق، بدءًا من اختيار حبوب من مصادر مسؤولة، وصولًا إلى دعم المزارعين والمجتمعات التي تقف وراء كل فنجان.'
                : 'We believe exceptional coffee begins with responsible sourcing. From carefully selected origins to the people behind every harvest, we are committed to quality, sustainability and lasting relationships.'}
            </p>
            <Link
              to="/about"
              className="group mt-4 inline-flex items-center gap-2 rounded-full border border-stone-900 bg-white px-6 py-2.5 text-sm font-bold text-stone-900 shadow-sm transition hover:bg-stone-900 hover:text-white sm:mt-6"
            >
              {isArabic ? 'اعرف المزيد' : 'Our Story'}
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
