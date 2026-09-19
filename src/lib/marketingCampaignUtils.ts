import type {
  MarketingCampaignAdmin,
  MarketingCampaignDisplayStatus,
} from '../types/marketingCampaign';

export const getCampaignDisplayStatus = (
  campaign: Pick<MarketingCampaignAdmin, 'archivedAt' | 'isActive' | 'startDateUtc' | 'endDateUtc'>,
  now = new Date(),
): MarketingCampaignDisplayStatus => {
  if (campaign.archivedAt) return 'ARCHIVED';
  if (!campaign.isActive) return 'INACTIVE';
  if (campaign.startDateUtc && new Date(campaign.startDateUtc) > now) return 'SCHEDULED';
  if (campaign.endDateUtc && new Date(campaign.endDateUtc) < now) return 'ENDED';
  return 'ACTIVE';
};

export const utcToLocalInput = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const localInputToUtc = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const formatCampaignSchedule = (
  start: string | null,
  end: string | null,
  locale: string,
): string => {
  if (!start && !end) return locale.startsWith('ar') ? 'دائماً' : 'Always';
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const from = start ? formatter.format(new Date(start)) : locale.startsWith('ar') ? 'بدون بداية' : 'No start';
  const to = end ? formatter.format(new Date(end)) : locale.startsWith('ar') ? 'بدون نهاية' : 'No end';
  return `${from} – ${to}`;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback;
  const candidate = error as { message?: string; errors?: Record<string, string[]> | string };
  if (candidate.errors && typeof candidate.errors === 'object') {
    const messages = Object.values(candidate.errors).flat().filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  if (typeof candidate.errors === 'string') return candidate.errors;
  return candidate.message || fallback;
};
