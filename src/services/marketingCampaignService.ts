import { http } from './apiClient';
import type {
  MarketingCampaignActionResponse,
  MarketingCampaignAdmin,
  MarketingCampaignAnalytics,
  MarketingCampaignApiResponse,
  MarketingCampaignPayload,
} from '../types/marketingCampaign';

const API_BASE = '/api/admin/marketing/campaigns';

const unwrap = <T>(response: { data: MarketingCampaignApiResponse<T> }): T => response.data.data;

export const marketingCampaignService = {
  async getAll(): Promise<MarketingCampaignAdmin[]> {
    return unwrap(await http.get<MarketingCampaignApiResponse<MarketingCampaignAdmin[]>>(API_BASE));
  },

  async getById(id: number): Promise<MarketingCampaignAdmin> {
    return unwrap(await http.get<MarketingCampaignApiResponse<MarketingCampaignAdmin>>(`${API_BASE}/${id}`));
  },

  async create(payload: MarketingCampaignPayload): Promise<MarketingCampaignAdmin> {
    return unwrap(await http.post<MarketingCampaignApiResponse<MarketingCampaignAdmin>>(API_BASE, payload));
  },

  async update(id: number, payload: MarketingCampaignPayload): Promise<MarketingCampaignAdmin> {
    return unwrap(await http.put<MarketingCampaignApiResponse<MarketingCampaignAdmin>>(`${API_BASE}/${id}`, payload));
  },

  async archive(id: number): Promise<MarketingCampaignActionResponse> {
    const response = await http.delete<MarketingCampaignActionResponse>(`${API_BASE}/${id}`);
    return response.data;
  },

  async activate(id: number): Promise<MarketingCampaignActionResponse> {
    const response = await http.post<MarketingCampaignActionResponse>(`${API_BASE}/${id}/activate`);
    return response.data;
  },

  async deactivate(id: number): Promise<MarketingCampaignActionResponse> {
    const response = await http.post<MarketingCampaignActionResponse>(`${API_BASE}/${id}/deactivate`);
    return response.data;
  },

  async getAnalytics(id: number): Promise<MarketingCampaignAnalytics> {
    return unwrap(await http.get<MarketingCampaignApiResponse<MarketingCampaignAnalytics>>(`${API_BASE}/${id}/analytics`));
  },
};
