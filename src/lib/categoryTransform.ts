import type { Category } from '../contexts/AppContextDefinition';
import type { Category as ApiCategory } from '../types/product';
import type { ProductsSsrBootstrap } from './productTransform';
import { getCategoryImageUrl } from './imageUtils.ts';

export const transformApiCategories = (apiCategories: ApiCategory[]) => {
  const sortedCategories = apiCategories
    .filter((category) => category.id !== null && category.id !== undefined && String(category.id) !== '')
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const allCategories: Category[] = sortedCategories.map((category) => ({
    id: String(category.id),
    slug: typeof category.slug === 'string' ? category.slug : undefined,
    name: String(category.name || category.nameAr || ''),
    nameAr: category.nameAr ? String(category.nameAr) : undefined,
    description: String(category.description || category.descriptionAr || ''),
    descriptionAr: category.descriptionAr ? String(category.descriptionAr) : undefined,
    image: getCategoryImageUrl(category.imagePath),
    displayOrder: typeof category.displayOrder === 'number' ? category.displayOrder : 0,
    taxPercentage: typeof category.taxPercentage === 'number' ? category.taxPercentage : 0,
  }));
  const categories = allCategories.filter((_category, index) => sortedCategories[index].isDisplayedOnHomepage);
  return { categories, allCategories };
};

export const resolveBootstrapCategories = (
  bootstrap: ProductsSsrBootstrap | undefined,
  currentRegionCode: string,
) => {
  if (!bootstrap || bootstrap.region !== currentRegionCode || !Array.isArray(bootstrap.categories)) {
    return { categories: [], allCategories: [] };
  }
  const apiCategories = bootstrap.categories.filter((value): value is ApiCategory =>
    typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'number' &&
    'name' in value && typeof value.name === 'string' &&
    'slug' in value && typeof value.slug === 'string',
  );
  return transformApiCategories(apiCategories);
};
