import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Spinner } from '../ui/spinner';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Shield,
  Heart,
  ShoppingBag,
  Bell,
  CreditCard,
  HelpCircle,
  Crown
} from 'lucide-react';

interface UserProfileProps {
  showFullName?: boolean;
  variant?: 'dropdown' | 'inline' | 'page';
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  showFullName = false,
  variant = 'dropdown'
}) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user.displayName || user.username || 'User';
  const userEmail = user.username || '';

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-white/20">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-stone-600 text-white font-semibold text-lg">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            {/* VIP Badge */}
            <div className="absolute -top-1 -right-1">
              <Crown className="h-4 w-4 text-yellow-400 drop-shadow-sm" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-white truncate">
                {userName}
              </p>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 text-xs">
                VIP
              </Badge>
            </div>
            {userEmail && (
              <p className="text-sm text-white/70 truncate">
                {userEmail}
              </p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Admin Panel Button - Only show if user is admin */}
          {user.roles?.includes('admin') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="flex-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 border border-blue-600/30"
            >
              <Shield className="h-4 w-4 mr-2" />
              {t('nav.admin')}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 bg-red-600/20 text-red-300 hover:bg-red-600/30 hover:text-red-200 border border-red-600/30"
          >
            {isLoggingOut ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 bg-white hover:bg-white shadow-sm border border-gray-100">
          <div className="relative">
            <Avatar className="h-9 w-9 ring-2 ring-stone-200">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-stone-700 text-white font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            {/* VIP Badge for premium users */}
            <div className="absolute -top-1 -right-1">
              <Crown className="h-4 w-4 text-yellow-500 drop-shadow-sm" />
            </div>
          </div>
          
          {showFullName && (
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {userName}
              </p>
              <p className="text-xs text-gray-500">
                {t('profile.memberSince')} 2025
              </p>
            </div>
          )}
          
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* User Header */}
        <div className="p-4 bg-stone-700 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-white/20">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-stone-600 text-white font-bold text-lg">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{userName}</p>
                <Badge className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5">
                  <Crown className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              </div>
              {userEmail && (
                <p className="text-sm text-white/80 truncate">{userEmail}</p>
              )}
              <p className="text-xs text-white/70">
                {t('profile.memberSince')} {t('profile.november')} 2025
              </p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('profile.account')}
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer"
          >
            <User className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.view')}</p>
              <p className="text-xs text-gray-500">{t('profile.manageAccount')}</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer">
            <Heart className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.favorites')}</p>
              <p className="text-xs text-gray-500">{t('profile.savedItems')}</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer">
            <ShoppingBag className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.orders')}</p>
              <p className="text-xs text-gray-500">{t('profile.orderHistory')}</p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('profile.preferences')}
          </DropdownMenuLabel>
          
          <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer">
            <Bell className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.notifications')}</p>
              <p className="text-xs text-gray-500">{t('profile.manageNotifications')}</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer">
            <Settings className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.settings')}</p>
              <p className="text-xs text-gray-500">{t('profile.accountSettings')}</p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('profile.support')}
          </DropdownMenuLabel>
          
          <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.help')}</p>
              <p className="text-xs text-gray-500">{t('profile.supportCenter')}</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            <div className="flex-1">
              <p className="font-medium">{t('profile.payment')}</p>
              <p className="text-xs text-gray-500">{t('profile.paymentMethods')}</p>
            </div>
          </DropdownMenuItem>
        
          {/* Admin Panel Link - Only for Admin users */}
          {user && (user.roles?.includes('Admin') || user.roles?.includes('admin')) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
              >
                <Shield className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{t('admin.title')}</p>
                  <p className="text-xs text-red-500">{t('admin.manage')}</p>
                </div>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
          >
            {isLoggingOut ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{t('auth.logout')}</p>
              <p className="text-xs text-red-500">{t('auth.signOut')}</p>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};