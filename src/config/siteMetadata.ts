export const siteMetadata = {
  siteName: 'Spirit Hub Cafe',
  baseUrl: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://spirithubcafe.com',
  defaultTitle: 'Spirit Hub Cafe | Specialty Coffee in Oman',
  defaultDescription:
    'Spirit Hub Cafe roasts and serves specialty coffee in Oman with curated beans, expertly trained baristas, and slow-crafted experiences that celebrate Arabic hospitality.',
  defaultDescriptionAr:
    'سبيريت هب كافيه يقدم قهوة متخصصة محمصة محلياً في عمان مع حبوب مختارة بعناية وتجارب ضيافة عربية معاصرة.',
  defaultKeywords: [
    'Spirit Hub Cafe',
    'specialty coffee Oman',
    'coffee roastery Muscat',
    'سبيريت هب',
    'قهوة مختصة مسقط',
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
