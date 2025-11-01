import React from 'react';
import { useApp } from '../../hooks/useApp';

export const SustainabilitySection: React.FC = () => {
  const { language } = useApp();

  return (
    <section className="relative py-32 overflow-hidden bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(/images/back.jpg)' }}>
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
              ? 'في سبيرت هب روستري، فلسفتنا مبنية على ثلاث ركائز: الاستدامة والجودة والالتزام. نؤمن بخلق تجربة قهوة تدعم الناس وتحافظ على الطبيعة وتحتفي بالحرفية. من الحصول على حبوب منزرعة أخلاقياً إلى تقليل النفايات في عملية التحميص والتعبئة، كل خطوة تعكس مسؤوليتنا تجاه الكوكب والمجتمعات التي نعمل معها.'
              : 'At SpiritHub Roastery, our philosophy is built on three pillars: Sustainability, Quality, and Commitment. We believe in creating a coffee experience that supports people, preserves nature, and celebrates craftsmanship. From sourcing ethically grown beans to minimizing waste in our roasting and packaging process, every step reflects our responsibility toward the planet and the communities we work with.'
            }
          </p>

          {/* Shop Now Button */}
          <a
            href="/#products"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-4 rounded-md transition-all duration-300 text-lg uppercase tracking-wide"
          >
            {language === 'ar' ? 'تسوق الآن' : 'SHOP NOW'}
          </a>
        </div>
      </div>
    </section>
  );
};
