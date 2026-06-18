import React, { useEffect, useMemo, useState } from 'react';
import { getImageUrl, handleImageError } from '../../lib/imageUtils';
import { producerService, type Producer, type ProducerSectionSettings } from '../../services/producerService';
import { useApp } from '../../hooks/useApp';

const fallbackSettings: ProducerSectionSettings = {
  isEnabled: true,
  title: 'OUR COFFEE PRODUCERS',
  backgroundColor: '#111813',
  textColor: '#f8f4ec',
  accentColor: '#c89b63',
  marqueeSpeedSeconds: 24,
  singleLogoSpeedSeconds: 18,
};

const producerSectionCopy = {
  en: {
    eyebrow: 'Directly From The Source',
    title: 'OUR COFFEE PRODUCERS',
  },
  ar: {
    eyebrow: 'مباشرة من المصدر',
    title: 'منتجو القهوة لدينا',
  },
};

const isSafeColor = (value: string | null | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(trimmed) ? trimmed : fallback;
};

export const ProducerHomepageSection: React.FC = () => {
  const { language } = useApp();
  const [settings, setSettings] = useState<ProducerSectionSettings>(fallbackSettings);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isArabic = language === 'ar';

  useEffect(() => {
    let cancelled = false;

    const loadProducers = async () => {
      const [sectionSettingsResult, homepageProducersResult] = await Promise.allSettled([
        producerService.getSectionSettings(),
        producerService.getHomepage(24),
      ]);

      if (cancelled) {
        return;
      }

      if (sectionSettingsResult.status === 'fulfilled') {
        const sectionSettings = sectionSettingsResult.value;
        setSettings({ ...fallbackSettings, ...sectionSettings });
      } else {
        console.error('[ProducerHomepageSection] settings fetch error:', sectionSettingsResult.reason);
        setSettings(fallbackSettings);
      }

      if (homepageProducersResult.status === 'fulfilled') {
        const homepageProducers = homepageProducersResult.value;
        setProducers(Array.isArray(homepageProducers) ? homepageProducers : []);
      } else {
        console.error('[ProducerHomepageSection] producers fetch error:', homepageProducersResult.reason);
        setProducers([]);
      }

      setLoaded(true);
    };

    void loadProducers();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducers = useMemo(
    () => producers.filter((producer) => producer.isActive !== false && producer.isDisplayedOnHomepage !== false),
    [producers],
  );

  const displayItems = useMemo(
    () => {
      if (visibleProducers.length <= 1) {
        return visibleProducers;
      }

      return [...visibleProducers, ...visibleProducers];
    },
    [visibleProducers],
  );

  if (!loaded || !settings.isEnabled || visibleProducers.length === 0) {
    return null;
  }

  const backgroundColor = isSafeColor(settings.backgroundColor, fallbackSettings.backgroundColor);
  const textColor = isSafeColor(settings.textColor, fallbackSettings.textColor);
  const accentColor = isSafeColor(settings.accentColor, fallbackSettings.accentColor);
  const sectionCopy = isArabic ? producerSectionCopy.ar : producerSectionCopy.en;
  const speed = Math.max(
    8,
    visibleProducers.length > 1 ? settings.marqueeSpeedSeconds : settings.singleLogoSpeedSeconds,
  );

  return (
    <div className="bg-[#fbfbf9] pt-8 sm:pt-10 lg:pt-12">
    <section
      className="overflow-hidden py-8 sm:py-9"
      style={{ backgroundColor, color: textColor }}
      dir={isArabic ? 'rtl' : 'ltr'}
      aria-label={settings.title || fallbackSettings.title}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm"
            style={{ color: accentColor }}
          >
            {sectionCopy.eyebrow}
          </p>
          <div
            className="mx-auto mt-2 h-0.5 w-16 rounded-full"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          <h2 className="mt-2 text-[21px] font-semibold uppercase tracking-[0.08em] sm:text-[26px]">
            {isArabic ? 'شركاء سبيريت هَب حول العالم' : settings.title || sectionCopy.title}
          </h2>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
            style={{ background: `linear-gradient(90deg, ${backgroundColor}, transparent)` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
            style={{ background: `linear-gradient(270deg, ${backgroundColor}, transparent)` }}
          />

          <div className="producer-marquee overflow-hidden">
            <div
              key={`${isArabic ? 'rtl' : 'ltr'}-${visibleProducers.length}`}
              className={
                visibleProducers.length === 1
                  ? `producer-single-track ${isArabic ? 'producer-track-rtl' : 'producer-track-ltr'} flex items-stretch`
                  : `producer-marquee-track ${isArabic ? 'producer-track-rtl' : 'producer-track-ltr'} flex w-max items-stretch gap-8 sm:gap-10`
              }
              style={{ animationDuration: `${speed}s` }}
            >
              {displayItems.map((producer, index) => {
                const logoUrl = getImageUrl(producer.logoPath, '/logo.png');
                const name = isArabic && producer.nameAr ? producer.nameAr : producer.name;
                const logo = (
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white p-2.5 shadow-sm ring-1 ring-white/20 sm:h-24 sm:w-24">
                    <img
                      src={logoUrl}
                      alt={name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => handleImageError(event, '/logo.png')}
                    />
                  </div>
                );

                return producer.websiteUrl ? (
                  <a
                    key={`${producer.id}-${index}`}
                    href={producer.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="block shrink-0 rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ color: textColor, '--tw-ring-color': accentColor } as React.CSSProperties}
                  >
                    {logo}
                  </a>
                ) : (
                  <div key={`${producer.id}-${index}`} className="shrink-0">
                    {logo}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .producer-marquee-track {
          animation-name: producer-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .producer-single-track {
          width: 100%;
          direction: ltr;
          animation-name: producer-single-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .producer-marquee:hover .producer-marquee-track,
        .producer-marquee:hover .producer-single-track {
          animation-play-state: paused;
        }

        @keyframes producer-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .producer-marquee-track.producer-track-rtl {
          animation-name: producer-scroll-rtl;
        }

        @keyframes producer-single-scroll {
          from {
            transform: translateX(-120px);
          }
          to {
            transform: translateX(calc(100% + 120px));
          }
        }

        @keyframes producer-scroll-rtl {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        .producer-single-track.producer-track-rtl {
          animation-name: producer-single-scroll-rtl;
        }

        @keyframes producer-single-scroll-rtl {
          from {
            transform: translateX(calc(100% + 120px));
          }
          to {
            transform: translateX(-120px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .producer-marquee-track,
          .producer-single-track {
            animation: none;
            justify-content: center;
          }
        }
      `}</style>
    </section>
    </div>
  );
};

export default ProducerHomepageSection;
