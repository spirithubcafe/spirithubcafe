import { publicHttp } from './apiClient';

export type GoogleReview = {
  authorName: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
};

export type GoogleReviewsData = {
  name: string;
  rating: number;
  userRatingsTotal: number;
  reviewWriteUrl: string;
  reviews: GoogleReview[];
};

type GoogleReviewsApiResponse = {
  success: boolean;
  data?: GoogleReviewsData;
};

export const googleReviewsService = {
  async getReviews(): Promise<GoogleReviewsData | null> {
    const response = await publicHttp.get<GoogleReviewsApiResponse>('/api/google/reviews');
    const payload = response.data;

    if (!payload?.success || !payload.data) {
      return null;
    }

    return payload.data;
  },
};

