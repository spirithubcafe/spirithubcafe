import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { Camera, Loader2, Trash2, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { profileService } from '../../services/profileService';
import type { UserProfile } from '../../services/profileService';
import { getProfilePictureUrl } from '../../lib/profileUtils';

interface ProfilePictureUploadProps {
  profile: UserProfile;
  onUpdate: () => void;
  language?: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({ 
  profile, 
  onUpdate,
  language = 'en' 
}) => {
  const isArabic = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: isArabic 
          ? 'يُسمح فقط بملفات JPG و JPEG و PNG' 
          : 'Only JPG, JPEG, and PNG files are allowed'
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setMessage({
        type: 'error',
        text: isArabic 
          ? 'حجم الملف يجب أن لا يتجاوز 5 ميجابايت' 
          : 'File size must not exceed 5MB'
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      const response = await profileService.uploadProfilePicture(file);
      
      setMessage({
        type: 'success',
        text: response.message || (isArabic ? 'تم رفع الصورة بنجاح' : 'Picture uploaded successfully')
      });

      // Refresh profile data
      setTimeout(() => {
        setPreview(null);
        onUpdate();
        setMessage(null);
      }, 2000);

    } catch (error: any) {
      console.error('Failed to upload picture:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (isArabic ? 'فشل رفع الصورة' : 'Failed to upload picture')
      });
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف صورة الملف الشخصي؟' : 'Are you sure you want to delete your profile picture?')) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      await profileService.deleteProfilePicture();
      
      setMessage({
        type: 'success',
        text: isArabic ? 'تم حذف الصورة بنجاح' : 'Picture deleted successfully'
      });

      // Refresh profile data
      setTimeout(() => {
        onUpdate();
        setMessage(null);
      }, 2000);

    } catch (error: any) {
      console.error('Failed to delete picture:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || (isArabic ? 'فشل حذف الصورة' : 'Failed to delete picture')
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get full URL for profile picture
  const currentPicture = preview || getProfilePictureUrl(profile.profilePicture);
  const initials = profile.displayName 
    ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.username?.slice(0, 2).toUpperCase() || 'U';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={isArabic ? 'text-right' : 'text-left'}>
          {isArabic ? 'صورة الملف الشخصي' : 'Profile Picture'}
        </CardTitle>
        <CardDescription className={isArabic ? 'text-right' : 'text-left'}>
          {isArabic 
            ? 'قم برفع صورة شخصية جديدة. الحد الأقصى للحجم: 5 ميجابايت. الصيغ المدعومة: JPG, PNG' 
            : 'Upload a new profile picture. Max size: 5MB. Supported formats: JPG, PNG'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Profile Picture Preview */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-32 w-32 ring-4 ring-stone-100">
              <AvatarImage src={currentPicture} alt="Profile" />
              <AvatarFallback className="text-2xl bg-stone-200 text-stone-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera Icon Overlay */}
            {!uploading && !preview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg transition-colors"
                disabled={uploading || deleting}
                aria-label={isArabic ? 'تغيير الصورة' : 'Change picture'}
                title={isArabic ? 'تغيير الصورة' : 'Change picture'}
              >
                <Camera className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Preview Actions */}
          {preview && !uploading && (
            <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCancelPreview}
              >
                <X className="h-4 w-4 mr-1" />
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          )}

          {/* Upload Status */}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isArabic ? 'جاري الرفع...' : 'Uploading...'}</span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || deleting}
          aria-label={isArabic ? 'اختر صورة الملف الشخصي' : 'Choose profile picture'}
          title={isArabic ? 'اختر صورة الملف الشخصي' : 'Choose profile picture'}
        />

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
            className="flex items-center justify-center gap-2 flex-1"
          >
            <Upload className="h-4 w-4" />
            {isArabic ? 'اختر صورة جديدة' : 'Choose New Picture'}
          </Button>

          {profile.profilePicture && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={uploading || deleting}
              className="flex items-center justify-center gap-2 flex-1"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {isArabic ? 'حذف الصورة' : 'Delete Picture'}
                </>
              )}
            </Button>
          )}
        </div>

        {/* File Guidelines */}
        <div className={`text-sm text-stone-500 space-y-1 ${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="font-medium">
            {isArabic ? 'إرشادات:' : 'Guidelines:'}
          </p>
          <ul className={`list-disc space-y-1 ${isArabic ? 'mr-5' : 'ml-5'}`}>
            <li>{isArabic ? 'الحد الأقصى للحجم: 5 ميجابايت' : 'Maximum file size: 5MB'}</li>
            <li>{isArabic ? 'الصيغ المدعومة: JPG, JPEG, PNG' : 'Supported formats: JPG, JPEG, PNG'}</li>
            <li>{isArabic ? 'الأبعاد الموصى بها: 500×500 بكسل' : 'Recommended dimensions: 500x500 pixels'}</li>
            <li>{isArabic ? 'استخدم صورة واضحة لوجهك أو شعارك' : 'Use a clear photo of your face or logo'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
