import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { 
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Palette,
  Shield,
  Smartphone,
  Lock,
  ArrowLeft,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UserSettings {
  // Profile Settings
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Privacy Settings
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  
  // Appearance Settings
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  fontSize: 'small' | 'medium' | 'large';
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  
  // Security Settings
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  passwordChangeNotifications: boolean;
}

export const SettingsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t, language } = useApp();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    theme: 'system',
    language: 'en',
    fontSize: 'medium',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
    loginNotifications: true,
    passwordChangeNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await settingsService.getUserSettings();
        // setSettings(response.data);
        
        // For now, set default values
        setSettings(prev => ({
          ...prev,
          language: language as 'en' | 'ar'
        }));
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, language]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // TODO: Replace with actual API call
      // await settingsService.updateUserSettings(settings);
      
      // TODO: Update language in app context if changed
      // if (settings.language !== language) {
      //   setLanguage(settings.language);
      // }
      
      // Show success message
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

    try {
      setIsSaving(true);
      // TODO: Replace with actual API call
      // await authService.changePassword({
      //   currentPassword: passwordForm.currentPassword,
      //   newPassword: passwordForm.newPassword
      // });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <SettingsIcon className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">
                {t('auth.loginRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                {t('settings.loginMessage')}
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
            <SettingsIcon className="h-8 w-8 text-stone-700" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('settings.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('settings.description')}
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('settings.profileSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-10 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t('settings.firstName')}</Label>
                      <Input
                        id="firstName"
                        value={settings.firstName}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                        placeholder={t('settings.firstNamePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName">{t('settings.lastName')}</Label>
                      <Input
                        id="lastName"
                        value={settings.lastName}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                        placeholder={t('settings.lastNamePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">{t('settings.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder={t('settings.emailPlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">{t('settings.phone')}</Label>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                        placeholder={t('settings.phonePlaceholder')}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('settings.appearance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('settings.theme')}</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: 'light' | 'dark' | 'system') => 
                        setSettings(prev => ({ ...prev, theme: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            {t('settings.lightTheme')}
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            {t('settings.darkTheme')}
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            {t('settings.systemTheme')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('settings.language')}</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value: 'en' | 'ar') => 
                        setSettings(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('settings.fontSize')}</Label>
                    <Select
                      value={settings.fontSize}
                      onValueChange={(value: 'small' | 'medium' | 'large') => 
                        setSettings(prev => ({ ...prev, fontSize: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">{t('settings.smallText')}</SelectItem>
                        <SelectItem value="medium">{t('settings.mediumText')}</SelectItem>
                        <SelectItem value="large">{t('settings.largeText')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('settings.security')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Change */}
                <div>
                  <h4 className="font-medium mb-3">{t('settings.changePassword')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Label>{t('settings.currentPassword')}</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({
                            ...prev,
                            currentPassword: e.target.value
                          }))}
                          placeholder={t('settings.currentPasswordPlaceholder')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Label>{t('settings.newPassword')}</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({
                            ...prev,
                            newPassword: e.target.value
                          }))}
                          placeholder={t('settings.newPasswordPlaceholder')}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>{t('settings.confirmPassword')}</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({
                          ...prev,
                          confirmPassword: e.target.value
                        }))}
                        placeholder={t('settings.confirmPasswordPlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handlePasswordChange}
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isSaving}
                    className="mt-4"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {t('settings.updatePassword')}
                  </Button>
                </div>

                <Separator />

                {/* Security Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{t('settings.twoFactor')}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('settings.twoFactorDesc')}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                      <Switch
                        checked={settings.twoFactorEnabled}
                        onCheckedChange={(value) => 
                          setSettings(prev => ({ ...prev, twoFactorEnabled: value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{t('settings.loginNotifications')}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('settings.loginNotificationsDesc')}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
                      <Switch
                        checked={settings.loginNotifications}
                        onCheckedChange={(value) => 
                          setSettings(prev => ({ ...prev, loginNotifications: value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              size="lg"
              className="min-w-[120px]"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('settings.saveChanges')}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};