import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  PackageCheck,
  RefreshCw,
  Save,
  Send,
  Truck,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { wholesaleOrderService } from '../../services/wholesaleOrderService';
import {
  formatWeightKg,
  getAllowedDispatchActions,
  getShipmentStatusBadgeClass,
  getShipmentStatusLabel,
  getWeightSourceBadgeClass,
  getWeightSourceLabel,
  isSafeHttpUrl,
  parseWeightKgToGrams,
} from '../../lib/wholesaleDispatch';
import type {
  WholesaleDispatchInfo,
  WholesaleDispatchResult,
  WholesaleShipmentProvider,
} from '../../types/wholesale';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const PICKUP = 1;
const PROVIDERS: WholesaleShipmentProvider[] = ['Nool', 'Genacom'];

type ConfirmKind = 'verifySent' | 'verifyNotSent' | 'delivered';

export interface WholesaleDispatchPanelProps {
  orderId: number;
  isArabic: boolean;
  shippingMethod: number;
  address?: string | null;
  city?: string | null;
  whatsAppOptIn?: boolean;
}

const normalizeApiDate = (raw?: string | null): string | undefined => {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed) || /[+-]\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return `${trimmed}Z`;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) return `${trimmed.replace(' ', 'T')}Z`;
  return trimmed;
};

const formatDate = (raw?: string | null): string => {
  const normalized = normalizeApiDate(raw);
  if (!normalized) return '—';
  try {
    return format(new Date(normalized), 'yyyy-MM-dd HH:mm');
  } catch {
    return raw || '—';
  }
};

const errorMessage = (err: unknown, fallback: string): string => {
  const value = err as { message?: string };
  return value?.message || fallback;
};

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={cn('min-w-0', className)}>
    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
    <div className="text-sm text-gray-900 break-words">{children}</div>
  </div>
);

