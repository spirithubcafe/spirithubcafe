import React from 'react';
import { Leaf, Globe, Flame, Coffee } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

export const TrustBadgesBar: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const items = [
    {
      Icon: Leaf,
      title: isArabic ? 'حبوب مختصة' : 'Specialty Beans',
      subtitle: isArabic ? 'أصول ونكهات فريدة' : 'Unique origins & flavours',
    },
    {
      Icon: Globe,
      title: isArabic ? 'مصادر مستدامة' : 'Sustainably Sourced',
      subtitle: isArabic ? 'دعم المزارعين' : 'Supporting farmers',
    },
    {
      Icon: Flame,
      title: isArabic ? 'تحميص احترافي' : 'Expertly Roasted',
      subtitle: isArabic ? 'في عُمان' : 'In Oman',
    },
    {
      Icon: Coffee,
      title: isArabic ? 'من الحبة إلى الكوب' : 'From Bean to Cup',
      subtitle: isArabic ? 'مقهى، تجزئة، وجملة' : 'Cafe, retail & wholesale',
    },
  ];

  return (
    <section className="bg-white" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-stone-200 rtl:sm:divide-x-reverse">
          {items.map((item) => (
            <div key={item.title} className="flex items-center gap-3 sm:justify-center sm:px-4">
              <item.Icon className="h-6 w-6 shrink-0 text-amber-600" strokeWidth={1.75} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold leading-tight text-stone-900 sm:text-[0.95rem]">{item.title}</p>
                <p className="text-xs leading-tight text-stone-500">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
