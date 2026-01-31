import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { CartContext, type CartItem, type CartContextType } from './CartContextDefinition';
import { RegionContext } from './RegionContextDefinition';

interface CartProviderProps {
  children: ReactNode;
}

// Helper function to get cart storage key for specific region
const getCartStorageKey = (regionCode: string) => `spirithub_cart_${regionCode}`;

// Helper function to load cart from localStorage
const loadCartFromStorage = (regionCode: string): CartItem[] => {
  try {
    const cartKey = getCartStorageKey(regionCode);
    const savedCart = localStorage.getItem(cartKey);
    console.log(`🛒 Loading cart for region: ${regionCode} from key: ${cartKey}`);
    if (!savedCart) return [];
    const parsed = JSON.parse(savedCart) as any[];
    // Ensure productVariantId exists for backward compatibility
    return parsed.map(item => ({
      ...item,
      productVariantId: 'productVariantId' in item ? item.productVariantId : null,
    })) as CartItem[];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Get current region from RegionContext
  const regionContext = React.useContext(RegionContext);
  const currentRegionCode = regionContext?.currentRegion?.code || 'om';
  
  // Track the region code that the current items belong to
  // This prevents saving old items to a new region's storage key
  const activeRegionRef = useRef<string>(currentRegionCode);
  
  const [items, setItems] = useState<CartItem[]>(() => {
    return loadCartFromStorage(currentRegionCode);
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Load cart when region changes
  useEffect(() => {
    // Skip if region hasn't actually changed (initial render)
    if (activeRegionRef.current === currentRegionCode) {
      return;
    }
    
    console.log(`🔄 Region changed from ${activeRegionRef.current} to ${currentRegionCode}`);
    
    // Load cart for the new region
    const loadedItems = loadCartFromStorage(currentRegionCode);
    
    if (loadedItems.length === 0) {
      console.log(`📭 No cart found for ${currentRegionCode}, starting with empty cart`);
    } else {
      console.log(`✅ Loaded ${loadedItems.length} items for ${currentRegionCode}`);
    }
    
    // Update the active region BEFORE setting items
    // This ensures the save effect uses the correct key
    activeRegionRef.current = currentRegionCode;
    setItems(loadedItems);
  }, [currentRegionCode]);

  // Save cart to localStorage whenever items change
  // ONLY save to the region that the items belong to
  useEffect(() => {
    // Only save if the active region matches the current region
    // This prevents overwriting when region is switching
    if (activeRegionRef.current !== currentRegionCode) {
      console.log(`⏭️ Skipping save: active region (${activeRegionRef.current}) !== current region (${currentRegionCode})`);
      return;
    }
    
    try {
      const cartKey = getCartStorageKey(activeRegionRef.current);
      localStorage.setItem(cartKey, JSON.stringify(items));
      console.log(`💾 Saved cart for ${activeRegionRef.current}: ${items.length} items`);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items, currentRegionCode]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      
      if (existingItem) {
        // Increment quantity if item already exists
        return prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item with quantity 1
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
