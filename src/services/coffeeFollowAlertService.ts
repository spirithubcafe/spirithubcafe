import { http } from './apiClient';

export type CoffeeFollowType = 'back-in-stock' | 'new-release';
export type CoffeeReleaseFollowValue = 'all' | 'ethiopia' | 'colombia' | 'yemen' | 'microlot';

export interface CoffeeFollowSubscription {
  key: string;
  followType: CoffeeFollowType;
  productId?: number | null;
  followValue?: string | null;
  productName?: string | null;
  productNameAr?: string | null;
  language: string;
  branchCode: string;
  subscribedAt: string;
}

export interface CreateCoffeeFollowRequest {
  followType: CoffeeFollowType;
  productId?: number;
  followValue?: CoffeeReleaseFollowValue;
  language: string;
  branchCode: string;
}

export const coffeeFollowAlertService = {
  list: async (): Promise<CoffeeFollowSubscription[]> => {
    const response = await http.get<CoffeeFollowSubscription[]>('/api/coffee-follow-alerts');
    return Array.isArray(response.data) ? response.data : [];
  },

  subscribe: async (request: CreateCoffeeFollowRequest) => {
    const response = await http.post('/api/coffee-follow-alerts', request);
    return response.data;
  },

  unsubscribe: async (key: string, language: string, branchCode: string) => {
    const response = await http.delete('/api/coffee-follow-alerts', {
      data: { key, language, branchCode },
    });
    return response.data;
  },
};
