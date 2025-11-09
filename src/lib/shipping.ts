import locations from '@/data/gcc-locations.json';

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
    // Placeholder until API integration is added
    price: 3.5
  })

  return methods
}
