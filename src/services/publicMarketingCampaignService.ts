import { publicHttp } from './apiClient';
import type {
  ActiveCampaignParams,
  PublicCampaignApiResponse,
  PublicCampaignEventRequest,
  PublicCampaignEventResponse,
  PublicCampaignSubmitRequest,
  PublicCampaignSubmitResponse,
  PublicMarketingCampaign,
} from '../types/publicMarketingCampaign';

const API_BASE = '/api/marketing/campaigns';

export const publicMarketingCampaignService = {
  async getActive({ signal, ...params }: ActiveCampaignParams): Promise<PublicMarketingCampaign | null> {
    const response = await publicHttp.get<PublicCampaignApiResponse<PublicMarketingCampaign | null>>(
      `${API_BASE}/active`,
      { params, signal },
    );
    return response.data.data;
  },

  async submit(id: number, payload: PublicCampaignSubmitRequest): Promise<PublicCampaignSubmitResponse> {
    const response = await publicHttp.post<PublicCampaignApiResponse<PublicCampaignSubmitResponse>>(
      `${API_BASE}/${id}/submit`, payload,
    );
    return response.data.data;
  },

  async trackEvent(id: number, payload: PublicCampaignEventRequest): Promise<PublicCampaignEventResponse> {
    const response = await publicHttp.post<PublicCampaignApiResponse<PublicCampaignEventResponse>>(
      `${API_BASE}/${id}/events`, payload,
    );
    return response.data.data;
  },
};
