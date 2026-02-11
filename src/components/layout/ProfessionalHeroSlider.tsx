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
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Handle video playback for iOS - immediate loading with progress tracking
  useEffect(() => {
    if (isMobile && videoRef.current) {
      const video = videoRef.current;
      
      // Track loading progress
      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const duration = video.duration;
          if (duration > 0) {
            setVideoProgress((bufferedEnd / duration) * 100);
          }
        }
      };

      video.addEventListener('progress', handleProgress);
      
      // Force play for iOS immediately - no waiting for page load
      const attemptPlay = async () => {
        try {
          video.muted = true; // Ensure muted for autoplay
          video.load(); // Start loading immediately
          await video.play();
          setVideoLoaded(true);
        } catch (error) {
          console.warn('Video autoplay failed:', error);
          // Fallback: try again on user interaction
          const playOnInteraction = async () => {
            try {
              await video.play();
              setVideoLoaded(true);
              document.removeEventListener('touchstart', playOnInteraction);
              document.removeEventListener('click', playOnInteraction);
            } catch (e) {
              console.warn('Video play on interaction failed:', e);
            }
          };
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('click', playOnInteraction, { once: true });
        }
      };

      // Start immediately, don't wait for full page load
      const timer = setTimeout(attemptPlay, 50); // Faster initialization
      
      return () => {
        clearTimeout(timer);
        video.removeEventListener('progress', handleProgress);
      };
    }
  }, [isMobile]);

  // Professional slide data with rich content
  const allSlides: SlideData[] = [
    {
      id: '1',
      image: '/images/slides/premium-specialty-coffee-roasted-in-oman.webp',
      title: language === 'ar' ? 'قهوة مختصة فاخرة محمصة في عُمان' : 'PREMIUM SPECIALTY COFFEE ROASTED IN OMAN',
      subtitle: language === 'ar' ? [
        'محاصيل محدودة مختارة • مصادر مستدامة • شحن خلال 24 ساعة'
      ] : [
        'LIMITED MICRO-LOTS • ETHICALLY SOURCED • SHIPPED WITHIN 24 HOURS'
      ],
      description: language === 'ar'
        ? 'قهوة مختصة فاخرة محمصة بعناية في عُمان'
        : 'Premium specialty coffee carefully roasted in Oman',
      stats: [
        { value: '24H', label: language === 'ar' ? 'شحن سريع' : 'Fast Shipping' },
        { value: '100%', label: language === 'ar' ? 'أخلاقي' : 'Ethical' },
        { value: 'AAA', label: language === 'ar' ? 'جودة فاخرة' : 'Premium Quality' }
      ],
      features: [
        language === 'ar' ? 'دفعات محدودة' : 'Limited Micro-Lots',
        language === 'ar' ? 'مصادر أخلاقية' : 'Ethically Sourced',
        language === 'ar' ? 'شحن خلال 24 ساعة' : 'Ships in 24 Hours'
      ],
      cta: language === 'ar' ? 'تسوّق الأكثر مبيعًا' : 'SHOP BEST SELLERS'
    },
    {
      id: '2',
      image: '/images/slides/slide1.webp',
      title: language === 'ar' ? 'مرحباً بكم في محمصة سبيريت هب للقهوة المختصة' : 'WELCOME TO SPIRITHUB SPECIALTY COFFEE ROASTERY',
      subtitle: language === 'ar' ? (isMobile ? [
        'اشتري حبوب قهوة مختصة محمصة بعناية',
        'لتكريم عمل المنتجين وإبراز النكهات المميزة',
        'اطلب الآن أفضل حبوب القهوة في عُمان والسعودية'
      ] : [
        'اشتري حبوب قهوة مختصة محمصة بدقة لتكريم العمل الشاق للمنتجين.',
        'من خلال إبراز النكهات والروائح والحموضة المميزة لكل قهوة، ندع قصصهم تتألق',
        'اطلب الآن أفضل حبوب القهوة في عُمان والسعودية.'
      ]) : (isMobile ? [
        'Buy specialty coffee beans expertly roasted',
        'to honor producers and reveal distinctive flavors',
        'Order now - Best coffee beans in Oman & Saudi'
      ] : [
        'Buy specialty coffee beans carefully roasted to honor producers\' hard work.',
        'By revealing each coffee\'s distinctive flavors, aromatics, and acidities, we let their stories shine through',
        'and provide customers the best coffee beans in Oman and Saudi Arabia.'
      ]),
      description: language === 'ar' 
        ? 'اطلب الآن أجود أنواع القهوة المحمصة بعناية فائقة من أفضل مزارع القهوة حول العالم'
        : 'Order now the finest carefully roasted specialty coffee from the best coffee farms around the world',
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
      id: '3',
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
      id: '4',
      image: '/images/slides/slide3.webp',
      title: language === 'ar' ? 'اشتري كبسولات قهوة مختصة فاخرة' : 'BUY SPECIALTY COFFEE CAPSULES',
      subtitle: language === 'ar' ? [
        'اليوم، يسعدنا أن نُقدّم لكم إنجازًا جديدًا في رحلتنا: تشكيلة حصرية من كبسولات القهوة المختصة!',
        'اطلب الآن من هذه الأنواع الخمسة الاستثنائية من القهوة، المُختارة بعناية،',
        'تُضفي جوهرًا أصيلًا على فنجانكم. توصيل سريع في عُمان والسعودية.'
      ] : [
        'Today, we are thrilled to introduce a new milestone in our journey: exclusive specialty coffee capsules selections!',
        'Order now from these 5 carefully curated exceptional coffee varieties',
        'that bring the authentic essence of their origins right to your cup. Fast delivery in Oman & Saudi Arabia.'
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
      id: '5',
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
      id: '6',
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
    },
    {
      id: '7',
      image: '/images/slides/spirithub-hero-bundles-gifts.webp',
      title: language === 'ar' ? 'هدايا مختارة بعناية وباقات اكتشاف' : 'THOUGHTFULLY CURATED GIFTS & DISCOVERY BUNDLES',
      subtitle: language === 'ar' ? [
        'من تشكيلات القهوة المختصة إلى تجارب الهدايا الأنيقة،',
        'صُممت لتُسعد كل ذوق وتناسب كل مناسبة.'
      ] : [
        'From specialty coffee selections to elegant gift experiences,',
        'crafted to delight every taste and occasion.'
      ],
      description: language === 'ar'
        ? 'باقات هدايا وتشكيلات قهوة مختصة لكل مناسبة'
        : 'Gift bundles and specialty coffee selections for every occasion',
      stats: [
        { value: '10+', label: language === 'ar' ? 'باقة مميزة' : 'Unique Bundles' },
        { value: '100%', label: language === 'ar' ? 'تغليف فاخر' : 'Premium Packaging' },
        { value: '5★', label: language === 'ar' ? 'تقييم' : 'Rating' }
      ],
      features: [
        language === 'ar' ? 'هدايا مختارة بعناية' : 'Curated Gifts',
        language === 'ar' ? 'تغليف أنيق' : 'Elegant Packaging',
        language === 'ar' ? 'مناسب لكل مناسبة' : 'Perfect for Any Occasion'
      ],
      cta: language === 'ar' ? 'استكشف الباقات والهدايا' : 'EXPLORE BUNDLES & GIFTS'
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

  // Reset currentSlide when slides array changes (mobile/desktop switch)
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const currentSlideData = slides[currentSlide];

  // Function to go to next slide - only on desktop
  const nextSlide = () => {
    if (!isMobile && slides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  };

  // Return loading state if no slide data is available
  if (!currentSlideData) {
    return (
      <section className="professional-hero-slider">
        <div className="slider-backgrounds" style={{ background: '#1a1a1a' }} />
      </section>
    );
  }

  return (
    <section 
      className={`professional-hero-slider ${!isMobile && slides.length > 1 ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={!isMobile && slides.length > 1 ? nextSlide : undefined}
    >
      {/* Background Images/Video with Fade Effect */}
      <div className="slider-backgrounds">
        {isMobile ? (
          // Mobile: Show video background with optimized loading
          <div className="slide-background">
            <video
              ref={videoRef}
              className="background-video"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={currentSlideData.image}
              onCanPlay={() => setVideoLoaded(true)}
              onError={() => {
                console.warn('Video failed to load, using fallback image');
                setVideoLoaded(false);
              }}
              style={{ 
                opacity: videoLoaded ? 1 : 0,
                transition: 'opacity 0.8s ease-out',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
              }}
              webkit-playsinline="true"
              x-webkit-airplay="allow"
            >
              <source src="/video/spirithub-specialty-coffee-roastery-mobile-banner.mp4" type="video/mp4" />
            </video>
            
            {/* Fallback image shown until video loads */}
            {!videoLoaded && (
              <img
                src={currentSlideData.image}
                alt={currentSlideData.title}
                className="background-image"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2
                }}
              />
            )}
            
            {/* Loading progress indicator */}
            {!videoLoaded && videoProgress > 0 && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  width: `${videoProgress}%`,
                  transition: 'width 0.3s ease',
                  zIndex: 6
                }}
              />
            )}
            
            <div className="background-overlay" style={{ zIndex: 3 }} />
          </div>
        ) : (
          // Desktop: Show image backgrounds with fade effect
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
        )}
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

              {/* Additional text below button - only for slide 1 */}
              {currentSlide === 0 && (
                <motion.div
                  className="text-center mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    letterSpacing: '0.1em',
                    fontWeight: 500
                  }}
                >
                  {language === 'ar' ? 'محمص طازجًا • توصيل سريع في جميع أنحاء عُمان' : 'ROASTED FRESH • FAST DELIVERY ACROSS OMAN'}
                </motion.div>
              )}
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
