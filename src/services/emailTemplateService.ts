import { http } from './apiClient';
import type { EmailMessageTemplate } from '../types/emailTemplate';

const API_BASE = '/api/email-message-templates';

const resolveValues = (obj: unknown): unknown => {
  if (obj && typeof obj === 'object' && '$values' in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>).$values;
  }
  return obj;
};

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if ('success' in obj && 'data' in obj) {
      return resolveValues(obj.data) as T;
    }
    if ('$values' in obj) {
      return obj.$values as T;
    }
  }
  return payload as T;
};

const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== 'object') return [];
  const values = (value as Record<string, unknown>).$values;
  return Array.isArray(values) ? (values as T[]) : [];
};

export const emailTemplateService = {
  getAll: async (branch?: string): Promise<EmailMessageTemplate[]> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get(API_BASE, config);
    return ensureArray<EmailMessageTemplate>(unwrap<unknown>(response.data));
  },

  getById: async (id: number, branch?: string): Promise<EmailMessageTemplate> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get(`${API_BASE}/${id}`, config);
    return unwrap<EmailMessageTemplate>(response.data);
  },

  update: async (id: number, payload: Record<string, unknown>, branch?: string): Promise<EmailMessageTemplate> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.put(`${API_BASE}/${id}`, payload, config);
    return unwrap<EmailMessageTemplate>(response.data);
  },

  reset: async (id: number, branch?: string): Promise<EmailMessageTemplate> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.post(`${API_BASE}/${id}/reset`, null, config);
    return unwrap<EmailMessageTemplate>(response.data);
  },
};

