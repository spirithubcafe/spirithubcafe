export const MARKETING_CAMPAIGN_PERMISSION = 'MarketingCampaigns.Manage';

export const CAMPAIGN_TYPES = ['NEWSLETTER', 'FIRST_ORDER_DISCOUNT'] as const;
export type MarketingCampaignType = (typeof CAMPAIGN_TYPES)[number];

export const TRIGGER_TYPES = ['DELAY', 'SCROLL'] as const;
export type MarketingCampaignTriggerType = (typeof TRIGGER_TYPES)[number];

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type MarketingCampaignDiscountType = (typeof DISCOUNT_TYPES)[number];

export type MarketingCampaignLanguageCode = 'en' | 'ar';

export interface MarketingCampaignTranslationInput {
  languageCode: MarketingCampaignLanguageCode;
  headline: string;
  description: string | null;
  emailPlaceholder: string | null;
  buttonText: string;
  closeText: string | null;
  successTitle: string;
  successMessage: string;
  successButtonText: string | null;
  termsText: string | null;
}

export interface MarketingCampaignPayload {
  name: string;
  campaignType: MarketingCampaignType;
  isActive: boolean;
  discountType: MarketingCampaignDiscountType | null;
  discountValue: number | null;
  discountCode: string | null;
  minimumOrderAmount: number | null;
  newCustomersOnly: boolean;
  startDateUtc: string | null;
  endDateUtc: string | null;
  triggerType: MarketingCampaignTriggerType;
  triggerDelaySeconds: number | null;
  scrollPercentage: number | null;
  exitIntentEnabled: boolean;
  frequencyDays: number;
  desktopEnabled: boolean;
  mobileEnabled: boolean;
  targetAllPages: boolean;
  targetPagePattern: string | null;
  priority: number;
  translations: MarketingCampaignTranslationInput[];
}

export interface MarketingCampaignAdmin extends MarketingCampaignPayload {
  id: number;
  branchCode: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaignAnalytics {
  campaignId: number;
  views: number;
  uniqueViews: number;
  closes: number;
  submissions: number;
  submissionRate: number;
  ctaClicks: number;
  discountReveals: number;
}

export interface MarketingCampaignApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface MarketingCampaignActionResponse {
  success: boolean;
  message?: string;
}

export type MarketingCampaignDisplayStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SCHEDULED'
  | 'ENDED'
  | 'ARCHIVED';
