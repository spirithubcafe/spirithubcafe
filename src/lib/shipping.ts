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

export const GCC_LOCATIONS = (locations as { countries: GCCCountry[] }).countries

export function getCountries() {
  return GCC_LOCATIONS.map(c => ({ iso2: c.iso2, name_en: c.name_en, name_ar: c.name_ar }))
}

export function getCountryByIso2(iso2?: string) {
  if (!iso2) return undefined
  return GCC_LOCATIONS.find(c => c.iso2 === iso2)
}

export function getCitiesByCountry(iso2?: string) {
  const country = getCountryByIso2(iso2)
  return country?.cities ?? []
}

export function computeShippingMethods(opts: { countryIso2?: string; citySlug?: string }): ShippingMethod[] {
  const { countryIso2, citySlug } = opts
  const isOman = countryIso2 === 'OM'
  const isKhasab = isOman && (citySlug === 'khasab')

  const methods: ShippingMethod[] = []

  methods.push({
    id: 'pickup',
    label: { en: 'Pickup from Shop', ar: 'استلام من المتجر' },
    description: {
      en: 'Collect your order from our Muscat location. We will notify you when it is ready.',
      ar: 'استلم طلبك من موقعنا في مسقط. سنخبرك حالما يصبح جاهزاً.'
    },
    eta: { en: 'Ready within 24 hours', ar: 'جاهز خلال 24 ساعة' },
    badge: { en: 'Free', ar: 'مجاني' },
    price: 0
  })

  if (isOman) {
    methods.push({
      id: 'nool',
      label: { en: 'Nool Delivery', ar: 'توصيل نول' },
      description: {
        en: 'Fast local delivery within Muscat area with our own delivery team.',
        ar: 'توصيل محلي سريع داخل منطقة مسقط مع فريق التوصيل الخاص بنا.'
      },
      eta: { en: '1-2 business days', ar: '١-٢ أيام عمل' },
      badge: { en: 'Fast delivery', ar: 'توصيل سريع' },
      price: isKhasab ? 3.0 : 2.0
    })
  }

  methods.push({
    id: 'aramex',
    label: { en: 'Aramex Courier', ar: 'أرامكس للشحن' },
    description: {
      en: 'Fast door-to-door delivery across Oman and GCC with live tracking.',
      ar: 'توصيل سريع إلى الباب في جميع أنحاء عُمان ودول الخليج مع تتبع مباشر.'
    },
    eta: { en: '2-4 business days', ar: '٢-٤ أيام عمل' },
    badge: { en: 'Best for gifts', ar: 'مثالي للهدايا' },
    // Placeholder - will be calculated dynamically in checkout
    price: 3.5
  })

  return methods
}

/**
 * Calculate Aramex shipping rate dynamically based on destination
 * @param countryIso2 - Destination country code (e.g., 'AE', 'SA', 'OM')
 * @param city - Destination city name
 * @param weight - Total weight of shipment in KG (default: 1)
 * @returns Promise with rate calculation result
 */
export async function calculateAramexShippingRate(
  countryIso2: string,
  city: string,
  weight: number = 1
): Promise<{ success: boolean; price?: number; error?: string }> {
  try {
    // Determine product type and group based on destination
    const isOman = countryIso2 === 'OM';
    const productGroup = isOman ? 'DOM' : 'EXP';
    const productType = isOman ? 'OND' : 'PPX';

    // Build rate request according to Aramex API specification
    const request: AramexRateRequest = {
      OriginAddress: {
        Line1: 'Al Hail',
        City: 'Muscat',
        CountryCode: 'OM',
        PostalCode: '111',
      },
      DestinationAddress: {
        Line1: 'Customer Address',
        City: city,
        CountryCode: countryIso2,
        PostalCode: '00000',
      },
      ShipmentDetails: {
        ActualWeight: { Unit: 'KG', Value: weight },
        ChargeableWeight: { Unit: 'KG', Value: weight },
        NumberOfPieces: 1,
        ProductGroup: productGroup,
        ProductType: productType,
        PaymentType: 'P',
        DescriptionOfGoods: 'Coffee Products',
        Dimensions: {
          Length: 20,
          Width: 20,
          Height: 20,
          Unit: 'CM',
        },
      },
    };

    const response = await calculateAramexRate(request);
    
    console.log('calculateAramexShippingRate - Response:', response);

    if (response.success && response.rate) {
      console.log('calculateAramexShippingRate - Returning price:', response.rate.amount);
      return {
        success: true,
        price: response.rate.amount,
      };
    } else {
      console.log('calculateAramexShippingRate - Failed:', response.errors);
      return {
        success: false,
        error: response.errors?.join(', ') || 'Failed to calculate shipping rate',
      };
    }
  } catch (error: any) {
    console.error('Error calculating Aramex rate:', error);
    return {
      success: false,
      error: error.message || 'Network error while calculating shipping rate',
    };
  }
}
