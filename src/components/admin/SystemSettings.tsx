import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Settings, Save, Globe, Bell, Mail, Shield, Database } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [settings, setSettings] = useState({
    siteName: 'Spirit Hub Cafe',
    siteNameAr: 'سبيريت هب كافيه',
    siteEmail: 'info@spirithubcafe.com',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    orderNotifications: true,
    smsNotifications: false,
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Settings saved:', settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <Settings className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isArabic ? 'إعدادات النظام' : 'System Settings'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة إعدادات التطبيق' : 'Manage application configuration'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {isArabic ? 'الإعدادات العامة' : 'General Settings'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'إعدادات الموقع الأساسية'
              : 'Basic site configuration settings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">
                {isArabic ? 'اسم الموقع (إنجليزي)' : 'Site Name (English)'}
              </Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteNameAr">
                {isArabic ? 'اسم الموقع (عربي)' : 'Site Name (Arabic)'}
              </Label>
              <Input
                id="siteNameAr"
                value={settings.siteNameAr}
                onChange={(e) =>
                  setSettings({ ...settings, siteNameAr: e.target.value })
                }
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteEmail">
              {isArabic ? 'البريد الإلكتروني للموقع' : 'Site Email'}
            </Label>
            <Input
              id="siteEmail"
              type="email"
              value={settings.siteEmail}
              onChange={(e) =>
                setSettings({ ...settings, siteEmail: e.target.value })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>
                {isArabic ? 'وضع الصيانة' : 'Maintenance Mode'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? 'تعطيل الموقع مؤقتاً للصيانة'
                  : 'Temporarily disable the site for maintenance'}
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* User Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isArabic ? 'إعدادات المستخدمين' : 'User Settings'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'إدارة تسجيل المستخدمين والوصول'
              : 'Manage user registration and access'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>
                {isArabic ? 'السماح بالتسجيل' : 'Allow Registration'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? 'السماح للمستخدمين الجدد بإنشاء حسابات'
                  : 'Allow new users to create accounts'}
              </p>
            </div>
            <Switch
              checked={settings.allowRegistration}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowRegistration: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'إدارة إشعارات النظام'
              : 'Manage system notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {isArabic ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? 'إرسال إشعارات عبر البريد الإلكتروني'
                  : 'Send notifications via email'}
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>
                {isArabic ? 'إشعارات الطلبات' : 'Order Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? 'إشعار عند استلام طلبات جديدة'
                  : 'Notify when new orders are received'}
              </p>
            </div>
            <Switch
              checked={settings.orderNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, orderNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>
                {isArabic ? 'إشعارات الرسائل القصيرة' : 'SMS Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? 'إرسال إشعارات عبر الرسائل القصيرة'
                  : 'Send notifications via SMS'}
              </p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, smsNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {isArabic ? 'إعدادات قاعدة البيانات' : 'Database Settings'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'إدارة النسخ الاحتياطي والصيانة'
              : 'Manage backups and maintenance'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline">
              {isArabic ? 'نسخ احتياطي الآن' : 'Backup Now'}
            </Button>
            <Button variant="outline">
              {isArabic ? 'استعادة من نسخة احتياطية' : 'Restore from Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
