export const siteMetadata = {
  siteName: 'Spirit Hub Cafe',
  baseUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://spirithubcafe.com',
  defaultTitle: 'SpiritHub Roastery | Specialty Coffee & Capsules in Oman & Saudi',
  defaultDescription:
    '🔥 Premium specialty coffee 2026 • Fresh roasted daily in Muscat & Khobar • Buy coffee beans & capsules online - Fast shipping within 24hrs! Order now from expert roastery in Oman.',
  defaultDescriptionAr:
    '🔥 سبيريت هب كافيه 2026 • أفضل محمصة قهوة مختصة في مسقط والخبر • حبوب قهوة طازجة محمصة يومياً - شحن سريع خلال 24 ساعة! اطلب الآن من أفضل محمصة في عُمان.',
  defaultKeywords: [
    'Spirit Hub Cafe',
    'specialty coffee Oman',
    'coffee roastery Muscat',
    'fresh roasted coffee beans',
    'single origin coffee Oman',
    'Arabic coffee Muscat',
    'coffee subscription Oman',
    'brewing equipment',
    'Q Grader certified',
    'سبيريت هب كافيه',
    'قهوة مختصة مسقط',
    'محمصة قهوة عمان',
    'حبوب قهوة طازجة',
    'قهوة عربية مسقط',
  ],
  twitterHandle: '@spirithubcafe',
  defaultImage: '/images/icon-512x512.png',
};

export const resolveAbsoluteUrl = (relativeOrAbsolute?: string): string | undefined => {
  if (!relativeOrAbsolute) {
    return undefined;
  }

  try {
    // If already absolute URL (starts with http:// or https://), return as-is
    if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) {
      return relativeOrAbsolute;
    }
    
    // Otherwise, resolve relative to site base URL
    const base = siteMetadata.baseUrl || window.location.origin;
    return new URL(relativeOrAbsolute, base).toString();
  } catch {
    return relativeOrAbsolute;
  }
};
