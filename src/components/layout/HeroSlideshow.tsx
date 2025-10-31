import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useApp } from '../../hooks/useApp';
import './HeroSlideshow.css';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta?: string;
}

export const HeroSlideshow: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useApp();

  // Slide data using local images
  const slides: HeroSlide[] = [
    {
      id: '1',
      image: '/images/slides/slide1.webp',
      title: language === 'ar' ? 'مرحباً بك في سبيريت هب' : 'Welcome to Spirit Hub Cafe',
      subtitle: language === 'ar' ? 'تجربة قهوة استثنائية في كل رشفة' : 'An exceptional coffee experience in every sip'
    },
    {
      id: '2',
      image: '/images/slides/slide2.webp',
      title: language === 'ar' ? 'قهوة طازجة يومياً' : 'Fresh Coffee Daily',
      subtitle: language === 'ar' ? 'من أجود أنواع البن المحمص بعناية' : 'From the finest carefully roasted coffee beans'
    },
    {
      id: '3',
      image: '/images/slides/slide3.webp',
      title: language === 'ar' ? 'أجواء مثالية للاسترخاء' : 'Perfect Atmosphere to Relax',
      subtitle: language === 'ar' ? 'مكان مريح لقضاء أوقات ممتعة' : 'A comfortable place to spend quality time'
    },
    {
      id: '4',
      image: '/images/slides/slide4.webp',
      title: language === 'ar' ? 'مذاق لا يُنسى' : 'Unforgettable Taste',
      subtitle: language === 'ar' ? 'نكهات متميزة تبقى في الذاكرة' : 'Distinctive flavors that linger in memory'
    },
    {
      id: '5',
      image: '/images/slides/slide5.webp',
      title: language === 'ar' ? 'خدمة متميزة' : 'Exceptional Service',
      subtitle: language === 'ar' ? 'فريق محترف يضمن أفضل تجربة' : 'Professional team ensuring the best experience'
    }
  ];

  return (
    <section className="hero-slideshow-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.hero-nav-button.next',
          prevEl: '.hero-nav-button.prev',
        }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination-custom',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop={true}
        className="hero-swiper"
        breakpoints={{
          320: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 1,
          },
          1024: {
            slidesPerView: 1,
          },
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="swiper-slide">
            {/* Background Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="hero-slide-image"
            />
            
            {/* Content Overlay */}
            <div className="hero-content-overlay" />
            
            {/* Content */}
            <div className="hero-content">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight">
                {slide.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-4xl mx-auto leading-relaxed opacity-90">
                {slide.subtitle}
              </p>
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {t('hero.cta')}
              </Button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button className="hero-nav-button prev">
        {language === 'ar' ? (
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </button>
      
      <button className="hero-nav-button next">
        {language === 'ar' ? (
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </button>

      {/* Custom Pagination */}
      <div className="swiper-pagination-custom absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {/* Pagination dots will be rendered by Swiper */}
      </div>
    </section>
  );
};