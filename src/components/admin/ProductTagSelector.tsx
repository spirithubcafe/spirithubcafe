import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../hooks/useApp';
import { productTagService } from '../../services/productTagService';
import type { ProductTagListDto, ProductTagInfoDto } from '../../types/productTag';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { RefreshCw, Tag } from 'lucide-react';

interface Props {
  /** When editing an existing product, pass its ID to load current assignments */
  productId?: number;
  /** Controlled value — array of selected tag IDs */
  selectedTagIds: number[];
  /** Called whenever the selection changes */
  onChange: (tagIds: number[]) => void;
}

export const ProductTagSelector: React.FC<Props> = ({
  productId,
  selectedTagIds,
  onChange,
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [allTags, setAllTags] = useState<ProductTagListDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tags, assigned] = await Promise.all([
        productTagService.getAll(),
        productId ? productTagService.getProductTags(productId) : Promise.resolve([]),
      ]);
      setAllTags(Array.isArray(tags) ? tags.filter((t) => t.isActive) : []);

      // If we loaded existing assignments and there's no pre-existing selection, set them
      if (productId && assigned.length > 0 && selectedTagIds.length === 0) {
        onChange(assigned.map((t: ProductTagInfoDto) => t.id));
      }
    } catch (err) {
      console.error('[ProductTagSelector]', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggle = useCallback(
    (id: number) => {
      const next = selectedTagIds.includes(id)
        ? selectedTagIds.filter((x) => x !== id)
        : [...selectedTagIds, id];
      onChange(next);
    },
    [selectedTagIds, onChange],
  );

  const topTags = allTags.filter((t) => t.positionValue === 0);
  const bottomTags = allTags.filter((t) => t.positionValue === 1);

  const renderGroup = (title: string, tags: ProductTagListDto[]) => {
    if (tags.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-stone-500">{title}</span>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            const name = isArabic && tag.nameAr ? tag.nameAr : tag.name;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium border-2 transition-all ${
                  selected
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: tag.backgroundColor || '#6B7280',
                  color: tag.textColor || '#FFFFFF',
                }}
              >
                {tag.icon && <span>{tag.icon}</span>}
                {name}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <RefreshCw className="h-4 w-4 animate-spin text-stone-400" />
        <span className="text-sm text-stone-400">
          {isArabic ? 'در حال بارگذاری تاج‌ها...' : 'Loading tags...'}
        </span>
      </div>
    );
  }

  if (allTags.length === 0) {
    return (
      <p className="text-sm text-stone-400 py-2">
        {isArabic ? 'هنوز تاجی ایجاد نشده' : 'No active tags available'}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 p-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-amber-600" />
        <Label className="text-sm font-semibold">
          {isArabic ? '🏷️ تاج‌های محصول' : '🏷️ Product Tags'}
        </Label>
        {selectedTagIds.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedTagIds.length} {isArabic ? 'انتخاب شده' : 'selected'}
          </Badge>
        )}
      </div>
      {renderGroup(isArabic ? '⬆️ بالا' : '⬆️ Top', topTags)}
      {renderGroup(isArabic ? '⬇️ پایین' : '⬇️ Bottom', bottomTags)}
    </div>
  );
};
