import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';

const sanitizeRedirect = (value: string | null): string | undefined => {
  if (!value) return undefined;
  return value.startsWith('/') ? value : undefined;
};

export const WholesaleLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading, login, logout, hasRole } = useAuth();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();

  const redirectParam = sanitizeRedirect(new URLSearchParams(location.search).get('redirect'));
  const stateFrom = (location.state as any)?.from as string | undefined;
  const redirectTarget = redirectParam || stateFrom || '/wholesale/dashboard';

  useEffect(() => {
    if (!isLoading && isAuthenticated && hasRole('Wholesale')) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, isLoading, hasRole, navigate, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      toast.error(isArabic ? 'يرجى إدخال اسم المستخدم وكلمة المرور.' : 'Please enter username and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email: username.trim(), password });
      if (!result.success) {
        toast.error(result.message || (isArabic ? 'فشل تسجيل الدخول.' : 'Login failed.'));
        return;
      }

      const hasWholesaleRole = hasRole('Wholesale') || result.user?.roles?.includes('Wholesale');
      if (!hasWholesaleRole) {
        await logout();
        toast.error(
          isArabic
            ? 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة الجملة.'
            : 'This account does not have access to the wholesale panel.'
        );
        return;
      }

      toast.success(isArabic ? 'مرحباً بك' : 'Welcome');
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      toast.error(isArabic ? 'فشل تسجيل الدخول.' : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isArabic ? 'تسجيل الدخول إلى لوحة الجملة' : 'Wholesale panel login'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'أدخل بيانات حساب الجملة للمتابعة.'
              : 'Enter your wholesale account details to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {isArabic ? 'اسم المستخدم' : 'Username'}
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isArabic ? 'اسم المستخدم' : 'Username'}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isArabic ? 'كلمة المرور' : 'Password'}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={loading}
            >
              {loading ? (isArabic ? 'جارٍ تسجيل الدخول...' : 'Signing in...') : (isArabic ? 'تسجيل الدخول' : 'Sign in')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WholesaleLoginPage;
