import type { CartItem } from '../contexts/CartContextDefinition';

export interface CheckoutDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postalCode?: string;
  address: string;
  notes?: string;
  isGift: boolean;
  recipientName?: string;
  recipientPhone?: string;
  recipientCountry?: string;
  recipientCity?: string;
  recipientPostalCode?: string;
  recipientAddress?: string;
}

export interface CheckoutOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  shippingMethod: {
    id: string;
    name: string;
    nameAr: string;
    eta?: string;
    etaAr?: string;
    cost: number;
  };
  totals: {
    subtotal: number;
    shipping: number;
    discount?: number;
    total: number;
    couponCode?: string;
  };
  checkoutDetails: CheckoutDetails;
}
