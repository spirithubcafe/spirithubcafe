import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import './ProfessionalHeroSlider.css';

interface SlideData {
  id: string;
  image: string;
  title: string;
  subtitle: string | string[];
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
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Professional slide data with rich content
  const allSlides: SlideData[] = [
    {
      id: '1',
      image: '/images/slides/slide1.webp',
      title: language === 'ar' ? 'مرحباً بكم في محمصة سبيريت هب للقهوة المختصة' : 'WELCOME TO SPIRITHUB ROASTERY AND SPECIALTY COFFEE',
      subtitle: language === 'ar' ? (isMobile ? [
        'حبوب قهوة مختارة بعناية ومحمصة بخبرة',
        'لتكريم عمل المنتجين وإبراز النكهات المميزة',
        'أفضل حبوب القهوة في عُمان'
      ] : [
        'يتم اختيار حبوب القهوة لدينا بعناية وتحميصها بدقة لتكريم العمل الشاق للمنتجين.',
        'من خلال إبراز النكهات والروائح والحموضة المميزة لكل قهوة، ندع قصصهم تتألق',
        'ونقدم لعملائنا أفضل حبوب القهوة في عُمان.'
      ]) : (isMobile ? [
        'Thoughtfully sourced and expertly roasted',
        'to honor producers and reveal distinctive flavors',
        'The best coffee beans in Oman'
      ] : [
        'Our coffee beans are thoughtfully sourced and carefully roasted to honor producers\' hard work.',
        'By revealing each coffee\'s distinctive flavors, aromatics, and acidities, we let their stories shine through',
        'and provide to customers the best coffee beans in Oman.'
      ]),
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
      cta: language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'
    },
    {
      id: '2',
      image: '/images/slides/slide2.webp',
      title: language === 'ar' ? 'فلتر ورقي لتنقيط القهوة على شكل قرص UFO صديق للبيئة' : 'ECO-FRIENDLY UFO DISK DRIP COFFEE PAPER FILTER',
      subtitle: language === 'ar' ? [
        'مهمتنا هي إثراء يوم كل عميل بتجربة قهوة مصنوعة يدوياً.',
        'من خلال محمصة سبيريت هب، نضمن جودة ونكهة استثنائية في كل كوب، من الحبوب المختارة بعناية إلى التحميص الخبير.',
        'أينما نقدم خدماتنا، تتألق شغفنا وإخلاصنا، مما يجعل كل رشفة لا تُنسى.'
      ] : [
        'Our mission is to enrich each customer\'s day with a hand-crafted coffee experience.',
        'Through SpiritHub Roastery, we guarantee exceptional quality and flavor in every cup, from carefully selected beans to expert roasting.',
        'Wherever we serve, our passion and dedication shine through, making every sip unforgettable.'
      ],
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
      cta: language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'
    },
    {
      id: '3',
      image: '/images/slides/slide3.webp',
      title: language === 'ar' ? 'أجواء مثالية للاسترخاء' : 'COFFEE CAPSULES SELECTIONS',
      subtitle: language === 'ar' ? [
        'اليوم، يسعدنا أن نُقدّم لكم إنجازًا جديدًا في رحلتنا: تشكيلة حصرية من كبسولات القهوة!',
        'هذه الأنواع الخمسة الاستثنائية من القهوة، المُختارة بعناية،',
        'تُضفي جوهرًا أصيلًا على فنجانكم.'
      ] : [
        'Today, we are thrilled to introduce a new milestone in our journey: exclusive coffee capsules selections!',
        'Carefully curated, these 5 exceptional coffee varieties',
        'bring the authentic essence of their origins right to your cup.'
      ],
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
      cta: language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'
    },
    {
      id: '4',
      image: '/images/slides/rwanda-farm-spirithub-coffee.webp',
      title: language === 'ar' ? 'من مصدرٍ مستدام وتحميصٍ يعكس الأصالة' : 'SUSTAINABLY SOURCED, AUTHENTICALLY ROASTED',
      subtitle: language === 'ar' ? [
        'من التلال الخضراء في رواندا إلى محمصة سبيريت هب، كل خطوة تكرم المزارعين والأرض،',
        'رحلة من التفاني والاستدامة والحرفية',
        'تحول الكرز المقطوف يدويًا إلى لحظات من الكمال.'
      ] : [
        'From the lush hills of Rwanda to SpiritHub Roastery, each step honors the farmers and the earth,',
        'a journey of dedication, sustainability, and craftsmanship',
        'that transforms hand-picked cherries into moments of pure coffee perfection.'
      ],
      description: language === 'ar'
        ? 'قهوة مستدامة من أفضل المزارع حول العالم'
        : 'Sustainable coffee from the best farms around the world',
      stats: [
        { value: '100%', label: language === 'ar' ? 'مستدام' : 'Sustainable' },
        { value: '20+', label: language === 'ar' ? 'دولة منشأ' : 'Origin Countries' },
        { value: 'AAA', label: language === 'ar' ? 'درجة الجودة' : 'Quality Grade' }
      ],
      features: [
        language === 'ar' ? 'تجارة عادلة' : 'Fair Trade',
        language === 'ar' ? 'عضوي معتمد' : 'Certified Organic',
        language === 'ar' ? 'قابل للتتبع' : 'Traceable'
      ],
      cta: language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'
    },
    {
      id: '5',
      image: '/images/slides/yemen-jabal-nabi-shuaib-spirithub-coffee.webp',
      title: language === 'ar' ? 'متجذرون في اليمن، محمص في سبيريت هب' : 'ROOTED IN YEMEN, ROASTED AT SPIRITHUB',
      subtitle: language === 'ar' ? [
        'من المرتفعات المقدسة لجبل النبي شعيب إلى محمصتنا في عُمان، كل حبة تروي قصة الأصل والصمود والفن،',
        'حكاية وُلدت من المدرجات اليمنية القديمة، رعاها أجيال من المزارعين،',
        'وأُتقنت من خلال شغف سبيريت هب بالحرفية والأصالة.'
      ] : [
        'From the sacred highlands of Jabal Nabi Shu\'ayb to our roastery in Oman, each bean tells a story of origin, resilience, and artistry,',
        'a tale born from Yemen\'s ancient terraces, nurtured by generations of farmers,',
        'and perfected through SpiritHub\'s passion for craft and authenticity.'
      ],
      description: language === 'ar'
        ? 'قهوة يمنية أصيلة من أعلى القمم'
        : 'Authentic Yemeni coffee from the highest peaks',
      stats: [
        { value: '3000m+', label: language === 'ar' ? 'ارتفاع' : 'Elevation' },
        { value: '1000+', label: language === 'ar' ? 'سنة تراث' : 'Years Heritage' },
        { value: 'A+', label: language === 'ar' ? 'تصنيف نادر' : 'Rare Grade' }
      ],
      features: [
        language === 'ar' ? 'تراث عريق' : 'Ancient Heritage',
        language === 'ar' ? 'قهوة نادرة' : 'Rare Coffee',
        language === 'ar' ? 'منتج يدوياً' : 'Hand Processed'
      ],
      cta: language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'
    }
  ];

