import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { useApp } from '../../hooks/useApp';
import './ProfessionalHeroSlider.css';

interface SlideData {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  stats: { value: string; label: string }[];
  features: string[];
  cta: string;
}

export const ProfessionalHeroSlider: React.FC = () => {
  // const { t } = useTranslation(); // Removed unused import
  const { language } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Professional slide data with rich content
  const slides: SlideData[] = [
    {
      id: '1',
      image: '/images/slides/slide1.webp',
      title: language === 'ar' ? 'من الحبة إلى الكوب، نسعى للكمال' : 'FROM BEAN TO BREW, WE STRIVE FOR PERFECTION',
      subtitle: language === 'ar' ? 'تجربة قهوة استثنائية في كل رشفة' : 'Our coffee beans are thoughtfully sourced and carefully roasted to honor producers\' hard work. By revealing each coffee\'s distinctive flavors, aromatics, and acidities, we let their stories shine through and provide customers with the best coffee beans in Oman.',
      description: language === 'ar' 
        ? 'نقدم لك أجود أنواع القهوة المحمصة بعناية فائقة من أفضل مزارع القهوة حول العالم'
        : 'We bring you the finest carefully roasted coffee from the best coffee farms around the world',
      stats: [
        { value: '500+', label: language === 'ar' ? 'عميل سعيد' : 'Happy Customers' },
        { value: '15+', label: language === 'ar' ? 'نوع قهوة' : 'Coffee Types' },
        { value: '5★', label: language === 'ar' ? 'تقييم' : 'Rating' }
      ],
      features: [
        language === 'ar' ? '100% قهوة عضوية' : '100% Organic Coffee',
        language === 'ar' ? 'محمصة طازجة يومياً' : 'Fresh Roasted Daily',
        language === 'ar' ? 'خدمة 24/7' : '24/7 Service'
      ],
      cta: language === 'ar' ? 'تسوق الآن' : 'Shop Now'
    },
    {
      id: '2',
      image: '/images/slides/slide2.webp',
      title: language === 'ar' ? 'حرفية في التحضير' : 'Craftsmanship in Preparation',
      subtitle: language === 'ar' ? 'خبرة تمتد لسنوات في فن صناعة القهوة' : 'Years of expertise in the art of coffee making',
      description: language === 'ar'
        ? 'باريستا محترفون يحضرون لك كل كوب بحب وإتقان باستخدام أحدث التقنيات'
        : 'Professional baristas prepare every cup with love and precision using the latest techniques',
      stats: [
        { value: '10+', label: language === 'ar' ? 'سنوات خبرة' : 'Years Experience' },
        { value: '50+', label: language === 'ar' ? 'وصفة مميزة' : 'Signature Recipes' },
        { value: '98%', label: language === 'ar' ? 'رضا العملاء' : 'Customer Satisfaction' }
      ],
      features: [
        language === 'ar' ? 'تقنيات حديثة' : 'Modern Techniques',
        language === 'ar' ? 'باريستا محترف' : 'Professional Barista',
        language === 'ar' ? 'جودة مضمونة' : 'Guaranteed Quality'
      ],
      cta: language === 'ar' ? 'تعرف علينا' : 'Learn More'
    },
    {
      id: '3',
      image: '/images/slides/slide3.webp',
      title: language === 'ar' ? 'أجواء مثالية للاسترخاء' : 'Perfect Atmosphere for Relaxation',
      subtitle: language === 'ar' ? 'مساحة مريحة ودافئة للاستمتاع بوقتك' : 'A comfortable and warm space to enjoy your time',
      description: language === 'ar'
        ? 'تصميم داخلي أنيق وموسيقى هادئة وإضاءة مثالية لتجربة لا تُنسى'
        : 'Elegant interior design, soothing music, and perfect lighting for an unforgettable experience',
      stats: [
        { value: '200+', label: language === 'ar' ? 'مقعد مريح' : 'Comfortable Seats' },
        { value: '3', label: language === 'ar' ? 'طوابق' : 'Floors' },
        { value: '12H', label: language === 'ar' ? 'ساعات عمل' : 'Operating Hours' }
      ],
      features: [
        language === 'ar' ? 'واي فاي مجاني' : 'Free WiFi',
        language === 'ar' ? 'مساحات عمل' : 'Work Spaces',
        language === 'ar' ? 'أجواء هادئة' : 'Quiet Atmosphere'
      ],
      cta: language === 'ar' ? 'احجز مكانك' : 'Reserve Your Spot'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isHovered) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, isHovered, slides.length]);

  const currentSlideData = slides[currentSlide];

  // Function to go to next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section 
      className="professional-hero-slider cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={nextSlide}
    >
      {/* Background Images with Fade Effect */}
      <div className="slider-backgrounds">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="slide-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <img
              src={currentSlideData.image}
              alt={currentSlideData.title}
              className="background-image"
            />
            <div className="background-overlay" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Content Container */}
      <div className="slider-content-container">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="w-full items-center">
            
            {/* Content - Centered */}
            <motion.div
              key={`content-${currentSlide}`}
              className="content-section max-w-4xl mx-auto text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Main Title */}
              <motion.h1
                className="slide-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {currentSlideData.title}
              </motion.h1>

              {/* Subtitle */}
              <motion.h2
                className="slide-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {currentSlideData.subtitle}
              </motion.h2>

              {/* CTA Button */}
              <motion.div
                className="slide-cta flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Button
                  size="lg"
                  className="cta-button"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentSlideData.cta}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="slide-indicators">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="indicator-progress">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ 
                  width: index === currentSlide && isPlaying && !isHovered ? '100%' : '0%' 
                }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};