export type PublicCampaignLanguage = 'en' | 'ar';
export type PublicCampaignDevice = 'mobile' | 'desktop';
export type PublicCampaignEventType = 'VIEW' | 'CLOSE' | 'CTA_CLICK';

const ELIGIBLE_STOREFRONT_ROUTE = /^\/(?:om|sa)(?:\/(?:shop|products)(?:\/[^?#]*)?)?\/?$/;
export const isMarketingCampaignRouteEligible = (pathname: string): boolean =>
  ELIGIBLE_STOREFRONT_ROUTE.test(pathname);

export interface PublicMarketingCampaign {
  id: number;
  campaignType: string;
  languageCode: string;
  headline: string;
  description: string | null;
  emailPlaceholder: string | null;
  buttonText: string;
  closeText: string | null;
  termsText: string | null;
  triggerType: string;
  triggerDelaySeconds: number | null;
  scrollPercentage: number | null;
  exitIntentEnabled: boolean;
  frequencyDays: number;
  variantKey: string | null;
}

export interface ActiveCampaignParams {
  language: PublicCampaignLanguage;
  page: string;
  device: PublicCampaignDevice;
  visitorId: string;
  signal?: AbortSignal;
}

export interface PublicCampaignSubmitRequest {
  email: string;
  languageCode: PublicCampaignLanguage;
  sessionId: string;
  visitorId: string;
  page: string;
  device: PublicCampaignDevice;
}

export interface PublicCampaignSubmitResponse {
  alreadySubmitted: boolean;
  languageCode: string;
  successTitle: string;
  successMessage: string;
  successButtonText: string | null;
  discountCode: string | null;
  discountType: string | null;
  discountValue: number | null;
  minimumOrderAmount: number | null;
}

export interface PublicCampaignEventRequest {
  eventType: PublicCampaignEventType;
  sessionId: string;
  visitorId: string;
  languageCode: PublicCampaignLanguage;
  pageUrl: string;
  variantKey: string | null;
}

export interface PublicCampaignEventResponse { duplicate: boolean }

export interface PublicCampaignApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
