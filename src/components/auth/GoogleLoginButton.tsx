import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { toast } from 'sonner';

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ mode = 'login' }) => {
  const { loginWithGoogle } = useAuth();
  const { language } = useApp();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      console.log('Google credential received:', credentialResponse);
      
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

      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(
        isArabic
          ? 'فشل تسجيل الدخول عبر Google'
          : 'Failed to login with Google'
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

  return (
    <div className="w-full">
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
  );
};
