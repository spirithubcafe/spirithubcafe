import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import './ProfessionalHeroSlider.css';

interface SlideData {
  id: string;
  image: string;
  imageClassName?: string;
  overlayClassName?: string;
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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const mobileHeroImages = [
    '/images/slides/spirithub-nitro-cold-brew-creamy-texture.webp',
    '/images/slides/spirithub-cold-brew-smooth-nitro.webp',
    '/images/slides/spirithub-cold-brew-smooth-low-acidity.webp',
  ];
  // Kept for future re-enable of mobile hero video without changing current image-only behavior.
  const mobileHeroVideoSrc = '/video/spirithub-specialty-coffee-roastery-mobile-banner.mp4';
  const useMobileHeroVideo = false;
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [mobilePrevImageIndex, setMobilePrevImageIndex] = useState<number | null>(null);
  const [mobileIsTransitioning, setMobileIsTransitioning] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    let rafId: number | null = null;

    const checkIsMobile = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile((prev) => (prev === nextIsMobile ? prev : nextIsMobile));
    };

    const onResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        checkIsMobile();
      });
    };

    checkIsMobile();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobile || useMobileHeroVideo || mobileHeroImages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMobileImageIndex((prev) => {
        const next = (prev + 1) % mobileHeroImages.length;
        setMobilePrevImageIndex(prev);
        setMobileIsTransitioning(true);
        return next;
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isMobile, useMobileHeroVideo, mobileHeroImages.length]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileIsTransitioning(false);
      setMobilePrevImageIndex(null);
    }, 750);
    return () => window.clearTimeout(timeoutId);
  }, [mobileImageIndex]);

  useEffect(() => {
    // Preload hero mobile images once to avoid flicker during first cycle.
    mobileHeroImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Professional slide data with rich content
  const allSlides: SlideData[] = [
    {
      id: '1',
      image: '/images/slides/premium-specialty-coffee-roasted-in-oman.webp',
      title: language === 'ar' ? 'قهوة مختصة تُحمّص بإتقان في عُمان والسعودية' : 'PREMIUM SPECIALTY COFFEE ROASTED IN OMAN AND SAUDI ARABIA',
      subtitle: '',
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
      cta: language === 'ar' ? 'تسوّق القهوة' : 'OUR COFFEE'
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
    },
    {
      id: '8',
      image: '/images/slides/spirithub-cold-brew-specialty-coffee.webp',
      imageClassName: 'background-image--nitro',
      overlayClassName: 'background-overlay--nitro',
      title: language === 'ar' ? 'حيث يلتقي الوقت بالمذاق' : 'Where Time Meets Taste',
      subtitle: language === 'ar' ? [
        'يتم تحضير الكولد برو لدينا بنقعٍ بطيء لساعات طويلة لاستخلاص نكهات عميقة،',
        'وحموضة منخفضة، وقوامٍ ناعم',
        'صُمم لعشّاق القهوة الحقيقيين.'
      ] : [
        'Our Cold Brew is patiently steeped for hours to unlock deep flavors,',
        'low acidity, and a silky finish',
        'designed for true coffee lovers.'
      ],
      description: language === 'ar'
        ? 'كولد برو مختص مُحضَّر ببطء لنكهات عميقة وقوام استثنائي'
        : 'Specialty cold brew slowly steeped for deep flavors and an exceptional finish',
      stats: [
        { value: '12H+', label: language === 'ar' ? 'وقت التحضير' : 'Steep Time' },
        { value: '0%', label: language === 'ar' ? 'حموضة' : 'Acidity' },
        { value: '100%', label: language === 'ar' ? 'قهوة مختصة' : 'Specialty Coffee' }
      ],
      features: [
        language === 'ar' ? 'نقع بارد بطيء' : 'Slow Cold Steep',
        language === 'ar' ? 'نكهات عميقة' : 'Deep Flavors',
        language === 'ar' ? 'قوام ناعم' : 'Silky Finish'
      ],
      cta: language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'
    },
    {
      id: '9',
      image: '/images/slides/spirithub-nitro-brew-barista-tap-specialty-coffee.webp',
      imageClassName: 'background-image--nitro',
      overlayClassName: 'background-overlay--nitro',
      title: language === 'ar' ? 'نيترو كولد برو… بتجربة أرقى' : 'Nitro Cold Brew',
      subtitle: language === 'ar' ? [
        'مُعزز بالنيتروجين ليمنحك قوامًا كريميًا ناعمًا ونكهة غنية',
        'تجربة قهوة مختصة منعشة لا مثيل لها.'
      ] : [
        'Infused with nitrogen for a smooth, creamy texture and rich flavor',
        'a refreshing specialty coffee experience like no other.'
      ],
      description: language === 'ar'
        ? 'نيترو كولد برو مُعزز بالنيتروجين لقوام كريمي ونكهة غنية لا مثيل لها'
        : 'Nitrogen-infused nitro cold brew for a smooth, creamy texture and unmatched rich flavor',
      stats: [
        { value: 'N₂', label: language === 'ar' ? 'نيتروجين' : 'Nitrogen' },
        { value: '100%', label: language === 'ar' ? 'كريمي' : 'Creamy' },
        { value: '5★', label: language === 'ar' ? 'تجربة فريدة' : 'Unique Experience' }
      ],
      features: [
        language === 'ar' ? 'مُعزز بالنيتروجين' : 'Nitrogen Infused',
        language === 'ar' ? 'قوام كريمي' : 'Creamy Texture',
        language === 'ar' ? 'نكهة غنية' : 'Rich Flavor'
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

  // Reset currentSlide when slides array changes (mobile/desktop switch)
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const currentSlideData = slides[currentSlide];
  const isHeroPrimaryTitle = currentSlideData?.id === '1';

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
          // Mobile: use photos only (no video) and rotate through the three assets.
          <div className="slide-background">
            {useMobileHeroVideo ? (
              <video
                className="background-video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster={mobileHeroImages[0]}
              >
                <source src={mobileHeroVideoSrc} type="video/mp4" />
              </video>
            ) : (
              <>
                {mobilePrevImageIndex !== null && (
                  <img
                    src={mobileHeroImages[mobilePrevImageIndex]}
                    alt={currentSlideData.title}
                    className={`background-image ${currentSlideData.imageClassName ?? ''}`.trim()}
                    loading="eager"
                    sizes="100vw"
                    decoding="async"
                    style={{ opacity: mobileIsTransitioning ? 1 : 0, position: 'absolute', inset: 0 }}
                  />
                )}
                <img
                  src={mobileHeroImages[mobileImageIndex]}
                  alt={currentSlideData.title}
                  className={`background-image ${currentSlideData.imageClassName ?? ''}`.trim()}
                  fetchPriority="high"
                  loading="eager"
                  sizes="100vw"
                  decoding="async"
                  style={{
                    opacity: mobileIsTransitioning && mobilePrevImageIndex !== null ? 0 : 1,
                    transition: 'opacity 0.7s ease-in-out',
                    position: 'absolute',
                    inset: 0
                  }}
                />
              </>
            )}
            
            <div
              className={`background-overlay ${currentSlideData.overlayClassName ?? ''}`.trim()}
            />
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
                className={`background-image ${currentSlideData.imageClassName ?? ''}`.trim()}
                fetchPriority={currentSlide === 0 ? 'high' : 'auto'}
                loading={currentSlide === 0 ? 'eager' : 'lazy'}
                sizes="100vw"
                decoding="async"
              />
              <div className={`background-overlay ${currentSlideData.overlayClassName ?? ''}`.trim()} />
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
                {isHeroPrimaryTitle && language !== 'ar' ? (
                  <>
                    PREMIUM SPECIALTY COFFEE ROASTED IN{' '}
                    <span className="title-underline-red">OMAN</span>
                    {' '}AND{' '}
                    <span className="title-underline-green">SAUDI ARABIA</span>
                  </>
                ) : isHeroPrimaryTitle && language === 'ar' ? (
                  <>
                    {`\u0642\u0647\u0648\u0629 \u0645\u062e\u062a\u0635\u0629 \u062a\u064f\u062d\u0645\u0651\u0635 \u0628\u0625\u062a\u0642\u0627\u0646 \u0641\u064a `}
                    <span className="title-underline-red">{`\u0639\u064f\u0645\u0627\u0646`}</span>
                    {` \u0648`}
                    <span className="title-underline-green">{`\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629`}</span>
                  </>
                ) : (
                  currentSlideData.title
                )}
              </motion.h1>

              {/* CTA Button */}
              <motion.div
                className="slide-cta flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link
                  to="/products"
                  className={`hero-cta-button inline-block text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide ${
                    isMobile
                      ? 'bg-red-500/60 hover:bg-red-500/70 backdrop-blur-[1px] border border-white/15'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentSlideData.cta}
                </Link>
              </motion.div>

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


