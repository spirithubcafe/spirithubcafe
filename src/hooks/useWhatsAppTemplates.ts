import { useState, useEffect, useCallback } from 'react';
import { whatsappTemplateService } from '../services/whatsappTemplateService';
import type {
  WhatsAppMessageTemplateListItem,
  WhatsAppMessageTemplateResponse,
  WhatsAppMessageTemplateDto,
} from '../types/whatsapp';

export function useWhatsAppTemplates(branch?: string) {
  const [templates, setTemplates] = useState<WhatsAppMessageTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (branchOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsappTemplateService.getAll(branchOverride ?? branch);
      if (import.meta.env.DEV) {
        console.log('[useWhatsAppTemplates] fetched', data?.length ?? 0, 'templates');
      }
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load templates';
      if (import.meta.env.DEV) {
        console.error('[useWhatsAppTemplates] fetch error:', err);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [branch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchOne = async (id: number): Promise<WhatsAppMessageTemplateResponse | null> => {
    try {
      return await whatsappTemplateService.getById(id, branch);
    } catch {
      return null;
    }
  };

  const create = async (dto: WhatsAppMessageTemplateDto) => {
    const result = await whatsappTemplateService.create(dto, branch);
    await fetchAll();
    return result;
  };

  const update = async (id: number, dto: WhatsAppMessageTemplateDto) => {
    const result = await whatsappTemplateService.update(id, dto, branch);
    await fetchAll();
    return result;
  };

  const remove = async (id: number) => {
    await whatsappTemplateService.delete(id, branch);
    await fetchAll();
  };

  const reset = async (id: number) => {
    const result = await whatsappTemplateService.reset(id, branch);
    await fetchAll();
    return result;
  };

  return { templates, loading, error, fetchAll, fetchOne, create, update, remove, reset };
}
