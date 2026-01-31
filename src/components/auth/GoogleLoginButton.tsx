import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ mode = 'login', onSuccess }) => {
  const { loginWithGoogle } = useAuth();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send ID token to backend
      await loginWithGoogle({
        idToken: credentialResponse.credential,
      });

      toast.success(
        isArabic 
          ? 'تم تسجيل الدخول بنجاح' 
          : 'Successfully logged in'
      );

      // Let the parent decide what to do (close modal, redirect, etc.).
      onSuccess?.();
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Show detailed error message
      const errorMessage =
        error?.message ||
        (typeof error?.errors === 'string'
          ? error.errors
          : error?.errors
            ? JSON.stringify(error.errors)
            : null) ||
        (error?.response?.data ? JSON.stringify(error.response.data) : null) ||
        'Failed to login with Google';
      
      toast.error(
        isArabic
          ? `فشل تسجيل الدخول عبر Google: ${errorMessage}`
          : `Failed to login with Google: ${errorMessage}`
      );
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    toast.error(
      isArabic
        ? 'فشل تسجيل الدخول عبر Google'
        : 'Failed to login with Google'
    );
  };

  if (!googleClientId) {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-sm">
          <Button type="button" variant="outline" className="w-full" disabled>
            {isArabic ? 'تسجيل الدخول عبر Google غير متاح' : 'Google sign-in unavailable'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-sm">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          text={mode === 'login' ? 'signin_with' : 'signup_with'}
          shape="rectangular"
          theme="outline"
          size="large"
          width="100%"
          locale={isArabic ? 'ar' : 'en'}
        />
      </div>
    </div>
  );
};
