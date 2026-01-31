import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock3, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PageHeader } from '../components/layout/PageHeader';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';

const sanitizeRedirect = (value: string | null): string | undefined => {
  if (!value) return undefined;
  return value.startsWith('/') ? value : undefined;
};

interface BenefitItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const LoginPage: React.FC = () => {
  const { language } = useApp();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect in URL params first, then in location state, default to profile
  const redirectParam = sanitizeRedirect(new URLSearchParams(location.search).get('redirect'));
  const stateFrom = (location.state as any)?.from;
  const stateMessageI18n = (location.state as any)?.messageI18n as
    | { en: string; ar: string }
    | undefined;
  const redirectTarget = redirectParam || stateFrom || '/profile';
  const registerPath = redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register';

  // If we arrived via a full-page redirect (e.g. 401 handler) we might lose router state.
  // Derive a localized notice from the redirect target as a fallback.
  const derivedMessageI18n: { en: string; ar: string } | undefined =
    stateMessageI18n ??
    (redirectTarget.includes('/wholesale')
      ? { en: 'Please login to access wholesale orders.', ar: 'يرجى تسجيل الدخول للوصول إلى طلبات الجملة.' }
      : undefined);

  const stateMessage =
    derivedMessageI18n
      ? (language === 'ar' ? derivedMessageI18n.ar : derivedMessageI18n.en)
      : (location.state as any)?.message;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTarget]);

  const heroCopy = {
    en: {
      title: 'Sign in to Spirit Hub Cafe',
      subtitle: 'Access your orders, private wishlists, and member-only perks with a fast and secure login experience.',
    },
    ar: {
      title: 'تسجيل الدخول إلى Spirit Hub Cafe',
      subtitle: 'ادخل إلى حسابك لإدارة الطلبات، متابعة القائمة المفضلة، والوصول إلى عروض الأعضاء بسهولة.',
    },
  };

  const activeCopy = language === 'ar' ? heroCopy.ar : heroCopy.en;

  const benefits: BenefitItem[] = [
    {
      icon: ShieldCheck,
      title: language === 'ar' ? 'تسجيل دخول آمن' : 'Secure sign in',
      description: language === 'ar'
        ? 'تحمي جلساتك المشفرة بياناتك حتى تتمكن من التسوق بثقة تامة.'
        : 'Encrypted sessions keep your data protected so you can shop with confidence.',
    },
    {
      icon: Clock3,
      title: language === 'ar' ? 'متابعة الطلبات' : 'Track every order',
      description: language === 'ar'
        ? 'اعرف حالة طلباتك خطوة بخطوة واستلم التحديثات فوراً.'
        : 'See live status updates for each order and never miss a delivery.',
    },
    {
      icon: Heart,
      title: language === 'ar' ? 'قائمة مفضلة خاصة' : 'Private wishlist',
      description: language === 'ar'
        ? 'احفظ القهوة المفضلة لديك بين الأجهزة واطلبها بضغطة واحدة.'
        : 'Save favorites across devices and reorder your go-to beans instantly.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: activeCopy.title,
    description: activeCopy.subtitle,
    url: `${siteMetadata.baseUrl}/login`,
  };

  const handleLoginSuccess = () => {
    navigate(redirectTarget, { replace: true });
  };

  const handleSwitchToRegister = () => {
    navigate(registerPath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={language === 'ar' ? 'تسجيل الدخول' : 'Login'}
        description={activeCopy.subtitle}
        canonical={`${siteMetadata.baseUrl}/login`}
        structuredData={structuredData}
      />
      <PageHeader
        title="Login"
        titleAr="تسجيل الدخول"
        subtitle={heroCopy.en.subtitle}
        subtitleAr={heroCopy.ar.subtitle}
      />

      <div className="container mx-auto py-12">
        {stateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-center"
          >
            {stateMessage}
          </motion.div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Login Form - First on mobile, Second on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="order-1 lg:order-2"
          >
            <Card className="shadow-xl border-0">
              <CardContent className="p-6 sm:p-8">
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onSwitchToRegister={handleSwitchToRegister}
                />
                <p className="text-center text-sm text-gray-500 mt-6">
                  {language === 'ar'
                    ? 'لست عضواً بعد؟'
                    : "Don't have an account yet?"}{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-amber-600"
                    onClick={handleSwitchToRegister}
                  >
                    {language === 'ar' ? 'سجل الآن' : 'Register now'}
                  </Button>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits - Second on mobile, First on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 order-2 lg:order-1"
          >
            <p className="text-lg text-gray-600 leading-relaxed">
              {activeCopy.subtitle}
            </p>

            <div className="space-y-5">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="rounded-full bg-amber-100 text-amber-700 p-3">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
