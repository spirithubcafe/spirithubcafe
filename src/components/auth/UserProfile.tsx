import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { getAdminBasePath, getPreferredAdminRegion } from '../../lib/regionUtils';
import { profileService } from '../../services/profileService';
import type { UserProfile as UserProfileType } from '../../services/profileService';
import { getProfilePictureUrl } from '../../lib/profileUtils';
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
import type { LucideIcon } from 'lucide-react';
import { 
  User, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  Heart,
  ShoppingBag,
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
  const { t, language } = useApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  // Fetch profile data including profile picture
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await profileService.getMyProfile();
        if (isMounted) {
          setProfileData(profile);
          const picUrl = getProfilePictureUrl(profile.profilePicture);
          if (picUrl) setProfilePictureUrl(picUrl);
        }
      } catch (error) {
        // Silently fail - will show initials fallback
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
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

  const userName = profileData?.fullName || profileData?.displayName || user.displayName || user.username || 'User';
  const userEmail = profileData?.email || user.username || '';
  const userPhone = profileData?.phoneNumber || '';
  const userHandle = user.username
    ? `@${user.username.split('@')[0]}`
    : '@member';

  const adminEntryPath = getAdminBasePath(getPreferredAdminRegion());

  type MenuEntry = {
    id: string;
    label: string;
    icon: LucideIcon;
    bubble: string;
    hover: string;
    to: string;
  };

  const dropdownItems: MenuEntry[] = [
    {
      id: 'profile',
      label: t('profile.view'),
      icon: User,
      bubble: 'bg-blue-100 text-blue-600',
      hover: 'hover:bg-blue-50/80',
      to: '/profile',
    },
    {
      id: 'favorites',
      label: t('profile.favorites'),
      icon: Heart,
      bubble: 'bg-rose-100 text-rose-500',
      hover: 'hover:bg-rose-50/80',
      to: '/favorites',
    },
    {
      id: 'orders',
      label: t('profile.orders'),
      icon: ShoppingBag,
      bubble: 'bg-emerald-100 text-emerald-600',
      hover: 'hover:bg-emerald-50/80',
      to: '/orders',
    },
  ] as const;

  const adminItems: MenuEntry[] = [
    {
      id: 'admin',
      label: t('admin.title'),
      icon: Shield,
      bubble: 'bg-violet-100 text-violet-600',
      hover: 'hover:bg-violet-50/80',
      to: adminEntryPath,
    },
  ] as const;

  const renderMenuItem = (item: MenuEntry, highlightClass = 'text-gray-900') => {
    const Icon = item.icon;
    return (
      <DropdownMenuItem
        key={item.id}
        onClick={() => navigate(item.to)}
        className={`group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold ${highlightClass} transition-all duration-200 data-[highlighted]:bg-transparent data-[highlighted]:text-current ${item.hover}`}
      >
        <span className="flex items-center gap-3">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.bubble}`}>
            <Icon className="h-5 w-5" />
          </span>
          {item.label}
        </span>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${chevronDirectionClass}`}
        />
      </DropdownMenuItem>
    );
  };

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-white/20">
              <AvatarImage src={profilePictureUrl} alt={userName} className="object-cover" />
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
              onClick={() => navigate(adminEntryPath)}
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

  const chevronDirectionClass = language === 'ar'
    ? 'rotate-180 group-hover:-translate-x-0.5'
    : 'group-hover:translate-x-0.5';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 bg-white hover:bg-white shadow-sm border border-gray-100">
          <div className="relative">
            <Avatar className="h-9 w-9 ring-2 ring-stone-200">
              <AvatarImage src={profilePictureUrl} alt={userName} className="object-cover" />
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
      
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-3xl border border-gray-100 bg-white p-0 shadow-2xl"
      >
        {/* User Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                <AvatarImage src={profilePictureUrl} alt={userName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -top-1 -right-1 rounded-full bg-yellow-400 p-1 shadow">
                <Crown className="h-3 w-3 text-amber-900" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-sm text-gray-500 truncate">{userHandle}</p>
            </div>
            <Badge className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              VIP
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-100" />

        <div className="flex flex-col gap-2 p-4">
          <DropdownMenuLabel className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t('profile.account')}
          </DropdownMenuLabel>

          {dropdownItems.map((item) => renderMenuItem(item))}

          {user && (user.roles?.includes('Admin') || user.roles?.includes('admin')) && (
            <>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuLabel className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {t('nav.admin')}
              </DropdownMenuLabel>
              {adminItems.map((item) => renderMenuItem(item, 'text-violet-700'))}
            </>
          )}

          <DropdownMenuSeparator className="bg-gray-100" />

          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-rose-600 transition-all duration-200 hover:border-rose-100 hover:bg-rose-50 data-[highlighted]:bg-transparent data-[highlighted]:text-rose-700"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                {isLoggingOut ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </span>
              {t('auth.logout')}
            </span>
            <ChevronRight
              className={`h-4 w-4 text-rose-400 transition-transform ${chevronDirectionClass}`}
            />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
