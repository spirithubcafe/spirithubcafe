import { http } from './apiClient';

export interface UserProfile {
  id: number;
  username: string;
  displayName?: string;
  fullName?: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  bio?: string;
  profilePicture?: string;
  totalSpent: number;
  points: number;
  membershipType?: string;
  memberSince: string;
  googleId?: string;
  isGoogleAccount: boolean;
  isActive: boolean;
  lastLoggedIn?: string;
  roles: string[];
}

export interface UpdateProfileDto {
  displayName?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
}

export interface PictureUploadResponse {
  success: boolean;
  message: string;
  profilePictureUrl: string;
}

const PROFILE_ENDPOINT = '/api/UserProfile';

export const profileService = {
  /**
   * Get current user's profile
   */
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await http.get<UserProfile>(`${PROFILE_ENDPOINT}/me`);
    return response.data;
  },

  /**
   * Update current user's profile
   */
  updateMyProfile: async (data: UpdateProfileDto): Promise<ProfileUpdateResponse> => {
    const response = await http.put<ProfileUpdateResponse>(`${PROFILE_ENDPOINT}/me`, data);
    return response.data;
  },

  /**
   * Upload profile picture
   */
  uploadProfilePicture: async (file: File): Promise<PictureUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await http.post<PictureUploadResponse>(
      `${PROFILE_ENDPOINT}/me/picture`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Delete profile picture
   */
  deleteProfilePicture: async (): Promise<ProfileUpdateResponse> => {
    const response = await http.delete<ProfileUpdateResponse>(`${PROFILE_ENDPOINT}/me/picture`);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordDto): Promise<ProfileUpdateResponse> => {
    const response = await http.post<ProfileUpdateResponse>(
      `${PROFILE_ENDPOINT}/me/change-password`,
      data
    );
    return response.data;
  },
};

export default profileService;
