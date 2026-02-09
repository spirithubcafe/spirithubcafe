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
  Globe,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import type { RegionCode } from '../../contexts/RegionContextDefinition';
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
  const { currentRegion, regions } = useRegion();

  const [selectedBranch, setSelectedBranch] = useState<RegionCode>(currentRegion.code);
  const [settings, setSettings] = useState<EmailNotificationSettingsDto>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  /* ---------- Fetch ------------------------------------------------ */

  const fetchSettings = useCallback(async (branch?: RegionCode) => {
    const targetBranch = branch ?? selectedBranch;
    setLoading(true);
    try {
      const data = await emailNotificationSettingsService.get(targetBranch);
      setSettings(data);
      setDirty(false);
    } catch {
      toast.error(
        isArabic
          ? 'فشل في تحميل إعدادات الإشعارات'
          : 'Failed to load notification settings',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, isArabic]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ---------- Branch switch ---------------------------------------- */

  const handleBranchSwitch = (branch: RegionCode) => {
    if (branch === selectedBranch) return;
    if (dirty) {
      const msg = isArabic
        ? 'لديك تغييرات غير محفوظة. هل تريد تبديل الفرع؟'
        : 'You have unsaved changes. Switch branch anyway?';
      if (!window.confirm(msg)) return;
    }
    setSelectedBranch(branch);
    setDirty(false);
    fetchSettings(branch);
  };

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
      const data = await emailNotificationSettingsService.update(settings, selectedBranch);
      setSettings(data);
      setDirty(false);
      toast.success(
        isArabic ? `تم حفظ الإعدادات بنجاح - ${regions[selectedBranch].flag} ${regions[selectedBranch].name}` : `Settings saved for ${regions[selectedBranch].flag} ${regions[selectedBranch].name}`,
      );
    } catch {
      toast.error(
        isArabic ? 'فشل في حفظ الإعدادات' : 'Failed to save settings',
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
      label: isArabic ? 'تأكيد الطلب' : 'Order Confirmation',
      description: isArabic
        ? 'إرسال بريد إلكتروني عند تقديم طلب جديد'
        : 'Send email when a new order is placed',
      icon: MailCheck,
    },
    {
      key: 'customerOrderStatusChangedEnabled',
      label: isArabic ? 'تغيير حالة الطلب' : 'Order Status Change',
      description: isArabic
        ? 'إرسال بريد إلكتروني عند تغيير حالة الطلب'
        : 'Send email when order status changes',
      icon: Mail,
    },
    {
      key: 'customerPaymentStatusChangedEnabled',
      label: isArabic ? 'تغيير حالة الدفع' : 'Payment Status Change',
      description: isArabic
        ? 'إرسال بريد إلكتروني عند تغيير حالة الدفع'
        : 'Send email when payment status changes',
      icon: Mail,
    },
    {
      key: 'customerShippingUpdateEnabled',
      label: isArabic ? 'تحديث الشحن' : 'Shipping Update',
      description: isArabic
        ? 'إرسال بريد إلكتروني عند تحديث معلومات الشحن'
        : 'Send email when shipping info is updated',
      icon: Mail,
    },
    {
      key: 'customerOrderCancelledEnabled',
      label: isArabic ? 'إلغاء الطلب' : 'Order Cancelled',
      description: isArabic
        ? 'إرسال بريد إلكتروني عند إلغاء الطلب'
        : 'Send email when an order is cancelled',
      icon: Mail,
    },
    {
      key: 'customerWelcomeEnabled',
      label: isArabic ? 'رسالة ترحيب' : 'Welcome Email',
      description: isArabic
        ? 'إرسال بريد ترحيب بعد التسجيل'
        : 'Send welcome email after registration',
      icon: User,
    },
    {
      key: 'customerLoginSuccessEnabled',
      label: isArabic ? 'تسجيل دخول ناجح' : 'Login Success',
      description: isArabic
        ? 'إرسال بريد إلكتروني عند تسجيل الدخول بنجاح'
        : 'Send email on successful login',
      icon: ShieldCheck,
    },
    {
      key: 'customerPasswordResetEnabled',
      label: isArabic ? 'إعادة تعيين كلمة المرور' : 'Password Reset',
      description: isArabic
        ? 'إرسال بريد إعادة تعيين كلمة المرور'
        : 'Send password reset email',
      icon: Mail,
    },
    {
      key: 'customerPasswordChangedEnabled',
      label: isArabic ? 'تغيير كلمة المرور' : 'Password Changed',
      description: isArabic
        ? 'إرسال بريد تأكيد تغيير كلمة المرور'
        : 'Send email confirming password change',
      icon: ShieldCheck,
    },
  ];

  const adminToggles: ToggleItem[] = [
    {
      key: 'adminNewOrderEnabled',
      label: isArabic ? 'طلب جديد' : 'New Order',
      description: isArabic
        ? 'إشعار المشرف بالطلبات الجديدة عبر البريد'
        : 'Notify admin of new orders',
      icon: Bell,
    },
    {
      key: 'adminPaymentReceivedEnabled',
      label: isArabic ? 'دفعة مستلمة' : 'Payment Received',
      description: isArabic
        ? 'إشعار المشرف بالدفعات المستلمة عبر البريد'
        : 'Notify admin of received payments',
      icon: Bell,
    },
    {
      key: 'adminOrderStatusChangedEnabled',
      label: isArabic ? 'تغيير حالة الطلب' : 'Order Status Change',
      description: isArabic
        ? 'إشعار المشرف بتغيير حالة الطلب عبر البريد'
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
            {isArabic ? 'إعدادات إشعارات البريد الإلكتروني' : 'Email Notification Settings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isArabic
              ? 'إدارة رسائل البريد الإلكتروني التلقائية للعملاء والمشرفين'
              : 'Manage automatic emails sent to customers and admins'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSettings()}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isArabic ? 'إعادة التحميل' : 'Reload'}
          </Button>
          <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* ---- Branch Selector ---- */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="font-medium">
              {isArabic ? 'الفرع النشط:' : 'Active Branch:'}
            </span>
            <Badge variant="outline" className="font-semibold text-sm">
              {regions[selectedBranch].flag} {regions[selectedBranch].name}
            </Badge>
            {dirty && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {isArabic ? 'غير محفوظ' : 'Unsaved'}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {(Object.keys(regions) as RegionCode[]).map((code) => (
              <Button
                key={code}
                variant={selectedBranch === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBranchSwitch(code)}
                disabled={loading || saving}
                className="gap-1.5"
              >
                <span>{regions[code].flag}</span>
                <span>{regions[code].name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  {isArabic ? 'نظام إشعارات البريد الإلكتروني' : 'Email Notification System'}
                </span>
                <Badge variant={settings.isEnabled ? 'default' : 'destructive'}>
                  {settings.isEnabled
                    ? isArabic
                      ? 'نشط'
                      : 'Active'
                    : isArabic
                      ? 'معطل'
                      : 'Disabled'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {settings.isEnabled
                  ? isArabic
                    ? 'رسائل البريد الإلكتروني التلقائية مفعلة'
                    : 'Automatic emails are being sent'
                  : isArabic
                    ? 'جميع رسائل البريد الإلكتروني التلقائية معطلة'
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
            ? '⚠️ نظام إشعارات البريد الإلكتروني معطل. لن يتم إرسال أي رسائل تلقائية.'
            : '⚠️ Email notification system is disabled. No automatic emails will be sent.'}
        </div>
      )}

      {/* ---- Email addresses ---- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            {isArabic ? 'عناوين البريد الإلكتروني' : 'Email Addresses'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'عناوين بريد المشرف والدعم'
              : 'Admin and support email addresses'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminEmails">
                {isArabic ? 'بريد المشرف' : 'Admin Emails'}
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
                  ? 'افصل بين العناوين بفاصلة'
                  : 'Separate multiple emails with commas'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">
                {isArabic ? 'بريد الدعم' : 'Support Email'}
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
                  ? 'يظهر كجهة اتصال الدعم في الرسائل'
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
                {isArabic ? 'إشعارات العملاء' : 'Customer Notifications'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isArabic
                  ? 'رسائل البريد الإلكتروني المرسلة إلى العملاء'
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
                {isArabic ? 'إشعارات المشرف' : 'Admin Notifications'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isArabic
                  ? 'رسائل البريد الإلكتروني المرسلة إلى فريق الإدارة'
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
