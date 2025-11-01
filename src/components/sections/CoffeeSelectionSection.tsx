import React from 'react';
import { useApp } from '../../hooks/useApp';

export const CoffeeSelectionSection: React.FC = () => {
  const { language } = useApp();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/video/shutterstock.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center text-white">
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold mb-8 uppercase tracking-wide">
            {language === 'ar' 
              ? 'اختيار القهوة'
              : 'COFFEE SELECTION'
            }
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl leading-relaxed mb-10 text-gray-100">
            {language === 'ar'
              ? 'مهمتنا هي إثراء يوم كل عميل بتجربة قهوة مصنوعة يدويًا. من خلال سبيرت هب روستري، نضمن جودة ونكهة استثنائية في كل كوب، من الحبوب المختارة بعناية إلى التحميص الخبير. أينما نخدم، تتألق شغفنا وتفانينا، مما يجعل كل رشفة لا تُنسى.'
              : "Our mission is to enrich each customer's day with a hand-crafted coffee experience. Through SpiritHub Roastery, we guarantee exceptional quality and flavor in every cup, from carefully selected beans to expert roasting. Wherever we serve, our passion and dedication shine through, making every sip unforgettable."
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
