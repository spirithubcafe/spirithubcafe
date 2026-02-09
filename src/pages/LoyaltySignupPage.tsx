import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useRegion } from '../hooks/useRegion';
import { PageHeader } from '../components/layout/PageHeader';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import {
  CountryCodePicker,
  getDefaultCountry,
  getCountryByCode,
  type Country,
} from '../components/ui/CountryCodePicker';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export const LoyaltySignupPage: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const isArabic = language === 'ar';

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    const regionMap: Record<string, string> = { om: 'OM', sa: 'SA' };
    return getCountryByCode(regionMap[currentRegion.code] ?? 'OM') ?? getDefaultCountry();
  });

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setFormData((prev) => ({ ...prev, phone: '' }));
    setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = isArabic ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = isArabic ? 'رقم الموبايل مطلوب' : 'Mobile number is required';
    } else {
      const digits = formData.phone.replace(/[\s\-]/g, '');
      if (!/^[0-9]+$/.test(digits) || digits.length < 7 || digits.length > selectedCountry.maxDigits) {
        newErrors.phone = isArabic ? 'رقم الموبايل غير صالح' : 'Invalid mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (field === 'phone') {
      value = value.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate submission (replace with real API call)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className={`min-h-screen bg-stone-50 ${isArabic ? 'rtl' : 'ltr'}`}>
      <Seo
        title={isArabic ? 'تسجيل في برنامج الولاء | SpiritHub' : 'Loyalty Signup | SpiritHub'}
        description={
          isArabic
            ? 'سجّل في برنامج الولاء واحصل على نقاط ومكافآت مع كل عملية شراء.'
            : 'Sign up for our Loyalty Program and earn points and rewards with every purchase.'
        }
        canonical={`${siteMetadata.baseUrl}/loyalty/signup`}
        type="website"
      />

      <PageHeader
        title="Loyalty Signup"
        titleAr="تسجيل في برنامج الولاء"
        subtitle="Create your loyalty account and start earning rewards."
        subtitleAr="أنشئ حساب الولاء الخاص بك وابدأ بجمع المكافآت."
      />

      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Back to loyalty */}
        <Link
          to={`/${currentRegion.code}/loyalty`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-stone-500 transition hover:text-amber-600"
        >
          <BackArrow className="h-4 w-4" />
          {isArabic ? 'العودة لبرنامج الولاء' : 'Back to Loyalty Program'}
        </Link>

        {isSuccess ? (
          /* ── Success State ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-green-200/60 bg-gradient-to-br from-green-50 via-white to-green-50 p-8 text-center shadow-lg sm:p-10"
          >
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-200/50">
                <CheckCircle className="h-10 w-10" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              {isArabic ? 'تم التسجيل بنجاح! 🎉' : 'You\'re In! 🎉'}
            </h2>
            <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto leading-relaxed">
              {isArabic
                ? 'تم إنشاء حسابك في برنامج الولاء بنجاح. ابدأ بجمع النقاط من زيارتك القادمة!'
                : 'Your loyalty account has been created successfully. Start earning points from your next visit!'}
            </p>

            <div className="space-y-3">
              <Link to={`/${currentRegion.code}/loyalty`}>
                <Button className="w-full bg-stone-900 text-white hover:bg-stone-800">
                  {isArabic ? 'العودة لبرنامج الولاء' : 'Back to Loyalty Program'}
                </Button>
              </Link>
              <Link to={`/${currentRegion.code}/`}>
                <Button variant="outline" className="w-full mt-2">
                  {isArabic ? 'تصفح المتجر' : 'Browse Store'}
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Signup Form ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-8 shadow-lg sm:p-10">
              {/* Decorative top bar */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700" />

              {/* Logo */}
              <div className="flex justify-center mb-6 pt-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-200/50 overflow-hidden">
                  <img
                    src="https://www.spirithubcafe.com/logo.png"
                    alt="Spirit Hub"
                    className="h-11 w-11 object-contain"
                  />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
                  {isArabic ? 'إنشاء حساب الولاء' : 'Create Your Account'}
                </h2>
                <p className="mt-1 text-xs text-stone-400">
                  {isArabic
                    ? 'املأ البيانات أدناه للانضمام لبرنامج الولاء'
                    : 'Fill in the details below to join our loyalty program'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="flex items-center gap-2 text-sm font-medium text-stone-700"
                  >
                    <User className="h-4 w-4 text-stone-400" />
                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    value={formData.fullName}
                    onChange={handleChange('fullName')}
                    className={`h-12 rounded-xl border-stone-200 bg-stone-50 px-4 text-sm transition focus:border-amber-500 focus:bg-white focus:ring-amber-500/20 ${
                      errors.fullName ? 'border-red-400 bg-red-50/50' : ''
                    }`}
                    dir={isArabic ? 'rtl' : 'ltr'}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="flex items-center gap-2 text-sm font-medium text-stone-700"
                  >
                    <Phone className="h-4 w-4 text-stone-400" />
                    {isArabic ? 'رقم الموبايل' : 'Mobile Number'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2" dir="ltr">
                    <CountryCodePicker
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      disabled={isSubmitting}
                      isArabic={isArabic}
                      compact
                    />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={selectedCountry.maxDigits}
                      placeholder={selectedCountry.code === 'OM' ? '9XXXXXXX' : selectedCountry.code === 'SA' ? '5XXXXXXXX' : '...'}
                      value={formData.phone}
                      onChange={handleChange('phone')}
                      className={`h-12 flex-1 rounded-xl border-stone-200 bg-stone-50 px-4 text-sm transition focus:border-amber-500 focus:bg-white focus:ring-amber-500/20 ${
                        errors.phone ? 'border-red-400 bg-red-50/50' : ''
                      }`}
                      dir="ltr"
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium text-stone-700"
                  >
                    <Mail className="h-4 w-4 text-stone-400" />
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    <span className="text-[10px] font-normal text-stone-400">
                      ({isArabic ? 'اختياري' : 'Optional'})
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={isArabic ? 'example@email.com' : 'example@email.com'}
                    value={formData.email}
                    onChange={handleChange('email')}
                    className="h-12 rounded-xl border-stone-200 bg-stone-50 px-4 text-sm transition focus:border-amber-500 focus:bg-white focus:ring-amber-500/20"
                    dir="ltr"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled
                  className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 text-sm font-semibold text-white shadow-md transition hover:from-stone-700 hover:to-stone-800 disabled:opacity-60"
                >
                  {isArabic ? 'قريباً...' : 'Coming Soon...'}
                </Button>
              </form>

              {/* Footer note */}
              <p className="mt-6 text-center text-[11px] text-stone-400 leading-relaxed">
                {isArabic
                  ? 'بتسجيلك فإنك توافق على شروط وأحكام برنامج الولاء.'
                  : 'By signing up, you agree to the terms and conditions of our loyalty program.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoyaltySignupPage;
