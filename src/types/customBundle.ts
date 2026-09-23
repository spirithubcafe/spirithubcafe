export interface CustomBundleSelectionItem {
  productId: number;
  productVariantId: number;
  quantity: number;
}

export interface CustomBundleSelection {
  definitionId: number;
  configurationVersion: number;
  items: CustomBundleSelectionItem[];
}

export interface CustomBundleTier {
  requiredQuantity: number;
  discountPercentage: number;
  complimentaryQuantity: number;
}

export interface CustomBundleImage {
  imagePath: string;
  altText?: string;
  altTextAr?: string;
}

export interface CustomBundleVariant {
  productVariantId: number;
  sku: string;
  price: number;
  weight: number;
  weightUnit: string;
  isAvailable: boolean;
  isLowStock: boolean;
}

export interface CustomBundleProduct {
  productId: number;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  tastingNotes?: string;
  tastingNotesAr?: string;
  origin?: string;
  mainImage?: CustomBundleImage;
  images: CustomBundleImage[];
  variants: CustomBundleVariant[];
}

export interface CustomBundleGift {
  productId: number;
  productVariantId: number;
  productName: string;
  productNameAr?: string;
  sku: string;
  image?: CustomBundleImage;
  quantity?: number;
  isAvailable: boolean;
  displayPrice: string;
}

export interface CustomBundleConfiguration {
  definitionId: number;
  code: string;
  configurationVersion: number;
  name: string;
  nameAr?: string;
  minimumQuantity: number;
  maximumQuantity: number;
  allowDuplicateVariants: boolean;
  allowCouponDiscounts: boolean;
  currency: string;
  tiers: CustomBundleTier[];
  complimentaryGift?: CustomBundleGift;
  eligibleProducts: CustomBundleProduct[];
}

export interface CustomBundleQuoteLine {
  productId: number;
  productVariantId: number;
  productName: string;
  productNameAr?: string;
  sku: string;
  weight: number;
  weightUnit: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  allocatedBundleDiscount: number;
  postDiscountSubtotal: number;
  taxPercentage: number;
  taxEstimate: number;
  lineTotal: number;
}

export interface CustomBundleQuote {
  definitionId: number;
  configurationVersion: number;
  currency: string;
  taxModel: string;
  components: CustomBundleQuoteLine[];
  coffeeSubtotal: number;
  selectedTier: CustomBundleTier;
  discountPercentage: number;
  bundleDiscountAmount: number;
  postDiscountBundleSubtotal: number;
  taxEstimate: number;
  finalQuotedBundleAmount: number;
  complimentaryGift: CustomBundleGift;
  isInformationalQuote: boolean;
  quoteNotice: string;
}

export interface CustomBundleApiResult<T> {
  isSuccess: boolean;
  errorCode?: string;
  message: string;
  data?: T;
}

export interface CartCustomBundle {
  id: string;
  selection: CustomBundleSelection;
  quote?: CustomBundleQuote;
  addedAt: string;
}
