import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { LogIn, UserPlus } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

interface AuthModalProps {
  children?: React.ReactNode;
  defaultView?: 'login' | 'register';
  onSuccess?: () => void;
  onOpen?: () => void;
  /** Controlled mode: externally control open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  children, 
  defaultView = 'login',
  onSuccess,
  onOpen,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const { t, language } = useApp();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [mode, setMode] = useState<'login' | 'register'>(defaultView);
  
  const isRTL = language === 'ar';

  // Reset mode when controlled open changes
  React.useEffect(() => {
    if (isOpen) setMode(defaultView);
  }, [isOpen, defaultView]);

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (open) onOpen?.(); }}>
      {!isControlled && (
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              {t('auth.login')}
            </Button>
          )}
        </DialogTrigger>
      )}
      
            <DialogContent className={`w-full max-w-md mx-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className={isRTL ? 'text-right' : 'text-left'}>
          <DialogTitle className={`text-xl font-semibold ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>
            {mode === 'login' ? t('auth.signin') : t('auth.signup')}
          </DialogTitle>
          <DialogDescription className={`text-sm text-muted-foreground ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>
            {mode === 'login' 
              ? (isRTL ? 'قم بتسجيل الدخول إلى حسابك للوصول إلى الميزات الحصرية' : 'Sign in to your account to access exclusive features')
              : (isRTL ? 'أنشئ حسابًا جديدًا للانضمام إلى مجتمع القهوة لدينا' : 'Create a new account to join our coffee community')
            }
          </DialogDescription>
        </DialogHeader>

        <div className={`flex items-center justify-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <Button
            variant={mode === 'login' ? 'default' : 'ghost'}
            onClick={() => setMode('login')}
            className={`${mode === 'login' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''} ${isRTL ? 'font-cairo' : ''} min-w-[100px]`}
          >
            {t('auth.signin')}
          </Button>
          <Button
            variant={mode === 'register' ? 'default' : 'ghost'}
            onClick={() => setMode('register')}
            className={`${mode === 'register' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''} ${isRTL ? 'font-cairo' : ''} min-w-[100px]`}
          >
            {t('auth.signup')}
          </Button>
        </div>

        {mode === 'login' && <LoginForm onSuccess={handleSuccess} onClose={() => setIsOpen(false)} />}
        {mode === 'register' && <RegisterForm onSuccess={handleSuccess} />}
      </DialogContent>
    </Dialog>
  );
};

// Separate login and register buttons for convenience
export const LoginButton: React.FC<{ 
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  onSuccess?: () => void;
  onOpen?: () => void;
  className?: string;
}> = ({ variant = 'outline', size = 'sm', onSuccess, onOpen }) => {
  const { t } = useApp();
  
  return (
    <AuthModal defaultView="login" onSuccess={onSuccess} onOpen={onOpen}>
      <Button variant={variant} size={size}>
        <LogIn className="mr-2 h-4 w-4" />
        {t('auth.login')}
      </Button>
    </AuthModal>
  );
};

export const RegisterButton: React.FC<{ 
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  onSuccess?: () => void;
  onOpen?: () => void;
  className?: string;
}> = ({ variant = 'default', size = 'sm', onSuccess, onOpen }) => {
  const { t } = useApp();
  
  return (
    <AuthModal defaultView="register" onSuccess={onSuccess} onOpen={onOpen}>
      <Button variant={variant} size={size}>
        <UserPlus className="mr-2 h-4 w-4" />
        {t('auth.register')}
      </Button>
    </AuthModal>
  );
};