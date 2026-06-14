import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Leaf, Award, HandHeart } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

export const SustainabilitySection: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const pillars = [
    {
      icon: Leaf,
      title: isArabic ? 'الاستدامة' : 'Sustainability',
      desc: isArabic ? 'مصادر موثوقة' : 'Ethically & responsibly sourced',
    },
    {
      icon: Award,
      title: isArabic ? 'الجودة' : 'Quality',
      desc: isArabic ? 'تحميص طازج بإتقان' : 'Freshly roasted to perfection',
    },
    {
      icon: HandHeart,
      title: isArabic ? 'الالتزام' : 'Commitment',
      desc: isArabic ? 'تكريم المزارعين والمجتمعات' : 'Honoring farmers & communities',
    },
  ];

  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center pb-10 pt-20 sm:py-24 md:py-32"
      style={{ backgroundImage: 'url(/images/header.webp)' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.55)_100%)]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-8 bg-amber-400/70" />
            <span className="text-amber-400 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase">
              {isArabic ? 'فلسفتنا' : 'Our Philosophy'}
            </span>
            <span className="h-px w-8 bg-amber-400/70" />
          </div>

          {/* Title */}
          <h2 className="mb-6 text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {isArabic ? (
              <>
                الاستدامة، <span className="text-amber-400">الجودة</span>، الالتزام
              </>
            ) : (
              <>
                Sustainability, <span className="text-amber-400">Quality</span>, Commitment
              </>
            )}
          </h2>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gray-200/90 md:text-lg">
            <span className="sm:hidden">
              {isArabic
                ? 'قهوة مختصة بأثر يتجاوز الفنجان، من مصادر موثوقة إلى تحميص يحتفي بالمزارعين والمجتمعات.'
                : 'Specialty coffee with impact beyond the cup, from trusted sourcing to roasting that celebrates farmers and communities.'}
            </span>
            <span className="hidden sm:inline">
              {isArabic
                ? 'نؤمن بأن القهوة المختصة تترك أثرًا يتجاوز الفنجان، من حبوب مختارة بمسؤولية إلى تحميص مدروس يحتفي بالمزارعين والمجتمعات والنكهة الاستثنائية في كل تحميصة.'
                : 'We believe specialty coffee should create impact beyond the cup, from ethically sourced beans to responsible roasting that celebrates farmers, communities, and exceptional flavor in every roast.'}
            </span>
          </p>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12 max-w-3xl mx-auto">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/40 hover:bg-white/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-400 transition-transform duration-300 group-hover:scale-110">
                  <pillar.icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="text-base font-bold tracking-wide">{pillar.title}</span>
                <span className="text-xs md:text-sm text-gray-300/80">{pillar.desc}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 rounded-full bg-red-500 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:bg-red-600 hover:shadow-red-500/40 hover:-translate-y-0.5"
            >
              {isArabic ? 'تسوق الآن' : 'Shop Now'}
              <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="group inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-amber-300 transition-colors hover:text-amber-200"
            >
              <span className="border-b border-amber-300/40 pb-0.5 transition-colors group-hover:border-amber-200">
                {isArabic ? 'اعرف المزيد عن قصتنا' : 'Learn more about our story'}
              </span>
              <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