  // Filter slides based on device type - mobile shows only first slide
  const slides = isMobile ? [allSlides[0]] : allSlides;

  // Auto-play functionality - only on desktop with multiple slides
  useEffect(() => {
    if (isPlaying && !isHovered && !isMobile && slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, isHovered, isMobile, slides.length]);

  const currentSlideData = slides[currentSlide];

  // Function to go to next slide - only on desktop
  const nextSlide = () => {
    if (!isMobile && slides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  };

  return (
    <section 
      className={`professional-hero-slider ${!isMobile && slides.length > 1 ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={!isMobile && slides.length > 1 ? nextSlide : undefined}
    >
      {/* Background Images with Fade Effect */}
      <div className="slider-backgrounds">
        <AnimatePresence initial={false}>
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
              <motion.div
                className="slide-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {Array.isArray(currentSlideData.subtitle) ? (
                  currentSlideData.subtitle.map((line, index) => (
                    <div key={index} className="subtitle-line">
                      {line}
                    </div>
                  ))
                ) : (
                  currentSlideData.subtitle
                )}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                className="slide-cta flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link
                  to="/products"
                  className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide"
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentSlideData.cta}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide Indicators - only show on desktop or when multiple slides */}
      {(!isMobile && slides.length > 1) && (
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
      )}
    </section>
  );
};
