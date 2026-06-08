import { useCallback, useSyncExternalStore } from 'react';

export interface FavoriteItem {
  id: string;
  slug?: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  addedDate: string;
}

const FAVORITES_STORAGE_KEY = 'spirithub_favorites';
const FAVORITES_EVENT = 'spirithub:favoritesUpdated';
const EMPTY_FAVORITES: FavoriteItem[] = [];

const readFavoritesFromStorage = (): FavoriteItem[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

let favoritesSnapshot: FavoriteItem[] = EMPTY_FAVORITES;
let favoritesInitialized = false;
let browserListenersInstalled = false;
const favoritesListeners = new Set<() => void>();

const ensureFavoritesInitialized = () => {
  if (favoritesInitialized) return;
  favoritesSnapshot = readFavoritesFromStorage();
  favoritesInitialized = true;
};

const notifyFavoritesListeners = (nextFavorites: FavoriteItem[]) => {
  favoritesSnapshot = nextFavorites;
  favoritesInitialized = true;
  favoritesListeners.forEach((listener) => listener());
};

const handleFavoritesEvent = (event: Event) => {
  const customEvent = event as CustomEvent<FavoriteItem[] | undefined>;
  notifyFavoritesListeners(customEvent.detail ?? readFavoritesFromStorage());
};

const handleFavoritesStorage = (event: StorageEvent) => {
  if (event.key === FAVORITES_STORAGE_KEY) {
    notifyFavoritesListeners(readFavoritesFromStorage());
  }
};

const installBrowserListeners = () => {
  if (browserListenersInstalled || typeof window === 'undefined') return;
  window.addEventListener(FAVORITES_EVENT, handleFavoritesEvent);
  window.addEventListener('storage', handleFavoritesStorage);
  browserListenersInstalled = true;
};

const removeBrowserListeners = () => {
  if (!browserListenersInstalled || favoritesListeners.size > 0 || typeof window === 'undefined') return;
  window.removeEventListener(FAVORITES_EVENT, handleFavoritesEvent);
  window.removeEventListener('storage', handleFavoritesStorage);
  browserListenersInstalled = false;
};

const subscribeToFavorites = (listener: () => void) => {
  ensureFavoritesInitialized();
  favoritesListeners.add(listener);
  installBrowserListeners();

  return () => {
    favoritesListeners.delete(listener);
    removeBrowserListeners();
  };
};

const getFavoritesSnapshot = () => {
  ensureFavoritesInitialized();
  return favoritesSnapshot;
};

export const useFavorites = () => {
  const favorites = useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES,
  );
  const isLoading = favorites === EMPTY_FAVORITES;

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteItem[]) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      notifyFavoritesListeners(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  // Add item to favorites
  const addToFavorites = (product: Omit<FavoriteItem, 'addedDate'>) => {
    const existingIndex = favorites.findIndex(item => item.id === product.id);
    
    if (existingIndex === -1) {
      const newItem: FavoriteItem = {
        ...product,
        addedDate: new Date().toISOString()
      };
      const newFavorites = [...favorites, newItem];
      saveFavorites(newFavorites);
      return true; // Added successfully
    }
    
    return false; // Already exists
  };

  // Remove item from favorites
  const removeFromFavorites = (id: string) => {
    const newFavorites = favorites.filter(item => item.id !== id);
    saveFavorites(newFavorites);
    return true;
  };

  // Toggle favorite status
  const toggleFavorite = (product: Omit<FavoriteItem, 'addedDate'>) => {
    const existingIndex = favorites.findIndex(item => item.id === product.id);
    
    if (existingIndex === -1) {
      return addToFavorites(product);
    } else {
      removeFromFavorites(product.id);
      return false; // Removed
    }
  };

  // Check if item is in favorites
  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id);
  };

  // Get favorites count
  const favoritesCount = favorites.length;

  // Clear all favorites
  const clearFavorites = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    notifyFavoritesListeners([]);
  };

  return {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    favoritesCount,
    clearFavorites
  };
};
