import { useState, useEffect } from 'react';

export interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  addedDate: string;
}

const FAVORITES_STORAGE_KEY = 'spirithub_favorites';
const FAVORITES_EVENT = 'spirithub:favoritesUpdated';

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

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = () => {
      const parsedFavorites = readFavoritesFromStorage();
      setFavorites(parsedFavorites);
      setIsLoading(false);
    };

    const handleFavoritesUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<FavoriteItem[] | undefined>;
      const updatedFavorites = customEvent.detail ?? readFavoritesFromStorage();
      setFavorites(updatedFavorites);
    };

    loadFavorites();
    window.addEventListener(FAVORITES_EVENT, handleFavoritesUpdate);

    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleFavoritesUpdate);
    };
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: FavoriteItem[]) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: newFavorites }));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

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
    setFavorites([]);
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: [] }));
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
