import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Coffee, Gift, Star, Users, MapPin } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { PageHeader } from '../components/layout/PageHeader';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

interface BranchInfo {
  code: string;
  nameEn: string;
  nameAr: string;
  cityEn: string;
  cityAr: string;
  loyaltyUrl: string;
}

const BRANCHES: Record<string, BranchInfo> = {
  om: {
    code: 'om',
    nameEn: 'Spirit Hub Roastery – Oman',
    nameAr: 'سبيريت هب روستري – عُمان',
    cityEn: 'Muscat, Oman',
    cityAr: 'مسقط، عُمان',
    loyaltyUrl: 'https://spirithubcafe.com/om/loyalty/signup',
  },
  sa: {
    code: 'sa',
    nameEn: 'Spirit Hub Café – Saudi Arabia',
    nameAr: 'سبيريت هب كافيه – السعودية',
    cityEn: 'Al Khobar, Saudi Arabia',
    cityAr: 'الخبر، السعودية',
    loyaltyUrl: 'https://spirithubcafe.com/sa/loyalty/signup',
  },
};



export const LoyaltyPage: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';

  const branch = useMemo(() => BRANCHES[currentRegion.code] ?? BRANCHES.om, [currentRegion.code]);

  const loyaltySignupUrl = branch.loyaltyUrl;

  return (
    <div className={`min-h-screen bg-stone-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      <Seo
        title={isArabic ? 'برنامج الولاء | SpiritHub' : 'Loyalty Program | SpiritHub'}
        description={
          isArabic
            ? 'انضم لبرنامج الولاء واحصل على مكافآت حصرية مع كل عملية شراء.'
            : 'Join our Loyalty Program and earn exclusive rewards with every purchase.'
        }
        canonical={`${siteMetadata.baseUrl}/loyalty`}
        type="website"
      />

      <PageHeader
        title="Loyalty Program"
        titleAr="برنامج الولاء"
        subtitle="Earn points, unlock rewards, and enjoy exclusive perks with every sip."
        subtitleAr="اجمع النقاط، افتح المكافآت، واستمتع بمزايا حصرية مع كل رشفة."
      />

      <div className="mx-auto max-w-6xl px-4 py-12 space-y-16">

        {/* ── Branch Info Card ── */}
        <section className="flex flex-col items-center space-y-6">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-stone-800 to-stone-900 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Coffee className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isArabic ? branch.nameAr : branch.nameEn}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                    <MapPin className="h-3 w-3" />
                    {isArabic ? branch.cityAr : branch.cityEn}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 text-center">
              <p className="text-xs text-stone-500">
                {isArabic
                  ? `أنت تتصفح فرع ${branch.cityAr}. سيتم تسجيلك في برنامج الولاء لهذا الفرع.`
                  : `You are browsing the ${branch.cityEn} branch. You will be enrolled in this branch's loyalty program.`}
              </p>
            </div>
          </div>
        </section>

        {/* ── QR Code Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
              {isArabic ? 'امسح للانضمام' : 'Scan to Join'}
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              {isArabic
                ? `امسح رمز QR بهاتفك للتسجيل في برنامج ولاء فرع ${branch.cityAr}`
                : `Scan this QR code with your phone to join the ${branch.cityEn} loyalty program.`}
            </p>
          </div>

          {/* Large QR Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-stone-700 to-stone-900 opacity-10 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-8 shadow-2xl sm:p-12">
              {/* Branch badge */}
              <div className="mb-6 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-stone-800 to-stone-900 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                  <Coffee className="h-3.5 w-3.5" />
                  {isArabic ? branch.nameAr : branch.nameEn}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-4 sm:p-6">
                  <QRCodeSVG
                    value={loyaltySignupUrl}
                    size={280}
                    bgColor="#ffffff"
                    fgColor="#1c1917"
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: 'https://www.spirithubcafe.com/logo.png',
                      height: 56,
                      width: 56,
                      excavate: true,
                    }}
                  />
                </div>
              </div>

              {/* Caption */}
              <p className="mt-6 text-center text-xs text-stone-400">
                {isArabic
                  ? 'وجّه كاميرا هاتفك نحو الرمز للتسجيل مباشرة'
                  : 'Point your phone camera at the code to sign up instantly'}
              </p>

              {/* Decorative dots */}
              <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1 opacity-20">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-stone-400" />
                ))}
              </div>
              <div className="absolute top-4 right-4 grid grid-cols-3 gap-1 opacity-20">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-stone-400" />
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── How It Works ── */}
        <section className="space-y-8">
          <h2 className="text-center text-2xl font-bold text-stone-900 md:text-3xl">
            {isArabic ? 'كيف يعمل البرنامج؟' : 'How It Works'}
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                titleEn: 'Sign Up',
                titleAr: 'سجّل الآن',
                descEn: 'Scan the QR code or visit the link to create your loyalty account in seconds.',
                descAr: 'امسح رمز QR أو زر الرابط لإنشاء حساب الولاء الخاص بك في ثوانٍ.',
                icon: Users,
              },
              {
                step: '02',
                titleEn: 'Earn Points',
                titleAr: 'اجمع النقاط',
                descEn: 'Get 1 point for every 100 Baisa spent. Points accumulate across all visits.',
                descAr: 'احصل على نقطة واحدة مقابل كل 100 بيسة. النقاط تتراكم مع كل زيارة.',
                icon: Star,
              },
              {
                step: '03',
                titleEn: 'Redeem Rewards',
                titleAr: 'استبدل المكافآت',
                descEn: 'Use your points for free drinks, discounts, exclusive merch, and more.',
                descAr: 'استخدم نقاطك للحصول على مشروبات مجانية وخصومات ومنتجات حصرية.',
                icon: Gift,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Number(item.step) * 0.1 }}
                  className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <span className="absolute -top-3 left-4 rtl:left-auto rtl:right-4 rounded-full bg-stone-900 px-3 py-0.5 text-[10px] font-bold text-white">
                    {item.step}
                  </span>
                  <div className="flex items-start gap-4 pt-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        {isArabic ? item.titleAr : item.titleEn}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-stone-500">
                        {isArabic ? item.descAr : item.descEn}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Your Reward ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
              {isArabic ? 'مكافأتك' : 'Your Reward'}
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              {isArabic
                ? 'اجمع النقاط واحصل على قهوة مجانية!'
                : 'Collect points and get a free coffee!'}
            </p>
          </div>

          <div className="mx-auto max-w-lg">
            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-stone-50 p-8 shadow-lg sm:p-10">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-200/50 overflow-hidden">
                  <img src="https://www.spirithubcafe.com/logo.png" alt="Spirit Hub" className="h-14 w-14 object-contain" />
                </div>
              </div>

              {/* Main message */}
              <div className="text-center space-y-4">
                <div className="space-y-1">
                  <p className="text-4xl font-extrabold text-stone-900 sm:text-5xl">8</p>
                  <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                    {isArabic ? 'نقاط' : 'Points'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-amber-300" />
                  <span className="text-xl text-amber-600">=</span>
                  <span className="h-px w-8 bg-amber-300" />
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-bold text-stone-900 sm:text-xl">
                    {isArabic ? '☕ قهوة مجانية واحدة' : '☕ 1 Free Coffee'}
                  </p>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                    {isArabic
                      ? 'كل ما تحتاجه هو جمع 8 نقاط للحصول على قهوة مجانية هدية منّا إليك!'
                      : 'Simply collect 8 points and enjoy a free coffee on us — it\'s our treat!'}
                  </p>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1 opacity-15">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-amber-400" />
                ))}
              </div>
              <div className="absolute top-4 right-4 grid grid-cols-3 gap-1 opacity-15">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default LoyaltyPage;
