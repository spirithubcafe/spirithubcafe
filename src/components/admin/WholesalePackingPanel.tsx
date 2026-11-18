import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  Boxes,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  ScanLine,
  Send,
  ShieldCheck,
  Undo2,
  Unlock,
  UserRound,
  Wrench,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { wholesaleOrderService } from '../../services/wholesaleOrderService';
import {
  MAX_BOX_COUNT,
  PACKING_COURIERS,
  addDraftBox,
  buildDraftFromPlan,
  buildLabelsHtml,
  buildPackingPayload,
  draftBoxNumber,
  formatWeightKg,
  getDeliveryLocationLabel,
  getPackingStatusBadgeClass,
  getPackingStatusLabel,
  parseQuantityInput,
  qrValueForBox,
  removeDraftBox,
  setDraftBoxWeight,
  setDraftCourier,
  setDraftItemQuantity,
  summarizeAllocation,
  type LabelBox,
  type PackingDraft,
} from '../../lib/wholesalePacking';
import type {
  WholesaleDeliveryLocationType,
  WholesaleOrder,
  WholesaleOrderItem,
  WholesalePackingBox,
  WholesalePackingInfo,
  WholesalePackingResult,
} from '../../types/wholesale';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const PICKUP = 1;
const REASON_MIN = 5;
const REASON_MAX = 500;
const NO_COURIER = '__none__';
const NO_LOCATION = '__none__';

type AdminDialog = 'reopen' | 'correction' | 'courierInformed';

export interface WholesalePackingPanelProps {
  orderId: number;
  isArabic: boolean;
  shippingMethod: number;
  /** Order items from the order details (fallback names when the packing endpoint omits them). */
  items: WholesaleOrderItem[];
  customerName?: string | null;
  customerPhone?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryLocationType?: WholesaleDeliveryLocationType | null;
  /** Changing this value reloads the packing state (e.g. after a dispatch action). */
  refreshKey?: number;
  /** Called after any packing action returns fresh state (lets the dispatch panel refresh). */
  onChanged?: () => void;
  /** Called with the updated order after the recipient is saved. */
  onOrderUpdated?: (order: WholesaleOrder) => void;
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

const PRINT_SCRIPT = `<script>
window.addEventListener('load', function () {
  window.addEventListener('afterprint', function () { window.close(); });
  setTimeout(function () { window.focus(); window.print(); }, 300);
});
</script>`;

/** Renders each QR code into a detached DOM node and returns the <svg> markup (avoids bundling react-dom/server). */
const renderQrSvgs = (codes: string[]): Record<string, string> => {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
  document.body.appendChild(container);
  const root = createRoot(container);
  const values = Array.from(new Set(codes.map(qrValueForBox)));
  try {
    flushSync(() =>
      root.render(
        <>
          {values.map((value) => (
            <div key={value}>
              <QRCodeSVG value={value} size={256} level="M" marginSize={4} />
            </div>
          ))}
        </>
      )
    );
    const result: Record<string, string> = {};
    Array.from(container.children).forEach((child, i) => {
      result[values[i]] = child.innerHTML;
    });
    return result;
  } finally {
    root.unmount();
    container.remove();
  }
};

export const WholesalePackingPanel: React.FC<WholesalePackingPanelProps> = ({
  orderId,
  isArabic,
  shippingMethod,
  items: orderItems,
  customerName,
  customerPhone,
  recipientName,
  recipientPhone,
  deliveryLocationType,
  refreshKey,
  onChanged,
  onOrderUpdated,
}) => {
  const t = useCallback((en: string, ar: string) => (isArabic ? ar : en), [isArabic]);

  const [info, setInfo] = useState<WholesalePackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const loadSeqRef = useRef(0);

  const [draft, setDraft] = useState<PackingDraft>(() => buildDraftFromPlan(null));
  const [dirty, setDirty] = useState(false);
  const [boxCountInput, setBoxCountInput] = useState('1');
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  const [adminDialog, setAdminDialog] = useState<AdminDialog | null>(null);
  const [reason, setReason] = useState('');
  const [courierAck, setCourierAck] = useState(false);
  const [courierNote, setCourierNote] = useState('');

  const [recipientNameDraft, setRecipientNameDraft] = useState(recipientName ?? '');
  const [recipientPhoneDraft, setRecipientPhoneDraft] = useState(recipientPhone ?? '');
  const [locationDraft, setLocationDraft] = useState<WholesaleDeliveryLocationType | null>(deliveryLocationType ?? null);
  const [recipientSaved, setRecipientSaved] = useState({
    name: recipientName ?? '',
    phone: recipientPhone ?? '',
    location: deliveryLocationType ?? null,
  });
  const [recipientRejected, setRecipientRejected] = useState<string | null>(null);
  const [recipientBusy, setRecipientBusy] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyInfo = useCallback((next: WholesalePackingInfo, resetDraft: boolean) => {
    setInfo(next);
    if (resetDraft) {
      setDraft(buildDraftFromPlan(next.plan));
      setDirty(false);
    }
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await wholesaleOrderService.getPacking(orderId);
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      if (result.data) applyInfo(result.data, true);
      if (!result.success || !result.data) {
        setLoadError(result.message || t('Failed to load packing details', 'فشل تحميل تفاصيل التعبئة'));
      }
    } catch (err) {
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      setLoadError(errorMessage(err, t('Failed to load packing details', 'فشل تحميل تفاصيل التعبئة')));
    } finally {
      if (mountedRef.current && seq === loadSeqRef.current) setLoading(false);
    }
  }, [orderId, applyInfo, t]);

