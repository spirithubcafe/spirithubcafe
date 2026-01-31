// Cache utilities for localStorage with expiration
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_VERSION = 6; // Increment this when cache structure changes

export const cacheUtils = {
  set: <T>(key: string, data: T, duration: number = CACHE_DURATION): void => {
    try {
      const now = Date.now();
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + duration,
        version: CACHE_VERSION,
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();

      // Check version mismatch - clear if version is different
      if (!cacheItem.version || cacheItem.version !== CACHE_VERSION) {
        localStorage.removeItem(key);
        return null;
      }

      // Check if cache has expired
      if (now > cacheItem.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  isExpired: (key: string): boolean => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return true;

      const cacheItem = JSON.parse(item);
      return Date.now() > cacheItem.expiresAt;
    } catch {
      return true;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  },

  clear: (): void => {
    try {
      // Clear only app-specific cache keys
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('spirithub_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Get cache age in minutes
  getCacheAge: (key: string): number | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const cacheItem = JSON.parse(item);
      const ageMs = Date.now() - cacheItem.timestamp;
      return Math.floor(ageMs / 60000); // Convert to minutes
    } catch {
      return null;
    }
  },
};

// Image cache utilities
export const imageCacheUtils = {
  // Preload image and cache it in browser with timeout
  preloadImage: (url: string, timeoutMs: number = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.src = ''; // Cancel the request
        reject(new Error(`Image load timeout: ${url}`));
      }, timeoutMs);
      
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  },

  // Preload multiple images with concurrency limit
  preloadImages: async (urls: string[], concurrency: number = 2): Promise<void> => {
    // Process images with limited concurrency to prevent resource exhaustion
    const results: Promise<void>[] = [];
    let index = 0;
    
    const runNext = async (): Promise<void> => {
      while (index < urls.length) {
        const currentIndex = index++;
        try {
          await imageCacheUtils.preloadImage(urls[currentIndex], 8000);
        } catch (error) {
          // Silently ignore individual image failures
          console.debug('Image preload failed:', urls[currentIndex]);
        }
      }
    };
    
    // Start limited concurrent workers
    const workers = Array(Math.min(concurrency, urls.length))
      .fill(null)
      .map(() => runNext());
    
    await Promise.all(workers);
  },

  // Mark images as cached in localStorage
  markImagesCached: (urls: string[]): void => {
    try {
      const cachedImages = imageCacheUtils.getCachedImages();
      urls.forEach(url => cachedImages.add(url));
      localStorage.setItem('spirithub_cached_images', JSON.stringify(Array.from(cachedImages)));
    } catch (error) {
      console.error('Error marking images as cached:', error);
    }
  },

  // Get list of cached image URLs
  getCachedImages: (): Set<string> => {
    try {
      const cached = localStorage.getItem('spirithub_cached_images');
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  },

  // Check if image is cached
  isImageCached: (url: string): boolean => {
    const cachedImages = imageCacheUtils.getCachedImages();
    return cachedImages.has(url);
  },
};
