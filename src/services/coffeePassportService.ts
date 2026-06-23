import { apiClient } from './apiClient';
import { resolveCurrentLocaleForApi } from '../lib/locale';

export interface Achievement {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  unlockedDate: string;
}

export interface LatestDiscovery {
  productId: number;
  nameEn: string;
  nameAr: string;
  originEn: string;
  originAr: string;
  originFlag: string;
  tasteNotesEn: string[];
  tasteNotesAr: string[];
  processEn: string;
  processAr: string;
  discoveredDate: string;
  productImage?: string;
}

export interface JourneyEvent {
  id: string;
  eventType: 'discovery' | 'achievement' | 'milestone' | 'purchase';
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  date: string;
  icon: string;
  metadata?: Record<string, unknown>;
}

export interface CoffeePassportProfile {
  customerId: number;
  countriesExplored: number;
  countriesList?: string[];
  countriesFlags?: Record<string, string>;
  coffeesTried: number;
  processesExplored: string[];
  achievements: Achievement[];
  latestDiscovery?: LatestDiscovery;
  tastingNotes: string[];
  productsTried: number;
  journeyTimeline: JourneyEvent[];
  joinDate: string;
  totalPoints: number;
  nextMilestone?: {
    titleEn: string;
    titleAr: string;
    progress: number;
    target: number;
  };
}

class CoffeePassportService {
  async getProfile(): Promise<CoffeePassportProfile | null> {
    try {
      const locale = resolveCurrentLocaleForApi();
      const response = await apiClient.get<CoffeePassportProfile>(
        '/api/coffee-passport/profile',
        {
          headers: {
            'Accept-Language': locale,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Coffee Passport profile:', error);
      return null;
    }
  }

  async recordDiscovery(productId: number, tasteNotes: string[]): Promise<void> {
    try {
      await apiClient.post('/api/coffee-passport/discoveries', {
        productId,
        tasteNotes,
      });
    } catch (error) {
      console.error('Error recording discovery:', error);
    }
  }

  async unlockAchievement(achievementId: string): Promise<void> {
    try {
      await apiClient.post(`/api/coffee-passport/achievements/${achievementId}/unlock`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  async getJourneyTimeline(limit: number = 10): Promise<JourneyEvent[]> {
    try {
      const response = await apiClient.get<JourneyEvent[]>(
        `/api/coffee-passport/journey-timeline?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching journey timeline:', error);
      return [];
    }
  }
}

export const coffeePassportService = new CoffeePassportService();