export const WholesaleDispatchPanel: React.FC<WholesaleDispatchPanelProps> = ({
  orderId,
  isArabic,
  shippingMethod,
  address: orderAddress,
  city: orderCity,
  whatsAppOptIn,
}) => {
  const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

  const [info, setInfo] = useState<WholesaleDispatchInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const loadSeqRef = useRef(0);

  const [addressDraft, setAddressDraft] = useState(orderAddress ?? '');
  const [cityDraft, setCityDraft] = useState(orderCity ?? '');
  const [provider, setProvider] = useState<WholesaleShipmentProvider | null>(null);
  const [weightKg, setWeightKg] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [trackingDraft, setTrackingDraft] = useState('');
  const [labelUrlDraft, setLabelUrlDraft] = useState('');
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [copied, setCopied] = useState(false);

  const isPickup = (info?.shippingMethod ?? shippingMethod) === PICKUP;
  const dispatchEnabled = info?.dispatchEnabled === true;

  useEffect(() => {
    if (!dispatchEnabled) setConfirm(null);
  }, [dispatchEnabled]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncDrafts = useCallback((next: WholesaleDispatchInfo, opts: { address: boolean }) => {
    if (opts.address) {
      setAddressDraft(next.address ?? '');
      setCityDraft(next.city ?? '');
    }
    setTrackingDraft(next.shipment?.trackingNumber ?? '');
    setLabelUrlDraft(next.shipment?.labelUrl ?? '');
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await wholesaleOrderService.getDispatchInfo(orderId);
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      if (!result.success || !result.data) {
        if (result.data) {
          setInfo(result.data);
          syncDrafts(result.data, { address: true });
        }
        setLoadError(result.message || t('Failed to load dispatch details', 'فشل تحميل تفاصيل الشحن'));
        return;
      }
      setInfo(result.data);
      syncDrafts(result.data, { address: true });
    } catch (err) {
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      setLoadError(errorMessage(err, t('Failed to load dispatch details', 'فشل تحميل تفاصيل الشحن')));
    } finally {
      if (mountedRef.current && seq === loadSeqRef.current) setLoading(false);
    }
  }, [orderId, syncDrafts, t]);

  useEffect(() => {
    if (shippingMethod === PICKUP) return;
    void load();
    // Reload only when the order changes, not when the language toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, shippingMethod]);

  /** Runs one mutating request; the ref blocks double clicks that state alone cannot. */
  const run = async (action: () => Promise<WholesaleDispatchResult>, successMessage: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await action();
      if (!mountedRef.current) return;
      if (result.data) {
        // Never clobber the address the admin is typing when a request fails.
        setInfo(result.data);
        syncDrafts(result.data, { address: result.success });
      }
      if (result.success) {
        toast.success(result.message || successMessage);
      } else {
        toast.error(result.message || t('The request failed', 'فشل الطلب'));
      }
    } catch (err) {
      if (mountedRef.current) toast.error(errorMessage(err, t('The request failed', 'فشل الطلب')));
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const copyTracking = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => {
        if (mountedRef.current) setCopied(false);
      }, 1500);
    } catch {
      toast.error(t('Could not copy', 'تعذر النسخ'));
    }
  };

  const wrapperClass = 'rounded-xl border bg-white';
  const header = (
    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b font-medium text-gray-900 flex items-center gap-2">
      <Truck className="h-4 w-4" />
      {t('Dispatch & Delivery', 'الشحن والتوصيل')}
    </div>
  );

  const methodLabel = isPickup ? t('Pickup', 'استلام من المتجر') : t('Nool Delivery', 'توصيل نول');

  if (isPickup) {
    return (
      <div className={wrapperClass}>
        {header}
        <div className="p-3 sm:p-4 space-y-3">
          <Field label={t('Delivery method', 'طريقة التوصيل')}>{methodLabel}</Field>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {t(
              'Pickup orders are collected by the customer and are not dispatched to a courier.',
              'طلبات الاستلام من المتجر يستلمها العميل بنفسه ولا يتم إرسالها إلى شركة التوصيل.'
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className={wrapperClass}>
        {header}
        <div className="p-3 sm:p-4 space-y-3">
          <Field label={t('Delivery method', 'طريقة التوصيل')}>{methodLabel}</Field>
          {loadError ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-2">
              <div className="break-words">{loadError}</div>
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto gap-2" onClick={() => void load()} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                {t('Retry', 'إعادة المحاولة')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Loading...', 'جاري التحميل...')}
            </div>
          )}
        </div>
      </div>
    );
  }

  const shipment = info.shipment ?? null;
  const status = shipment?.status;
  const actions = getAllowedDispatchActions(status, dispatchEnabled);
  const showForm = actions.canRequestDispatch || actions.canRetryDispatch;

  const providerInfo = (name: WholesaleShipmentProvider) => info.providers.find((p) => p.name === name);
  const isConfigured = (name: WholesaleShipmentProvider) => providerInfo(name)?.configured ?? false;
  const effectiveProvider: WholesaleShipmentProvider =
    provider ?? PROVIDERS.find((p) => isConfigured(p)) ?? 'Nool';
  const providerConfigured = isConfigured(effectiveProvider);

  const notifyAvailable = info.customerNotificationAvailable;
  const notifyChecked = notifyAvailable && notifyCustomer;
  const optIn = info.whatsAppOptIn ?? whatsAppOptIn ?? false;
  const notifyDisabledReason = !notifyAvailable
    ? optIn
      ? t(
          'The "Wholesale shipment dispatched (customer)" WhatsApp notification is turned off in the WhatsApp settings.',
          'إشعار "شحن طلب الجملة (العميل)" معطل في إعدادات واتساب.'
        )
      : t('The customer did not opt in to WhatsApp notifications.', 'العميل لم يوافق على إشعارات واتساب.')
    : null;

  const savedAddress = (info.address ?? '').trim();
  const addressDirty =
    addressDraft.trim() !== savedAddress || cityDraft.trim() !== (info.city ?? '').trim();
  const displayedAddress = actions.canEditAddress ? addressDraft.trim() : savedAddress;
  const weightGrams = parseWeightKgToGrams(weightKg);
  const weightInvalid = weightGrams === undefined;

  const submitDispatch = () =>
    run(
      () =>
        wholesaleOrderService.requestDispatch(orderId, {
          provider: effectiveProvider,
          weightGrams: weightGrams ?? null,
          notifyCustomer: notifyChecked,
        }),
      actions.canRetryDispatch ? t('Dispatch retried', 'تمت إعادة محاولة الشحن') : t('Dispatch requested', 'تم طلب الشحن')
    );

  const requestDisabled =
    busy || !info.canDispatch || !providerConfigured || weightInvalid || addressDirty || !displayedAddress;

  const fullWidthBtn = 'w-full sm:w-auto gap-2';

  const confirmCopy: Record<ConfirmKind, { title: string; body: string; ok: string }> = {
    verifySent: {
      title: t('Courier received the request?', 'هل استلمت شركة التوصيل الطلب؟'),
      body: t(
        'This records that the courier received the WhatsApp request. The shipment will move to "Requested".',
        'سيتم تسجيل أن شركة التوصيل استلمت رسالة واتساب، وستنتقل حالة الشحنة إلى "تم الطلب".'
      ),
      ok: t('Courier received it', 'استلمت شركة التوصيل الطلب'),
    },
    verifyNotSent: {
      title: t('Courier did not receive it?', 'هل لم تستلم شركة التوصيل الطلب؟'),
      body: t(
        'This marks the shipment as Failed so you can retry the dispatch. Only continue if you have already confirmed with the courier that nothing was received. If the courier may have received it, retrying can create a duplicate shipment.',
        'سيتم تعليم الشحنة كفاشلة لتتمكن من إعادة المحاولة. تابع فقط إذا كنت قد تأكدت من شركة التوصيل أنها لم تستلم أي شيء. إذا كان من المحتمل أن شركة التوصيل استلمت الطلب فقد تؤدي إعادة المحاولة إلى إنشاء شحنة مكررة.'
      ),
      ok: t('Not received – allow retry', 'لم يستلم – السماح بإعادة المحاولة'),
    },
    delivered: {
      title: t('Mark as delivered?', 'تعليم الشحنة كمسلّمة؟'),
      body: t(
        'This only records the courier delivery status. It does not change the order status.',
        'هذا يسجل حالة تسليم شركة التوصيل فقط ولا يغيّر حالة الطلب.'
      ),
      ok: t('Mark delivered', 'تعليم كمسلّمة'),
    },
  };

  const runConfirmed = () => {
    const kind = confirm;
    setConfirm(null);
    if (!dispatchEnabled) return;
    if (kind === 'verifySent') {
      void run(() => wholesaleOrderService.verifyDispatch(orderId, 'Sent'), t('Marked as received by the courier', 'تم تسجيل استلام شركة التوصيل'));
    } else if (kind === 'verifyNotSent') {
      void run(() => wholesaleOrderService.verifyDispatch(orderId, 'NotSent'), t('Marked as not received – you can retry', 'تم التسجيل كغير مستلم – يمكنك إعادة المحاولة'));
    } else if (kind === 'delivered') {
      void run(() => wholesaleOrderService.markDispatchDelivered(orderId), t('Marked as delivered', 'تم تعليم الشحنة كمسلّمة'));
    }
  };

  const orderedAudit = shipment
    ? [...(shipment.audit ?? [])].sort((a, b) => (normalizeApiDate(b.performedAt) ?? '').localeCompare(normalizeApiDate(a.performedAt) ?? ''))
    : [];

  return (
    <div className={wrapperClass}>
      {header}
      <div className="p-3 sm:p-4 space-y-4">
        {loadError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 break-words">
            {loadError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('Delivery method', 'طريقة التوصيل')}>{methodLabel}</Field>
          {info.customerPhone ? <Field label={t('Customer phone', 'هاتف العميل')}><span dir="ltr">{info.customerPhone}</span></Field> : null}
        </div>

        {!dispatchEnabled ? (
          <div role="status" className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {t(
                  'Courier dispatch for wholesale orders is currently disabled by the administrator. Existing shipment details are shown read-only.',
                  'تم تعطيل إرسال طلبات الجملة إلى شركة التوصيل حالياً من قبل المسؤول. تفاصيل الشحنة الحالية معروضة للقراءة فقط.'
                )}
              </span>
            </div>
            {!shipment ? (
              <Button type="button" variant="outline" size="sm" className={fullWidthBtn} disabled={loading} onClick={() => void load()}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                {t('Refresh', 'تحديث')}
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Address */}
        {actions.canEditAddress ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`dispatch-address-${orderId}`}>{t('Delivery address', 'عنوان التوصيل')}</Label>
                <Input
                  id={`dispatch-address-${orderId}`}
                  value={addressDraft}
                  disabled={busy}
                  onChange={(e) => setAddressDraft(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dispatch-city-${orderId}`}>{t('City', 'المدينة')}</Label>
                <Input
                  id={`dispatch-city-${orderId}`}
                  value={cityDraft}
                  disabled={busy}
                  onChange={(e) => setCityDraft(e.target.value)}
                />
              </div>
            </div>
            {!displayedAddress ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('The delivery address is missing. Add it before requesting dispatch.', 'عنوان التوصيل مفقود. أضفه قبل طلب الشحن.')}</span>
              </div>
            ) : null}
            {addressDirty && displayedAddress ? (
              <div className="text-xs text-amber-700">
                {t('Save the address before requesting dispatch.', 'احفظ العنوان قبل طلب الشحن.')}
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className={fullWidthBtn}
              disabled={busy || !addressDraft.trim() || !addressDirty}
              onClick={() =>
                void run(
                  () => wholesaleOrderService.updateDeliveryAddress(orderId, addressDraft.trim(), cityDraft.trim() || undefined),
                  t('Address saved', 'تم حفظ العنوان')
                )
              }
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('Save address', 'حفظ العنوان')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label={t('Delivery address', 'عنوان التوصيل')} className="sm:col-span-2">{info.address || '—'}</Field>
            <Field label={t('City', 'المدينة')}>{info.city || '—'}</Field>
          </div>
        )}

        {/* PendingSend */}
        {actions.isInProgress ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <div className="flex items-start gap-2 flex-1">
              <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" />
              <span>{t('The dispatch request is being sent to the courier. Refresh to see the latest status.', 'يتم إرسال طلب الشحن إلى شركة التوصيل. حدّث الصفحة لرؤية آخر حالة.')}</span>
            </div>
            <Button type="button" variant="outline" size="sm" className={fullWidthBtn} disabled={loading} onClick={() => void load()}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              {t('Refresh', 'تحديث')}
            </Button>
          </div>
        ) : null}

        {/* Dispatch form */}
        {showForm ? (
          <div className="space-y-3 rounded-lg border bg-slate-50/60 p-3">
            {actions.canRetryDispatch && shipment?.failureReason ? (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 break-words">
                <span className="font-medium">{t('Last attempt failed: ', 'فشلت المحاولة الأخيرة: ')}</span>
                {shipment.failureReason}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('Courier', 'شركة التوصيل')}</Label>
                <Select value={effectiveProvider} onValueChange={(v) => setProvider(v as WholesaleShipmentProvider)} disabled={busy}>
                  <SelectTrigger className="w-full" aria-label={t('Courier', 'شركة التوصيل')}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p} disabled={!isConfigured(p)}>
                        {p}{!isConfigured(p) ? t(' (not configured)', ' (غير مهيأ)') : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!providerConfigured ? (
                  <div className="text-xs text-red-600">
                    {t(
                      `The ${effectiveProvider} WhatsApp recipient number is not configured in the WhatsApp settings.`,
                      `رقم واتساب المستلم الخاص بـ ${effectiveProvider} غير مهيأ في إعدادات واتساب.`
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`dispatch-weight-${orderId}`}>{t('Override weight (kg)', 'تعديل الوزن (كغ)')}</Label>
                <Input
                  id={`dispatch-weight-${orderId}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={weightKg}
                  disabled={busy}
                  placeholder={t('Empty = use calculated weight', 'فارغ = استخدام الوزن المحسوب')}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
                {weightInvalid ? (
                  <div className="text-xs text-red-600">{t('Enter a valid weight greater than 0.', 'أدخل وزناً صالحاً أكبر من 0.')}</div>
                ) : null}
              </div>
            </div>

            <div className="text-sm flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{t('Calculated weight:', 'الوزن المحسوب:')}</span>
              <span className="font-medium" dir="ltr">{formatWeightKg(info.weight.totalGrams)}</span>
              <Badge variant="outline" className={getWeightSourceBadgeClass(info.weight.source)}>
                {getWeightSourceLabel(info.weight.source, isArabic)}
              </Badge>
            </div>
            {info.weight.source === 'Unavailable' || info.weight.source === 'Partial' || info.weight.itemsWithoutWeight > 0 ? (
              <div className="text-xs text-muted-foreground">
                {t(
                  `${info.weight.itemsWithoutWeight} item(s) have no weight data. Weight is optional and does not block dispatch; enter an override if needed.`,
                  `${info.weight.itemsWithoutWeight} عنصر بدون بيانات وزن. الوزن اختياري ولا يمنع الشحن؛ أدخل وزناً يدوياً عند الحاجة.`
                )}
              </div>
            ) : null}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`dispatch-notify-${orderId}`}
                  checked={notifyChecked}
                  disabled={!notifyAvailable || busy}
                  onCheckedChange={(v) => setNotifyCustomer(v === true)}
                />
                <Label htmlFor={`dispatch-notify-${orderId}`} className={cn(!notifyAvailable && 'text-muted-foreground')}>
                  {t('Notify customer on WhatsApp', 'إشعار العميل عبر واتساب')}
                </Label>
              </div>
              {notifyDisabledReason ? <div className="text-xs text-muted-foreground">{notifyDisabledReason}</div> : null}
            </div>

            {info.blockers.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
                <div className="font-medium mb-1">{t('Dispatch is not possible yet:', 'لا يمكن الشحن حالياً:')}</div>
                <ul className="list-disc ps-5 space-y-0.5">
                  {info.blockers.map((b, i) => <li key={i} className="break-words">{b}</li>)}
                </ul>
              </div>
            ) : null}

            <Button type="button" className={fullWidthBtn} disabled={requestDisabled} onClick={() => void submitDispatch()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {actions.canRetryDispatch ? t('Retry dispatch', 'إعادة محاولة الشحن') : t('Request dispatch', 'طلب الشحن')}
            </Button>
          </div>
        ) : null}

        {/* DeliveryUncertain */}
        {actions.canVerify ? (
          <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="font-medium">{t('WhatsApp delivery outcome unknown', 'نتيجة إرسال واتساب غير معروفة')}</div>
                <div>
                  {t(
                    'We could not confirm whether the WhatsApp message reached the courier (for example a timeout, HTTP 408/5xx or a connection failure), so it may or may not have been delivered. The request is NOT resent automatically. Verify with the courier first, then record the outcome below.',
                    'لم نتمكن من تأكيد وصول رسالة واتساب إلى شركة التوصيل (مثل انتهاء المهلة أو خطأ HTTP 408/5xx أو فشل الاتصال)، وقد تكون وصلت أو لم تصل. لن يتم إعادة إرسال الطلب تلقائياً. تحقق من شركة التوصيل أولاً، ثم سجّل النتيجة أدناه.'
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" className={fullWidthBtn} disabled={busy} onClick={() => setConfirm('verifySent')}>
                <Check className="h-4 w-4" />
                {t('Courier received it', 'استلمت شركة التوصيل الطلب')}
              </Button>
              <Button type="button" variant="outline" className={fullWidthBtn} disabled={busy} onClick={() => setConfirm('verifyNotSent')}>
                <RefreshCw className="h-4 w-4" />
                {t('Not received – allow retry', 'لم يستلم – السماح بإعادة المحاولة')}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Shipment details */}
        {shipment ? (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{shipment.provider}</span>
              <Badge variant="outline" className={getShipmentStatusBadgeClass(shipment.status)}>
                {getShipmentStatusLabel(shipment.status, isArabic)}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ms-auto h-7 px-2"
                disabled={loading || busy}
                onClick={() => void load()}
                aria-label={t('Refresh', 'تحديث')}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              </Button>
            </div>

            {shipment.failureReason && !actions.canRetryDispatch ? (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 break-words">
                {shipment.failureReason}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('Requested at', 'وقت الطلب')}>{formatDate(shipment.requestedAt)}</Field>
              <Field label={t('Attempts', 'عدد المحاولات')}>{shipment.attemptCount}</Field>
              {shipment.collectedAt ? <Field label={t('Collected at', 'وقت الاستلام من المتجر')}>{formatDate(shipment.collectedAt)}</Field> : null}
              {shipment.deliveredAt ? <Field label={t('Delivered at', 'وقت التوصيل')}>{formatDate(shipment.deliveredAt)}</Field> : null}
              <Field label={t('Weight', 'الوزن')}>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span dir="ltr">{formatWeightKg(shipment.totalWeightGrams)}</span>
                  <Badge variant="outline" className={getWeightSourceBadgeClass(shipment.weightSource)}>
                    {getWeightSourceLabel(shipment.weightSource, isArabic)}
                  </Badge>
                </span>
              </Field>
              <Field label={t('Customer notification', 'إشعار العميل')}>
                {shipment.notifyCustomer ? t('Requested', 'مطلوب') : t('Not requested', 'غير مطلوب')}
              </Field>
              {shipment.whatsAppMessageId ? (
                <Field label={t('WhatsApp message ID', 'معرّف رسالة واتساب')} className="sm:col-span-2">
                  <span className="font-mono text-xs break-all" dir="ltr">{shipment.whatsAppMessageId}</span>
                </Field>
              ) : null}
              <Field label={t('Tracking number', 'رقم التتبع')}>
                {shipment.trackingNumber ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-mono break-all" dir="ltr">{shipment.trackingNumber}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      aria-label={t('Copy tracking number', 'نسخ رقم التتبع')}
                      onClick={() => void copyTracking(shipment.trackingNumber ?? '')}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </span>
                ) : '—'}
              </Field>
              <Field label={t('Label', 'الملصق')}>
                {shipment.labelUrl ? (
                  isSafeHttpUrl(shipment.labelUrl) ? (
                    <a
                      href={shipment.labelUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all"
                    >
                      {t('Open label', 'فتح الملصق')}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="break-all" dir="ltr">{shipment.labelUrl}</span>
                  )
                ) : '—'}
              </Field>
            </div>
          </div>
        ) : null}

        {/* Tracking */}
        {actions.canEditTracking ? (
          <div className="space-y-3 rounded-lg border bg-slate-50/60 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`dispatch-tracking-${orderId}`}>{t('Tracking number', 'رقم التتبع')}</Label>
                <Input
                  id={`dispatch-tracking-${orderId}`}
                  value={trackingDraft}
                  disabled={busy}
                  dir="ltr"
                  onChange={(e) => setTrackingDraft(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dispatch-label-${orderId}`}>{t('Label URL (optional)', 'رابط الملصق (اختياري)')}</Label>
                <Input
                  id={`dispatch-label-${orderId}`}
                  value={labelUrlDraft}
                  disabled={busy}
                  dir="ltr"
                  placeholder="https://"
                  onChange={(e) => setLabelUrlDraft(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className={fullWidthBtn}
                disabled={busy || !trackingDraft.trim()}
                onClick={() =>
                  void run(
                    () => wholesaleOrderService.updateDispatchTracking(orderId, trackingDraft.trim(), labelUrlDraft.trim() || null),
                    t('Tracking saved', 'تم حفظ التتبع')
                  )
                }
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('Save tracking', 'حفظ التتبع')}
              </Button>
              {actions.canMarkCollected ? (
                <Button
                  type="button"
                  variant="outline"
                  className={fullWidthBtn}
                  disabled={busy}
                  onClick={() => void run(() => wholesaleOrderService.markDispatchCollected(orderId), t('Marked as collected', 'تم تعليم الشحنة كمستلمة'))}
                >
                  <Truck className="h-4 w-4" />
                  {t('Mark collected', 'تعليم كمستلمة من المتجر')}
                </Button>
              ) : null}
              {actions.canMarkDelivered ? (
                <Button type="button" className={fullWidthBtn} disabled={busy} onClick={() => setConfirm('delivered')}>
                  <PackageCheck className="h-4 w-4" />
                  {t('Mark delivered', 'تعليم كمسلّمة')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Audit */}
        {orderedAudit.length > 0 ? (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <span>{t('Audit history', 'سجل العمليات')} ({orderedAudit.length})</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 divide-y rounded-lg border">
                {orderedAudit.map((entry) => (
                  <li key={entry.id} className="p-2.5 text-sm space-y-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{entry.action}</span>
                      {entry.fromStatus || entry.toStatus ? (
                        <span className="text-xs text-muted-foreground">
                          {entry.fromStatus ? getShipmentStatusLabel(entry.fromStatus, isArabic) : '—'} → {entry.toStatus ? getShipmentStatusLabel(entry.toStatus, isArabic) : '—'}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(entry.performedAt)}{entry.performedBy ? ` · ${entry.performedBy}` : ''}
                    </div>
                    {entry.details ? <div className="text-xs text-gray-700 break-words">{entry.details}</div> : null}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>

      <AlertDialog open={confirm !== null && dispatchEnabled} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent dir={isArabic ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm ? confirmCopy[confirm].title : ''}</AlertDialogTitle>
            <AlertDialogDescription>{confirm ? confirmCopy[confirm].body : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirmed}>{confirm ? confirmCopy[confirm].ok : ''}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
