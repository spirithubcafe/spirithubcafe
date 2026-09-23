import type { CartItem } from '../contexts/CartContextDefinition';
import type { CartCustomBundle } from './customBundle';

export interface CheckoutDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode?: string;
  notes?: string;
  isGift: boolean;
  recipientName?: string;
  recipientPhone?: string;
  recipientCountry?: string;
  recipientCity?: string;
  recipientAddress?: string;
  recipientPostalCode?: string;
}

export interface CheckoutOrder {
  id: string;
  createdAt: string;
  items: CartItem[];
  customBundles?: CartCustomBundle[];
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
    tax?: number;
    discount?: number;
    giftCardDiscount?: number;
    total: number;
    couponCode?: string;
    giftCardCode?: string;
  };
  checkoutDetails: CheckoutDetails;
}
