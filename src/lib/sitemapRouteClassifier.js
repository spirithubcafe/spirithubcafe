const normalizeSlug = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const normalizeId = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const createShopCategoryLookup = (shopCategories) => {
  const ids = new Set();
  const slugs = new Set();

  for (const category of Array.isArray(shopCategories) ? shopCategories : []) {
    const id = normalizeId(category?.id);
    const slug = normalizeSlug(category?.slug || category?.categorySlug);
    if (id !== null) ids.add(id);
    if (slug) slugs.add(slug);
  }

  return { ids, slugs };
};

const isLookupShopCategory = (lookup, category) => {
  const id = normalizeId(category?.id);
  const slug = normalizeSlug(category?.slug || category?.categorySlug);
  return (id !== null && lookup.ids.has(id)) || Boolean(slug && lookup.slugs.has(slug));
};

export const getOmanSitemapCategoryPath = (category, shopCategoryLookup) => {
  const slug = normalizeSlug(category?.slug || category?.categorySlug);
  if (!slug || !isLookupShopCategory(shopCategoryLookup, category)) {
    return null;
  }
  return `/om/shop/${slug}`;
};

export const getOmanSitemapProductPath = (product, shopCategoryLookup) => {
  const slugOrId = normalizeSlug(product?.slug || product?.productSlug || product?.id);
  if (!slugOrId) {
    return null;
  }

  const categoryId = normalizeId(product?.categoryId || product?.category?.id);
  const categorySlug = normalizeSlug(product?.category?.slug || product?.categorySlug);
  const isShopProduct =
    (categoryId !== null && shopCategoryLookup.ids.has(categoryId)) ||
    Boolean(categorySlug && shopCategoryLookup.slugs.has(categorySlug));

  return isShopProduct ? `/om/shop/product/${slugOrId}` : `/om/products/${slugOrId}`;
};
