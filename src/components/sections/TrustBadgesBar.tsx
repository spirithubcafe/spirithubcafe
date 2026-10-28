import React from 'react';
import { Leaf, Globe, Flame, Coffee } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { homepageContainerClassName } from './homepageSectionSpacing';

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
      <div className={homepageContainerClassName('py-5 sm:py-8')}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item) => (
            <li key={item.title} className="flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-3 ring-1 ring-stone-200/60 sm:px-4 sm:py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#8b6f47] ring-1 ring-stone-200/70">
                <item.Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-5 text-stone-900 sm:text-[14px]">{item.title}</p>
                <p className="truncate text-[12px] leading-4 text-stone-500">{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
