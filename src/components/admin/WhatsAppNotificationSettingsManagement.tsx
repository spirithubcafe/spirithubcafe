import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Loader2,
  Save,
  ShieldCheck,
  User,
  RefreshCw,
  Phone,
  MessageSquare,
  Key,
  Package,
  CreditCard,
  Truck,
  XCircle,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import {
  whatsappNotificationSettingsService,
} from '../../services/whatsappNotificationSettingsService';
import type { WhatsAppNotificationSettingsDto } from '../../types/whatsapp';
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

const DEFAULT_SETTINGS: WhatsAppNotificationSettingsDto = {
  isEnabled: true,
  adminNumbers: '',
  supportNumber: '',

  // Customer notifications
  customerOrderPlacedEnabled: true,
  customerOrderStatusChangedEnabled: true,
  customerPaymentStatusChangedEnabled: true,
  customerShippingUpdateEnabled: true,
  customerOrderCancelledEnabled: true,
  customerWelcomeEnabled: true,
  customerLoginSuccessEnabled: false,
  customerPasswordResetEnabled: true,
  customerPasswordChangedEnabled: true,
  customerOtpEnabled: true,

  // Admin notifications
  adminNewOrderEnabled: true,
  adminPaymentReceivedEnabled: true,
  adminOrderStatusChangedEnabled: true,
  adminLowStockEnabled: true,
  adminNewUserEnabled: true,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const WhatsAppNotificationSettingsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [settings, setSettings] = useState<WhatsAppNotificationSettingsDto>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  /* ---------- Fetch ------------------------------------------------ */

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await whatsappNotificationSettingsService.get();
      setSettings(data);
      setDirty(false);
    } catch {
      toast.error(
        isArabic
          ? 'فشل في تحميل إعدادات واتساب'
          : 'Failed to load WhatsApp settings',
      );
    } finally {
      setLoading(false);
    }
  }, [isArabic]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ---------- Update helpers --------------------------------------- */

  const update = <K extends keyof WhatsAppNotificationSettingsDto>(
    key: K,
    value: WhatsAppNotificationSettingsDto[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  /* ---------- Save ------------------------------------------------- */

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await whatsappNotificationSettingsService.update(settings);
      setSettings(data);
      setDirty(false);
      toast.success(
        isArabic ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully',
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
    key: keyof WhatsAppNotificationSettingsDto;
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
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
      key: 'customerOtpEnabled',
      label: isArabic ? 'رمز الدخول OTP' : 'OTP Login Code',
      description: isArabic
        ? 'إرسال رمز التحقق للدخول عبر واتساب'
        : 'Send login verification code via WhatsApp',
      icon: Key,
    },
    {
      key: 'customerOrderPlacedEnabled',
      label: isArabic ? 'تأكيد الطلب' : 'Order Confirmation',
      description: isArabic
        ? 'إرسال رسالة عند تقديم طلب جديد'
        : 'Send message when a new order is placed',
      icon: Package,
    },
    {
      key: 'customerOrderStatusChangedEnabled',
      label: isArabic ? 'تغيير حالة الطلب' : 'Order Status Change',
      description: isArabic
        ? 'إرسال رسالة عند تغيير حالة الطلب'
        : 'Send message when order status changes',
      icon: MessageSquare,
    },
    {
      key: 'customerPaymentStatusChangedEnabled',
      label: isArabic ? 'تغيير حالة الدفع' : 'Payment Status Change',
      description: isArabic
        ? 'إرسال رسالة عند تغيير حالة الدفع'
        : 'Send message when payment status changes',
      icon: CreditCard,
    },
    {
      key: 'customerShippingUpdateEnabled',
      label: isArabic ? 'تحديث الشحن' : 'Shipping Update',
      description: isArabic
        ? 'إرسال رسالة عند تحديث معلومات الشحن'
        : 'Send message when shipping info is updated',
      icon: Truck,
    },
    {
      key: 'customerOrderCancelledEnabled',
      label: isArabic ? 'إلغاء الطلب' : 'Order Cancelled',
      description: isArabic
        ? 'إرسال رسالة عند إلغاء الطلب'
        : 'Send message when an order is cancelled',
      icon: XCircle,
    },
    {
      key: 'customerWelcomeEnabled',
      label: isArabic ? 'رسالة ترحيب' : 'Welcome Message',
      description: isArabic
        ? 'إرسال رسالة ترحيب بعد التسجيل'
        : 'Send welcome message after registration',
      icon: User,
    },
    {
      key: 'customerLoginSuccessEnabled',
      label: isArabic ? 'تسجيل دخول ناجح' : 'Login Success',
      description: isArabic
        ? 'إرسال رسالة عند تسجيل الدخول بنجاح'
        : 'Send message on successful login',
      icon: ShieldCheck,
    },
    {
      key: 'customerPasswordResetEnabled',
      label: isArabic ? 'إعادة تعيين كلمة المرور' : 'Password Reset',
      description: isArabic
        ? 'إرسال رسالة إعادة تعيين كلمة المرور'
        : 'Send password reset message',
      icon: Key,
    },
    {
      key: 'customerPasswordChangedEnabled',
      label: isArabic ? 'تغيير كلمة المرور' : 'Password Changed',
      description: isArabic
        ? 'إرسال رسالة تأكيد تغيير كلمة المرور'
        : 'Send message confirming password change',
      icon: ShieldCheck,
    },
  ];

  const adminToggles: ToggleItem[] = [
    {
      key: 'adminNewOrderEnabled',
      label: isArabic ? 'طلب جديد' : 'New Order',
      description: isArabic
        ? 'إشعار المشرف بالطلبات الجديدة عبر واتساب'
        : 'Notify admin of new orders',
      icon: Package,
    },
    {
      key: 'adminPaymentReceivedEnabled',
      label: isArabic ? 'دفعة مستلمة' : 'Payment Received',
      description: isArabic
        ? 'إشعار المشرف بالدفعات المستلمة عبر واتساب'
        : 'Notify admin of received payments',
      icon: CreditCard,
    },
    {
      key: 'adminOrderStatusChangedEnabled',
      label: isArabic ? 'تغيير حالة الطلب' : 'Order Status Change',
      description: isArabic
        ? 'إشعار المشرف بتغيير حالة الطلب عبر واتساب'
        : 'Notify admin of order status changes',
      icon: Bell,
    },
    {
      key: 'adminLowStockEnabled',
      label: isArabic ? 'تنبيه نفاد المخزون' : 'Low Stock Alert',
      description: isArabic
        ? 'إشعار المشرف عند انخفاض المخزون'
        : 'Notify admin when stock is low',
      icon: AlertTriangle,
    },
    {
      key: 'adminNewUserEnabled',
      label: isArabic ? 'تسجيل مستخدم جديد' : 'New User Registration',
      description: isArabic
        ? 'إشعار المشرف بتسجيل مستخدم جديد'
        : 'Notify admin of new user registrations',
      icon: UserPlus,
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

        {/* Phone config skeleton */}
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
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isArabic ? 'إعدادات إشعارات واتساب' : 'WhatsApp Notification Settings'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic
                ? 'إدارة رسائل واتساب التلقائية للعملاء والمشرفين'
                : 'Manage automatic WhatsApp messages to customers and admins'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isArabic ? 'إعادة التحميل' : 'Reload'}
          </Button>
          <Button onClick={handleSave} disabled={saving || !dirty} size="sm" className="bg-green-600 hover:bg-green-700">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* ---- Global toggle ---- */}
      <Card className="border-2 transition-colors"
            style={{
              borderColor: settings.isEnabled
                ? 'rgb(34 197 94 / 0.3)'
                : 'hsl(var(--destructive) / 0.3)',
            }}>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                settings.isEnabled
                  ? 'bg-green-100 text-green-600'
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
                  {isArabic ? 'نظام إشعارات واتساب' : 'WhatsApp Notification System'}
                </span>
                <Badge variant={settings.isEnabled ? 'default' : 'destructive'} className={settings.isEnabled ? 'bg-green-600' : ''}>
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
                    ? 'رسائل واتساب التلقائية مفعلة'
                    : 'Automatic WhatsApp messages are being sent'
                  : isArabic
                    ? 'جميع رسائل واتساب التلقائية معطلة'
                    : 'All automatic WhatsApp messages are disabled'}
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
            ? '⚠️ نظام إشعارات واتساب معطل. لن يتم إرسال أي رسائل تلقائية.'
            : '⚠️ WhatsApp notification system is disabled. No automatic messages will be sent.'}
        </div>
      )}

      {/* ---- Phone numbers ---- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {isArabic ? 'أرقام واتساب' : 'WhatsApp Numbers'}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'أرقام المشرف والدعم لتلقي الإشعارات'
              : 'Admin and support numbers for receiving notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminNumbers">
                {isArabic ? 'أرقام المشرف' : 'Admin Numbers'}
              </Label>
              <Input
                id="adminNumbers"
                placeholder="96892506030, 96899999999"
                value={settings.adminNumbers || ''}
                onChange={(e) => update('adminNumbers', e.target.value)}
                disabled={!settings.isEnabled}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? 'افصل بين الأرقام بفاصلة (مع رمز الدولة 968)'
                  : 'Separate multiple numbers with commas (with country code 968)'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportNumber">
                {isArabic ? 'رقم الدعم' : 'Support Number'}
              </Label>
              <Input
                id="supportNumber"
                placeholder="96892506030"
                value={settings.supportNumber || ''}
                onChange={(e) => update('supportNumber', e.target.value)}
                disabled={!settings.isEnabled}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? 'رقم الدعم الذي يظهر في الرسائل'
                  : 'Shown as the support contact in messages'}
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
                  ? 'رسائل واتساب المرسلة إلى العملاء'
                  : 'WhatsApp messages sent to customers'}
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
                  ? 'رسائل واتساب المرسلة إلى فريق الإدارة'
                  : 'WhatsApp messages sent to admin team'}
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
