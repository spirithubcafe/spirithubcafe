export const siteMetadata = {
  siteName: 'Spirit Hub Cafe',
  baseUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://spirithubcafe.com',
  defaultTitle: 'Spirit Hub Cafe | Premium Specialty Coffee Roastery in Muscat, Oman',
  defaultDescription:
    'Spirit Hub Cafe - Muscat\'s premier specialty coffee roastery. Fresh roasted single-origin beans, artisan coffee blends, brewing equipment, and coffee subscriptions. Expert Q Graders, Arabic hospitality, and exceptional coffee experiences in Oman.',
  defaultDescriptionAr:
    'سبيريت هب كافيه - أفضل محمصة قهوة مختصة في مسقط. حبوب قهوة طازجة محمصة، خلطات قهوة حرفية، معدات تحضير القهوة، واشتراكات القهوة. خبراء معتمدون وضيافة عربية أصيلة في عمان.',
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
    const base = siteMetadata.baseUrl || window.location.origin;
    return new URL(relativeOrAbsolute, base).toString();
  } catch {
    return relativeOrAbsolute;
  }
};
