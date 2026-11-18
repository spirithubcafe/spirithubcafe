import type {
  WholesaleDeliveryLocationType,
  WholesalePackingBoxItem,
  WholesalePackingLabel,
  WholesalePackingPlan,
  WholesalePackingStatus,
  WholesalePackingUpdateRequest,
  WholesaleShipmentProvider,
} from '../types/wholesale';

export type {
  WholesalePackingInfo,
  WholesalePackingItem,
  WholesalePackingLabel,
  WholesalePackingPlan,
  WholesalePackingUpdateRequest,
} from '../types/wholesale';

export const MAX_BOX_COUNT = 100;
export const MAX_BOX_WEIGHT_GRAMS = 100000;
export const PACKING_COURIERS: readonly WholesaleShipmentProvider[] = ['Nool', 'Genacom'];

const tr = (isArabic: boolean, en: string, ar: string): string => (isArabic ? ar : en);

// ---------- Input parsing ----------

/** Empty => null (nothing in this box); whole number >= 0 => value; anything else => undefined (invalid). */
export const parseQuantityInput = (input: string | null | undefined): number | null | undefined => {
  const trimmed = (input ?? '').trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : undefined;
};

/** Grams with up to 3 decimals, > 0 and <= 100000. Empty => null (not weighed); invalid => undefined. */
export const parseWeightInput = (input: string | null | undefined): number | null | undefined => {
  const trimmed = (input ?? '').trim().replace(',', '.');
  if (trimmed === '') return null;
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed) && !/^\.\d{1,3}$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_BOX_WEIGHT_GRAMS) return undefined;
  return value;
};

/** Grams -> "x.xxx kg" (trailing zeros trimmed to at least 2 decimals); "—" for missing/invalid. */
export const formatWeightKg = (grams?: number | null): string => {
  if (grams === null || grams === undefined || !Number.isFinite(grams) || grams < 0) return '—';
  const kg = (grams / 1000).toFixed(3).replace(/0$/, '');
  return `${kg} kg`;
};

// ---------- Draft editing ----------

export interface PackingDraftBox {
  /** Stable React key; never sent to the server. */
  key: string;
  /** null = new box (server generates the code on save). */
  uniqueBoxCode: string | null;
  weight: string;
  /** wholesaleOrderItemId -> raw quantity input. */
  quantities: Record<number, string>;
}

export interface PackingDraft {
  preferredCourier: WholesaleShipmentProvider | null;
  boxes: PackingDraftBox[];
}

let draftKeySeq = 0;
const nextKey = () => `new-${++draftKeySeq}`;

const toCourier = (value: string | null | undefined): WholesaleShipmentProvider | null =>
  PACKING_COURIERS.includes(value as WholesaleShipmentProvider) ? (value as WholesaleShipmentProvider) : null;

const formatNumberInput = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value) ? '' : String(value);

export const buildDraftFromPlan = (plan: WholesalePackingPlan | null | undefined): PackingDraft => {
  if (!plan) return { preferredCourier: null, boxes: [] };
  const boxes = [...plan.boxes]
    .sort((a, b) => a.boxNumber - b.boxNumber)
    .map<PackingDraftBox>((box) => {
      const quantities: Record<number, string> = {};
      for (const item of box.items) {
        quantities[item.wholesaleOrderItemId] = String(
          (Number(quantities[item.wholesaleOrderItemId]) || 0) + item.quantity
        );
      }
      return {
        key: `box-${box.uniqueBoxCode}`,
        uniqueBoxCode: box.uniqueBoxCode,
        weight: formatNumberInput(box.weightGrams),
        quantities,
      };
    });
  return { preferredCourier: toCourier(plan.preferredCourier), boxes };
};

export const addDraftBox = (draft: PackingDraft): PackingDraft =>
  draft.boxes.length >= MAX_BOX_COUNT
    ? draft
    : { ...draft, boxes: [...draft.boxes, { key: nextKey(), uniqueBoxCode: null, weight: '', quantities: {} }] };

/** Removes a box; remaining boxes are renumbered by position. Removed existing boxes are simply omitted from the payload. */
export const removeDraftBox = (draft: PackingDraft, index: number): PackingDraft => {
  if (index < 0 || index >= draft.boxes.length) return draft;
  return { ...draft, boxes: draft.boxes.filter((_, i) => i !== index) };
};

const updateBox = (draft: PackingDraft, index: number, update: (box: PackingDraftBox) => PackingDraftBox): PackingDraft => {
  if (index < 0 || index >= draft.boxes.length) return draft;
  return { ...draft, boxes: draft.boxes.map((box, i) => (i === index ? update(box) : box)) };
};

