export const siteMetadata = {
  siteName: 'Spirit Hub Cafe',
  baseUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://www.spirithubcafe.com',
  defaultTitle: 'SpiritHub Roastery | Specialty Coffee Roasted in Oman & Saudi Arabia',
  defaultDescription:
    'Premium specialty coffee roasted in Oman and Saudi Arabia. Shop capsules, filter brews, and freshly roasted coffee beans online. Fast delivery in Muscat and Khobar.',
  defaultDescriptionAr:
    'اطلب قهوة مختصة فاخرة، كبسولات، وقهوة فلتر. محمصة بعناية في مسقط عمان • نخدم الآن الخبر، السعودية. اشتري حبوب قهوة مختصة محمصة طازجة يومياً.',
  defaultKeywords: [
    'Spirit Hub Cafe',
    'SpiritHub Roastery',
    'specialty coffee Oman',
    'coffee roastery Muscat',
    'fresh roasted coffee beans',
    'single origin coffee Oman',
    'coffee capsules Oman',
    'filter coffee Oman',
    'brewing equipment',
    'Q Grader certified',
    'specialty coffee Saudi Arabia',
    'coffee Khobar',
    'سبيريت هب',
    'قهوة مختصة مسقط',
    'محمصة قهوة عمان',
    'حبوب قهوة طازجة',
    'كبسولات قهوة',
    'قهوة فلتر',
  ],
  twitterHandle: '@spirithubcafe',
  // Use a proper 1200x630 banner image for social sharing (not the square app icon)
  defaultImage: '/images/slides/premium-specialty-coffee-roasted-in-oman.webp',
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
