import { http } from './apiClient';
import { extractBundleApiErrorMessage } from '../lib/bundleAdminUtils';
import type { BundleDefinitionCreateUpdateDto, BundleDefinitionDto } from '../types/bundleAdmin';

interface BundleApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const withBranch = (branch?: string) => (branch ? { headers: { 'X-Branch': branch } } : undefined);

/**
 * Admin client for /api/admin/bundle-configurations (existing backend endpoints only).
 */
export const bundleAdminService = {
  getAll: async (branch?: string): Promise<BundleDefinitionDto[]> => {
    try {
      const response = await http.get<BundleApiEnvelope<BundleDefinitionDto[]>>(
        '/api/admin/bundle-configurations',
        withBranch(branch)
      );
      if (response.data?.success === false) {
        throw new Error(response.data.message || 'Failed to load bundle configurations');
      }
      return response.data?.data ?? [];
    } catch (error: unknown) {
      throw new Error(extractBundleApiErrorMessage(error, 'Failed to load bundle configurations'));
    }
  },

  getById: async (id: number, branch?: string): Promise<BundleDefinitionDto> => {
    try {
      const response = await http.get<BundleApiEnvelope<BundleDefinitionDto>>(
        `/api/admin/bundle-configurations/${id}`,
        withBranch(branch)
      );
      if (response.data?.success === false || !response.data?.data) {
        throw new Error(response.data?.message || 'Bundle configuration not found');
      }
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(extractBundleApiErrorMessage(error, 'Bundle configuration not found'));
    }
  },

  update: async (
    id: number,
    dto: BundleDefinitionCreateUpdateDto,
    branch?: string
  ): Promise<BundleDefinitionDto> => {
    try {
      const response = await http.put<BundleApiEnvelope<BundleDefinitionDto>>(
        `/api/admin/bundle-configurations/${id}`,
        dto,
        withBranch(branch)
      );
      if (response.data?.success === false || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to save bundle configuration');
      }
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(extractBundleApiErrorMessage(error, 'Failed to save bundle configuration'));
    }
  },
};
