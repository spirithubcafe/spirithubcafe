import locations from '@/data/gcc-locations.json';
import { calculateAramexRate, type AramexRateRequest } from '@/services/aramexService';

export type GCCCountry = {
  name_en: string
  name_ar: string
  iso2: string
  cities: Array<{
    slug: string
    name_en: string
    name_ar: string
    cityCode: string
  }>
}

export type ShippingMethod = {
  id: 'pickup' | 'nool' | 'aramex'
  label: { en: string; ar: string }
  description: { en: string; ar: string }
  eta: { en: string; ar: string }
  badge: { en: string; ar: string }
  price: number
  isCalculating?: boolean
  calculationError?: string
}

export const GCC_LOCATIONS = (locations as { countries: GCCCountry[] }).countries;

export function getCountries() {
  return GCC_LOCATIONS.map(c => ({
    iso2: c.iso2,
    name_en: c.name_en,
    name_ar: c.name_ar
  }));
}

export function getCountryByIso2(iso2?: string) {
  if (!iso2) return undefined;
  return GCC_LOCATIONS.find(c => c.iso2 === iso2);
}

export function getCitiesByCountry(iso2?: string) {
  return getCountryByIso2(iso2)?.cities ?? [];
}

export function computeShippingMethods(opts: {
  countryIso2?: string;
  citySlug?: string;
  orderTotal?: number;
}): ShippingMethod[] {
  const { countryIso2, citySlug, orderTotal = 0 } = opts;
  const isOman = countryIso2 === 'OM';
  const isKhasab = isOman && citySlug === 'khasab';
  const isFreeNoolDelivery = orderTotal > 20;

  const methods: ShippingMethod[] = [
    {
      id: 'pickup',
      label: { en: 'Pickup from Shop', ar: 'استلام من المتجر' },
      description: {
        en: 'Collect your order from our Muscat location. We will notify you when it is ready.',
        ar: 'استلم طلبك من موقعنا في مسقط. سنخبرك حالما يصبح جاهزاً.'
      },
      eta: { en: 'Ready within 24 hours', ar: 'جاهز خلال 24 ساعة' },
      badge: { en: 'Free', ar: 'مجاني' },
      price: 0,
    },
  ];

  if (isOman) {
    methods.push({
      id: 'nool',
      label: { en: 'Nool Delivery', ar: 'توصيل نول' },
      description: {
        en: 'Fast local delivery within Muscat area with our own delivery team.',
        ar: 'توصيل محلي سريع داخل منطقة مسقط مع فريق التوصيل الخاص بنا.'
      },
      eta: { en: '1-2 business days', ar: '١-٢ أيام عمل' },
      badge: {
        en: isFreeNoolDelivery ? 'Free over 20 OMR' : 'Fast delivery',
        ar: isFreeNoolDelivery ? 'مجاني فوق 20 ر.ع' : 'توصيل سريع'
      },
      price: isFreeNoolDelivery ? 0 : (isKhasab ? 3.0 : 2.0),
    });
  }

  methods.push({
    id: 'aramex',
    label: { en: 'Aramex Courier', ar: 'أرامكس للشحن' },
    description: {
      en: 'Fast door-to-door delivery across Oman and GCC with live tracking.',
      ar: 'توصيل سريع إلى الباب في جميع أنحاء عُمان ودول الخليج مع تتبع مباشر.\u200F'
    },
    eta: { en: '2-4 business days', ar: '٢-٤ أيام عمل' },
    badge: { en: 'Best for gifts', ar: 'مثالي للهدايا' },
    price: 0, // Updated dynamically
  });

  return methods;
}

/**
 * Calculate Aramex shipping rate dynamically based on destination
 */
export async function calculateAramexShippingRate(
  countryIso2: string,
  city: string,
  weight: number
): Promise<{ success: boolean; price?: number; error?: string }> {
  try {
    const isOman = countryIso2 === 'OM';

    const productGroup = isOman ? 'DOM' : 'EXP';
    const productType = isOman ? 'ONP' : 'PPX'; // ONP for domestic Oman, PPX for international

    const chargeableWeight = Math.max(1, Math.ceil(weight || 0));

    const request: AramexRateRequest = {
      originAddress: {
        line1: 'Al Hail',
        city: 'Muscat',
        countryCode: 'OM',
        postCode: '111',
      },
      destinationAddress: {
        line1: 'Customer Address',
        city: city,
        countryCode: countryIso2,
        postCode: '00000',
      },
      shipmentDetails: {
        actualWeight: { unit: 'KG', value: chargeableWeight },
        chargeableWeight: { unit: 'KG', value: chargeableWeight },
        numberOfPieces: 1,
        productGroup: productGroup,
        productType: productType,
        paymentType: 'P',
        descriptionOfGoods: 'Coffee Products',
        dimensions: {
          length: 20,
          width: 20,
          height: 20,
          unit: 'CM',
        },
      },
    };

    const response = await calculateAramexRate(request);

    if (response.success && response.rate?.amount) {
      return { success: true, price: response.rate.amount };
    }

    return {
      success: false,
      error: response.errors?.join(', ') || 'Rate unavailable'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error'
    };
  }
}
