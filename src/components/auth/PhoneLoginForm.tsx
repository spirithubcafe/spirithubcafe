import React, { useEffect, useRef, useState } from 'react';
import { usePhoneAuth } from '../../hooks/usePhoneAuth';
import { whatsappService } from '../../services/whatsappService';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
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
  AlertCircle,
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
    <div className={`w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 'phone' ? (
        /* Phone Number Step */
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{copy.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{copy.subtitle}</p>
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="phone"
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
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
                className="flex-1 text-left"
                dir="ltr"
                autoComplete="tel"
              />
            </div>
            <div className="min-h-[20px]">
              {phoneNumber && whatsappService.isValidPhone(phoneNumber, selectedCountry.maxDigits, selectedCountry.startsWith) && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {whatsappService.formatPhoneDisplay(phoneNumber, selectedCountry.dialCode)}
                </p>
              )}
              {phoneNumber && !whatsappService.isValidPhone(phoneNumber, selectedCountry.maxDigits, selectedCountry.startsWith) && (
                <p className="text-xs text-amber-600">
                  {isRTL
                    ? `أدخل ${selectedCountry.maxDigits} أرقام${selectedCountry.startsWith ? ` تبدأ بـ ${selectedCountry.startsWith}` : ''}`
                    : `Enter ${selectedCountry.maxDigits} digits${selectedCountry.startsWith ? ` starting with ${selectedCountry.startsWith}` : ''}`}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || !whatsappService.isValidPhone(phoneNumber, selectedCountry.maxDigits, selectedCountry.startsWith)}
          >
            {loading ? (
              <>
                <Spinner className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {copy.sending}
              </>
            ) : (
              <>
                <svg className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {copy.requestOtp}
              </>
            )}
          </Button>

          <div className="text-center text-xs text-gray-500 space-y-1">
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
                className="text-sm text-amber-600 hover:text-amber-700"
              >
                {copy.orUseEmail}
              </Button>
            </div>
          )}
        </form>
      ) : (
        /* OTP Verification Step */
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{copy.otpTitle}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {copy.otpSubtitle}
            </p>
            <p className="font-medium text-gray-700 mt-1 flex items-center justify-center gap-1.5" dir="ltr">
              <span className="text-base">{selectedCountry.flag}</span>
              {whatsappService.formatPhoneDisplay(phoneNumber, selectedCountry.dialCode)}
            </p>
            {isNewUser && (
              <p className="mt-2 text-green-600 text-sm flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4" />
                {copy.newUser}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="otp"
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
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
              className="text-center text-2xl tracking-[0.5em] font-mono"
              dir="ltr"
              autoComplete="one-time-code"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={loading || otpCode.length < 6}
          >
            {loading ? (
              <>
                <Spinner className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {copy.verifying}
              </>
            ) : (
              <>
                <CheckCircle2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
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
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-1 rotate-180' : 'mr-1'}`} />
              {copy.changeNumber}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={countdown > 0 || loading}
              className={countdown > 0 ? 'text-gray-400' : 'text-green-600 hover:text-green-700'}
            >
              {countdown > 0 ? (
                `${copy.resendIn} ${countdown}${copy.seconds}`
              ) : (
                <>
                  <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
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
