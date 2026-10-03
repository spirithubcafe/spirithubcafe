const normalizeSeoPath = (urlPath) => {
  let path = String(urlPath || '/').split('?')[0].split('#')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/^\/(om|sa)(?=\/|$)/, '') || '/';
  return path.replace(/\/+$/, '') || '/';
};

const PRIVATE_ROUTE_PREFIXES = Object.freeze([
  '/admin',
  '/profile',
  '/my-account',
  '/orders',
  '/order',
  '/order-detail',
  '/favorites',
  '/checkout',
  '/payment',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/wholesale',
  '/loyalty/signup',
]);

export const PRIVATE_ROBOTS_TAG = 'noindex, follow';

export const shouldNoindexRoute = (urlPath) => {
  const normalizedPath = normalizeSeoPath(urlPath);
  return PRIVATE_ROUTE_PREFIXES.some((prefix) =>
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );
};

