import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// Helper function to save cart to localStorage
const saveCartToStorage = (regionCode: string, items: CartItem[]): void => {
  try {
    const cartKey = getCartStorageKey(regionCode);
    localStorage.setItem(cartKey, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Get current region from RegionContext
  const regionContext = React.useContext(RegionContext);
  const currentRegionCode = regionContext?.currentRegion?.code || 'om';
  
  // Track the region code that the current items belong to
  // This prevents saving old items to a new region's storage key
  const activeRegionRef = useRef<string>(currentRegionCode);
  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);
  
  const [items, setItems] = useState<CartItem[]>(() => {
    // On initial render, load from the detected region
    const initialRegion = regionContext?.currentRegion?.code || 'om';
    activeRegionRef.current = initialRegion;
    return loadCartFromStorage(initialRegion);
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Handle region changes - load cart for new region
  useEffect(() => {
    // Skip initial mount since we already loaded in useState
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      // Make sure activeRegionRef matches currentRegionCode on mount
      if (activeRegionRef.current !== currentRegionCode) {
        activeRegionRef.current = currentRegionCode;
        setItems(loadCartFromStorage(currentRegionCode));
      }
      return;
    }
    
    // Skip if region hasn't actually changed
    if (activeRegionRef.current === currentRegionCode) {
      return;
    }
    
    // Update ref FIRST to prevent save effect from writing to wrong key
    activeRegionRef.current = currentRegionCode;
    
    // Load cart for the new region
    const loadedItems = loadCartFromStorage(currentRegionCode);
    setItems(loadedItems);
  }, [currentRegionCode]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    // Don't save during initial mount - the cart was just loaded
    if (isInitialMountRef.current) {
      return;
    }
    
    // Only save if the active region matches the current region
    // This prevents overwriting during region switch
    if (activeRegionRef.current !== currentRegionCode) {
      return;
    }
    
    saveCartToStorage(activeRegionRef.current, items);
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

  // Memoize computed values to prevent unnecessary re-renders
  const totalItems = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  
  const totalPrice = useMemo(() => 
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value: CartContextType = useMemo(() => ({
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
  }), [items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isOpen, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
