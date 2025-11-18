import { createContext } from 'react';

export interface CartItem {
  id: string; // productId as string for backward compatibility
  productId: number; // Actual product ID for API
  productVariantId: number | null; // Variant ID if product has variants (null when none)
  name: string;
  price: number;
  image: string;
  quantity: number;
  tastingNotes?: string;
  variantName?: string; // Display name for variant (e.g., "250g", "Medium Roast")
  weight?: number; // Weight per unit (from product variant)
  weightUnit?: string; // Weight unit (g, kg, oz, lb)
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
