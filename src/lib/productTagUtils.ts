import type { ProductTagInfoDto, TagPosition } from '../types/productTag';

const unwrapValues = (value: unknown): unknown[] | undefined => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && '$values' in (value as Record<string, unknown>)) {
    const inner = (value as Record<string, unknown>).$values;
    return Array.isArray(inner) ? inner : undefined;
  }
  return undefined;
};

const normalizeTagPosition = (value: unknown, fallback: TagPosition): TagPosition => {
  return value === 'Top' || value === 'Bottom' ? value : fallback;
};

const normalizeProductTag = (
  value: unknown,
  fallbackPosition: TagPosition,
): ProductTagInfoDto | null => {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id);
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';

  if (!Number.isFinite(id) || !name) return null;

  return {
    id,
    name,
    nameAr: typeof raw.nameAr === 'string' && raw.nameAr.trim() ? raw.nameAr : undefined,
    position: normalizeTagPosition(raw.position, fallbackPosition),
    backgroundColor: typeof raw.backgroundColor === 'string' ? raw.backgroundColor : undefined,
    textColor: typeof raw.textColor === 'string' ? raw.textColor : undefined,
    icon: typeof raw.icon === 'string' ? raw.icon : undefined,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
  };
};

export const normalizeProductTags = (
  value: unknown,
  fallbackPosition: TagPosition,
): ProductTagInfoDto[] | undefined => {
  const tags = unwrapValues(value);
  if (!tags) return undefined;

  const normalized = tags
    .map((tag) => normalizeProductTag(tag, fallbackPosition))
    .filter((tag): tag is ProductTagInfoDto => tag !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return normalized.length > 0 ? normalized : undefined;
};
