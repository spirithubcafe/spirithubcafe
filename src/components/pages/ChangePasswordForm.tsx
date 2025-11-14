import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { profileService } from '../../services/profileService';
import type { ChangePasswordDto } from '../../services/profileService';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  language?: string;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  onSuccess,
  language = 'en' 
}) => {
  const isArabic = language === 'ar';
  
  const [passwords, setPasswords] = useState<ChangePasswordDto>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Current password required
    if (!passwords.currentPassword) {
      newErrors.currentPassword = isArabic ? 'كلمة المرور الحالية مطلوبة' : 'Current password is required';
    }

    // New password validation
    if (!passwords.newPassword) {
      newErrors.newPassword = isArabic ? 'كلمة المرور الجديدة مطلوبة' : 'New password is required';
    } else if (passwords.newPassword.length < 4) {
      newErrors.newPassword = isArabic ? 'كلمة المرور يجب أن تحتوي على 4 أحرف على الأقل' : 'Password must be at least 4 characters';
    } else if (passwords.newPassword.length > 100) {
      newErrors.newPassword = isArabic ? 'كلمة المرور طويلة جداً (الحد الأقصى 100 حرف)' : 'Password too long (max 100 characters)';
    }

    // Confirm password validation
    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = isArabic ? 'تأكيد كلمة المرور مطلوب' : 'Confirm password is required';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
    }

    // Check if new password is different from current
    if (passwords.currentPassword && passwords.newPassword && passwords.currentPassword === passwords.newPassword) {
      newErrors.newPassword = isArabic ? 'كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة' : 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({
        type: 'error',
        text: isArabic ? 'يرجى تصحيح الأخطاء في النموذج' : 'Please fix the errors in the form'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await profileService.changePassword(passwords);
      
      setMessage({
        type: 'success',
        text: isArabic ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully'
      });

      // Clear form
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }

    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.error;
      
      // Handle specific error cases
      if (errorMessage?.toLowerCase().includes('incorrect') || errorMessage?.toLowerCase().includes('wrong')) {
        setErrors({ currentPassword: isArabic ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect' });
      }
      
      setMessage({
        type: 'error',
        text: errorMessage || (isArabic ? 'فشل تغيير كلمة المرور' : 'Failed to change password')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
          <Lock className="h-5 w-5" />
          {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
        </CardTitle>
        <CardDescription className={isArabic ? 'text-right' : 'text-left'}>
          {isArabic 
            ? 'قم بتحديث كلمة المرور الخاصة بك. تأكد من استخدام كلمة مرور قوية.' 
            : 'Update your password. Make sure to use a strong password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Messages */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className={isArabic ? 'text-right mr-2' : 'text-left ml-2'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className={isArabic ? 'text-right block' : ''}>
              {isArabic ? 'كلمة المرور الحالية' : 'Current Password'} *
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.currentPassword}
                onChange={handleChange}
                required
                placeholder={isArabic ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                className={`${isArabic ? 'text-right pr-10' : 'pr-10'} ${errors.currentPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className={`absolute top-1/2 -translate-y-1/2 ${isArabic ? 'left-3' : 'right-3'} text-stone-500 hover:text-stone-700`}
                tabIndex={-1}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className={isArabic ? 'text-right block' : ''}>
              {isArabic ? 'كلمة المرور الجديدة' : 'New Password'} *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.newPassword}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={100}
                placeholder={isArabic ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                className={`${isArabic ? 'text-right pr-10' : 'pr-10'} ${errors.newPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className={`absolute top-1/2 -translate-y-1/2 ${isArabic ? 'left-3' : 'right-3'} text-stone-500 hover:text-stone-700`}
                tabIndex={-1}
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                {errors.newPassword}
              </p>
            )}
            <p className={`text-sm text-stone-500 ${isArabic ? 'text-right' : ''}`}>
              {isArabic ? 'يجب أن تحتوي كلمة المرور على 4 أحرف على الأقل' : 'Password must be at least 4 characters long'}
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={isArabic ? 'text-right block' : ''}>
              {isArabic ? 'تأكيد كلمة المرور' : 'Confirm New Password'} *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={100}
                placeholder={isArabic ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                className={`${isArabic ? 'text-right pr-10' : 'pr-10'} ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className={`absolute top-1/2 -translate-y-1/2 ${isArabic ? 'left-3' : 'right-3'} text-stone-500 hover:text-stone-700`}
                tabIndex={-1}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isArabic ? 'جاري التغيير...' : 'Changing...'}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className={`p-4 bg-stone-50 rounded-lg ${isArabic ? 'text-right' : 'text-left'}`}>
            <p className="text-sm text-stone-600">
              <strong>{isArabic ? 'ملاحظة أمنية:' : 'Security Note:'}</strong>
            </p>
            <ul className={`text-sm text-stone-600 mt-2 space-y-1 ${isArabic ? 'mr-4' : 'ml-4'} list-disc`}>
              <li>{isArabic ? 'استخدم كلمة مرور قوية وفريدة' : 'Use a strong and unique password'}</li>
              <li>{isArabic ? 'لا تشارك كلمة المرور مع أي شخص' : "Don't share your password with anyone"}</li>
              <li>{isArabic ? 'سيتم تسجيل خروجك من جميع الأجهزة الأخرى' : 'You will be logged out from all other devices'}</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
