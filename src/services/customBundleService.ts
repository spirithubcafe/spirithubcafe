import { apiClient } from './apiClient';
import type {
  CustomBundleApiResult,
  CustomBundleConfiguration,
  CustomBundleQuote,
  CustomBundleSelection,
} from '../types/customBundle';
import { unwrapCustomBundleResult } from './customBundleResponse';

export { CustomBundleApiError, unwrapCustomBundleResult } from './customBundleResponse';

const BASE_PATH = '/api/custom-bundles/build-your-own-coffee';

export const customBundleService = {
  async getConfiguration(): Promise<CustomBundleConfiguration> {
    const response = await apiClient.get<CustomBundleApiResult<CustomBundleConfiguration>>(BASE_PATH);
    return unwrapCustomBundleResult(response.data);
  },

  async quote(selection: CustomBundleSelection): Promise<CustomBundleQuote> {
    const response = await apiClient.post<CustomBundleApiResult<CustomBundleQuote>>(`${BASE_PATH}/quote`, selection);
    return unwrapCustomBundleResult(response.data);
  },
};