export const setDraftItemQuantity = (draft: PackingDraft, boxIndex: number, itemId: number, value: string): PackingDraft =>
  updateBox(draft, boxIndex, (box) => ({ ...box, quantities: { ...box.quantities, [itemId]: value } }));

export const setDraftBoxWeight = (draft: PackingDraft, boxIndex: number, value: string): PackingDraft =>
  updateBox(draft, boxIndex, (box) => ({ ...box, weight: value }));

export const setDraftCourier = (draft: PackingDraft, courier: string | null): PackingDraft => ({
  ...draft,
  preferredCourier: toCourier(courier),
});

/** Box number shown for a draft box (array order defines box numbers). */
export const draftBoxNumber = (index: number): number => index + 1;

export interface PackingPayloadResult {
  payload: WholesalePackingUpdateRequest;
  /** Input problems that must be fixed before saving. */
  inputErrors: string[];
}

/** Converts the draft into the PUT payload. Zero/empty quantities are omitted; invalid inputs are reported. */
export const buildPackingPayload = (
  draft: PackingDraft,
  expectedVersion: number,
  isArabic = false
): PackingPayloadResult => {
  const inputErrors: string[] = [];
  const boxes = draft.boxes.map((box, index) => {
    const number = draftBoxNumber(index);
    const items: WholesalePackingBoxItem[] = [];
    for (const [rawId, rawQty] of Object.entries(box.quantities)) {
      const parsed = parseQuantityInput(rawQty);
      if (parsed === undefined) {
        inputErrors.push(
          tr(isArabic, `Box ${number}: quantities must be whole numbers of 0 or more.`, `الصندوق ${number}: يجب أن تكون الكميات أعداداً صحيحة تساوي 0 أو أكثر.`)
        );
        continue;
      }
      if (parsed === null || parsed === 0) continue;
      items.push({ wholesaleOrderItemId: Number(rawId), quantity: parsed });
    }
    const weight = parseWeightInput(box.weight);
    if (weight === undefined) {
      inputErrors.push(
        tr(
          isArabic,
          `Box ${number}: weight must be greater than 0 and at most ${MAX_BOX_WEIGHT_GRAMS} g (up to 3 decimals).`,
          `الصندوق ${number}: يجب أن يكون الوزن أكبر من 0 وألا يتجاوز ${MAX_BOX_WEIGHT_GRAMS} غرام (حتى 3 منازل عشرية).`
        )
      );
    }
    return {
      uniqueBoxCode: box.uniqueBoxCode,
      weightGrams: weight ?? null,
      items: items.sort((a, b) => a.wholesaleOrderItemId - b.wholesaleOrderItemId),
    };
  });
  return {
    payload: { expectedVersion, preferredCourier: draft.preferredCourier, boxes },
    inputErrors: Array.from(new Set(inputErrors)),
  };
};

// ---------- Allocation summary (display only; the server is authoritative) ----------

export interface AllocationOrderItem {
  wholesaleOrderItemId: number;
  orderedQuantity: number;
  productName?: string | null;
}

export type AllocationState = 'exact' | 'under' | 'over';

export interface AllocationItemSummary {
  wholesaleOrderItemId: number;
  ordered: number;
  allocated: number;
  remaining: number;
  state: AllocationState;
}

export interface AllocationSummary {
  items: AllocationItemSummary[];
  totalOrdered: number;
  totalAllocated: number;
  isComplete: boolean;
  errors: string[];
}

const isValidQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export const summarizeAllocation = (
  items: readonly AllocationOrderItem[],
  boxes: readonly { items: readonly WholesalePackingBoxItem[] }[],
  isArabic = false
): AllocationSummary => {
  const errors: string[] = [];
  const allocated = new Map<number, number>();
  const known = new Set(items.map((i) => i.wholesaleOrderItemId));
  const nameOf = (id: number) => items.find((i) => i.wholesaleOrderItemId === id)?.productName || `#${id}`;

  if (boxes.length === 0) errors.push(tr(isArabic, 'Add at least one box.', 'أضف صندوقاً واحداً على الأقل.'));

  boxes.forEach((box, index) => {
    const number = index + 1;
    let validLines = 0;
    for (const line of box.items) {
      if (!known.has(line.wholesaleOrderItemId)) {
        errors.push(tr(isArabic, `Box ${number} contains an item that is not in this order.`, `الصندوق ${number} يحتوي على عنصر غير موجود في هذا الطلب.`));
        continue;
      }
      if (!isValidQuantity(line.quantity)) {
        errors.push(
          tr(
            isArabic,
            `Box ${number}: quantity for ${nameOf(line.wholesaleOrderItemId)} must be a positive whole number.`,
            `الصندوق ${number}: يجب أن تكون كمية ${nameOf(line.wholesaleOrderItemId)} عدداً صحيحاً موجباً.`
          )
        );
        continue;
      }
      validLines++;
      allocated.set(line.wholesaleOrderItemId, (allocated.get(line.wholesaleOrderItemId) ?? 0) + line.quantity);
    }
    if (validLines === 0) errors.push(tr(isArabic, `Box ${number} is empty.`, `الصندوق ${number} فارغ.`));
  });

  const summaries = items.map<AllocationItemSummary>((item) => {
    const ordered = item.orderedQuantity;
    const sum = allocated.get(item.wholesaleOrderItemId) ?? 0;
    const remaining = ordered - sum;
    const state: AllocationState = remaining === 0 ? 'exact' : remaining > 0 ? 'under' : 'over';
    if (state === 'over') {
      errors.push(
        tr(isArabic, `${nameOf(item.wholesaleOrderItemId)}: ${-remaining} more than ordered.`, `${nameOf(item.wholesaleOrderItemId)}: ${-remaining} أكثر من الكمية المطلوبة.`)
      );
    } else if (state === 'under') {
      errors.push(
        tr(isArabic, `${nameOf(item.wholesaleOrderItemId)}: ${remaining} not yet packed.`, `${nameOf(item.wholesaleOrderItemId)}: ${remaining} لم تُعبأ بعد.`)
      );
    }
    return { wholesaleOrderItemId: item.wholesaleOrderItemId, ordered, allocated: sum, remaining, state };
  });

  return {
    items: summaries,
    totalOrdered: summaries.reduce((acc, s) => acc + s.ordered, 0),
    totalAllocated: summaries.reduce((acc, s) => acc + s.allocated, 0),
    isComplete: errors.length === 0,
    errors,
  };
};

// ---------- Status labels ----------

