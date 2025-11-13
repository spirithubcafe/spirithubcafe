import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GoogleLoginButton } from './GoogleLoginButton';
import { Alert, AlertDescription } from '../ui/alert';
import { Spinner } from '../ui/spinner';
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
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
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.username.trim()) {
      errors.username = t('auth.usernameRequired');
    }

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
      const response = await register(formData);
      
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

  return (
    <div className={`w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-1 mb-6">
        <h2 className={`text-xl font-bold ${isRTL ? 'text-right font-cairo' : 'text-center'}`}>
          {t('auth.register')}
        </h2>
        <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right font-cairo' : 'text-center'}`}>
          {t('auth.registerDescription')}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label 
              htmlFor="username" 
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
              {t('auth.username')}
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={t('auth.enterUsername')}
              disabled={isLoading}
              className={`w-full ${fieldErrors.username ? 'border-red-500' : ''} ${isRTL ? 'text-right font-cairo placeholder:text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {fieldErrors.username && (
              <p className={`text-sm text-red-500 ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>{fieldErrors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="email"
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
              {t('auth.email')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('auth.enterEmail')}
              disabled={isLoading}
              className={`w-full ${fieldErrors.email ? 'border-red-500' : ''} ${isRTL ? 'text-right font-cairo placeholder:text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {fieldErrors.email && (
              <p className={`text-sm text-red-500 ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>{fieldErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label 
              htmlFor="password"
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
              {t('auth.password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('auth.enterPassword')}
                disabled={isLoading}
                className={`w-full ${isRTL ? 'pl-10 font-cairo placeholder:text-right' : 'pr-10'} ${fieldErrors.password ? 'border-red-500' : ''} ${isRTL ? 'text-right' : 'text-left'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full px-3 py-2 hover:bg-transparent`}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {fieldErrors.password && (
              <p className={`text-sm text-red-500 ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="confirmPassword"
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
              {t('auth.confirmPassword')}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                disabled={isLoading}
                className={`w-full ${isRTL ? 'pl-10 font-cairo placeholder:text-right' : 'pr-10'} ${fieldErrors.confirmPassword ? 'border-red-500' : ''} ${isRTL ? 'text-right' : 'text-left'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full px-3 py-2 hover:bg-transparent`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('auth.registering')}
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('auth.register')}
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {isRTL ? 'أو' : 'OR'}
              </span>
            </div>
          </div>

          {/* Google Register Button */}
          <GoogleLoginButton mode="register" />
          
          {onSwitchToLogin && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToLogin}
                disabled={isLoading}
                className="text-sm"
              >
                {t('auth.alreadyHaveAccount')} {t('auth.login')}
              </Button>
            </div>
          )}
        </form>
    </div>
  );
};