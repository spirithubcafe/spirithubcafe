import React, { useEffect, useRef, useState } from 'react';
import { usePhoneAuth } from '../../hooks/usePhoneAuth';
import { whatsappService } from '../../services/whatsappService';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AuthError } from './AuthUi';
import { authFieldClass, authLabelClass, authLinkClass, authPrimaryButtonClass } from './authStyles';
import { Spinner } from '../ui/spinner';
import {
  CountryCodePicker,
  getDefaultCountry,
  type Country,
} from '../ui/CountryCodePicker';
import { 
  Phone, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

interface PhoneLoginFormProps {
  onSuccess?: () => void;
  onSwitchToEmail?: () => void;
}

export const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({
  onSuccess,
  onSwitchToEmail,
}) => {
  const { language } = useApp();
  const isRTL = language === 'ar';
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry);

  const {
    step,
    phoneNumber,
    otpCode,
    isNewUser,
    loading,
    error,
    countdown,
    setPhoneNumber,
    setOtpCode,
    setCountryDialCode,
    requestOtp,
    verifyOtp,
    resendOtp,
    goBack,
  } = usePhoneAuth();

  // Sync country code with hook
  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setCountryDialCode(country.dialCode);
    setPhoneNumber('');
  };

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= selectedCountry.maxDigits) {
      setPhoneNumber(value);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '');
    // Limit to 6 digits
    if (value.length <= 6) {
      setOtpCode(value);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await verifyOtp();
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleResendOtp = async () => {
    await resendOtp();
  };

  const texts = {
    en: {
      title: 'Login with Phone',
      subtitle: 'Enter your mobile number to receive a verification code via WhatsApp',
      phoneLabel: 'Mobile Number',
      phonePlaceholder: selectedCountry.code === 'OM' ? '92506030' : '5XXXXXXXX',
      requestOtp: 'Get Verification Code',
      sending: 'Sending...',
      otpTitle: 'Verification Code',
      otpSubtitle: 'Enter the 6-digit code sent to',
      otpLabel: '6-digit Code',
      otpPlaceholder: '------',
      verifying: 'Verifying...',
      verify: 'Verify & Login',
      changeNumber: 'Change number',
      resend: 'Resend code',
      resendIn: 'Resend in',
      seconds: 's',
      newUser: '🎉 A new account will be created for you',
      whatsappNote: 'Verification code will be sent via WhatsApp',
      noWhatsapp: 'If you don\'t have WhatsApp, use other login methods',
      orUseEmail: 'or login with email',
    },
    ar: {
      title: 'تسجيل الدخول بالهاتف',
      subtitle: 'أدخل رقم هاتفك المحمول لتلقي رمز التحقق عبر واتساب',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: selectedCountry.code === 'OM' ? '92506030' : '5XXXXXXXX',
      requestOtp: 'الحصول على رمز التحقق',
      sending: 'جاري الإرسال...',
      otpTitle: 'رمز التحقق',
      otpSubtitle: 'أدخل الرمز المكون من 6 أرقام المرسل إلى',
      otpLabel: 'رمز مكون من 6 أرقام',
      otpPlaceholder: '------',
      verifying: 'جاري التحقق...',
      verify: 'تحقق وسجل الدخول',
      changeNumber: 'تغيير الرقم',
      resend: 'إعادة إرسال الرمز',
      resendIn: 'إعادة الإرسال خلال',
      seconds: 'ث',
      newUser: '🎉 سيتم إنشاء حساب جديد لك',
      whatsappNote: 'سيتم إرسال رمز التحقق عبر واتساب',
      noWhatsapp: 'إذا لم يكن لديك واتساب، استخدم طرق تسجيل الدخول الأخرى',
      orUseEmail: 'أو تسجيل الدخول بالبريد الإلكتروني',
    },
  };

  const copy = isRTL ? texts.ar : texts.en;

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {error && <div className="mb-4"><AuthError>{error}</AuthError></div>}

      {step === 'phone' ? (
        /* Phone Number Step */
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-3.5 ring-1 ring-emerald-100">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 ring-1 ring-emerald-100">
              <Phone className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-stone-900">{copy.title}</h3>
              <p className="mt-0.5 text-[13px] leading-5 text-stone-500">{copy.subtitle}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className={authLabelClass}>
              {copy.phoneLabel}
            </Label>
            <div className="flex gap-2" dir="ltr">
              <CountryCodePicker
                value={selectedCountry}
                onChange={handleCountryChange}
                disabled={loading}
                isArabic={isRTL}
                compact
              />
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={selectedCountry.maxDigits}
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={copy.phonePlaceholder}
                disabled={loading}
                className={`${authFieldClass} flex-1 text-left`}
                dir="ltr"
                autoComplete="tel"
              />
            </div>
            <div className="min-h-[20px]">
              {phoneNumber && whatsappService.isValidPhone(phoneNumber, selectedCountry.maxDigits, selectedCountry.startsWith) && (
                <p className="flex items-center gap-1 text-[12px] text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {whatsappService.formatPhoneDisplay(phoneNumber, selectedCountry.dialCode)}
                </p>
              )}
              {phoneNumber && !whatsappService.isValidPhone(phoneNumber, selectedCountry.maxDigits, selectedCountry.startsWith) && (
                <p className="text-[12px] text-stone-500">
                  {isRTL
                    ? `أدخل ${selectedCountry.maxDigits} أرقام${selectedCountry.startsWith ? ` تبدأ بـ ${selectedCountry.startsWith}` : ''}`
                    : `Enter ${selectedCountry.maxDigits} digits${selectedCountry.startsWith ? ` starting with ${selectedCountry.startsWith}` : ''}`}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className={authPrimaryButtonClass}
            disabled={loading || !whatsappService.isValidPhone(phoneNumber, selectedCountry.maxDigits, selectedCountry.startsWith)}
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                {copy.sending}
              </>
            ) : (
              <>
                <svg className="size-5 text-[#25D366]" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {copy.requestOtp}
              </>
            )}
          </Button>

          <div className="space-y-1 text-center text-[12px] leading-5 text-stone-400">
            <p>{copy.whatsappNote}</p>
            <p>{copy.noWhatsapp}</p>
          </div>

          {onSwitchToEmail && (
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToEmail}
                disabled={loading}
                className={authLinkClass}
              >
                {copy.orUseEmail}
              </Button>
            </div>
          )}
        </form>
      ) : (
        /* OTP Verification Step */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
            <h3 className="text-[16px] font-semibold text-stone-900">{copy.otpTitle}</h3>
            <p className="mt-1 text-[13px] text-stone-500">
              {copy.otpSubtitle}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 font-medium text-stone-800" dir="ltr">
              <span className="text-base">{selectedCountry.flag}</span>
              {whatsappService.formatPhoneDisplay(phoneNumber, selectedCountry.dialCode)}
            </p>
            {isNewUser && (
              <p className="mt-2 flex items-center justify-center gap-1 text-[13px] text-emerald-600">
                <Sparkles className="h-4 w-4" />
                {copy.newUser}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="otp" className={authLabelClass}>
              {copy.otpLabel}
            </Label>
            <Input
              ref={otpInputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={handleOtpChange}
              placeholder={copy.otpPlaceholder}
              disabled={loading}
              className={`${authFieldClass} h-14 text-center font-mono text-2xl tracking-[0.5em] md:text-2xl`}
              dir="ltr"
              autoComplete="one-time-code"
            />
          </div>

          <Button
            type="submit"
            className={authPrimaryButtonClass}
            disabled={loading || otpCode.length < 6}
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                {copy.verifying}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                {copy.verify}
              </>
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={loading}
              className="text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className={`size-4 me-1 ${isRTL ? 'rotate-180' : ''}`} />
              {copy.changeNumber}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={countdown > 0 || loading}
              className={countdown > 0 ? 'text-stone-400' : 'text-[#8b6f47] hover:text-[#6f5639]'}
            >
              {countdown > 0 ? (
                `${copy.resendIn} ${countdown}${copy.seconds}`
              ) : (
                <>
                  <RefreshCw className="size-4 me-1" />
                  {copy.resend}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
