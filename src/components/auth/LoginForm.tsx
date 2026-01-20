import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GoogleLoginButton } from './GoogleLoginButton';
import { Alert, AlertDescription } from '../ui/alert';
import { Spinner } from '../ui/spinner';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

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
  
  const isRTL = language === 'ar';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
    <div className={`w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label 
              htmlFor="email" 
              className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
            >
              {t('auth.emailOrUsername')}
            </Label>
            <Input
              id="email"
              name="email"
              type="text"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('auth.enterEmailOrUsername')}
              disabled={isLoading}
              className={`w-full ${isRTL ? 'font-cairo' : ''} text-left`}
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="password" 
                className={`block text-sm font-medium ${isRTL ? 'text-right font-cairo' : 'text-left'}`}
              >
                {t('auth.password')}
              </Label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
                onClick={onClose}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('auth.enterPassword')}
                disabled={isLoading}
                className={`w-full ${isRTL ? 'text-right font-cairo placeholder:text-right pl-10 pr-3' : 'text-left pr-10 pl-3'}`}
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
          </div>
          
          <Button
            type="submit"
            className={`w-full bg-amber-600 hover:bg-amber-700 text-white ${isRTL ? 'font-cairo' : ''}`}
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <>
                <Spinner className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t('auth.loggingIn')}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {t('auth.login')}
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

          {/* Google Login Button */}
          <GoogleLoginButton mode="login" onSuccess={onSuccess} />
          
          {onSwitchToRegister && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToRegister}
                disabled={isLoading}
                className="text-sm"
              >
                {t('auth.dontHaveAccount')} {t('auth.signUp')}
              </Button>
            </div>
          )}
        </form>
    </div>
  );
};