import type {
  WholesaleShipmentStatus,
  WholesaleWeightSource,
} from '../types/wholesale';

type Bilingual = { en: string; ar: string };

export const WHOLESALE_SHIPMENT_STATUSES: readonly WholesaleShipmentStatus[] = [
  'PendingSend',
  'Requested',
  'Failed',
  'DeliveryUncertain',
  'TrackingAssigned',
  'Collected',
  'Delivered',
];

const STATUS_META: Record<WholesaleShipmentStatus, { label: Bilingual; className: string }> = {
  PendingSend: { label: { en: 'Sending…', ar: 'جاري الإرسال…' }, className: 'bg-slate-50 text-slate-700 border-slate-200' },
  Requested: { label: { en: 'Requested', ar: 'تم الطلب' }, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Failed: { label: { en: 'Failed', ar: 'فشل' }, className: 'bg-red-50 text-red-700 border-red-200' },
  DeliveryUncertain: { label: { en: 'Delivery uncertain', ar: 'حالة التسليم غير مؤكدة' }, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  TrackingAssigned: { label: { en: 'Tracking assigned', ar: 'تم تعيين التتبع' }, className: 'bg-violet-50 text-violet-700 border-violet-200' },
  Collected: { label: { en: 'Collected', ar: 'تم الاستلام من المتجر' }, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Delivered: { label: { en: 'Delivered', ar: 'تم التوصيل' }, className: 'bg-green-50 text-green-700 border-green-200' },
};

const UNKNOWN_STATUS = { label: { en: '', ar: '' }, className: 'bg-slate-50 text-slate-700 border-slate-200' };

export const getShipmentStatusBadgeClass = (status?: string | null): string =>
  (STATUS_META[status as WholesaleShipmentStatus] ?? UNKNOWN_STATUS).className;

export const getShipmentStatusLabel = (status: string | null | undefined, isArabic: boolean): string => {
  const meta = STATUS_META[status as WholesaleShipmentStatus];
  if (!meta) return status ?? '';
  return isArabic ? meta.label.ar : meta.label.en;
};

export interface WholesaleDispatchActions {
  canEditAddress: boolean;
  canRequestDispatch: boolean;
  canRetryDispatch: boolean;
  canVerify: boolean;
  canEditTracking: boolean;
  canMarkCollected: boolean;
  canMarkDelivered: boolean;
  isInProgress: boolean;
}

/**
 * Which actions the admin may attempt for a shipment status (undefined = no shipment yet).
 * Fails closed: unless `enabled === true` (server kill switch) every mutating action is false.
 */
export const getAllowedDispatchActions = (
  status?: WholesaleShipmentStatus | null,
  enabled?: boolean | null
): WholesaleDispatchActions => {
  const on = enabled === true;
  return {
    canEditAddress: on && (!status || status === 'Failed'),
    canRequestDispatch: on && !status,
    canRetryDispatch: on && status === 'Failed',
    canVerify: on && status === 'DeliveryUncertain',
    canEditTracking: on && (status === 'Requested' || status === 'TrackingAssigned' || status === 'Collected'),
    canMarkCollected: on && (status === 'Requested' || status === 'TrackingAssigned'),
    canMarkDelivered: on && (status === 'Requested' || status === 'TrackingAssigned' || status === 'Collected'),
    isInProgress: status === 'PendingSend',
  };
};

const WEIGHT_SOURCE_META: Record<WholesaleWeightSource, { label: Bilingual; className: string }> = {
  Calculated: { label: { en: 'Calculated', ar: 'محسوب' }, className: 'bg-green-50 text-green-700 border-green-200' },
  Partial: { label: { en: 'Partial', ar: 'جزئي' }, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  Manual: { label: { en: 'Manual', ar: 'يدوي' }, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Unavailable: { label: { en: 'Unavailable', ar: 'غير متوفر' }, className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const getWeightSourceLabel = (source: string | null | undefined, isArabic: boolean): string => {
  const meta = WEIGHT_SOURCE_META[source as WholesaleWeightSource];
  if (!meta) return source ?? '';
  return isArabic ? meta.label.ar : meta.label.en;
};

export const getWeightSourceBadgeClass = (source?: string | null): string =>
  (WEIGHT_SOURCE_META[source as WholesaleWeightSource] ?? WEIGHT_SOURCE_META.Unavailable).className;

/** Accepts only absolute http/https URLs (blocks javascript:, data:, relative and protocol-relative URLs). */
export const isSafeHttpUrl = (url?: string | null): boolean => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

/** Grams -> "x.xx kg"; returns "—" for missing/invalid values. */
export const formatWeightKg = (grams?: number | null): string => {
  if (grams === null || grams === undefined || !Number.isFinite(grams) || grams < 0) return '—';
  return `${(grams / 1000).toFixed(2)} kg`;
};

/**
 * Parses an admin-entered kilogram value into whole grams.
 * Empty input => null (use the calculated weight); invalid or non-positive input => undefined.
 */
export const parseWeightKgToGrams = (input: string): number | null | undefined => {
  const trimmed = input.trim();
  if (trimmed === '') return null;
  const kg = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(kg) || kg <= 0) return undefined;
  return Math.round(kg * 1000);
};
