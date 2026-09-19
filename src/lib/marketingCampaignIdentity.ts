import { safeStorage } from './safeStorage';

const VISITOR_KEY = 'marketing.campaign.visitor-id';
const SESSION_KEY = 'marketing.campaign.session-id';
let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const getOrCreate = (key: string, scope: 'local' | 'session', memory: string | null): string => {
  const stored = safeStorage.getItem(key, scope);
  if (stored) return stored;
  const id = memory ?? createId();
  safeStorage.setItem(key, id, scope);
  return safeStorage.getItem(key, scope) ?? id;
};

export const getMarketingCampaignVisitorId = (): string => {
  memoryVisitorId = getOrCreate(VISITOR_KEY, 'local', memoryVisitorId);
  return memoryVisitorId;
};

export const getMarketingCampaignSessionId = (): string => {
  memorySessionId = getOrCreate(SESSION_KEY, 'session', memorySessionId);
  return memorySessionId;
};