  useEffect(() => {
    void load();
    // Reload only when the order changes, not when the language toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const lastRefreshKeyRef = useRef(refreshKey);
  useEffect(() => {
    if (lastRefreshKeyRef.current === refreshKey) return;
    lastRefreshKeyRef.current = refreshKey;
    // Keep unsaved edits; the admin can refresh manually.
    if (!dirty) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  /** Runs one mutating request; the ref blocks double clicks that state alone cannot. */
  const run = async (
    action: () => Promise<WholesalePackingResult>,
    successMessage: string,
    opts: { keepDraftOnValidationError?: boolean } = {}
  ): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setActionError(null);
    try {
      const result = await action();
      if (!mountedRef.current) return false;
      if (result.data) {
        // A 400 on save leaves the server plan unchanged: keep the admin's edits so they can fix them.
        const keepDraft = !result.success && opts.keepDraftOnValidationError === true && result.statusCode === 400;
        applyInfo(result.data, !keepDraft);
        onChanged?.();
      }
      if (result.success) {
        toast.success(result.message || successMessage);
        return true;
      }
      const message = result.message || t('The request failed', 'فشل الطلب');
      setActionError(message);
      toast.error(message);
      return false;
    } catch (err) {
      if (mountedRef.current) {
        const message = errorMessage(err, t('The request failed', 'فشل الطلب'));
        setActionError(message);
        toast.error(message);
      }
      return false;
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const packingItems = useMemo(() => {
    if (info?.items?.length) return info.items;
    return orderItems.map((it) => ({
      wholesaleOrderItemId: it.id,
      productName: it.productName ?? null,
      variantInfo: it.variantInfo ?? null,
      variantSku: null,
      orderedQuantity: it.quantity,
      allocatedQuantity: 0,
      remainingQuantity: it.quantity,
    }));
  }, [info, orderItems]);

  const plan = info?.plan ?? null;
  const version = plan?.version ?? 0;
  const { payload, inputErrors } = useMemo(() => buildPackingPayload(draft, version, isArabic), [draft, version, isArabic]);
  const allocation = useMemo(
    () =>
      summarizeAllocation(
        packingItems.map((i) => ({ wholesaleOrderItemId: i.wholesaleOrderItemId, orderedQuantity: i.orderedQuantity, productName: i.productName })),
        payload.boxes,
        isArabic
      ),
    [packingItems, payload, isArabic]
  );

  const savedBoxByCode = useMemo(() => {
    const map = new Map<string, WholesalePackingBox>();
    for (const box of plan?.boxes ?? []) map.set(box.uniqueBoxCode, box);
    return map;
  }, [plan]);

  const sortedSavedBoxes = useMemo(() => [...(plan?.boxes ?? [])].sort((a, b) => a.boxNumber - b.boxNumber), [plan]);

  const editDraft = (update: (d: PackingDraft) => PackingDraft) => {
    setDraft((d) => update(d));
    setDirty(true);
  };

  // ---------- Actions ----------

  const createPlan = () => {
    const count = parseQuantityInput(boxCountInput);
    if (!count || count < 1 || count > MAX_BOX_COUNT) return;
    void run(() => wholesaleOrderService.createPacking(orderId, count), t('Packing plan created', 'تم إنشاء خطة التعبئة'));
  };

  const savePlan = () =>
    run(() => wholesaleOrderService.updatePacking(orderId, payload), t('Packing plan saved', 'تم حفظ خطة التعبئة'), {
      keepDraftOnValidationError: true,
    });

  const discardChanges = () => {
    setDraft(buildDraftFromPlan(plan));
    setDirty(false);
    setActionError(null);
  };

  const verifyBox = async (code: string) => {
    const ok = await run(
      () => wholesaleOrderService.verifyPackingBox(orderId, code, version),
      t(`Box ${code} verified`, `تم التحقق من الصندوق ${code}`)
    );
    return ok;
  };

  const submitScan = async () => {
    const typed = scanInput.trim();
    if (!typed || busyRef.current) return;
    const match = plan?.boxes.find((b) => b.uniqueBoxCode.toLowerCase() === typed.toLowerCase());
    if (match?.verifiedAt) {
      const message = t(`Box ${match.uniqueBoxCode} is already verified.`, `تم التحقق من الصندوق ${match.uniqueBoxCode} مسبقاً.`);
      setActionError(message);
      toast.message(message);
      setScanInput('');
      return;
    }
    await verifyBox(match?.uniqueBoxCode ?? typed);
    if (!mountedRef.current) return;
    setScanInput('');
    scanRef.current?.focus();
  };

  const printLabels = async (boxes: WholesalePackingBox[]) => {
    if (!info || boxes.length === 0) return;
    // Open synchronously in the click handler so pop-up blockers allow it.
    const popup = window.open('', `wholesale-box-labels-${orderId}`, 'width=480,height=760');
    if (!popup) {
      const message = t(
        'The print window was blocked. Please allow pop-ups for this site and try again.',
        'تم حظر نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم المحاولة مرة أخرى.'
      );
      setActionError(message);
      toast.error(message);
      return;
    }
    popup.document.open();
    popup.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>…</title></head><body style="font-family:Arial,sans-serif;padding:16px">Preparing labels…</body></html>`);
    popup.document.close();

    const codes = boxes.map((b) => b.uniqueBoxCode);
    try {
      const qrSvgByCode = renderQrSvgs(codes);
      const labelBoxes: LabelBox[] = boxes.map((b) => ({ code: b.uniqueBoxCode, boxNumber: b.boxNumber, weightGrams: b.weightGrams }));
      const html = buildLabelsHtml({
        labels: info.label,
        boxes: labelBoxes,
        totalBoxes: plan?.boxes.length ?? boxes.length,
        qrSvgByCode,
        isArabic,
      });
      if (popup.closed) return;
      popup.document.open();
      popup.document.write(html.replace('</body>', `${PRINT_SCRIPT}</body>`));
      popup.document.close();
    } catch (err) {
      try {
        popup.close();
      } catch {
        // ignore
      }
      const message = errorMessage(err, t('Could not prepare the labels for printing.', 'تعذر تجهيز الملصقات للطباعة.'));
      setActionError(message);
      toast.error(message);
      return;
    }

    await run(
      () => wholesaleOrderService.recordPackingLabelsPrinted(orderId, codes),
      boxes.length === 1 ? t('Label sent to the printer', 'تم إرسال الملصق إلى الطابعة') : t('Labels sent to the printer', 'تم إرسال الملصقات إلى الطابعة')
    );
  };

  const closeAdminDialog = () => {
    setAdminDialog(null);
    setReason('');
    setCourierAck(false);
    setCourierNote('');
  };

  const reasonTrimmed = reason.trim();
  const reasonValid = reasonTrimmed.length >= REASON_MIN && reasonTrimmed.length <= REASON_MAX;

  const confirmAdminDialog = async () => {
    const kind = adminDialog;
    if (!kind) return;
    let ok = false;
    if (kind === 'reopen') {
      if (!reasonValid) return;
      ok = await run(() => wholesaleOrderService.reopenPacking(orderId, version, reasonTrimmed), t('Packing plan reopened', 'تمت إعادة فتح خطة التعبئة'));
    } else if (kind === 'correction') {
      if (!reasonValid || !courierAck) return;
      ok = await run(
        () => wholesaleOrderService.startPackingCorrection(orderId, version, reasonTrimmed),
        t('Correction started – the plan is back in draft', 'بدأ التصحيح – عادت الخطة إلى المسودة')
      );
    } else {
      ok = await run(
        () => wholesaleOrderService.confirmPackingCourierInformed(orderId, courierNote),
        t('Courier confirmation recorded', 'تم تسجيل تأكيد إبلاغ شركة التوصيل')
      );
    }
    if (ok && mountedRef.current) closeAdminDialog();
  };

  // ---------- Recipient ----------

  const shipmentBlocksRecipient = !!info?.shipment && info.shipment.status !== 'Failed';
  const recipientDisabled = recipientBusy || shipmentBlocksRecipient || !!recipientRejected;
  const recipientDirty =
    recipientNameDraft.trim() !== recipientSaved.name.trim() ||
    recipientPhoneDraft.trim() !== recipientSaved.phone.trim() ||
    locationDraft !== recipientSaved.location;
  const recipientTooLong = recipientNameDraft.trim().length > 200 || recipientPhoneDraft.trim().length > 20;

  const saveRecipient = async () => {
    if (recipientBusy || !recipientDirty || recipientTooLong) return;
    setRecipientBusy(true);
    try {
      const result = await wholesaleOrderService.updateRecipient(orderId, {
        recipientName: recipientNameDraft.trim() || null,
        recipientPhone: recipientPhoneDraft.trim() || null,
        deliveryLocationType: locationDraft,
      });
      if (!mountedRef.current) return;
      if (result.success) {
        const order = result.data;
        const saved = {
          name: order?.recipientName ?? (recipientNameDraft.trim() || ''),
          phone: order?.recipientPhone ?? (recipientPhoneDraft.trim() || ''),
          location: order ? order.deliveryLocationType ?? null : locationDraft,
        };
        setRecipientSaved(saved);
        setRecipientNameDraft(saved.name);
        setRecipientPhoneDraft(saved.phone);
        setLocationDraft(saved.location);
        if (order) onOrderUpdated?.(order);
        toast.success(result.message || t('Recipient saved', 'تم حفظ بيانات المستلم'));
        void load();
      } else {
        const message = result.message || t('Could not save the recipient', 'تعذر حفظ بيانات المستلم');
        if (result.statusCode === 409) setRecipientRejected(message);
        toast.error(message);
      }
    } catch (err) {
      if (mountedRef.current) toast.error(errorMessage(err, t('Could not save the recipient', 'تعذر حفظ بيانات المستلم')));
    } finally {
      if (mountedRef.current) setRecipientBusy(false);
    }
  };

  // ---------- Render ----------

  const wrapperClass = 'rounded-xl border bg-white';
  const header = (
    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b font-medium text-gray-900 flex items-center gap-2">
      <Boxes className="h-4 w-4" />
      <span className="flex-1">{t('Box Labels & Packing', 'ملصقات الصناديق والتعبئة')}</span>
      {info ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={loading || busy}
          onClick={() => {
            if (dirty && !window.confirm(t('Discard unsaved packing changes?', 'تجاهل تغييرات التعبئة غير المحفوظة؟'))) return;
            void load();
          }}
          aria-label={t('Refresh', 'تحديث')}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      ) : null}
    </div>
  );

  if (!info) {
    return (
      <div className={wrapperClass}>
        {header}
        <div className="p-3 sm:p-4">
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

  const isAdmin = info.isAdmin === true;
  const canEdit = info.canEdit && !!plan && plan.status === 'Draft';
  const isPickup = shippingMethod === PICKUP;
  const fullWidthBtn = 'w-full sm:w-auto gap-2';
  const progress = allocation.totalOrdered > 0 ? Math.min(100, Math.round((Math.min(allocation.totalAllocated, allocation.totalOrdered) / allocation.totalOrdered) * 100)) : 0;
  const allocationById = new Map(allocation.items.map((s) => [s.wholesaleOrderItemId, s]));
  const canPrint = !!plan && plan.boxes.length > 0 && !dirty;
  const orderedAudit = [...(info.audit ?? [])]
    .sort((a, b) => (normalizeApiDate(b.performedAt) ?? '').localeCompare(normalizeApiDate(a.performedAt) ?? ''))
    .slice(0, 50);
  const boxCount = parseQuantityInput(boxCountInput);
  const boxCountValid = typeof boxCount === 'number' && boxCount >= 1 && boxCount <= MAX_BOX_COUNT;
  const verifiedBoxes = plan?.boxes.filter((b) => b.verifiedAt).length ?? 0;
  const itemName = (id: number) => packingItems.find((i) => i.wholesaleOrderItemId === id)?.productName || `#${id}`;

  const stateClass = (state: 'exact' | 'under' | 'over') =>
    state === 'exact' ? 'text-green-700' : state === 'over' ? 'text-red-700' : 'text-amber-700';

  const banner = (tone: 'red' | 'amber' | 'blue' | 'slate', icon: React.ReactNode, content: React.ReactNode, role: 'alert' | 'status' = 'status') => (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2 rounded-lg border p-3 text-sm',
        tone === 'red' && 'border-red-200 bg-red-50 text-red-700',
        tone === 'amber' && 'border-amber-300 bg-amber-50 text-amber-900',
        tone === 'blue' && 'border-blue-200 bg-blue-50 text-blue-900',
        tone === 'slate' && 'border-slate-200 bg-slate-50 text-slate-700'
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 break-words">{content}</div>
    </div>
  );

  const adminDialogCopy: Record<AdminDialog, { title: string; body: string; ok: string }> = {
    reopen: {
      title: t('Reopen verified packing plan?', 'إعادة فتح خطة التعبئة المتحقق منها؟'),
      body: t(
        'The plan returns to Draft and all box verifications are cleared. Box codes are kept. A reason is required and recorded in the audit history.',
        'ستعود الخطة إلى المسودة وسيتم مسح جميع عمليات التحقق من الصناديق مع الاحتفاظ برموز الصناديق. السبب مطلوب وسيُسجل في سجل العمليات.'
      ),
      ok: t('Reopen plan', 'إعادة فتح الخطة'),
    },
    correction: {
      title: t('Start packing correction?', 'بدء تصحيح التعبئة؟'),
      body: t(
        'A courier request already exists. The plan returns to Draft so boxes can be corrected. Nothing is resent to the courier – you must inform the courier of the corrected box count and weight yourself.',
        'يوجد طلب شحن لدى شركة التوصيل بالفعل. ستعود الخطة إلى المسودة لتصحيح الصناديق. لن يُعاد إرسال أي شيء إلى شركة التوصيل – يجب عليك إبلاغ شركة التوصيل بعدد الصناديق والوزن المصحح بنفسك.'
      ),
      ok: t('Start correction', 'بدء التصحيح'),
    },
    courierInformed: {
      title: t('Confirm the courier was informed?', 'تأكيد إبلاغ شركة التوصيل؟'),
      body: t(
        'Confirm that you told the courier the corrected box count and weight. This clears the shipment mismatch warning.',
        'أكّد أنك أبلغت شركة التوصيل بعدد الصناديق والوزن المصحح. سيؤدي ذلك إلى إزالة تحذير عدم التطابق.'
      ),
      ok: t('Courier was informed', 'تم إبلاغ شركة التوصيل'),
    },
  };

  const adminConfirmDisabled =
    busy ||
    (adminDialog === 'reopen' && !reasonValid) ||
    (adminDialog === 'correction' && (!reasonValid || !courierAck));

  return (
    <div className={wrapperClass}>
      {header}
      <div className="p-3 sm:p-4 space-y-4">
        {loadError ? banner('red', <AlertTriangle className="h-4 w-4" />, loadError, 'alert') : null}
        {actionError ? banner('red', <AlertTriangle className="h-4 w-4" />, actionError, 'alert') : null}
        {info.locked
          ? banner('slate', <Lock className="h-4 w-4" />, info.lockReason || t('The packing plan is locked.', 'خطة التعبئة مقفلة.'))
          : null}
        {info.shipmentMismatch
          ? banner(
              'amber',
              <AlertTriangle className="h-4 w-4" />,
              info.shipmentMismatchMessage ||
                t('The packing plan no longer matches what was sent to the courier.', 'خطة التعبئة لم تعد مطابقة لما تم إرساله إلى شركة التوصيل.'),
              'alert'
            )
          : null}
        {plan?.correctionInProgress
          ? banner(
              'amber',
              <Wrench className="h-4 w-4" />,
              t(
                'Correction in progress. Fix the boxes, verify again, then inform the courier manually and confirm it here.',
                'التصحيح قيد التنفيذ. صحّح الصناديق وتحقق منها مجدداً، ثم أبلغ شركة التوصيل يدوياً وأكّد ذلك هنا.'
              )
            )
          : null}

        {/* No plan yet */}
        {!plan ? (
          <div className="space-y-3">
            {!isPickup
              ? banner(
                  'blue',
                  <Boxes className="h-4 w-4" />,
                  info.shipment
                    ? t(
                        'This order has no packing plan yet. A verified packing plan with box labels is required before the next new courier dispatch.',
                        'لا توجد خطة تعبئة لهذا الطلب بعد. يلزم وجود خطة تعبئة متحقق منها مع ملصقات الصناديق قبل أي طلب شحن جديد.'
                      )
                    : t(
                        'A verified packing plan is required before this order can be dispatched to a courier. This also applies to orders created before box labels were introduced.',
                        'يلزم وجود خطة تعبئة متحقق منها قبل إرسال هذا الطلب إلى شركة التوصيل، وينطبق ذلك أيضاً على الطلبات التي أُنشئت قبل إضافة ملصقات الصناديق.'
                      )
                )
              : null}
            {info.canEdit ? (
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <div className="space-y-1 sm:w-48">
                  <Label htmlFor={`packing-box-count-${orderId}`}>{t('Number of boxes', 'عدد الصناديق')}</Label>
                  <Input
                    id={`packing-box-count-${orderId}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_BOX_COUNT}
                    step={1}
                    value={boxCountInput}
                    disabled={busy}
                    onChange={(e) => setBoxCountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createPlan();
                      }
                    }}
                  />
                </div>
                <Button type="button" className={fullWidthBtn} disabled={busy || !boxCountValid} onClick={createPlan}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {t('Create packing plan', 'إنشاء خطة التعبئة')}
                </Button>
              </div>
            ) : null}
            {!boxCountValid && boxCountInput.trim() !== '' ? (
              <div className="text-xs text-red-600">
                {t(`Enter a whole number between 1 and ${MAX_BOX_COUNT}.`, `أدخل عدداً صحيحاً بين 1 و${MAX_BOX_COUNT}.`)}
              </div>
            ) : null}
          </div>
        ) : null}

        {plan ? (
          <>
            {/* Plan summary */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={getPackingStatusBadgeClass(plan.status)}>
                  {getPackingStatusLabel(plan.status, isArabic)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t('Version', 'الإصدار')} {plan.version}
                </span>
                {dirty ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                    {t('Unsaved changes', 'تغييرات غير محفوظة')}
                  </Badge>
                ) : null}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label={t('Boxes', 'الصناديق')}>
                  {plan.boxes.length}
                  {plan.status !== 'Draft' ? (
                    <span className="text-muted-foreground"> · {t(`${verifiedBoxes} verified`, `${verifiedBoxes} متحقق منها`)}</span>
                  ) : null}
                </Field>
                <Field label={t('Total weight', 'الوزن الإجمالي')}>
                  <span dir="ltr">{formatWeightKg(plan.totalWeightGrams)}</span>
                  {!plan.allBoxesWeighed ? (
                    <span className="block text-xs text-amber-700">{t('Not all boxes are weighed', 'لم يتم وزن جميع الصناديق')}</span>
                  ) : null}
                </Field>
                <Field label={t('Updated', 'آخر تحديث')}>
                  {formatDate(plan.updatedAt)}
                  {plan.updatedBy ? ` · ${plan.updatedBy}` : ''}
                </Field>
                {plan.verifiedAt ? (
                  <Field label={t('Plan verified', 'تم التحقق من الخطة')}>
                    {formatDate(plan.verifiedAt)}
                    {plan.verifiedBy ? ` · ${plan.verifiedBy}` : ''}
                  </Field>
                ) : null}
                {plan.reopenedAt ? (
                  <Field label={t('Reopened', 'أعيد فتحها')} className="sm:col-span-2">
                    {formatDate(plan.reopenedAt)}
                    {plan.reopenedBy ? ` · ${plan.reopenedBy}` : ''}
                    {plan.reopenReason ? <span className="block text-xs text-muted-foreground">{plan.reopenReason}</span> : null}
                  </Field>
                ) : null}
              </div>

              <div className="space-y-1 sm:max-w-xs">
                <Label>{t('Preferred courier (shown on labels)', 'شركة التوصيل المفضلة (تظهر على الملصقات)')}</Label>
                <Select
                  value={draft.preferredCourier ?? NO_COURIER}
                  disabled={!canEdit || busy}
                  onValueChange={(v) => editDraft((d) => setDraftCourier(d, v === NO_COURIER ? null : v))}
                >
                  <SelectTrigger className="w-full" aria-label={t('Preferred courier', 'شركة التوصيل المفضلة')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COURIER}>{t('Not set', 'غير محدد')}</SelectItem>
                    {PACKING_COURIERS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Completeness */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{t('Allocation', 'توزيع الكميات')}</span>
                <span className={cn('font-medium', allocation.isComplete ? 'text-green-700' : 'text-amber-700')}>
                  {allocation.totalAllocated} / {allocation.totalOrdered}
                  {allocation.isComplete ? ` · ${t('Complete', 'مكتمل')}` : ` · ${t('Incomplete', 'غير مكتمل')}`}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={t('Allocation progress', 'تقدم التوزيع')}
              >
                <div
                  className={cn('h-full transition-all', allocation.isComplete ? 'bg-green-600' : allocation.items.some((i) => i.state === 'over') ? 'bg-red-600' : 'bg-amber-500')}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-start font-normal py-1 pe-2">{t('Item', 'العنصر')}</th>
                      <th className="text-end font-normal py-1 px-2">{t('Ordered', 'المطلوب')}</th>
                      <th className="text-end font-normal py-1 px-2">{t('Packed', 'المعبأ')}</th>
                      <th className="text-end font-normal py-1 ps-2">{t('Remaining', 'المتبقي')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {packingItems.map((item) => {
                      const s = allocationById.get(item.wholesaleOrderItemId);
                      if (!s) return null;
                      return (
                        <tr key={item.wholesaleOrderItemId}>
                          <td className="py-1.5 pe-2 min-w-0">
                            <div className="break-words">{item.productName || `#${item.wholesaleOrderItemId}`}</div>
                            {item.variantInfo || item.variantSku ? (
                              <div className="text-xs text-muted-foreground break-words">
                                {[item.variantInfo, item.variantSku ? `SKU ${item.variantSku}` : null].filter(Boolean).join(' · ')}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-1.5 px-2 text-end tabular-nums">{s.ordered}</td>
                          <td className="py-1.5 px-2 text-end tabular-nums">{s.allocated}</td>
                          <td className={cn('py-1.5 ps-2 text-end font-medium tabular-nums', stateClass(s.state))}>
                            {s.state === 'over' ? `+${-s.remaining}` : s.remaining}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {dirty && (allocation.errors.length > 0 || inputErrors.length > 0) ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900">
                  <div className="font-medium mb-1">{t('Unsaved plan problems:', 'مشاكل في الخطة غير المحفوظة:')}</div>
                  <ul className="list-disc ps-5 space-y-0.5">
                    {[...inputErrors, ...allocation.errors].map((e, i) => <li key={i} className="break-words">{e}</li>)}
                  </ul>
                </div>
              ) : null}
              {!dirty && info.errors.length > 0 ? (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                  <div className="font-medium mb-1">{t('Packing problems:', 'مشاكل في التعبئة:')}</div>
                  <ul className="list-disc ps-5 space-y-0.5">
                    {info.errors.map((e, i) => <li key={i} className="break-words">{e}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Scan to verify */}
            {info.canVerifyBoxes && !dirty ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2">
                <Label htmlFor={`packing-scan-${orderId}`} className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4" />
                  {t('Scan or enter a box code to verify it', 'امسح رمز الصندوق أو أدخله للتحقق منه')}
                </Label>
                <form
                  className="flex flex-col sm:flex-row gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitScan();
                  }}
                >
                  <Input
                    id={`packing-scan-${orderId}`}
                    ref={scanRef}
                    value={scanInput}
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    disabled={busy}
                    onChange={(e) => setScanInput(e.target.value)}
                  />
                  <Button type="submit" className={fullWidthBtn} disabled={busy || !scanInput.trim()}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {t('Verify', 'تحقق')}
                  </Button>
                </form>
                <div className="text-xs text-muted-foreground">
                  {t(`${verifiedBoxes} of ${plan.boxes.length} boxes verified`, `تم التحقق من ${verifiedBoxes} من ${plan.boxes.length} صناديق`)}
                </div>
              </div>
            ) : null}

            {/* Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {draft.boxes.map((box, index) => {
                const saved = box.uniqueBoxCode ? savedBoxByCode.get(box.uniqueBoxCode) : undefined;
                const number = draftBoxNumber(index);
                return (
                  <div key={box.key} className="rounded-lg border p-3 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">
                          {t(`Box ${number} of ${draft.boxes.length}`, `صندوق ${number} من ${draft.boxes.length}`)}
                        </div>
                        <div className="font-mono text-xs break-all" dir="ltr">
                          {box.uniqueBoxCode ?? t('New box – code assigned on save', 'صندوق جديد – يُنشأ الرمز عند الحفظ')}
                        </div>
                      </div>
                      {saved ? (
                        saved.verifiedAt ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t('Verified', 'تم التحقق')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            {t('Not verified', 'غير متحقق منه')}
                          </Badge>
                        )
                      ) : null}
                    </div>

                    {saved?.verifiedAt ? (
                      <div className="text-xs text-muted-foreground">
                        {t('Verified', 'تم التحقق')}: {formatDate(saved.verifiedAt)}
                        {saved.verifiedBy ? ` · ${saved.verifiedBy}` : ''}
                      </div>
                    ) : null}
                    {saved && saved.labelPrintCount > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        {t(`Label printed ${saved.labelPrintCount}×`, `طُبع الملصق ${saved.labelPrintCount} مرة`)}
                        {saved.lastLabelPrintedAt ? ` · ${formatDate(saved.lastLabelPrintedAt)}` : ''}
                      </div>
                    ) : null}

                    <div className="space-y-1">
                      <Label htmlFor={`packing-weight-${orderId}-${box.key}`}>{t('Weight (g, optional)', 'الوزن (غرام، اختياري)')}</Label>
                      {canEdit ? (
                        <Input
                          id={`packing-weight-${orderId}-${box.key}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="100000"
                          step="0.001"
                          dir="ltr"
                          value={box.weight}
                          disabled={busy}
                          onChange={(e) => editDraft((d) => setDraftBoxWeight(d, index, e.target.value))}
                        />
                      ) : (
                        <div className="text-sm" dir="ltr">{saved?.weightGrams ? `${saved.weightGrams} g (${formatWeightKg(saved.weightGrams)})` : '—'}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">{t('Contents', 'المحتويات')}</div>
                      {packingItems.map((item) => {
                        const raw = box.quantities[item.wholesaleOrderItemId] ?? '';
                        const invalid = parseQuantityInput(raw) === undefined;
                        if (!canEdit && !(Number(raw) > 0)) return null;
                        return (
                          <div key={item.wholesaleOrderItemId} className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm break-words">{item.productName || `#${item.wholesaleOrderItemId}`}</div>
                              {item.variantInfo || item.variantSku ? (
                                <div className="text-xs text-muted-foreground break-words">
                                  {[item.variantInfo, item.variantSku ? `SKU ${item.variantSku}` : null].filter(Boolean).join(' · ')}
                                </div>
                              ) : null}
                            </div>
                            {canEdit ? (
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={1}
                                dir="ltr"
                                className={cn('w-20 shrink-0 text-center', invalid && 'border-red-500')}
                                aria-label={t(`Quantity of ${itemName(item.wholesaleOrderItemId)} in box ${number}`, `كمية ${itemName(item.wholesaleOrderItemId)} في الصندوق ${number}`)}
                                aria-invalid={invalid}
                                value={raw}
                                placeholder="0"
                                disabled={busy}
                                onChange={(e) => editDraft((d) => setDraftItemQuantity(d, index, item.wholesaleOrderItemId, e.target.value))}
                              />
                            ) : (
                              <span className="text-sm font-semibold tabular-nums">× {raw}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      {saved && canPrint ? (
                        <Button type="button" variant="outline" size="sm" className={fullWidthBtn} disabled={busy} onClick={() => void printLabels([saved])}>
                          <Printer className="h-4 w-4" />
                          {saved.labelPrintCount > 0 ? t(`Reprint label (${saved.labelPrintCount})`, `إعادة طباعة الملصق (${saved.labelPrintCount})`) : t('Print label', 'طباعة الملصق')}
                        </Button>
                      ) : null}
                      {saved && info.canVerifyBoxes && !saved.verifiedAt && !dirty ? (
                        <Button type="button" size="sm" className={fullWidthBtn} disabled={busy} onClick={() => void verifyBox(saved.uniqueBoxCode)}>
                          <Check className="h-4 w-4" />
                          {t('Verify box', 'تحقق من الصندوق')}
                        </Button>
                      ) : null}
                      {canEdit ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn(fullWidthBtn, 'text-red-600 hover:text-red-700')}
                          disabled={busy}
                          onClick={() => editDraft((d) => removeDraftBox(d, index))}
                        >
                          <Minus className="h-4 w-4" />
                          {t('Remove box', 'إزالة الصندوق')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                className={fullWidthBtn}
                disabled={busy || draft.boxes.length >= MAX_BOX_COUNT}
                onClick={() => editDraft(addDraftBox)}
              >
                <Plus className="h-4 w-4" />
                {t('Add box', 'إضافة صندوق')}
              </Button>
            ) : null}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 border-t pt-3">
              {canEdit ? (
                <Button type="button" className={fullWidthBtn} disabled={busy || !dirty || inputErrors.length > 0} onClick={() => void savePlan()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('Save packing plan', 'حفظ خطة التعبئة')}
                </Button>
              ) : null}
              {dirty ? (
                <Button type="button" variant="ghost" className={fullWidthBtn} disabled={busy} onClick={discardChanges}>
                  <Undo2 className="h-4 w-4" />
                  {t('Discard changes', 'تجاهل التغييرات')}
                </Button>
              ) : null}
              {info.canSubmit && !dirty ? (
                <Button
                  type="button"
                  className={fullWidthBtn}
                  disabled={busy}
                  onClick={() => void run(() => wholesaleOrderService.submitPacking(orderId, version), t('Submitted for verification', 'تم الإرسال للتحقق'))}
                >
                  <Send className="h-4 w-4" />
                  {t('Submit for verification', 'إرسال للتحقق')}
                </Button>
              ) : null}
              {info.canUnlock ? (
                <Button
                  type="button"
                  variant="outline"
                  className={fullWidthBtn}
                  disabled={busy}
                  onClick={() => void run(() => wholesaleOrderService.unlockPacking(orderId, version), t('Plan unlocked – back to draft', 'تم فتح الخطة – عادت إلى المسودة'))}
                >
                  <Unlock className="h-4 w-4" />
                  {t('Unlock (back to draft)', 'فتح القفل (العودة إلى المسودة)')}
                </Button>
              ) : null}
              {info.canVerifyPlan ? (
                <Button
                  type="button"
                  className={fullWidthBtn}
                  disabled={busy}
                  onClick={() => void run(() => wholesaleOrderService.verifyPackingPlan(orderId, version), t('Packing plan verified', 'تم التحقق من خطة التعبئة'))}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t('Verify packing plan', 'التحقق من خطة التعبئة')}
                </Button>
              ) : null}
              {plan.boxes.length > 0 ? (
                <Button type="button" variant="outline" className={fullWidthBtn} disabled={busy || !canPrint} onClick={() => void printLabels(sortedSavedBoxes)}>
                  <Printer className="h-4 w-4" />
                  {t(`Print all labels (${plan.boxes.length})`, `طباعة جميع الملصقات (${plan.boxes.length})`)}
                </Button>
              ) : null}
              {isAdmin && info.canReopen ? (
                <Button type="button" variant="outline" className={fullWidthBtn} disabled={busy} onClick={() => setAdminDialog('reopen')}>
                  <RotateCcw className="h-4 w-4" />
                  {t('Reopen plan', 'إعادة فتح الخطة')}
                </Button>
              ) : null}
              {isAdmin && info.canCorrect ? (
                <Button type="button" variant="outline" className={fullWidthBtn} disabled={busy} onClick={() => setAdminDialog('correction')}>
                  <Wrench className="h-4 w-4" />
                  {t('Start correction', 'بدء التصحيح')}
                </Button>
              ) : null}
              {isAdmin && info.canConfirmCourierInformed ? (
                <Button type="button" variant="outline" className={fullWidthBtn} disabled={busy} onClick={() => setAdminDialog('courierInformed')}>
                  <Check className="h-4 w-4" />
                  {t('Confirm courier informed', 'تأكيد إبلاغ شركة التوصيل')}
                </Button>
              ) : null}
            </div>
            {dirty && plan.boxes.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {t('Save your changes before printing labels or submitting for verification.', 'احفظ التغييرات قبل طباعة الملصقات أو الإرسال للتحقق.')}
              </div>
            ) : null}
          </>
        ) : null}

        {/* Recipient */}
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserRound className="h-4 w-4" />
            {t('Label recipient', 'المستلم على الملصق')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`packing-recipient-name-${orderId}`}>{t('Recipient name', 'اسم المستلم')}</Label>
              <Input
                id={`packing-recipient-name-${orderId}`}
                value={recipientNameDraft}
                maxLength={200}
                placeholder={customerName ?? ''}
                disabled={recipientDisabled}
                onChange={(e) => setRecipientNameDraft(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`packing-recipient-phone-${orderId}`}>{t('Recipient phone', 'هاتف المستلم')}</Label>
              <Input
                id={`packing-recipient-phone-${orderId}`}
                value={recipientPhoneDraft}
                maxLength={20}
                dir="ltr"
                inputMode="tel"
                placeholder={customerPhone ?? ''}
                disabled={recipientDisabled}
                onChange={(e) => setRecipientPhoneDraft(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('Delivery location', 'موقع التسليم')}</Label>
              <Select
                value={locationDraft ?? NO_LOCATION}
                disabled={recipientDisabled}
                onValueChange={(v) => setLocationDraft(v === 'Home' || v === 'Office' ? v : null)}
              >
                <SelectTrigger className="w-full" aria-label={t('Delivery location', 'موقع التسليم')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LOCATION}>{t('Not set', 'غير محدد')}</SelectItem>
                  <SelectItem value="Home">{getDeliveryLocationLabel('Home', isArabic)}</SelectItem>
                  <SelectItem value="Office">{getDeliveryLocationLabel('Office', isArabic)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {t('Leave empty to use the customer name and phone on the labels.', 'اتركه فارغاً لاستخدام اسم العميل وهاتفه على الملصقات.')}
          </div>
          {recipientRejected || shipmentBlocksRecipient ? (
            <div className="text-xs text-amber-700 break-words">
              {recipientRejected ||
                t('The recipient cannot be changed after the order was sent to the courier.', 'لا يمكن تغيير المستلم بعد إرسال الطلب إلى شركة التوصيل.')}
            </div>
          ) : null}
          {recipientTooLong ? (
            <div className="text-xs text-red-600">
              {t('Name must be at most 200 characters and phone at most 20.', 'يجب ألا يتجاوز الاسم 200 حرف والهاتف 20 حرفاً.')}
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className={fullWidthBtn}
            disabled={recipientDisabled || !recipientDirty || recipientTooLong}
            onClick={() => void saveRecipient()}
          >
            {recipientBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('Save recipient', 'حفظ المستلم')}
          </Button>
        </div>

        {/* Audit */}
        {orderedAudit.length > 0 ? (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <span>{t('Packing history', 'سجل التعبئة')} ({orderedAudit.length})</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 divide-y rounded-lg border">
                {orderedAudit.map((entry) => (
                  <li key={entry.id} className="p-2.5 text-sm space-y-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{entry.action}</span>
                      {entry.boxCode ? <span className="font-mono text-xs" dir="ltr">{entry.boxCode}</span> : null}
                      {entry.fromStatus || entry.toStatus ? (
                        <span className="text-xs text-muted-foreground">
                          {entry.fromStatus ? getPackingStatusLabel(entry.fromStatus, isArabic) : '—'} → {entry.toStatus ? getPackingStatusLabel(entry.toStatus, isArabic) : '—'}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(entry.performedAt)}{entry.performedBy ? ` · ${entry.performedBy}` : ''}
                    </div>
                    {entry.reason ? <div className="text-xs text-gray-700 break-words">{t('Reason', 'السبب')}: {entry.reason}</div> : null}
                    {entry.details ? <div className="text-xs text-gray-700 break-words">{entry.details}</div> : null}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>

      <AlertDialog open={adminDialog !== null} onOpenChange={(open) => { if (!open && !busy) closeAdminDialog(); }}>
        <AlertDialogContent dir={isArabic ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{adminDialog ? adminDialogCopy[adminDialog].title : ''}</AlertDialogTitle>
            <AlertDialogDescription>{adminDialog ? adminDialogCopy[adminDialog].body : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          {adminDialog === 'reopen' || adminDialog === 'correction' ? (
            <div className="space-y-2">
              <Label htmlFor={`packing-reason-${orderId}`}>{t('Reason (required)', 'السبب (مطلوب)')}</Label>
              <Textarea
                id={`packing-reason-${orderId}`}
                value={reason}
                maxLength={REASON_MAX}
                rows={3}
                disabled={busy}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className={cn('text-xs', reasonTrimmed.length > 0 && !reasonValid ? 'text-red-600' : 'text-muted-foreground')}>
                {t(`${REASON_MIN}–${REASON_MAX} characters (${reasonTrimmed.length})`, `${REASON_MIN}–${REASON_MAX} حرفاً (${reasonTrimmed.length})`)}
              </div>
              {adminDialog === 'correction' ? (
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id={`packing-courier-ack-${orderId}`}
                    checked={courierAck}
                    disabled={busy}
                    onCheckedChange={(v) => setCourierAck(v === true)}
                  />
                  <Label htmlFor={`packing-courier-ack-${orderId}`} className="leading-snug">
                    {t('I will inform the courier manually', 'سأبلغ شركة التوصيل يدوياً')}
                  </Label>
                </div>
              ) : null}
            </div>
          ) : null}
          {adminDialog === 'courierInformed' ? (
            <div className="space-y-2">
              <Label htmlFor={`packing-courier-note-${orderId}`}>{t('Note (optional)', 'ملاحظة (اختياري)')}</Label>
              <Textarea
                id={`packing-courier-note-${orderId}`}
                value={courierNote}
                maxLength={REASON_MAX}
                rows={2}
                disabled={busy}
                onChange={(e) => setCourierNote(e.target.value)}
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
            <Button type="button" disabled={adminConfirmDisabled} onClick={() => void confirmAdminDialog()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {adminDialog ? adminDialogCopy[adminDialog].ok : ''}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
