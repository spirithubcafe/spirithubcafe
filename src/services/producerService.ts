import { http, publicHttp } from './apiClient';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface Producer {
  id: number;
  slug: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  logoPath?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
  isDisplayedOnHomepage: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProducerCreateUpdateDto {
  slug: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  logoPath?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
  isDisplayedOnHomepage: boolean;
  displayOrder: number;
}

export interface ProducerSectionSettings {
  isEnabled: boolean;
  title: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  marqueeSpeedSeconds: number;
  singleLogoSpeedSeconds: number;
}

const unwrap = <T>(response: ApiResponse<T>, fallbackMessage: string): T => {
  if (response?.success === false) {
    throw new Error(response.message || fallbackMessage);
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response as T;
};

export const producerService = {
  getAll: async (includeInactive = false): Promise<Producer[]> => {
    const client = includeInactive ? http : publicHttp;
    const response = await client.get<ApiResponse<Producer[]>>('/api/Producers', {
      params: { includeInactive },
    });
    return unwrap(response.data, 'Failed to load producers');
  },

  create: async (data: ProducerCreateUpdateDto): Promise<Producer> => {
    const response = await http.post<ApiResponse<Producer>>('/api/Producers', data);
    return unwrap(response.data, 'Failed to create producer');
  },

  update: async (id: number, data: ProducerCreateUpdateDto): Promise<Producer> => {
    const response = await http.put<ApiResponse<Producer>>(`/api/Producers/${id}`, data);
    return unwrap(response.data, 'Failed to update producer');
  },

  delete: async (id: number): Promise<void> => {
    const response = await http.delete<ApiResponse<void>>(`/api/Producers/${id}`);
    if (response.data?.success === false) {
      throw new Error(response.data.message || 'Failed to delete producer');
    }
  },

  setActive: async (id: number, isActive: boolean): Promise<Producer> => {
    const response = await http.patch<ApiResponse<Producer>>(`/api/Producers/${id}/active`, { isActive });
    return unwrap(response.data, 'Failed to update producer status');
  },

  checkSlug: async (slug: string, excludeId?: number): Promise<boolean> => {
    const response = await http.get<ApiResponse<boolean> & { exists?: boolean }>('/api/Producers/check-slug', {
      params: { slug, excludeId },
    });
    if (response.data?.success === false) {
      throw new Error(response.data.message || 'Failed to check producer slug');
    }
    return Boolean(response.data.exists ?? response.data.data);
  },

  getSectionSettings: async (): Promise<ProducerSectionSettings> => {
    const response = await publicHttp.get<ApiResponse<ProducerSectionSettings>>('/api/Producers/section-settings');
    return unwrap(response.data, 'Failed to load producer section settings');
  },

  updateSectionSettings: async (data: ProducerSectionSettings): Promise<ProducerSectionSettings> => {
    const response = await http.put<ApiResponse<ProducerSectionSettings>>('/api/Producers/section-settings', data);
    return unwrap(response.data, 'Failed to update producer section settings');
  },
};

export default producerService;
