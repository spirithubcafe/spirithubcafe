import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';

export const SustainabilitySection: React.FC = () => {
  const { language } = useApp();

  return (
    <section className="relative py-32 overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(/images/header.webp)' }}>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center text-white">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold mb-8 uppercase tracking-wide">
            {language === 'ar' 
              ? 'الاستدامة، الجودة، الالتزام'
              : 'SUSTAINABILITY, QUALITY, COMMITMENT'
            }
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl leading-relaxed mb-10 text-gray-100">
            {language === 'ar'
              ? 'في سبيرت هب، نؤمن بأن القهوة المختصة تتجاوز مجرد فنجان قهوة، فهي تجربة متكاملة تجمع بين الجودة والاستدامة والحرفية. نحرص على اختيار حبوب قهوة مختصة مزروعة بمسؤولية، مع تطبيق ممارسات تحميص وتعبئة مدروسة تعكس التزامنا تجاه البيئة والمجتمعات التي نتعامل معها، لنقدّم تجربة قهوة استثنائية في كل فنجان.'
              : "At SpiritHub Roastery, we believe specialty coffee should create a meaningful impact beyond the cup. Our philosophy is built on sustainability, quality, and craftsmanship, from ethically sourced coffee beans and responsible roasting practices to carefully crafted coffee experiences that celebrate farmers, communities, and exceptional flavor in every roast."
            }
            <Link to="/about" className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors">
              {language === 'ar' ? 'اعرف المزيد عن قصتنا' : 'Learn more about our story'}
            </Link>
          </p>

          {/* Shop Now Button */}
          <Link
            to="/products"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-md transition-all duration-300 text-base uppercase tracking-wide"
          >
            {language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'}
          </Link>
        </div>
      </div>
    </section>
  );
};
