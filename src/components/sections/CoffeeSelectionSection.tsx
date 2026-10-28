import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../hooks/useApp';
import { CoffeeBeansCanvas } from '../three/CoffeeBeansCanvas';
import { homepageContainerClassName } from './homepageSectionSpacing';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';

export const CoffeeSelectionSection: React.FC = () => {
  const { language } = useApp();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const regionPrefix = location.pathname.startsWith('/sa') ? '/sa' : '/om';

  // Text rises gently into place; with reduced motion it is simply shown.
  const reveal = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.4 },
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative isolate overflow-hidden bg-[#120a06] bg-[radial-gradient(ellipse_at_50%_40%,#4a2b18_0%,#22130b_45%,#0d0705_100%)]">
      {/* Roasted coffee beans floating in 3D (progressive enhancement; the gradient is the fallback). */}
      <CoffeeBeansCanvas />

      {/* Vignette keeps the copy readable over the moving beans. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,7,5,0.72)_0%,rgba(13,7,5,0.35)_45%,rgba(13,7,5,0.1)_75%)]"
        aria-hidden="true"
      />

      <div className={homepageContainerClassName('relative z-10 py-24 sm:py-32')}>
        <div className="max-w-5xl mx-auto text-center text-white">
          <motion.p
            className={`mb-4 inline-flex items-center gap-2 text-[12px] font-semibold text-[#e3c196] ${language === 'ar' ? '' : 'uppercase tracking-[0.18em]'}`}
            {...reveal(0)}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#c69c6d]" />
            {language === 'ar' ? 'محمصة سبيريت هب' : 'SpiritHub Roastery'}
          </motion.p>
          <motion.h2
            className={`mb-6 text-[34px] font-semibold leading-[1.1] sm:text-[56px] ${language === 'ar' ? '' : 'tracking-[-0.02em]'}`}
            {...reveal(0.06)}
          >
            {language === 'ar' ? 'اختيار القهوة' : 'Coffee Selection'}
          </motion.h2>

          <motion.p
            className="mx-auto mb-10 max-w-3xl text-[16px] leading-7 text-white/75 md:text-lg md:leading-8"
            {...reveal(0.12)}
          >
            {language === 'ar'
              ? 'مهمتنا هي إثراء يوم كل عميل بتجربة قهوة مصنوعة يدويًا. من خلال سبيرت هب روستري، نضمن جودة ونكهة استثنائية في كل كوب، من الحبوب المختارة بعناية إلى التحميص الخبير. أينما نخدم، تتألق شغفنا وتفانينا، مما يجعل كل رشفة لا تُنسى.'
              : "Explore SpiritHub Roastery’s curated world of specialty coffee, from espresso blends and pour-over selections to premium coffee capsules and curated gift bundles. Freshly roasted in Oman and Saudi Arabia, each coffee is carefully selected for exceptional quality, distinctive character, and an unforgettable coffee experience."
            }
          </motion.p>

          <motion.div {...reveal(0.24)}>
            <Link
              to={`${regionPrefix}/products`}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#c69c6d] px-6 text-[15px] font-semibold text-stone-950 transition-[background-color,transform] duration-200 hover:bg-[#d4ad80] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:active:scale-100"
            >
              {language === 'ar' ? 'تسوق الآن' : 'Shop now'}
              <AnimatedIcon name="arrow-right" className={`size-4 ${language === 'ar' ? '-scale-x-100' : ''}`} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
