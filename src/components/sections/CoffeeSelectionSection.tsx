import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../hooks/useApp';
import { CoffeeBeansCanvas } from '../three/CoffeeBeansCanvas';

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

      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="max-w-5xl mx-auto text-center text-white">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-8 uppercase tracking-wide"
            {...reveal(0)}
          >
            {language === 'ar' ? 'اختيار القهوة' : 'COFFEE SELECTION'}
          </motion.h2>

          <motion.p
            className="text-lg md:text-xl leading-relaxed mb-10 text-gray-100"
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
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(239,68,68,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
