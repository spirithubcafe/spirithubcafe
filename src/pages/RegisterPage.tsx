import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gift, Award, Coffee } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RegisterForm } from '../components/auth/RegisterForm';
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

export const RegisterPage: React.FC = () => {
  const { language } = useApp();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectParam = sanitizeRedirect(new URLSearchParams(location.search).get('redirect'));
  const redirectTarget = redirectParam ?? '/profile';
  const loginPath = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTarget]);

  const heroCopy = {
    en: {
      title: 'Create your Spirit Hub Cafe account',
      subtitle: 'Join our specialty coffee community for tailored recommendations, exclusive offers, and seamless re-ordering.',
    },
    ar: {
      title: 'أنشئ حسابك في Spirit Hub Cafe',
      subtitle: 'انضم إلى مجتمع القهوة المختصة لتحصل على توصيات مخصصة، عروض حصرية، وتجربة طلب سلسة.',
    },
  };

  const activeCopy = language === 'ar' ? heroCopy.ar : heroCopy.en;

  const benefits: BenefitItem[] = [
    {
      icon: Gift,
      title: language === 'ar' ? 'عروض حصرية' : 'Exclusive offers',
      description: language === 'ar'
        ? 'استلم كوبونات موسمية ونقاط ولاء مقابل كل عملية شراء.'
        : 'Receive seasonal coupons and loyalty rewards with every purchase.',
    },
    {
      icon: Award,
      title: language === 'ar' ? 'توصيات ذكية' : 'Personal recommendations',
      description: language === 'ar'
        ? 'اختر القهوة التي تناسب ذوقك بفضل توصيات تعتمد على مشترياتك.'
        : 'Discover coffees that match your taste through personalized picks.',
    },
    {
      icon: Coffee,
      title: language === 'ar' ? 'طلبات أسرع' : 'Faster checkout',
      description: language === 'ar'
        ? 'احفظ عناوينك وتفضيلاتك لإنهاء الطلب في ثوانٍ.'
        : 'Save your addresses and preferences to reorder in seconds.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: activeCopy.title,
    description: activeCopy.subtitle,
    url: `${siteMetadata.baseUrl}/register`,
  };

  const handleRegisterSuccess = () => {
    navigate(redirectTarget, { replace: true });
  };

  const handleSwitchToLogin = () => {
    navigate(loginPath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title={language === 'ar' ? 'إنشاء حساب' : 'Register'}
        description={activeCopy.subtitle}
        canonical={`${siteMetadata.baseUrl}/register`}
        structuredData={structuredData}
      />
      <PageHeader
        title="Register"
        titleAr="تسجيل حساب جديد"
        subtitle={heroCopy.en.subtitle}
        subtitleAr={heroCopy.ar.subtitle}
      />

      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Register Form - First on mobile, Second on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="order-1 lg:order-2"
          >
            <Card className="shadow-xl border-0">
              <CardContent className="p-6 sm:p-8">
                <RegisterForm
                  onSuccess={handleRegisterSuccess}
                  onSwitchToLogin={handleSwitchToLogin}
                />
                <p className="text-center text-sm text-gray-500 mt-6">
                  {language === 'ar'
                    ? 'لديك حساب بالفعل؟'
                    : 'Already a member?'}{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-amber-600"
                    onClick={handleSwitchToLogin}
                  >
                    {language === 'ar' ? 'سجّل دخولك' : 'Sign in'}
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
                  <div className="rounded-full bg-stone-100 text-amber-700 p-3">
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

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild className="gap-2">
                <Link to="/about">
                  <Award className="h-4 w-4" />
                  {language === 'ar' ? 'تعرّف على قصتنا' : 'Discover our story'}
                </Link>
              </Button>
              <Button variant="ghost" onClick={handleSwitchToLogin}>
                {language === 'ar' ? 'لديك حساب؟' : 'Already have an account?'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
