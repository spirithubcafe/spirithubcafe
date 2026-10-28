import React, { useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '../ui/button';
import { OverlayScroll } from '../ui/OverlayScroll';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { AuthSegmented } from './AuthUi';
import { AnimatedIcon } from '../icons/AnimatedIcon';
import { LogIn, UserPlus } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import './auth-modal.css';

interface AuthModalProps {
  children?: React.ReactNode;
  defaultView?: 'login' | 'register';
  onSuccess?: () => void;
  onOpen?: () => void;
  /** Controlled mode: externally control open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Mode = 'login' | 'register';

/**
 * Sign in / sign up. A bottom sheet on phones (thumb-reachable, slides up) and
 * a centred card from `sm` up. It owns its header, so the close button and the
 * scrollbar never sit over the form. Motion lives in ./auth-modal.css.
 */
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
  const contentRef = useRef<HTMLDivElement | null>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [mode, setMode] = useState<Mode>(defaultView);

  const isRTL = language === 'ar';

  // Reset mode when controlled open changes
  React.useEffect(() => {
    if (isOpen) setMode(defaultView);
  }, [isOpen, defaultView]);

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  const title = mode === 'login'
    ? (isRTL ? 'مرحبًا بعودتك' : 'Welcome back')
    : (isRTL ? 'أنشئ حسابك' : 'Create your account');
  const description = mode === 'login'
    ? (isRTL ? 'سجّل الدخول لمتابعة طلباتك ومفضلاتك ونقاط الولاء.' : 'Sign in to track orders, keep favourites and earn loyalty points.')
    : (isRTL ? 'انضم إلى مجتمع سبيريت هب واحصل على عروض حصرية.' : 'Join the SpiritHub community for members-only offers.');

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (open) onOpen?.(); }}>
      {!isControlled && (
        <DialogPrimitive.Trigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <LogIn className="me-2 h-4 w-4" />
              {t('auth.login')}
            </Button>
          )}
        </DialogPrimitive.Trigger>
      )}

      <DialogPrimitive.Portal>
        {/* The overlay holds the panel so it can centre it (desktop) or seat it
            at the bottom (phone) without transforms the animations need. */}
        <DialogPrimitive.Overlay
          data-slot="auth-overlay"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/50 backdrop-blur-[3px] sm:items-center sm:p-6"
        >
          <DialogPrimitive.Content
            ref={contentRef}
            data-slot="auth-modal"
            dir={isRTL ? 'rtl' : 'ltr'}
            // Focus the panel, not its first control: no focus ring on the close
            // button and no keyboard popping up on phones the moment it opens.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              contentRef.current?.focus({ preventScroll: true });
            }}
            className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white text-stone-900 shadow-[0_-12px_40px_-12px_rgba(28,25,23,0.35)] outline-none sm:max-h-[min(780px,calc(100dvh-3rem))] sm:w-[440px] sm:rounded-[28px] sm:shadow-[0_24px_64px_-16px_rgba(28,25,23,0.45)] ${isRTL ? 'font-cairo' : ''}`}
          >
            {/* Grab bar: phones only, signals a sheet */}
            <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-stone-200 sm:hidden" />

            <div className="flex shrink-0 items-center justify-between px-6 pt-3 sm:px-8 sm:pt-7">
              <img
                src="/images/logo/logo-dark.webp"
                alt="SpiritHub Roastery"
                width={180}
                height={48}
                decoding="async"
                className="h-7 w-auto"
              />
              <DialogPrimitive.Close
                aria-label={isRTL ? 'إغلاق' : 'Close'}
                className="inline-flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 outline-none transition-[background-color,color,transform] duration-200 hover:bg-stone-200 hover:text-stone-900 focus-visible:ring-4 focus-visible:ring-[#c69c6d]/25 active:scale-[0.94] motion-reduce:active:scale-100"
              >
                <AnimatedIcon name="x" className="size-5" />
              </DialogPrimitive.Close>
            </div>

            <div className="shrink-0 px-6 pt-5 sm:px-8 sm:pt-6">
              <DialogPrimitive.Title className="text-[26px] font-semibold leading-tight tracking-tight text-stone-900">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1.5 text-[14px] leading-6 text-stone-500">
                {description}
              </DialogPrimitive.Description>
              <div className="mt-5">
                <AuthSegmented
                  value={mode}
                  onChange={setMode}
                  label={isRTL ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign in or sign up'}
                  options={[
                    { value: 'login', label: t('auth.signin') },
                    { value: 'register', label: t('auth.signup') },
                  ]}
                />
              </div>
            </div>

            <OverlayScroll className="min-h-0 flex-1">
              <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pb-8">
                {mode === 'login'
                  ? <LoginForm onSuccess={handleSuccess} onClose={() => setIsOpen(false)} />
                  : <RegisterForm onSuccess={handleSuccess} />}
              </div>
            </OverlayScroll>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
        <LogIn className="me-2 h-4 w-4" />
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
        <UserPlus className="me-2 h-4 w-4" />
        {t('auth.register')}
      </Button>
    </AuthModal>
  );
};
