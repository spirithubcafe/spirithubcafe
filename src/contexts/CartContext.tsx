import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { CartContext, type CartItem, type CartContextType } from './CartContextDefinition';
import { clampQuantity, DEFAULT_MAX_QUANTITY } from '../lib/stockUtils';

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
  // Track what was last saved to prevent duplicate saves
  const lastSavedRef = useRef<{ region: string; itemsHash: string }>({ region: '', itemsHash: '' });
  
  const [items, setItems] = useState<CartItem[]>(() => {
    // On initial render, load from the URL region
    activeRegionRef.current = currentRegionCode;
    return loadCartFromStorage(currentRegionCode);
  });
  
  const [isOpen, setIsOpen] = useState(false);

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

  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'>, requestedQty: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      // Use incoming maxStock, or keep what we already stored
      const effectiveMax = newItem.maxStock ?? existingItem?.maxStock;
      const ceiling = effectiveMax ?? DEFAULT_MAX_QUANTITY;

      if (currentQty >= ceiling) {
        // Already at limit – show toast outside setState via microtask
        queueMicrotask(() => {
          toast.warning(`Only ${ceiling} available`);
        });
        return prevItems;
      }

      const allowedAdd = Math.min(requestedQty, ceiling - currentQty);

      if (allowedAdd < requestedQty) {
        queueMicrotask(() => {
          toast.warning(`Only ${ceiling} available`);
        });
      }

      if (existingItem) {
        return prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + allowedAdd, maxStock: effectiveMax }
            : item
        );
      } else {
        return [...prevItems, { ...newItem, quantity: allowedAdd, maxStock: effectiveMax }];
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

    setItems(prevItems => {
      const item = prevItems.find(i => i.id === id);
      if (!item) return prevItems;

      const clamped = clampQuantity(quantity, item.maxStock);

      if (clamped < quantity) {
        const ceiling = item.maxStock ?? DEFAULT_MAX_QUANTITY;
        queueMicrotask(() => {
          toast.warning(`Only ${ceiling} available`);
        });
      }

      return prevItems.map(i =>
        i.id === id ? { ...i, quantity: clamped } : i
      );
    });
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
