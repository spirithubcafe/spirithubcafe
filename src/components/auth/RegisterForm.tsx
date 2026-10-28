import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GoogleLoginButton } from './GoogleLoginButton';
import { Spinner } from '../ui/spinner';
import { useApp } from '../../hooks/useApp';
import { AuthDivider, AuthError, PasswordInput } from './AuthUi';
import { authErrorTextClass, authFieldClass, authLabelClass, authLinkClass, authPrimaryButtonClass } from './authStyles';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  onSwitchToLogin 
}) => {
  const { register } = useAuth();
  const { t, language } = useApp();
  
  const isRTL = language === 'ar';
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.email.trim()) {
      errors.email = t('auth.emailRequired');
    } else if (!validateEmail(formData.email)) {
      errors.email = t('auth.invalidEmail');
    }

    if (!formData.password) {
      errors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 6) {
      errors.password = t('auth.passwordTooShort');
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.passwordsDoNotMatch');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      setError('');
    }
    
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      
      if (response.success) {
        onSuccess?.();
      } else {
        setError(response.message || t('auth.registerFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('auth.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const showLabel = isRTL ? 'إظهار كلمة المرور' : 'Show password';
  const hideLabel = isRTL ? 'إخفاء كلمة المرور' : 'Hide password';

  return (
    <div className="w-full space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Fastest path first */}
      <GoogleLoginButton mode="register" onSuccess={onSuccess} />

      <AuthDivider>{isRTL ? 'أو بالبريد الإلكتروني' : 'or with email'}</AuthDivider>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <AuthError>{error}</AuthError>}

        <div className="space-y-1.5">
          <Label htmlFor="register-email" className={authLabelClass}>
            {t('auth.email')}
          </Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            inputMode="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('auth.enterEmail')}
            disabled={isLoading}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            className={`${authFieldClass} text-start`}
            dir="ltr"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
          />
          {fieldErrors.email && <p id="register-email-error" className={authErrorTextClass}>{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password" className={authLabelClass}>
            {t('auth.password')}
          </Label>
          <PasswordInput
            id="register-password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={t('auth.enterPassword')}
            disabled={isLoading}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'register-password-error' : 'register-password-hint'}
            autoComplete="new-password"
            showLabel={showLabel}
            hideLabel={hideLabel}
          />
          {fieldErrors.password ? (
            <p id="register-password-error" className={authErrorTextClass}>{fieldErrors.password}</p>
          ) : (
            <p id="register-password-hint" className="text-[12px] text-stone-400">
              {isRTL ? '6 أحرف على الأقل' : 'At least 6 characters'}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-confirm-password" className={authLabelClass}>
            {t('auth.confirmPassword')}
          </Label>
          <PasswordInput
            id="register-confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            disabled={isLoading}
            aria-invalid={fieldErrors.confirmPassword ? true : undefined}
            aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-error' : undefined}
            autoComplete="new-password"
            showLabel={showLabel}
            hideLabel={hideLabel}
          />
          {fieldErrors.confirmPassword && (
            <p id="register-confirm-error" className={authErrorTextClass}>{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" className={`${authPrimaryButtonClass} mt-2`} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner className="size-4" />
              {t('auth.registering')}
            </>
          ) : (
            isRTL ? 'إنشاء الحساب' : 'Create account'
          )}
        </button>

        {onSwitchToLogin && (
          <p className="text-center text-[13px] text-stone-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <button type="button" onClick={onSwitchToLogin} disabled={isLoading} className={authLinkClass}>
              {t('auth.login')}
            </button>
          </p>
        )}
      </form>
    </div>
  );
};
