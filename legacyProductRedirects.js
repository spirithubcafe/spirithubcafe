export const OMAN_LEGACY_PRODUCT_REDIRECTS = Object.freeze([
  ['/om/products/spirithub-experience-box-ufo-drip-coffee-collection', '/om/products/ufo-drip-coffee-spirithub-experience-box-7-disk-collection'],
  ['/om/products/costa-rica-ohban-gesha-anaerobic-honey-163', '/om/products/costa-rica-ohban-geisha-anaerobic-honey-163'],
  ['/om/products/ufo-drip-coffee-brazil-catuai-natural-7-drip-box', '/om/products/ufo-drip-coffee-brazil-catuai-natural-7-drip-bags'],
  ['/om/products/ufo-drip-coffee-ethiopia-halo-hartume-natural-7-drip-box', '/om/products/ufo-drip-coffee-ethiopia-halo-hartume-natural-7-drip-bags'],
  ['/om/products/ufo-drip-coffee-yemen-odaini-anaerobic-7-drip-box', '/om/products/ufo-drip-coffee-yemen-odaini-anaerobic-7-drip-bags'],
  ['/om/products/ufo-drip-coffee-yunnan-dehong-catimor-7-drip-box', '/om/products/ufo-drip-coffee-yunnan-dehong-catimor-7-drip-bags'],
  ['/om/products/ufo-drip-coffee-colombia-pink-bourbon-honey-7-drip-box', '/om/products/ufo-drip-coffee-colombia-pink-bourbon-honey-7-drip-bags'],
  ['/om/products/ufo-drip-coffee-ethiopia-gargari-gutity-yirgacheffe-7-drip-box', '/om/products/ufo-drip-coffee-ethiopia-gargari-gutity-yirgacheffe-7-drip-bags'],
  ['/om/products/yemen-odaini-anaerobic-natural', '/om/products/yemen-odaini-anaerobic-natural-spirithub-exclusive-lot'],
].map(([source, destination]) => Object.freeze({ source, destination })));

export const getLegacyProductRedirect = (url) => {
  const queryStart = url.indexOf('?');
  const pathname = (queryStart === -1 ? url : url.slice(0, queryStart)).replace(/\/$/, '');
  const match = OMAN_LEGACY_PRODUCT_REDIRECTS.find(({ source }) => source === pathname);
  return match ? match.destination + (queryStart === -1 ? '' : url.slice(queryStart)) : null;
};
