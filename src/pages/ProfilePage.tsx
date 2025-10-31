import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

/**
 * ProfilePage
 * - Shows authenticated user information
 * - Uses shadcn UI components
 * - Uses i18n keys for Arabic/English translations
 */
const ProfilePage: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useApp();

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto p-6 pt-24">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.notAuthenticated')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('profile.loginPrompt')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-6 pt-24">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={''} alt={user?.displayName || user?.username} />
              <AvatarFallback>{initials(user?.displayName || user?.username)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.displayName || user.username}</CardTitle>
              <CardDescription>{user.roles?.join(', ') || t('profile.noRoles')}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t('profile.email')}</h3>
              <p className="text-base">{user.username}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="default" onClick={() => (window.location.hash = '#edit-profile')}>{t('profile.edit')}</Button>
              <Button variant="ghost" onClick={() => logout()}>{t('profile.logout')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;