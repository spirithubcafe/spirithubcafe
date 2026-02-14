import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { CartContext, type CartItem, type CartContextType } from './CartContextDefinition';

interface CartProviderProps {
  children: ReactNode;
}

// Helper to detect region from URL path directly
const getRegionFromPath = (pathname: string): string => {
  if (pathname.startsWith('/sa')) return 'sa';
  if (pathname.startsWith('/om')) return 'om';
  return 'om'; // default
};

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
  } catch {
    return [];
  }
};

// Helper function to save cart to localStorage
const saveCartToStorage = (regionCode: string, items: CartItem[]): void => {
  try {
    const cartKey = getCartStorageKey(regionCode);
    localStorage.setItem(cartKey, JSON.stringify(items));
  } catch {
    // ignore
  }
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Get region directly from URL using useLocation - this is the source of truth
  const location = useLocation();
  const currentRegionCode = getRegionFromPath(location.pathname);
  
  // Track the region that items currently belong to - this is the KEY to preventing mixing
  const activeRegionRef = useRef<string>(currentRegionCode);
  // Track what was last saved to prevent duplicate saves.
  // Initialise with the current region and empty-array hash so the save
  // effect does NOT persist [] back to localStorage before the load effect
  // has a chance to restore real items (avoids clearing the cart on mount).
  const lastSavedRef = useRef<{ region: string; itemsHash: string }>({ region: currentRegionCode, itemsHash: '[]' });
  
  // Start with an empty cart so SSR and client hydration produce identical
  // output (avoids React error #418).  Real items are loaded after hydration
  // in the useEffect below.
  const [items, setItems] = useState<CartItem[]>([]);
  
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage after hydration (runs once on mount).
  useEffect(() => {
    activeRegionRef.current = currentRegionCode;
    const loadedItems = loadCartFromStorage(currentRegionCode);
    const itemsHash = JSON.stringify(loadedItems);
    lastSavedRef.current = { region: currentRegionCode, itemsHash };
    if (loadedItems.length > 0) {
      setItems(loadedItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle region changes - load cart for new region
  useEffect(() => {
    // Skip if region hasn't actually changed
    if (activeRegionRef.current === currentRegionCode) {
      return;
    }
    
    // Update ref BEFORE loading new items - this is critical
    activeRegionRef.current = currentRegionCode;
    
    // Load cart for the new region
    const loadedItems = loadCartFromStorage(currentRegionCode);
    
    // Mark this as "already saved" so the save effect won't re-save
    const itemsHash = JSON.stringify(loadedItems);
    lastSavedRef.current = { region: currentRegionCode, itemsHash };
    
    setItems(loadedItems);
  }, [currentRegionCode]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    // Critical: only save if active region matches current region
    if (activeRegionRef.current !== currentRegionCode) {
      return;
    }
    
    // Create a hash of current items to detect if we need to save
    const itemsHash = JSON.stringify(items);
    
    // Skip if this exact state was already saved (prevents duplicate saves after region switch)
    if (lastSavedRef.current.region === currentRegionCode && 
        lastSavedRef.current.itemsHash === itemsHash) {
      return;
    }
    
    // Update last saved state
    lastSavedRef.current = { region: currentRegionCode, itemsHash };
    
    saveCartToStorage(currentRegionCode, items);
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
