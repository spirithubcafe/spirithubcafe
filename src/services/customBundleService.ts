import { apiClient } from './apiClient';
import type {
  CustomBundleApiResult,
  CustomBundleConfiguration,
  CustomBundleQuote,
  CustomBundleSelection,
} from '../types/customBundle';

const BASE_PATH = '/api/custom-bundles/build-your-own-coffee';

export class CustomBundleApiError extends Error {
  readonly code: string | undefined;

  constructor(code: string | undefined, message: string) {
    super(message);
    this.name = 'CustomBundleApiError';
    this.code = code;
  }
}

const unwrap = <T>(result: CustomBundleApiResult<T>): T => {
  if (!result.isSuccess || !result.data) {
    throw new CustomBundleApiError(result.errorCode, result.message || 'Custom bundle request failed.');
  }
  return result.data;
};

export const customBundleService = {
  async getConfiguration(): Promise<CustomBundleConfiguration> {
    const response = await apiClient.get<CustomBundleApiResult<CustomBundleConfiguration>>(BASE_PATH);
    return unwrap(response.data);
  },

  async quote(selection: CustomBundleSelection): Promise<CustomBundleQuote> {
    const response = await apiClient.post<CustomBundleApiResult<CustomBundleQuote>>(`${BASE_PATH}/quote`, selection);
    return unwrap(response.data);
  },
};
