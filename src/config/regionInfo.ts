import type { RegionCode } from '../contexts/RegionContextDefinition';

export interface RegionContactInfo {
  phone: string;
  phone2?: string;
  whatsapp: string;
  email: string;
  address: {
    en: string;
    ar: string;
  };
  workingHours: {
    en: string;
    ar: string;
  };
  location: {
    lat: number;
    lng: number;
  };
  googleMapsUrl: string;
}

export interface RegionSocialLinks {
  facebook?: string;
  instagram?: string;
  whatsapp: string;
  email: string;
}

export interface RegionInfo {
  contact: RegionContactInfo;
  social: RegionSocialLinks;
  aboutContent: {
    companyName: {
      en: string;
      ar: string;
    };
    description: {
      en: string;
      ar: string;
    };
    established?: string;
  };
}

export const REGION_INFO: Record<RegionCode, RegionInfo> = {
  om: {
    contact: {
      phone: '+968 9190 0005',
      phone2: '+968 7272 6999',
      whatsapp: '96891900005',
      email: 'info@spirithubcafe.com',
      address: {
        en: 'Al Mouj St, Muscat, Oman',
        ar: 'شارع الموج، مسقط، عُمان'
      },
      workingHours: {
        en: 'Daily: 7 AM - 12 AM',
        ar: 'يومياً: 7 صباحاً - 12 منتصف الليل'
      },
      location: {
        lat: 23.618926,
        lng: 58.256566
      },
      googleMapsUrl: 'https://maps.google.com/?q=23.618926,58.256566'
    },
    social: {
      facebook: 'https://www.facebook.com/spirithubcafe',
      instagram: 'https://www.instagram.com/spirithubcafe/',
      whatsapp: 'https://wa.me/96891900005',
      email: 'mailto:info@spirithubcafe.com'
    },
    aboutContent: {
      companyName: {
        en: 'Spirit Hub Cafe Oman',
        ar: 'سبيريت هب كافيه عُمان'
      },
      description: {
        en: 'Founded in Oman, SpiritHub Roastery crafts exceptional specialty coffee, showcasing the unique flavors, aromas, and origins behind every carefully roasted bean.',
        ar: 'تأسست في عُمان، سبيرت هب روستري تصنع قهوة مختصة استثنائية، لتبرز النكهات والعطور والأصول الفريدة وراء كل حبة محمصة بعناية.'
      },
      established: '2020'
    }
  },
  sa: {
    contact: {
      phone: '+966 53 983 9201',
      phone2: '+966 051 050 1001',
      whatsapp: '966539839201',
      email: 'info@spirithubcafe.com',
      address: {
        en: 'Al Khobar Al Shamalia',
        ar: 'الخبر الشمالية'
      },
      workingHours: {
        en: 'Daily: 7am - 12am',
        ar: 'يومياً: 7 صباحاً - 12 منتصف الليل'
      },
      location: {
        lat: 26.2910625,
        lng: 50.2170625
      },
      googleMapsUrl:
        'https://www.google.com/maps/place/SpiritHub+Roastery+%E2%80%93+%D9%85%D8%AD%D9%85%D8%B5%D8%A9+%D8%B3%D8%A8%D9%8A%D8%B1%D9%8A%D8%AA+%D9%87%D8%A8+%7C+%D8%A7%D9%84%D8%AE%D8%A8%D8%B1/@26.2911111,50.2168019,17z/data=!4m6!3m5!1s0x3e49e9646063cea3:0xea9aae657d1793f5!8m2!3d26.2910625!4d50.2170625!16s%2Fg%2F11ynx_bngw'
    },
    social: {
      facebook: 'https://www.facebook.com/spirithubcafe.sa',
      instagram: 'https://www.instagram.com/spirithubcafe.sa/',
      whatsapp: 'https://wa.me/966539839201',
      email: 'mailto:info.sa@spirithubcafe.com'
    },
    aboutContent: {
      companyName: {
        en: 'Spirit Hub Cafe Saudi Arabia',
        ar: 'سبيريت هب كافيه السعودية'
      },
      description: {
        en: 'Spirit Hub Cafe brings exceptional specialty coffee to Saudi Arabia, showcasing the unique flavors, aromas, and origins behind every carefully roasted bean.',
        ar: 'يقدم سبيريت هب كافيه قهوة مختصة استثنائية إلى المملكة العربية السعودية، لتبرز النكهات والعطور والأصول الفريدة وراء كل حبة محمصة بعناية.'
      },
      established: '2026'
    }
  }
};

/**
 * Hook to get region-specific information
 */
export const useRegionInfo = () => {
  // This will be implemented as a hook
  return REGION_INFO;
};
