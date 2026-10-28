import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useRegion } from '../../hooks/useRegion';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { GoogleLoginButton } from './GoogleLoginButton';
import { PhoneLoginForm } from './PhoneLoginForm';
import { Spinner } from '../ui/spinner';
import { Mail, MessageCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { whatsAppProductReminderService } from '../../services/whatsAppProductReminderService';
import { AuthDivider, AuthError, AuthSegmented, PasswordInput } from './AuthUi';
import { authFieldClass, authLabelClass, authLinkClass, authPrimaryButtonClass } from './authStyles';

type LoginMethod = 'email' | 'phone';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onClose
}) => {
  const { login } = useAuth();
  const { t, language } = useApp();
  const { currentRegion } = useRegion();

  const isRTL = language === 'ar';

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  // Optional, unchecked by default. Leaving it unchecked never disables an
  // existing preference — we only ever opt users IN after a successful login.
  const [whatsAppRemindersOptIn, setWhatsAppRemindersOptIn] = useState(false);

  const optInToWhatsAppReminders = () => {
    if (!whatsAppRemindersOptIn) return;
    whatsAppProductReminderService.updatePreference(true).catch((err) => {
      // Non-critical: never block or interrupt a successful login for this.
      // The API returns 400 specifically when the account has no phone number on file.
      if (err?.response?.status === 400) {
        toast.info(
          isRTL
            ? 'تسجيل الدخول ناجح. أضف رقم هاتف في ملفك الشخصي لتفعيل تذكيرات واتساب.'
            : 'Login successful. Add a phone number in your profile to enable WhatsApp reminders.'
        );
      }
    });
  };

  const handleGoogleLoginSuccess = () => {
    optInToWhatsAppReminders();
    onSuccess?.();
  };

  const handlePhoneLoginSuccess = () => {
    optInToWhatsAppReminders();
    onSuccess?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError(t('auth.loginFailed'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await login(formData);

      if (response.success) {
        optInToWhatsAppReminders();
        onSuccess?.();
      } else {
        setError(response.message || t('auth.loginFailed'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Fastest path first */}
      <GoogleLoginButton mode="login" onSuccess={handleGoogleLoginSuccess} />

      <AuthDivider>{isRTL ? 'أو' : 'or'}</AuthDivider>

      <AuthSegmented
        size="sm"
        value={loginMethod}
        onChange={setLoginMethod}
        label={isRTL ? 'طريقة تسجيل الدخول' : 'Sign-in method'}
        options={[
          { value: 'email', label: isRTL ? 'البريد الإلكتروني' : 'Email', icon: <Mail className="size-4" /> },
          { value: 'phone', label: isRTL ? 'واتساب' : 'WhatsApp', icon: <MessageCircle className="size-4" /> },
        ]}
      />

      {loginMethod === 'phone' ? (
        <PhoneLoginForm onSuccess={handlePhoneLoginSuccess} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <AuthError>{error}</AuthError>}

          <div className="space-y-1.5">
            <Label htmlFor="email" className={authLabelClass}>
              {t('auth.emailOrUsername')}
            </Label>
            <Input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('auth.enterEmailOrUsername')}
              disabled={isLoading}
              aria-invalid={error ? true : undefined}
              className={`${authFieldClass} text-start`}
              dir="ltr"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password" className={authLabelClass}>
                {t('auth.password')}
              </Label>
              <Link
                to={`/${currentRegion.code}/forgot-password`}
                className={authLinkClass}
                onClick={onClose}
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('auth.enterPassword')}
              disabled={isLoading}
              aria-invalid={error ? true : undefined}
              autoComplete="current-password"
              showLabel={isRTL ? 'إظهار كلمة المرور' : 'Show password'}
              hideLabel={isRTL ? 'إخفاء كلمة المرور' : 'Hide password'}
            />
          </div>

          <button
            type="submit"
            className={`${authPrimaryButtonClass} mt-2`}
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <>
                <Spinner className="size-4" />
                {t('auth.loggingIn')}
              </>
            ) : (
              t('auth.login')
            )}
          </button>

          {onSwitchToRegister && (
            <p className="text-center text-[13px] text-stone-500">
              {t('auth.dontHaveAccount')}{' '}
              <button type="button" onClick={onSwitchToRegister} disabled={isLoading} className={authLinkClass}>
                {t('auth.signUp')}
              </button>
            </p>
          )}
        </form>
      )}

      {/* WhatsApp reminders opt-in: optional, one quiet line */}
      <label
        htmlFor="whatsapp-reminders-optin"
        className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1 text-start"
      >
        <Checkbox
          id="whatsapp-reminders-optin"
          checked={whatsAppRemindersOptIn}
          onCheckedChange={(checked) => setWhatsAppRemindersOptIn(checked === true)}
          className="mt-0.5 size-[18px] rounded-[5px] border-stone-300 data-[state=checked]:border-stone-900 data-[state=checked]:bg-stone-900"
        />
        <span className="text-[13px] leading-5 text-stone-600">
          <span className="font-medium text-stone-800">{isRTL ? 'تذكيرات واتساب' : 'WhatsApp reminders'}</span>
          <span className="block text-stone-500">
            {isRTL ? 'استلم تحديثات حول القهوة والمنتجات الجديدة.' : 'Hear about new coffee and restocks.'}
          </span>
        </span>
      </label>
    </div>
  );
};
