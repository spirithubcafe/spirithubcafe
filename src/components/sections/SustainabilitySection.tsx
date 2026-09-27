import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Play } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

export const SustainabilitySection: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section className="bg-white pt-5 pb-12 sm:pt-12 sm:pb-16" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          {/* Video thumbnail — no video source yet, links to the About/story page */}
          <Link
            to="/about"
            className="group relative block aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg lg:w-1/2"
          >
            <img
              src="/images/slides/rwanda-farm-spirithub-coffee.webp"
              alt={isArabic ? 'رحلتنا من الحبة إلى الكوب' : 'Our journey from bean to cup'}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
            <span className="absolute start-6 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-xl transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
              <Play className="h-6 w-6 fill-current ps-0.5" aria-hidden="true" />
            </span>
            <div className="absolute inset-x-6 bottom-6 text-white">
              <p className="text-lg font-extrabold leading-tight sm:text-xl">
                {isArabic ? 'رحلتنا من الحبة إلى الكوب' : 'Our Journey From Bean to Cup'}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {isArabic ? 'شاهد الفيديو · (٢:١٥)' : 'Watch the video · (2:15)'}
              </p>
            </div>
          </Link>

          {/* Copy */}
          <div className="lg:w-1/2">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              <span className="h-px w-6 bg-amber-500/60" aria-hidden="true" />
              {isArabic ? 'فلسفتنا' : 'Our Philosophy'}
            </div>
            <h2 className="text-2xl font-extrabold leading-tight text-stone-900 sm:text-4xl">
              {isArabic ? 'الاستدامة، الجودة، الالتزام' : 'Sustainability, Quality, Commitment'}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
              {isArabic
                ? 'نؤمن بأن للقهوة المختصة أثرًا يتجاوز جودة المذاق، بدءًا من اختيار حبوب من مصادر مسؤولة، وصولًا إلى دعم المزارعين والمجتمعات التي تقف وراء كل فنجان.'
                : 'We believe specialty coffee should create a positive impact — from ethically sourced beans to supporting the communities and farmers who make it possible.'}
            </p>
            <Link
              to="/about"
              className="group mt-6 inline-flex items-center gap-2 rounded-full border border-stone-900 bg-white px-6 py-2.5 text-sm font-bold text-stone-900 shadow-sm transition hover:bg-stone-900 hover:text-white"
            >
              {isArabic ? 'اعرف المزيد' : 'Learn more'}
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
