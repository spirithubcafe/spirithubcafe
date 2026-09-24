import type { CustomBundleApiResult } from '../types/customBundle';

export class CustomBundleApiError extends Error {
  readonly code: string | undefined;

  constructor(code: string | undefined, message: string) {
    super(message);
    this.name = 'CustomBundleApiError';
    this.code = code;
  }
}

export const unwrapCustomBundleResult = <T>(result: CustomBundleApiResult<T>): T => {
  if (!result.success || !result.data) {
    throw new CustomBundleApiError(result.errorCode, result.message || 'Custom bundle request failed.');
  }
  return result.data;
};
