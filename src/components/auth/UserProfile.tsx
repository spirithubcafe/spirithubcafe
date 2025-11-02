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
        <div className="flex gap-3">
          {/* Admin Panel Button - Only show if user is admin */}
          {user.roles?.includes('admin') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="flex-1 bg-gradient-to-r from-blue-600/20 to-blue-700/20 text-blue-200 hover:from-blue-600/30 hover:to-blue-700/30 hover:text-blue-100 border-0 backdrop-blur-sm shadow-lg"
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
            className="flex-1 bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-200 hover:from-red-600/30 hover:to-red-700/30 hover:text-red-100 border-0 backdrop-blur-sm shadow-lg"
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
      
      <DropdownMenuContent align="end" className="w-80 p-0 border-0 shadow-2xl bg-white/95 backdrop-blur-md">
        {/* User Header */}
        <div className="p-6 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-3 ring-white/30 shadow-lg">
                <AvatarImage src="" alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-stone-600 to-stone-500 text-white font-bold text-xl">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-500 p-1 rounded-full">
                <Crown className="h-3 w-3 text-yellow-900" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold truncate text-lg">{userName}</p>
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs px-2 py-1 font-medium shadow-sm">
                  VIP
                </Badge>
              </div>
              {userEmail && (
                <p className="text-sm text-white/90 truncate font-medium">{userEmail}</p>
              )}
              <p className="text-xs text-white/70 mt-1">
                {t('profile.memberSince')} {t('profile.november')} 2025
              </p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider bg-gray-50/50 rounded-md mb-2">
            {t('profile.account')}
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.view')}</p>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/favorites')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <Heart className="h-4 w-4 text-red-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.favorites')}</p>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/orders')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.orders')}</p>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          
          <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider bg-gray-50/50 rounded-md mb-2">
            {t('profile.preferences')}
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.notifications')}</p>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <Settings className="h-4 w-4 text-gray-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.settings')}</p>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          
          <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider bg-gray-50/50 rounded-md mb-2">
            {t('profile.support')}
          </DropdownMenuLabel>
          
          <DropdownMenuItem 
            onClick={() => navigate('/help')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <HelpCircle className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.help')}</p>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/payment')}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="font-semibold text-gray-800 group-hover:text-gray-900">{t('profile.payment')}</p>
          </DropdownMenuItem>
        
          {/* Admin Panel Link - Only for Admin users */}
          {user && (user.roles?.includes('Admin') || user.roles?.includes('admin')) && (
            <>
              <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-red-200 to-transparent" />
              <DropdownMenuItem 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-200 cursor-pointer group border border-red-200/50 hover:border-red-300/70 mx-2"
              >
                <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <p className="font-semibold text-red-700 group-hover:text-red-800">{t('admin.title')}</p>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-200 cursor-pointer group mx-2 mb-2"
          >
            <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              {isLoggingOut ? (
                <Spinner className="h-4 w-4 text-red-600" />
              ) : (
                <LogOut className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="font-semibold text-red-700 group-hover:text-red-800">{t('auth.logout')}</p>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};