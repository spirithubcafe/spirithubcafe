import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Key, Lock, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageHeader } from '../components/layout/PageHeader';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { passwordResetService } from '../services/passwordResetService';
import { useApp } from '../hooks/useApp';

export const ResetPasswordPage: React.FC = () => {
  const { language } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'Set New Password',
      subtitle: 'Create a secure password',
      verifying: 'Verifying link...',
      invalidTitle: 'Invalid Link',
      invalidMessage: 'This password reset link is invalid or has expired.',
      requestNew: 'Request New Link',
      backToLogin: 'Back to Login',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'At least 6 characters',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Repeat password',
      submitButton: 'Set New Password',
      submitting: 'Saving...',
      passwordMismatch: 'Passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      successMessage: 'Password has been reset successfully. Redirecting to login...',
      errorMessage: 'An error occurred. Please try again.',
    },
    ar: {
      title: 'تعيين كلمة مرور جديدة',
      subtitle: 'إنشاء كلمة مرور آمنة',
      verifying: 'جارٍ التحقق من الرابط...',
      invalidTitle: 'رابط غير صالح',
      invalidMessage: 'رابط إعادة تعيين كلمة المرور هذا غير صالح أو منتهي الصلاحية.',
      requestNew: 'طلب رابط جديد',
      backToLogin: 'العودة لتسجيل الدخول',
      newPasswordLabel: 'كلمة المرور الجديدة',
      newPasswordPlaceholder: 'على الأقل 6 أحرف',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: 'كرر كلمة المرور',
      submitButton: 'تعيين كلمة مرور جديدة',
      submitting: 'جارٍ الحفظ...',
      passwordMismatch: 'كلمات المرور غير متطابقة.',
      passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
      successMessage: 'تم إعادة تعيين كلمة المرور بنجاح. جارٍ التوجيه لتسجيل الدخول...',
      errorMessage: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    },
  };

  const t = isRTL ? content.ar : content.en;

  // Extract and verify token from URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');

    if (!tokenFromUrl) {
      setMessage({
        type: 'error',
        text: t.invalidMessage,
      });
      setVerifying(false);
      return;
    }

    setToken(tokenFromUrl);

    // Verify token
    const verifyToken = async () => {
      try {
        await passwordResetService.verifyToken(tokenFromUrl);
        setIsValidToken(true);
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || t.invalidMessage,
        });
        setIsValidToken(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check password match
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: t.passwordMismatch,
      });
      return;
    }

    // Check password strength
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: t.passwordTooShort,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await passwordResetService.resetPassword(token, newPassword, confirmPassword);

      setMessage({
        type: 'success',
        text: response.message || t.successMessage,
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t.errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Verifying token
  if (verifying) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <Seo
          title={`${t.title} - ${siteMetadata.siteName}`}
          description={t.subtitle}
          canonical={`${siteMetadata.baseUrl}/reset-password`}
        />
        <PageHeader
          title="Reset Password"
          titleAr="إعادة تعيين كلمة المرور"
          subtitle="Set your new password"
          subtitleAr="تعيين كلمة المرور الجديدة"
        />

        <div className="container mx-auto py-12 px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-0">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
                  <p className={`text-gray-600 ${isRTL ? 'font-cairo' : ''}`}>
                    {t.verifying}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <Seo
          title={`${t.invalidTitle} - ${siteMetadata.siteName}`}
          description={t.invalidMessage}
          canonical={`${siteMetadata.baseUrl}/reset-password`}
        />
        <PageHeader
          title="Invalid Link"
          titleAr="رابط غير صالح"
          subtitle="Reset link is not valid"
          subtitleAr="رابط إعادة التعيين غير صالح"
        />

        <div className="container mx-auto py-12 px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="shadow-xl border-0">
                <CardContent className="p-6 sm:p-8">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 mb-4">
                      <XCircle className="h-8 w-8" />
                    </div>
                    <h1 className={`text-2xl font-bold text-gray-900 mb-2 ${isRTL ? 'font-cairo' : ''}`}>
                      {t.invalidTitle}
                    </h1>
                    {message && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className={isRTL ? 'font-cairo' : ''}>
                          {message.text}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-3">
                      <Link to="/forgot-password" className="block">
                        <Button className={`w-full bg-amber-600 hover:bg-amber-700 ${isRTL ? 'font-cairo' : ''}`}>
                          {t.requestNew}
                        </Button>
                      </Link>
                      <Link to="/login" className="block">
                        <Button variant="outline" className={`w-full ${isRTL ? 'font-cairo' : ''}`}>
                          {t.backToLogin}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Seo
        title={`${t.title} - ${siteMetadata.siteName}`}
        description={t.subtitle}
        canonical={`${siteMetadata.baseUrl}/reset-password`}
      />
      <PageHeader
        title="Reset Password"
        titleAr="إعادة تعيين كلمة المرور"
        subtitle="Choose a new password"
        subtitleAr="اختر كلمة مرور جديدة"
      />

      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-xl border-0">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-700 mb-4">
                    <Key className="h-8 w-8" />
                  </div>
                  <h1 className={`text-2xl font-bold text-gray-900 mb-2 ${isRTL ? 'font-cairo' : ''}`}>
                    {t.title}
                  </h1>
                  <p className={`text-gray-600 ${isRTL ? 'font-cairo' : ''}`}>
                    {t.subtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        {message.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription className={isRTL ? 'font-cairo' : ''}>
                          {message.text}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label 
                      htmlFor="newPassword"
                      className={`flex items-center gap-2 ${isRTL ? 'font-cairo' : ''}`}
                    >
                      <Lock className="h-4 w-4" />
                      {t.newPasswordLabel}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t.newPasswordPlaceholder}
                      required
                      minLength={6}
                      disabled={loading}
                      className={isRTL ? 'font-cairo' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label 
                      htmlFor="confirmPassword"
                      className={`flex items-center gap-2 ${isRTL ? 'font-cairo' : ''}`}
                    >
                      <Key className="h-4 w-4" />
                      {t.confirmPasswordLabel}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.confirmPasswordPlaceholder}
                      required
                      minLength={6}
                      disabled={loading}
                      className={isRTL ? 'font-cairo' : ''}
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`w-full bg-amber-600 hover:bg-amber-700 ${isRTL ? 'font-cairo' : ''}`}
                    disabled={loading || !newPassword || !confirmPassword}
                  >
                    {loading ? t.submitting : t.submitButton}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
