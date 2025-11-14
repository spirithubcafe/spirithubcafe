import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { profileService } from '../../services/profileService';
import type { UserProfile, UpdateProfileDto } from '../../services/profileService';

interface ProfileEditFormProps {
  profile: UserProfile;
  onUpdate: () => void;
  language?: string;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ 
  profile, 
  onUpdate,
  language = 'en' 
}) => {
  const isArabic = language === 'ar';
  
  const [formData, setFormData] = useState<UpdateProfileDto>({
    displayName: profile.displayName || '',
    fullName: profile.fullName || '',
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || '',
    country: profile.country || '',
    city: profile.city || '',
    postalCode: profile.postalCode || '',
    address: profile.address || '',
    bio: profile.bio || '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when profile changes
  useEffect(() => {
    setFormData({
      displayName: profile.displayName || '',
      fullName: profile.fullName || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      country: profile.country || '',
      city: profile.city || '',
      postalCode: profile.postalCode || '',
      address: profile.address || '',
      bio: profile.bio || '',
    });
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isArabic ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format';
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phoneNumber && formData.phoneNumber.length < 8) {
      newErrors.phoneNumber = isArabic ? 'رقم الهاتف قصير جداً' : 'Phone number too short';
    }

    // Display name length
    if (formData.displayName && formData.displayName.length > 100) {
      newErrors.displayName = isArabic ? 'الاسم المعروض طويل جداً (الحد الأقصى 100 حرف)' : 'Display name too long (max 100 characters)';
    }

    // Full name length
    if (formData.fullName && formData.fullName.length > 200) {
      newErrors.fullName = isArabic ? 'الاسم الكامل طويل جداً (الحد الأقصى 200 حرف)' : 'Full name too long (max 200 characters)';
    }

    // Bio length
    if (formData.bio && formData.bio.length > 1000) {
      newErrors.bio = isArabic ? 'السيرة الذاتية طويلة جداً (الحد الأقصى 1000 حرف)' : 'Bio too long (max 1000 characters)';
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
      // Only send non-empty fields
      const updateData: UpdateProfileDto = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          updateData[key as keyof UpdateProfileDto] = value;
        }
      });

      await profileService.updateMyProfile(updateData);
      
      setMessage({
        type: 'success',
        text: isArabic ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
      });

      // Refresh profile data
      setTimeout(() => {
        onUpdate();
        setMessage(null);
      }, 2000);

    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || (isArabic ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={isArabic ? 'text-right' : 'text-left'}>
          {isArabic ? 'تعديل الملف الشخصي' : 'Edit Profile'}
        </CardTitle>
        <CardDescription className={isArabic ? 'text-right' : 'text-left'}>
          {isArabic 
            ? 'قم بتحديث معلومات ملفك الشخصي. جميع الحقول اختيارية.' 
            : 'Update your profile information. All fields are optional.'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'الاسم المعروض' : 'Display Name'}
              </Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                maxLength={100}
                placeholder={isArabic ? 'أدخل اسمك المعروض' : 'Enter your display name'}
                className={`${isArabic ? 'text-right' : ''} ${errors.displayName ? 'border-red-500' : ''}`}
              />
              {errors.displayName && (
                <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'الاسم الكامل' : 'Full Name'}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                maxLength={200}
                placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                className={`${isArabic ? 'text-right' : ''} ${errors.fullName ? 'border-red-500' : ''}`}
              />
              {errors.fullName && (
                <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                maxLength={256}
                placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                className={`${isArabic ? 'text-right' : ''} ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'رقم الهاتف' : 'Phone Number'}
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                maxLength={20}
                placeholder={isArabic ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                className={`${isArabic ? 'text-right' : ''} ${errors.phoneNumber ? 'border-red-500' : ''}`}
              />
              {errors.phoneNumber && (
                <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'الدولة' : 'Country'}
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                maxLength={100}
                placeholder={isArabic ? 'أدخل دولتك' : 'Enter your country'}
                className={isArabic ? 'text-right' : ''}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'المدينة' : 'City'}
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                maxLength={100}
                placeholder={isArabic ? 'أدخل مدينتك' : 'Enter your city'}
                className={isArabic ? 'text-right' : ''}
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postalCode" className={isArabic ? 'text-right block' : ''}>
                {isArabic ? 'الرمز البريدي' : 'Postal Code'}
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                maxLength={20}
                placeholder={isArabic ? 'أدخل الرمز البريدي' : 'Enter your postal code'}
                className={isArabic ? 'text-right' : ''}
              />
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="address" className={isArabic ? 'text-right block' : ''}>
              {isArabic ? 'العنوان' : 'Address'}
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              maxLength={500}
              rows={3}
              placeholder={isArabic ? 'أدخل عنوانك الكامل' : 'Enter your full address'}
              className={isArabic ? 'text-right' : ''}
            />
          </div>

          {/* Bio - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="bio" className={isArabic ? 'text-right block' : ''}>
              {isArabic ? 'السيرة الذاتية' : 'Bio'}
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={1000}
              rows={4}
              placeholder={isArabic ? 'أخبرنا عن نفسك...' : 'Tell us about yourself...'}
              className={`${isArabic ? 'text-right' : ''} ${errors.bio ? 'border-red-500' : ''}`}
            />
            {errors.bio && (
              <p className={`text-sm text-red-500 ${isArabic ? 'text-right' : ''}`}>
                {errors.bio}
              </p>
            )}
            <p className={`text-sm text-gray-500 ${isArabic ? 'text-right' : ''}`}>
              {formData.bio?.length || 0}/1000
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  displayName: profile.displayName || '',
                  fullName: profile.fullName || '',
                  email: profile.email || '',
                  phoneNumber: profile.phoneNumber || '',
                  country: profile.country || '',
                  city: profile.city || '',
                  postalCode: profile.postalCode || '',
                  address: profile.address || '',
                  bio: profile.bio || '',
                });
                setErrors({});
                setMessage(null);
              }}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
