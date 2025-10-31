import React from 'react';
import { useTranslation } from 'react-i18next';
import { Coffee, Heart, Star } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Coffee,
      title: t('language') === 'ar' ? 'قهوة مميزة' : 'Premium Coffee',
      description: t('language') === 'ar' 
        ? 'نقدم أجود أنواع القهوة المحمصة بعناية من أفضل المزارع حول العالم'
        : 'We serve the finest carefully roasted coffee from the best farms around the world'
    },
    {
      icon: Heart,
      title: t('language') === 'ar' ? 'صنع بحب' : 'Made with Love',
      description: t('language') === 'ar'
        ? 'كل كوب قهوة نقدمه محضر بحب وعناية لضمان أفضل تجربة لعملائنا'
        : 'Every cup we serve is prepared with love and care to ensure the best experience for our customers'
    },
    {
      icon: Star,
      title: t('language') === 'ar' ? 'جودة عالية' : 'High Quality',
      description: t('language') === 'ar'
        ? 'نلتزم بأعلى معايير الجودة في كل مرحلة من مراحل تحضير القهوة'
        : 'We are committed to the highest quality standards at every stage of coffee preparation'
    }
  ];

  return (
    <section id="about" className="py-16 bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('sections.aboutUs')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('language') === 'ar' 
              ? 'سبيريت هب هو المكان المثالي لعشاق القهوة الذين يبحثون عن تجربة استثنائية. نحن نؤمن بأن القهوة ليست مجرد مشروب، بل هي لحظة من السعادة والدفء في كل رشفة.'
              : 'Spirit Hub Cafe is the perfect place for coffee lovers seeking an exceptional experience. We believe that coffee is not just a drink, but a moment of happiness and warmth in every sip.'
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-200 transition-colors duration-300">
                <feature.icon className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">500+</div>
              <div className="text-gray-600">
                {t('language') === 'ar' ? 'عميل سعيد' : 'Happy Customers'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">50+</div>
              <div className="text-gray-600">
                {t('language') === 'ar' ? 'نوع قهوة' : 'Coffee Types'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">5</div>
              <div className="text-gray-600">
                {t('language') === 'ar' ? 'سنوات خبرة' : 'Years Experience'}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-2">100%</div>
              <div className="text-gray-600">
                {t('language') === 'ar' ? 'جودة مضمونة' : 'Quality Guaranteed'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};