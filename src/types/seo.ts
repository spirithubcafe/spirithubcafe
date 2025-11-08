export interface SeoFileInfo {
  fileName: string;
  publicUrl: string;
  lastUpdatedUtc?: string | null;
  sizeInBytes: number;
  entryCount: number;
  exists: boolean;
}

export interface SeoOverview {
  sitemap: SeoFileInfo;
  productFeed: SeoFileInfo;
  activeProductCount: number;
  activeCategoryCount: number;
  baseUrl: string;
}

export interface SeoGenerationResult extends SeoFileInfo {
  message: string;
}
