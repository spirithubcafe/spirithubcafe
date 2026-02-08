import { useState, useCallback, useEffect, useRef } from 'react';
import { whatsappService } from '../services/whatsappService';
import { tokenManager } from '../services/apiClient';
import { safeStorage } from '../lib/safeStorage';
import type { UserInfo } from '../types/auth';

type Step = 'phone' | 'otp';

interface UsePhoneAuthReturn {
  step: Step;
  phoneNumber: string;
  otpCode: string;
  isNewUser: boolean;
  loading: boolean;
  error: string | null;
  countdown: number;
  setPhoneNumber: (phone: string) => void;
  setOtpCode: (code: string) => void;
  requestOtp: () => Promise<boolean>;
  verifyOtp: () => Promise<{ success: boolean; user?: UserInfo }>;
  resendOtp: () => Promise<boolean>;
  reset: () => void;
  goBack: () => void;
}

export const usePhoneAuth = (): UsePhoneAuthReturn => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  const startCountdown = useCallback((seconds: number = 60) => {
    setCountdown(seconds);
  }, []);

  const requestOtp = useCallback(async (): Promise<boolean> => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!whatsappService.isValidOmanPhone(phoneNumber)) {
      setError('Please enter a valid Oman phone number');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await whatsappService.requestOtp({ 
        phoneNumber: whatsappService.normalizePhoneNumber(phoneNumber) 
      });

      if (response.success) {
        setIsNewUser(response.isNewUser ?? false);
        setStep('otp');
        startCountdown(60);
        return true;
      } else {
        // Extract wait time from error message if present
        const waitMatch = response.error?.match(/(\d+)\s*seconds?/i);
        if (waitMatch) {
          startCountdown(parseInt(waitMatch[1], 10));
        }
        setError(response.error || 'Failed to send OTP');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, startCountdown]);

  const verifyOtp = useCallback(async (): Promise<{ success: boolean; user?: UserInfo }> => {
    if (!otpCode.trim() || otpCode.length < 6) {
      setError('Please enter the 6-digit code');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await whatsappService.verifyOtp({
        phoneNumber: whatsappService.normalizePhoneNumber(phoneNumber),
        code: otpCode,
      });

      if (response.success && response.access_token && response.refresh_token) {
        // Store tokens
        tokenManager.setTokens(response.access_token, response.refresh_token);
        
        // Create user info
        const userInfo: UserInfo = {
          id: response.user?.id ?? 0,
          username: response.user?.username ?? phoneNumber,
          displayName: response.user?.displayName ?? phoneNumber,
          roles: response.user?.roles ?? ['User'],
          isActive: response.user?.isActive ?? true,
          lastLoggedIn: response.user?.lastLoggedIn ?? new Date().toISOString(),
        };
        
        safeStorage.setJson('user', userInfo);
        
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth-login', { detail: userInfo }));
        
        return { success: true, user: userInfo };
      } else {
        setError(response.error || 'Invalid OTP');
        return { success: false };
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, otpCode]);

  const resendOtp = useCallback(async (): Promise<boolean> => {
    if (countdown > 0) {
      setError(`Please wait ${countdown} seconds before requesting another code`);
      return false;
    }
    setOtpCode('');
    return requestOtp();
  }, [countdown, requestOtp]);

  const goBack = useCallback(() => {
    setStep('phone');
    setOtpCode('');
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStep('phone');
    setPhoneNumber('');
    setOtpCode('');
    setIsNewUser(false);
    setError(null);
    setCountdown(0);
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
  }, []);

  return {
    step,
    phoneNumber,
    otpCode,
    isNewUser,
    loading,
    error,
    countdown,
    setPhoneNumber,
    setOtpCode,
    requestOtp,
    verifyOtp,
    resendOtp,
    reset,
    goBack,
  };
};
