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
  LogOut,
  Shield,
  Heart,
  ShoppingBag,
  Crown,
  ChevronDown,
  Mail,
  Phone
} from 'lucide-react';

export const MinimalUserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { t, language } = useApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const isRTL = language === 'ar';

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
  const isVIP = user.roles?.includes('Admin') || user.roles?.includes('VIP');
  const adminEntryPath = getAdminBasePath(getPreferredAdminRegion());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Avatar className="h-9 w-9 ring-2 ring-gray-200 hover:ring-gray-300 transition-all">
            <AvatarImage src={profilePictureUrl} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {isVIP && (
            <div className="absolute -top-1 -right-1">
              <Crown className="h-4 w-4 text-amber-500 drop-shadow-sm" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={`w-64 ${isRTL ? 'font-cairo' : ''}`}
        align={isRTL ? 'start' : 'end'} 
        side="bottom"
        sideOffset={8}
        forceMount
      >
        {/* User Header */}
        <DropdownMenuLabel className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-gray-200 shadow-sm">
              <AvatarImage src={profilePictureUrl} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userName}
                </p>
                {isVIP && (
                  <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 text-xs font-medium px-2 py-0.5">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              {userEmail && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              )}
              {userPhone && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">{userPhone}</p>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Navigation Items */}
        <div className="p-1">
          <DropdownMenuItem 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-blue-50 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
              {t('nav.profile')}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto ${isRTL ? 'rotate-90' : '-rotate-90'}`} />
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate('/favorites')}
            className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-red-50 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <Heart className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">
              {t('nav.favorites')}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto ${isRTL ? 'rotate-90' : '-rotate-90'}`} />
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => navigate('/orders')}
            className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-green-50 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
              {t('nav.orders')}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto ${isRTL ? 'rotate-90' : '-rotate-90'}`} />
          </DropdownMenuItem>

          {isAdmin() && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem 
                onClick={() => navigate(adminEntryPath)}
                className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-purple-50 transition-colors group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                  {t('nav.admin')}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto ${isRTL ? 'rotate-90' : '-rotate-90'}`} />
              </DropdownMenuItem>
            </>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <div className="p-1">
          <DropdownMenuItem 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-red-50 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <LogOut className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-700 group-hover:text-red-800">
              {isLoggingOut ? t('auth.loggingOut') : t('auth.logout')}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};