const STATUS_LABELS: Record<WholesalePackingStatus, { en: string; ar: string; className: string }> = {
  Draft: { en: 'Draft', ar: 'مسودة', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  ReadyForVerification: { en: 'Ready for verification', ar: 'جاهز للتحقق', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Verified: { en: 'Verified', ar: 'تم التحقق', className: 'bg-green-50 text-green-700 border-green-200' },
};

export const getPackingStatusLabel = (status: string | null | undefined, isArabic: boolean): string => {
  const meta = STATUS_LABELS[status as WholesalePackingStatus];
  if (!meta) return status ?? '';
  return isArabic ? meta.ar : meta.en;
};

export const getPackingStatusBadgeClass = (status: string | null | undefined): string =>
  (STATUS_LABELS[status as WholesalePackingStatus] ?? STATUS_LABELS.Draft).className;

export const getDeliveryLocationLabel = (value: WholesaleDeliveryLocationType | string | null | undefined, isArabic: boolean): string => {
  if (value === 'Home') return tr(isArabic, 'Home', 'منزل');
  if (value === 'Office') return tr(isArabic, 'Office', 'مكتب');
  return '';
};

// ---------- Labels ----------

export const escapeHtml = (text: unknown): string => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/** The QR code carries ONLY the unique box code. */
export const qrValueForBox = (code: string): string => (code ?? '').trim();

export interface LabelBox {
  code: string;
  boxNumber: number;
  weightGrams?: number | null;
}

export interface BuildLabelsInput {
  labels: WholesalePackingLabel;
  boxes: readonly LabelBox[];
  totalBoxes: number;
  /** Pre-rendered QR <svg> markup keyed by box code (trusted, generated locally). */
  qrSvgByCode: Record<string, string>;
  isArabic?: boolean;
}

const LABEL_CSS = `
@page { size: 100mm 150mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
body { font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.label { width: 100mm; height: 150mm; padding: 4mm; overflow: hidden; display: flex; flex-direction: column; gap: 1.5mm;
  page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid; direction: ltr; text-align: left; }
.label:last-of-type { page-break-after: auto; break-after: auto; }
.brand { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 2mm; border-bottom: 0.6mm solid #000; padding-bottom: 1.5mm; }
.brand-name { font-size: 13pt; font-weight: 800; white-space: nowrap; }
.order { font-size: 9pt; font-weight: 700; text-align: right; overflow-wrap: anywhere; min-width: 0; }
.box-count { flex: 0 0 auto; font-size: 22pt; font-weight: 900; text-align: center; line-height: 1.05; }
.code-row { flex: 0 0 auto; display: flex; align-items: center; gap: 3mm; border: 0.5mm solid #000; padding: 1.5mm; }
.qr { width: 32mm; height: 32mm; flex: 0 0 32mm; }
.qr svg { width: 100%; height: 100%; display: block; }
.code { font-family: "Courier New", Courier, monospace; font-size: 14pt; font-weight: 800; word-break: break-all; overflow-wrap: anywhere; line-height: 1.15; min-width: 0; }
.section { flex: 0 1 auto; min-height: 0; overflow: hidden; font-size: 9.5pt; line-height: 1.2; overflow-wrap: anywhere; word-break: break-word; }
.k { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2mm; }
.v { font-size: 10.5pt; font-weight: 700; }
.clamp2, .addr { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
.clamp2 { -webkit-line-clamp: 2; line-clamp: 2; }
.addr { -webkit-line-clamp: 3; line-clamp: 3; }
.meta { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 1mm 4mm; font-size: 9.5pt; }
.meta b { font-weight: 800; }
.spacer { flex: 1 1 auto; }
.sender { flex: 0 0 auto; border-top: 0.4mm solid #000; padding-top: 1.5mm; font-size: 9pt; font-weight: 700; }
.ar { direction: rtl; unicode-bidi: isolate; font-weight: 400; }
`;

const line = (key: string, value: string | null | undefined, extraClass = ''): string => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  return `<div class="section"><div class="k">${escapeHtml(key)}</div><div class="v ${extraClass}">${escapeHtml(trimmed)}</div></div>`;
};

const renderLabel = (input: BuildLabelsInput, box: LabelBox): string => {
  const { labels, totalBoxes, qrSvgByCode, isArabic } = input;
  const code = qrValueForBox(box.code);
  const address = [labels.address, labels.city].map((p) => (p ?? '').trim()).filter(Boolean).join(', ');
  const cafeOrCustomer = [labels.cafeName, labels.customerName]
    .map((p) => (p ?? '').trim())
    .filter((p, i, arr) => p && arr.indexOf(p) === i)
    .join(' / ');
  const location = labels.deliveryLocationType === 'Home' || labels.deliveryLocationType === 'Office' ? labels.deliveryLocationType : null;
  const courier = (labels.courier ?? '').trim();
  const hasWeight = typeof box.weightGrams === 'number' && Number.isFinite(box.weightGrams) && box.weightGrams > 0;
  const meta = [
    location ? `<span>Location: <b>${escapeHtml(location)}</b>${isArabic ? ` <span class="ar">(${escapeHtml(getDeliveryLocationLabel(location, true))})</span>` : ''}</span>` : '',
    courier ? `<span>Courier: <b>${escapeHtml(courier)}</b></span>` : '',
    hasWeight ? `<span>Weight: <b>${escapeHtml(formatWeightKg(box.weightGrams))}</b></span>` : '',
  ].filter(Boolean).join('');

  return `<section class="label">
<div class="brand"><div class="brand-name">SpiritHub Roastery</div><div class="order">Wholesale order #${escapeHtml(labels.orderNumber)}</div></div>
<div class="box-count">Box ${escapeHtml(box.boxNumber)} of ${escapeHtml(totalBoxes)}${isArabic ? `<div class="ar" style="font-size:12pt">صندوق ${escapeHtml(box.boxNumber)} من ${escapeHtml(totalBoxes)}</div>` : ''}</div>
<div class="code-row"><div class="qr">${qrSvgByCode[code] ?? qrSvgByCode[box.code] ?? ''}</div><div class="code">${escapeHtml(code)}</div></div>
${line('Recipient', labels.recipientName, 'clamp2')}
${line('Phone', labels.recipientPhone)}
${line('Café / Customer', cafeOrCustomer, 'clamp2')}
${line('Delivery address', address, 'addr')}
${meta ? `<div class="meta">${meta}</div>` : ''}
<div class="spacer"></div>
<div class="sender">Sender: ${escapeHtml((labels.sender ?? '').trim() || 'SpiritHub Roastery, Oman')}</div>
</section>`;
};

/** Full printable HTML document: one 100mm x 150mm page per box. Only shipping data is rendered (no prices, payment, email or notes). */
export const buildLabelsHtml = (input: BuildLabelsInput): string => {
  const title = `Box labels - ${input.labels.orderNumber}`;
  const body = input.boxes.map((box) => renderLabel(input, box)).join('\n');
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${LABEL_CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
};
