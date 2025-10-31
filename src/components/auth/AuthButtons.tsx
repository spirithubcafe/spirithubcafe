import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/button';
import { AuthModal } from './AuthModal';
import { UserProfile } from './UserProfile';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthButtonsProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

export const AuthButtons: React.FC<AuthButtonsProps> = ({ 
  variant = 'outline',
  size = 'sm',
  showText = true
}) => {
  const { isAuthenticated } = useAuth();
  const { t } = useApp();

  if (isAuthenticated) {
    return <UserProfile showFullName={showText} />;
  }

  return (
    <AuthModal defaultView="login">
      <Button variant={variant} size={size}>
        <LogIn className="h-4 w-4" />
        {showText && <span className="mr-2">{t('auth.login')}</span>}
      </Button>
    </AuthModal>
  );
};

// Separate login button component
export const LoginButton: React.FC<AuthButtonsProps> = ({ 
  variant = 'outline', 
  size = 'sm' 
}) => {
  const { t } = useApp();
  
  return (
    <AuthModal defaultView="login">
      <Button variant={variant} size={size}>
        <LogIn className="h-4 w-4 mr-2" />
        {t('auth.login')}
      </Button>
    </AuthModal>
  );
};

// Separate register button component
export const RegisterButton: React.FC<AuthButtonsProps> = ({ 
  variant = 'default', 
  size = 'sm' 
}) => {
  const { t } = useApp();
  
  return (
    <AuthModal defaultView="register">
      <Button variant={variant} size={size}>
        <UserPlus className="h-4 w-4 mr-2" />
        {t('auth.register')}
      </Button>
    </AuthModal>
  );
};