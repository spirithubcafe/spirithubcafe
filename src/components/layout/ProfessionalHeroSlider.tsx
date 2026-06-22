import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const MOBILE_HERO_IMAGES = [
  '/images/products/spirithub-mobile-hero-colombia-typica-watermelon-new-harvest.webp',
  '/images/products/spirithub-mobile-hero-ethiopia-agamosa-gotiti-new-harvest.webp',
  '/images/products/spirithub-mobile-hero-indonesia-black-orchid-new-harvest.webp',
];

const MOBILE_HERO_IMAGE_ALTS = [
  'SpiritHub Colombia Typica Watermelon new harvest specialty coffee',
  'SpiritHub Ethiopia Agamosa Gotiti new harvest specialty coffee',
  'SpiritHub Indonesia Black Orchid new harvest specialty coffee',
];

const NEW_HARVEST_MOBILE_IMAGE_COUNT = 3;

// Kept for future re-enable of mobile hero video without changing current image-only behavior.
const MOBILE_HERO_VIDEO_SRC = '/video/spirithub-specialty-coffee-roastery-mobile-banner.mp4';
const USE_MOBILE_HERO_VIDEO = false;

export const ProfessionalHeroSlider: React.FC = () => {
  // const { t } = useTranslation(); // Removed unused import
  const { language } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [autoPlayReady, setAutoPlayReady] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hoverZone, setHoverZone] = useState<'left' | 'right' | null>(null);
  const [overInteractive, setOverInteractive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const mouseMoveRafRef = useRef<number | null>(null);

  // Check if device is mobile
  useEffect(() => {
    let rafId: number | null = null;

    const checkIsMobile = () => {
      const nextIsMobile = window.innerWidth <= 768;
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
    if (!autoPlayReady || !isMobile || USE_MOBILE_HERO_VIDEO || MOBILE_HERO_IMAGES.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMobileImageIndex((prev) => (prev + 1) % MOBILE_HERO_IMAGES.length);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoPlayReady, isMobile]);

  useEffect(() => {
    if (!autoPlayReady || !isMobile || USE_MOBILE_HERO_VIDEO || MOBILE_HERO_IMAGES.length <= 1) {
      return;
    }

    const preloadLaterImages = () => {
      MOBILE_HERO_IMAGES.slice(1).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number })
        .requestIdleCallback(preloadLaterImages, { timeout: 3000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = globalThis.setTimeout(preloadLaterImages, 2500);
    return () => globalThis.clearTimeout(timeoutId);
  }, [autoPlayReady, isMobile]);

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
      subtitle: language === 'ar'
        ? 'حبوب مختصة محمصة بإتقان، تكريمًا لقصة كل منتج.'
        : 'Specialty beans, expertly roasted to honor every producer\'s story.',
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
      subtitle: language === 'ar'
        ? 'تحضير صديق للبيئة، لفنجان أنقى وأغنى نكهة.'
        : 'Eco-friendly brewing, crafted for a cleaner, richer cup.',
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
      subtitle: language === 'ar'
        ? 'خمس خلطات كبسولات استثنائية، نكهة أصيلة في كل فنجان.'
        : 'Five exceptional capsule blends, authentic flavor in every cup.',
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
      subtitle: language === 'ar'
        ? 'من مرتفعات اليمن العريقة إلى محمصتنا، قصة في كل حبة.'
        : 'From Yemen\'s ancient highlands to our roastery, a story in every bean.',
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
      subtitle: language === 'ar'
        ? 'هدايا مختارة وباقات اكتشاف لكل ذوق ومناسبة.'
        : 'Curated gifts & discovery bundles for every taste and occasion.',
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
      subtitle: language === 'ar'
        ? 'كولد برو منقوع ببطء لنكهة عميقة وقوام ناعم.'
        : 'Cold brew, slow-steeped for deep flavor and a silky finish.',
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
      subtitle: language === 'ar'
        ? 'مُعزز بالنيتروجين لقوام كريمي منعش لا مثيل له.'
        : 'Nitrogen-infused for a smooth, creamy, refreshing brew.',
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
    if (autoPlayReady && isPlaying && !isHovered && !isMobile && slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [autoPlayReady, isPlaying, isHovered, isMobile, slides.length]);

  useEffect(() => {
    let timeoutId: number | null = null;

    const enableAutoPlay = () => {
      setAutoPlayReady(true);
      cleanup();
    };

    const cleanup = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      window.removeEventListener('pointerdown', enableAutoPlay);
      window.removeEventListener('keydown', enableAutoPlay);
      window.removeEventListener('touchstart', enableAutoPlay);
    };

    window.addEventListener('pointerdown', enableAutoPlay, { passive: true, once: true });
    window.addEventListener('keydown', enableAutoPlay, { once: true });
    window.addEventListener('touchstart', enableAutoPlay, { passive: true, once: true });
    timeoutId = window.setTimeout(enableAutoPlay, 16000);

    return cleanup;
  }, []);

  // Reset currentSlide when slides array changes (mobile/desktop switch)
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (mouseMoveRafRef.current !== null) {
        cancelAnimationFrame(mouseMoveRafRef.current);
      }
    };
  }, []);

  const currentSlideData = slides[currentSlide];
  const isHeroPrimaryTitle = currentSlideData?.id === '1';
  const safeMobileImageIndex = mobileImageIndex % MOBILE_HERO_IMAGES.length;
  const currentMobileHeroImage = MOBILE_HERO_IMAGES[safeMobileImageIndex];
  const currentHeroImageAlt = isMobile
    ? MOBILE_HERO_IMAGE_ALTS[safeMobileImageIndex] ?? currentSlideData.title
    : currentSlideData.title;
  const currentHeroImageSrc = isMobile ? currentMobileHeroImage : currentSlideData.image;
  const isNewHarvestMobileImage = isMobile && safeMobileImageIndex < NEW_HARVEST_MOBILE_IMAGE_COUNT;

  // Function to go to next slide - only on desktop
  const nextSlide = () => {
    if (!isMobile && slides.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  };

  // Function to go to previous slide - only on desktop
  const prevSlide = () => {
    if (!isMobile && slides.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const navEnabled = !isMobile && slides.length > 1;

  const handleSliderMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!navEnabled) return;

    // Throttle using requestAnimationFrame to reduce forced reflows
    if (mouseMoveRafRef.current !== null) {
      cancelAnimationFrame(mouseMoveRafRef.current);
    }

    mouseMoveRafRef.current = requestAnimationFrame(() => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      setCursorPos({ x, y: e.clientY - rect.top });
      setHoverZone(x < rect.width / 2 ? 'left' : 'right');
      mouseMoveRafRef.current = null;
    });
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!navEnabled) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      prevSlide();
    } else {
      nextSlide();
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
      ref={sectionRef}
      className={`professional-hero-slider ${navEnabled ? 'slider--interactive' : ''}`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovered(false);
          setHoverZone(null);
          setOverInteractive(false);
        }
      }}
      onMouseMove={handleSliderMouseMove}
      onClick={navEnabled ? handleSliderClick : undefined}
    >
      {/* Background Images/Video with Fade Effect */}
      <div className="slider-backgrounds">
        <div
          key={isMobile ? currentMobileHeroImage : currentSlide}
          className={`slide-background ${!isMobile && currentSlide !== 0 ? 'slide-background--fade' : ''}`.trim()}
        >
          {isMobile && USE_MOBILE_HERO_VIDEO ? (
            <video
              className="background-video"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={MOBILE_HERO_IMAGES[0]}
            >
              <source src={MOBILE_HERO_VIDEO_SRC} type="video/mp4" />
            </video>
          ) : (
            <picture className="background-picture">
              <source
                media="(max-width: 768px)"
                srcSet={currentMobileHeroImage}
              />
              <img
                src={currentHeroImageSrc}
                alt={currentHeroImageAlt}
                className={`background-image ${currentSlideData.imageClassName ?? ''}`.trim()}
                fetchPriority={currentSlide === 0 ? 'high' : 'auto'}
                loading={currentSlide === 0 ? 'eager' : 'lazy'}
                sizes="100vw"
                decoding="async"
              />
            </picture>
          )}
          <div className={`background-overlay ${currentSlideData.overlayClassName ?? ''}`.trim()} />
        </div>
      </div>

      {/* Edge navigation hints */}
      {navEnabled && (
        <>
          <div
            className={`slider-edge-hint slider-edge-hint--left ${hoverZone === 'left' && !overInteractive ? 'is-active' : ''}`}
            aria-hidden="true"
          />
          <div
            className={`slider-edge-hint slider-edge-hint--right ${hoverZone === 'right' && !overInteractive ? 'is-active' : ''}`}
            aria-hidden="true"
          />
        </>
      )}

      {/* Custom directional cursor */}
      {navEnabled && hoverZone && !overInteractive && (
        <div
          className={`slider-cursor slider-cursor--${hoverZone}`}
          style={{ left: cursorPos.x, top: cursorPos.y }}
          aria-hidden="true"
        >
          {hoverZone === 'left' ? (
            <ChevronLeft className="slider-cursor-icon" strokeWidth={2.5} />
          ) : (
            <ChevronRight className="slider-cursor-icon" strokeWidth={2.5} />
          )}
        </div>
      )}

      {/* Main Content Container */}
      <div className="slider-content-container">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="w-full items-center">
            
            {/* Content - Centered */}
            <div
              key={`content-${currentSlide}`}
              className="content-section max-w-4xl mx-auto text-center"
            >
              {/* Main Title */}
              {!isNewHarvestMobileImage && (
                <h1 className="slide-title">
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
                </h1>
              )}

              {/* CTA Button */}
              <div className="slide-cta flex justify-center">
                <Link
                  to="/products"
                  className={`hero-cta-button inline-block text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide ${
                    isMobile
                      ? 'bg-red-500/60 hover:bg-red-500/70 backdrop-blur-[1px] border border-white/15'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => setOverInteractive(true)}
                  onMouseLeave={() => setOverInteractive(false)}
                >
                  {currentSlideData.cta}
                </Link>
              </div>

              {/* Subtitle */}
              <div className="slide-subtitle">
                {Array.isArray(currentSlideData.subtitle) ? (
                  currentSlideData.subtitle.map((line, index) => (
                    <div key={index} className="subtitle-line">
                      {line}
                    </div>
                  ))
                ) : (
                  currentSlideData.subtitle
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators - only show on desktop or when multiple slides */}
      {(!isMobile && slides.length > 1) && (
        <div
          className="slide-indicators"
          onMouseEnter={() => setOverInteractive(true)}
          onMouseLeave={() => setOverInteractive(false)}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              aria-label={`${language === 'ar' ? 'انتقل إلى الشريحة' : 'Go to slide'} ${index + 1}`}
              aria-current={index === currentSlide ? 'true' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(index);
              }}
            >
              <div className="indicator-progress">
                <div
                  className={`progress-fill ${
                    index === currentSlide && autoPlayReady && isPlaying && !isHovered ? 'progress-fill--active' : ''
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};



