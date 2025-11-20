import { http } from './apiClient';

export interface NewsletterSubscriptionRequest {
  email: string;
}

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message: string;
}

export const newsletterService = {
  /**
   * Subscribe an email to the newsletter
   */
  subscribe: async (email: string): Promise<NewsletterSubscriptionResponse> => {
    try {
      const response = await http.post<NewsletterSubscriptionResponse>(
        '/api/newsletter/subscribe',
        { email }
      );
      return response.data;
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      
      // If the API endpoint doesn't exist yet (404) or network error, 
      // store locally as a temporary solution
      if (error?.statusCode === 404 || error?.message === 'Network Error' || !navigator.onLine) {
        console.log('📧 Storing newsletter subscription locally (API not available yet)');
        
        // Store in localStorage temporarily
        const storedEmails = JSON.parse(localStorage.getItem('pendingNewsletterSubscriptions') || '[]');
        if (!storedEmails.includes(email)) {
          storedEmails.push({
            email,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('pendingNewsletterSubscriptions', JSON.stringify(storedEmails));
        }
        
        return {
          success: true,
          message: 'Thank you for subscribing! You will be notified about our offers.'
        };
      }
      
      throw error;
    }
  },

  /**
   * Unsubscribe an email from the newsletter
   */
  unsubscribe: async (email: string): Promise<NewsletterSubscriptionResponse> => {
    try {
      const response = await http.post<NewsletterSubscriptionResponse>(
        '/api/newsletter/unsubscribe',
        { email }
      );
      return response.data;
    } catch (error: any) {
      console.error('Newsletter unsubscription error:', error);
      throw error;
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
