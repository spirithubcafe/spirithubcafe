import { http } from './apiClient';
import type {
  WhatsAppMessageTemplateDto,
  WhatsAppMessageTemplateResponse,
  WhatsAppMessageTemplateListItem,
  WhatsAppTemplatePreviewRequest,
  WhatsAppTemplatePreviewResponse,
} from '../types/whatsapp';

/* ------------------------------------------------------------------ */
/*  Response unwrapping helpers                                        */
/* ------------------------------------------------------------------ */

/**
 * Resolve ASP.NET `$values` wrapper that appears on collections
 * serialized with ReferenceHandler.Preserve.
 */
const resolveValues = (obj: unknown): unknown => {
  if (obj && typeof obj === 'object' && '$values' in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>).$values;
  }
  return obj;
};

/**
 * Unwrap the standard `{ success, data }` API envelope.
 * Handles several real-world backend shapes:
 *   - `{ success, data: T }`            → standard envelope
 *   - `{ success, data: { $values } }`  → ASP.NET collection inside envelope
 *   - `T` directly (no envelope)        → pass-through
 *   - `{ $values: [...] }`              → bare ASP.NET collection
 */
const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    // Standard API envelope  →  { success: bool, data: ... }
    if ('success' in obj && 'data' in obj) {
      const inner = resolveValues(obj.data);
      return inner as T;
    }

    // Bare $values wrapper (no envelope)
    if ('$values' in obj) {
      return obj.$values as T;
    }
  }

  return payload as T;
};

/**
 * Guarantee an array – protects against null / undefined / object
 * returned by unexpected backend shapes.
 */
const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value == null) return [];
  // If it's an object with $values, try to extract
  if (typeof value === 'object' && value !== null && '$values' in (value as Record<string, unknown>)) {
    const inner = (value as Record<string, unknown>).$values;
    return Array.isArray(inner) ? inner as T[] : [];
  }
  return [];
};

const API_BASE = '/api/whatsapp-message-templates';

/**
 * WhatsApp Message Template Service
 * Manages CRUD operations for WhatsApp notification message templates
 */
export const whatsappTemplateService = {
  /** List all templates */
  getAll: async (branch?: string): Promise<WhatsAppMessageTemplateListItem[]> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get(API_BASE, config);
    const data = unwrap<WhatsAppMessageTemplateListItem[]>(response.data);
    return ensureArray<WhatsAppMessageTemplateListItem>(data);
  },

  /** Get template by ID */
  getById: async (id: number, branch?: string): Promise<WhatsAppMessageTemplateResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get(`${API_BASE}/${id}`, config);
    return unwrap<WhatsAppMessageTemplateResponse>(response.data);
  },

  /** Get template by key */
  getByKey: async (key: string, branch?: string): Promise<WhatsAppMessageTemplateResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.get(`${API_BASE}/by-key/${key}`, config);
    return unwrap<WhatsAppMessageTemplateResponse>(response.data);
  },

  /** Create a new template */
  create: async (
    dto: WhatsAppMessageTemplateDto,
    branch?: string,
  ): Promise<WhatsAppMessageTemplateResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.post(API_BASE, dto, config);
    return unwrap<WhatsAppMessageTemplateResponse>(response.data);
  },

  /** Update an existing template */
  update: async (
    id: number,
    dto: WhatsAppMessageTemplateDto,
    branch?: string,
  ): Promise<WhatsAppMessageTemplateResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.put(`${API_BASE}/${id}`, dto, config);
    return unwrap<WhatsAppMessageTemplateResponse>(response.data);
  },

  /** Delete a template */
  delete: async (id: number, branch?: string): Promise<void> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    await http.delete(`${API_BASE}/${id}`, config);
  },

  /** Reset template to default */
  reset: async (id: number, branch?: string): Promise<WhatsAppMessageTemplateResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.post(`${API_BASE}/${id}/reset`, null, config);
    return unwrap<WhatsAppMessageTemplateResponse>(response.data);
  },

  /** Preview template with sample data */
  preview: async (
    req: WhatsAppTemplatePreviewRequest,
    branch?: string,
  ): Promise<WhatsAppTemplatePreviewResponse> => {
    const config = branch ? { headers: { 'X-Branch': branch } } : undefined;
    const response = await http.post(`${API_BASE}/preview`, req, config);
    return unwrap<WhatsAppTemplatePreviewResponse>(response.data);
  },
};
