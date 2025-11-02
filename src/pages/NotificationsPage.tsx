import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { 
  Bell, 
  BellOff,
  Mail,
  MessageSquare,
  ShoppingBag,
  Settings as SettingsIcon,
  Check,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  newsletter: boolean;
}

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'system' | 'newsletter';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export const NotificationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: false,
    newProducts: true,
    newsletter: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications and settings from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API calls
        // const [notificationsResponse, settingsResponse] = await Promise.all([
        //   notificationsService.getUserNotifications(),
        //   notificationsService.getUserSettings()
        // ]);
        // setNotifications(notificationsResponse.data);
        // setSettings(settingsResponse.data);
        
        // For now, set empty data
        setNotifications([]);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsService.updateSettings({ [key]: value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call  
      // await notificationsService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      // await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <Bell className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {t('auth.loginRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                {t('notifications.loginMessage')}
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.backHome')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Bell className="h-8 w-8 text-stone-700" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('notifications.title')}
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {t('notifications.description')}
          </p>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                {t('notifications.settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{t('notifications.emailNotifications')}</p>
                      <p className="text-sm text-gray-500 truncate">{t('notifications.emailDesc')}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(value) => updateSetting('emailNotifications', value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{t('notifications.pushNotifications')}</p>
                      <p className="text-sm text-gray-500 truncate">{t('notifications.pushDesc')}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(value) => updateSetting('pushNotifications', value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{t('notifications.orderUpdates')}</p>
                      <p className="text-sm text-gray-500 truncate">{t('notifications.orderDesc')}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                    <Switch
                      checked={settings.orderUpdates}
                      onCheckedChange={(value) => updateSetting('orderUpdates', value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{t('notifications.promotions')}</p>
                      <p className="text-sm text-gray-500 truncate">{t('notifications.promotionsDesc')}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                    <Switch
                      checked={settings.promotions}
                      onCheckedChange={(value) => updateSetting('promotions', value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('notifications.recent')}</CardTitle>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    <Check className="h-4 w-4 mr-2" />
                    {t('notifications.markAllRead')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {t('notifications.empty')}
                  </h3>
                  <p className="text-gray-500">
                    {t('notifications.emptyDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all ${
                        notification.read 
                          ? 'bg-white border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${
                              notification.read ? 'text-gray-900' : 'text-blue-900'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.date).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};