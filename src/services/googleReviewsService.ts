import { publicHttp } from './apiClient';

export type GoogleReview = {
  authorName: string;
  profilePhotoUrl?: string;
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
    const response = await publicHttp.get<GoogleReviewsApiResponse>('/api/google/reviews', {
      params: { reviews_sort: 'newest' },
    });
    const payload = response.data;

    if (!payload?.success || !payload.data) {
      return null;
    }

    return {
      ...payload.data,
      reviews: (payload.data.reviews ?? [])
        .map((review) => {
          const raw = review as typeof review & { profile_photo_url?: string };
          return {
            ...review,
            profilePhotoUrl: review.profilePhotoUrl ?? raw.profile_photo_url,
          };
        })
        .filter((review) => Number(review.rating) === 5)
        .sort((a, b) => (b.time ?? 0) - (a.time ?? 0)),
    };
  },
};
