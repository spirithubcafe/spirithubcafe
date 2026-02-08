import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Loader2,
  Mail,
  MailCheck,
  Save,
  ShieldCheck,
  User,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import {
  emailNotificationSettingsService,
  type EmailNotificationSettingsDto,
} from '../../services/emailNotificationSettingsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

/* ------------------------------------------------------------------ */
/*  Default state                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS: EmailNotificationSettingsDto = {
  isEnabled: true,
  adminEmails: '',
  supportEmail: '',

  customerOrderPlacedEnabled: true,
  customerOrderStatusChangedEnabled: true,
  customerPaymentStatusChangedEnabled: true,
  customerShippingUpdateEnabled: true,
  customerOrderCancelledEnabled: true,
  customerWelcomeEnabled: true,
  customerLoginSuccessEnabled: false,
  customerPasswordResetEnabled: true,
  customerPasswordChangedEnabled: true,

  adminNewOrderEnabled: true,
  adminPaymentReceivedEnabled: true,
  adminOrderStatusChangedEnabled: true,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const EmailNotificationSettingsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [settings, setSettings] = useState<EmailNotificationSettingsDto>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  /* ---------- Fetch ------------------------------------------------ */

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailNotificationSettingsService.get();
      setSettings(data);
      setDirty(false);
    } catch {
      toast.error(
        isArabic
          ? 'خطا در بارگذاری تنظیمات اعلان‌ها'
          : 'Failed to load notification settings',
      );
    } finally {
      setLoading(false);
    }
  }, [isArabic]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ---------- Update helpers --------------------------------------- */

  const update = <K extends keyof EmailNotificationSettingsDto>(
    key: K,
    value: EmailNotificationSettingsDto[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  /* ---------- Save ------------------------------------------------- */

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await emailNotificationSettingsService.update(settings);
      setSettings(data);
      setDirty(false);
      toast.success(
        isArabic ? 'تنظیمات با موفقیت ذخیره شد' : 'Settings saved successfully',
      );
    } catch {
      toast.error(
        isArabic ? 'خطا در ذخیره تنظیمات' : 'Failed to save settings',
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Toggle group helper ---------------------------------- */

  interface ToggleItem {
    key: keyof EmailNotificationSettingsDto;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const renderToggle = (item: ToggleItem) => (
    <div
      key={String(item.key)}
      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:bg-accent/30"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
          <item.icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">{item.label}</div>
          <div className="text-xs text-muted-foreground leading-snug truncate">
            {item.description}
          </div>
        </div>
      </div>
      <Switch
        checked={Boolean(settings[item.key])}
        disabled={!settings.isEnabled}
        onCheckedChange={(checked) => update(item.key, checked as never)}
      />
    </div>
  );

  /* ---------- Definitions ------------------------------------------ */

  const customerToggles: ToggleItem[] = [
    {
      key: 'customerOrderPlacedEnabled',
      label: isArabic ? 'تأیید ثبت سفارش' : 'Order Confirmation',
      description: isArabic
        ? 'ارسال ایمیل هنگام ثبت سفارش جدید'
        : 'Send email when a new order is placed',
      icon: MailCheck,
    },
    {
      key: 'customerOrderStatusChangedEnabled',
      label: isArabic ? 'تغییر وضعیت سفارش' : 'Order Status Change',
      description: isArabic
        ? 'ارسال ایمیل هنگام تغییر وضعیت سفارش'
        : 'Send email when order status changes',
      icon: Mail,
    },
    {
      key: 'customerPaymentStatusChangedEnabled',
      label: isArabic ? 'تغییر وضعیت پرداخت' : 'Payment Status Change',
      description: isArabic
        ? 'ارسال ایمیل هنگام تغییر وضعیت پرداخت'
        : 'Send email when payment status changes',
      icon: Mail,
    },
    {
      key: 'customerShippingUpdateEnabled',
      label: isArabic ? 'بروزرسانی ارسال' : 'Shipping Update',
      description: isArabic
        ? 'ارسال ایمیل هنگام بروزرسانی اطلاعات ارسال'
        : 'Send email when shipping info is updated',
      icon: Mail,
    },
    {
      key: 'customerOrderCancelledEnabled',
      label: isArabic ? 'لغو سفارش' : 'Order Cancelled',
      description: isArabic
        ? 'ارسال ایمیل هنگام لغو سفارش'
        : 'Send email when an order is cancelled',
      icon: Mail,
    },
    {
      key: 'customerWelcomeEnabled',
      label: isArabic ? 'خوشامدگویی' : 'Welcome Email',
      description: isArabic
        ? 'ارسال ایمیل خوشامدگویی بعد از ثبت‌نام'
        : 'Send welcome email after registration',
      icon: User,
    },
    {
      key: 'customerLoginSuccessEnabled',
      label: isArabic ? 'ورود موفق' : 'Login Success',
      description: isArabic
        ? 'ارسال ایمیل هنگام ورود موفق'
        : 'Send email on successful login',
      icon: ShieldCheck,
    },
    {
      key: 'customerPasswordResetEnabled',
      label: isArabic ? 'بازیابی رمز عبور' : 'Password Reset',
      description: isArabic
        ? 'ارسال ایمیل بازیابی رمز عبور'
        : 'Send password reset email',
      icon: Mail,
    },
    {
      key: 'customerPasswordChangedEnabled',
      label: isArabic ? 'تغییر رمز عبور' : 'Password Changed',
      description: isArabic
        ? 'ارسال ایمیل تأیید تغییر رمز عبور'
        : 'Send email confirming password change',
      icon: ShieldCheck,
    },
  ];

  const adminToggles: ToggleItem[] = [
    {
      key: 'adminNewOrderEnabled',
      label: isArabic ? 'سفارش جدید' : 'New Order',
      description: isArabic
        ? 'اعلان ایمیلی سفارش جدید به ادمین'
        : 'Notify admin of new orders',
      icon: Bell,
    },
    {
      key: 'adminPaymentReceivedEnabled',
      label: isArabic ? 'پرداخت دریافت شده' : 'Payment Received',
      description: isArabic
        ? 'اعلان ایمیلی پرداخت به ادمین'
        : 'Notify admin of received payments',
      icon: Bell,
    },
    {
      key: 'adminOrderStatusChangedEnabled',
      label: isArabic ? 'تغییر وضعیت سفارش' : 'Order Status Change',
      description: isArabic
        ? 'اعلان ایمیلی تغییر وضعیت سفارش به ادمین'
        : 'Notify admin of order status changes',
      icon: Bell,
    },
  ];

  /* ---------- Loading Skeleton ------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
        </div>

        {/* Global toggle card skeleton */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100" />
              <div className="space-y-1.5">
                <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-72 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
            <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Email config skeleton */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Toggle sections skeleton */}
        {[0, 1].map((section) => (
          <div key={section} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-5 w-52 animate-pulse rounded bg-gray-200" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />
                    <div className="space-y-1">
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-56 animate-pulse rounded bg-gray-50" />
                    </div>
                  </div>
                  <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ---------- Render ----------------------------------------------- */

  const enabledCustomerCount = customerToggles.filter(
    (t) => settings[t.key] === true,
  ).length;
  const enabledAdminCount = adminToggles.filter(
    (t) => settings[t.key] === true,
  ).length;

  return (
    <div className="space-y-6 p-1">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? 'تنظیمات اعلان‌های ایمیل' : 'Email Notification Settings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isArabic
              ? 'مدیریت ایمیل‌های خودکار ارسالی به مشتریان و ادمین'
              : 'Manage automatic emails sent to customers and admins'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isArabic ? 'بارگذاری مجدد' : 'Reload'}
          </Button>
          <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isArabic ? 'ذخیره تغییرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* ---- Global toggle ---- */}
      <Card className="border-2 transition-colors"
            style={{
              borderColor: settings.isEnabled
                ? 'hsl(var(--primary) / 0.3)'
                : 'hsl(var(--destructive) / 0.3)',
            }}>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                settings.isEnabled
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {settings.isEnabled ? (
                <Bell className="h-6 w-6" />
              ) : (
                <BellOff className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">
                  {isArabic ? 'سیستم اعلان ایمیل' : 'Email Notification System'}
                </span>
                <Badge variant={settings.isEnabled ? 'default' : 'destructive'}>
                  {settings.isEnabled
                    ? isArabic
                      ? 'فعال'
                      : 'Active'
                    : isArabic
                      ? 'غیرفعال'
                      : 'Disabled'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {settings.isEnabled
                  ? isArabic
                    ? 'ایمیل‌های خودکار فعال هستند'
                    : 'Automatic emails are being sent'
                  : isArabic
                    ? 'همه ایمیل‌های خودکار غیرفعال هستند'
                    : 'All automatic emails are disabled'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.isEnabled}
            onCheckedChange={(checked) => update('isEnabled', checked)}
          />
        </CardContent>
      </Card>

      {/* Disabled overlay message */}
      {!settings.isEnabled && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {isArabic
            ? '⚠️ سیستم اعلان ایمیل غیرفعال است. هیچ ایمیل خودکاری ارسال نخواهد شد.'
            : '⚠️ Email notification system is disabled. No automatic emails will be sent.'}
        </div>
      )}

      {/* ---- Email addresses ---- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            {isArabic ? 'آدرس‌های ایمیل' : 'Email Addresses'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'ایمیل‌های ادمین و پشتیبانی'
              : 'Admin and support email addresses'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminEmails">
                {isArabic ? 'ایمیل‌های ادمین' : 'Admin Emails'}
              </Label>
              <Input
                id="adminEmails"
                placeholder="admin@example.com, info@example.com"
                value={settings.adminEmails}
                onChange={(e) => update('adminEmails', e.target.value)}
                disabled={!settings.isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? 'چند ایمیل را با کاما جدا کنید'
                  : 'Separate multiple emails with commas'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">
                {isArabic ? 'ایمیل پشتیبانی' : 'Support Email'}
              </Label>
              <Input
                id="supportEmail"
                placeholder="support@example.com"
                value={settings.supportEmail}
                onChange={(e) => update('supportEmail', e.target.value)}
                disabled={!settings.isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? 'ایمیل پشتیبانی که در ایمیل‌ها نمایش داده می‌شود'
                  : 'Shown as the support contact in emails'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Customer notifications ---- */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                {isArabic ? 'اعلان‌های مشتری' : 'Customer Notifications'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isArabic
                  ? 'ایمیل‌هایی که به مشتری ارسال می‌شوند'
                  : 'Emails sent to customers'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {enabledCustomerCount}/{customerToggles.length}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {customerToggles.map(renderToggle)}
        </CardContent>
      </Card>

      {/* ---- Admin notifications ---- */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                {isArabic ? 'اعلان‌های ادمین' : 'Admin Notifications'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isArabic
                  ? 'ایمیل‌هایی که به ادمین ارسال می‌شوند'
                  : 'Emails sent to admin team'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {enabledAdminCount}/{adminToggles.length}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {adminToggles.map(renderToggle)}
        </CardContent>
      </Card>
    </div>
  );
};
