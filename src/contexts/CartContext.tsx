import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CartContext, type CartItem, type CartContextType } from './CartContextDefinition';
import { RegionContext } from './RegionContextDefinition';

interface CartProviderProps {
  children: ReactNode;
}

// Helper function to get cart storage key for specific region
const getCartStorageKey = (regionCode: string) => `spirithub_cart_${regionCode}`;

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Get current region from RegionContext
  const regionContext = React.useContext(RegionContext);
  const currentRegionCode = regionContext?.currentRegion?.code || 'om';
  
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initial render based on current region
    try {
      const cartKey = getCartStorageKey(currentRegionCode);
      const savedCart = localStorage.getItem(cartKey);
      console.log(`🛒 Loading cart for region: ${currentRegionCode} from key: ${cartKey}`);
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
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Load cart when region changes
  useEffect(() => {
    try {
      const cartKey = getCartStorageKey(currentRegionCode);
      const savedCart = localStorage.getItem(cartKey);
      console.log(`🔄 Region changed to: ${currentRegionCode}, loading cart from: ${cartKey}`);
      
      if (!savedCart) {
        console.log(`📭 No cart found for ${currentRegionCode}, starting with empty cart`);
        setItems([]);
        return;
      }
      
      const parsed = JSON.parse(savedCart) as any[];
      const loadedItems = parsed.map(item => ({
        ...item,
        productVariantId: 'productVariantId' in item ? item.productVariantId : null,
      })) as CartItem[];
      
      console.log(`✅ Loaded ${loadedItems.length} items for ${currentRegionCode}`);
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading cart for region:', error);
      setItems([]);
    }
  }, [currentRegionCode]);

  // Save cart to localStorage whenever it changes (with region-specific key)
  useEffect(() => {
    try {
      const cartKey = getCartStorageKey(currentRegionCode);
      localStorage.setItem(cartKey, JSON.stringify(items));
      console.log(`💾 Saved cart for ${currentRegionCode}: ${items.length} items`);
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
