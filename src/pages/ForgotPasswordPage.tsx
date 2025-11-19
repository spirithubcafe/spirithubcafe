import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
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

export const ForgotPasswordPage: React.FC = () => {
  const { language } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isRTL = language === 'ar';

  const content = {
    en: {
      title: 'Forgot Password',
      subtitle: 'Enter your email to reset your password',
      emailLabel: 'Email Address',
      emailPlaceholder: 'your@email.com',
      submitButton: 'Send Reset Link',
      submitting: 'Sending...',
      backToLogin: 'Back to Login',
      description: 'Enter your email address and we will send you a link to reset your password.',
      successMessage: 'If an account exists with this email, a password reset link has been sent.',
      errorMessage: 'An error occurred. Please try again.',
    },
    ar: {
      title: 'نسيت كلمة المرور',
      subtitle: 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'your@email.com',
      submitButton: 'إرسال رابط إعادة التعيين',
      submitting: 'جارٍ الإرسال...',
      backToLogin: 'العودة لتسجيل الدخول',
      description: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.',
      successMessage: 'إذا كان هناك حساب بهذا البريد، فقد تم إرسال رابط إعادة التعيين.',
      errorMessage: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    },
  };

  const t = isRTL ? content.ar : content.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await passwordResetService.forgotPassword(email);

      setMessage({
        type: 'success',
        text: response.message || t.successMessage,
      });

      // Clear form
      setEmail('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t.errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Seo
        title={`${t.title} - ${siteMetadata.siteName}`}
        description={t.subtitle}
        canonical={`${siteMetadata.baseUrl}/forgot-password`}
      />
      <PageHeader
        title="Forgot Password"
        titleAr="نسيت كلمة المرور"
        subtitle="Reset your account password"
        subtitleAr="إعادة تعيين كلمة مرور حسابك"
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
                    <KeyRound className="h-8 w-8" />
                  </div>
                  <h1 className={`text-2xl font-bold text-gray-900 mb-2 ${isRTL ? 'font-cairo' : ''}`}>
                    {t.title}
                  </h1>
                  <p className={`text-gray-600 ${isRTL ? 'font-cairo' : ''}`}>
                    {t.description}
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
                      htmlFor="email"
                      className={`flex items-center gap-2 ${isRTL ? 'font-cairo' : ''}`}
                    >
                      <Mail className="h-4 w-4" />
                      {t.emailLabel}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      required
                      disabled={loading}
                      dir="ltr"
                      className="text-left"
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`w-full bg-amber-600 hover:bg-amber-700 ${isRTL ? 'font-cairo' : ''}`}
                    disabled={loading || !email}
                  >
                    {loading ? t.submitting : t.submitButton}
                  </Button>

                  <div className="text-center pt-4">
                    <Link 
                      to="/login" 
                      className={`inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 hover:underline ${isRTL ? 'font-cairo' : ''}`}
                    >
                      {!isRTL && <ArrowLeft className="h-4 w-4" />}
                      {t.backToLogin}
                      {isRTL && <ArrowLeft className="h-4 w-4 rotate-180" />}
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
