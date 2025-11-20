import { http } from './apiClient';

export interface NewsletterSubscribeDto {
  email: string;
  name?: string;
}

export interface NewsletterSubscriptionDto {
  id: number;
  email: string;
  name?: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  metadata?: string;
}

export interface NewsletterQueryParameters {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  searchTerm?: string;
}

export interface NewsletterSubscriptionsResponse {
  items: NewsletterSubscriptionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface NewsletterUnsubscribeDto {
  email: string;
}

export interface NewsletterSendEmailDto {
  subject: string;
  body: string;
  recipientEmails: string[];
  isHtml?: boolean;
}

export interface NewsletterResponse {
  success?: boolean;
  message: string;
}

export const newsletterService = {
  /**
   * Subscribe an email to the newsletter
   */
  subscribe: async (data: NewsletterSubscribeDto): Promise<NewsletterSubscriptionDto> => {
    try {
      const response = await http.post<NewsletterSubscriptionDto>(
        '/api/Newsletter/subscribe',
        data
      );
      
      // Store subscription status in localStorage
      if (response.data.isActive) {
        localStorage.setItem(`newsletter_subscribed_${data.email}`, 'true');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      throw error;
    }
  },

  /**
   * Unsubscribe an email from the newsletter
   */
  unsubscribe: async (data: NewsletterUnsubscribeDto): Promise<NewsletterResponse> => {
    try {
      const response = await http.post<NewsletterResponse>(
        '/api/Newsletter/unsubscribe',
        data
      );
      
      // Remove subscription status from localStorage
      localStorage.removeItem(`newsletter_subscribed_${data.email}`);
      
      return response.data;
    } catch (error: any) {
      console.error('Newsletter unsubscription error:', error);
      throw error;
    }
  },

  /**
   * Get list of newsletter subscriptions (Admin only)
   */
  getSubscriptions: async (params?: NewsletterQueryParameters): Promise<NewsletterSubscriptionsResponse> => {
    try {
      const response = await http.get<NewsletterSubscriptionsResponse>(
        '/api/Newsletter/subscriptions',
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch newsletter subscriptions:', error);
      throw error;
    }
  },

  /**
   * Send email to selected subscribers (Admin only)
   */
  sendEmail: async (data: NewsletterSendEmailDto): Promise<NewsletterResponse> => {
    try {
      const response = await http.post<NewsletterResponse>(
        '/api/Newsletter/send-email',
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to send newsletter email:', error);
      throw error;
    }
  },

  /**
   * Check subscription status for a specific email
   * Note: This tries to subscribe and checks the response to determine status
   */
  checkSubscriptionStatus: async (email: string): Promise<boolean> => {
    try {
      // Try to get subscriptions with the email (this will fail for non-admin)
      const response = await http.get<NewsletterSubscriptionsResponse>(
        '/api/Newsletter/subscriptions',
        { 
          params: { 
            searchTerm: email,
            isActive: true,
            pageSize: 1 
          } 
        }
      );
      
      // If successful (admin user), check if email exists in results
      const subscription = response.data.items.find(sub => 
        sub.email.toLowerCase() === email.toLowerCase()
      );
      
      return subscription ? subscription.isActive : false;
    } catch (error: any) {
      // If not admin, we can't check directly
      // Return false and let the UI try to subscribe/show appropriate message
      console.warn('Cannot check subscription status (non-admin user):', error.message);
      
      // Check localStorage as fallback
      const localStatus = localStorage.getItem(`newsletter_subscribed_${email}`);
      return localStatus === 'true';
    }
  },

  /**
   * Get pending subscriptions stored locally
   */
  getPendingSubscriptions: (): Array<{email: string, timestamp: string}> => {
    return JSON.parse(localStorage.getItem('pendingNewsletterSubscriptions') || '[]');
  },

  /**
   * Clear pending subscriptions (call this after syncing with backend)
   */
  clearPendingSubscriptions: (): void => {
    localStorage.removeItem('pendingNewsletterSubscriptions');
  }
};
