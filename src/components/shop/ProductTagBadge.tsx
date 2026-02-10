import type { ProductTagInfoDto } from '../../types/productTag';
import { useApp } from '../../hooks/useApp';

interface Props {
  tag: ProductTagInfoDto;
  size?: 'sm' | 'md';
}

export const ProductTagBadge = ({ tag, size = 'sm' }: Props) => {
  const { language } = useApp();
  const name = language === 'ar' && tag.nameAr ? tag.nameAr : tag.name;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: tag.backgroundColor || '#6B7280',
        color: tag.textColor || '#FFFFFF',
      }}
    >
      {tag.icon && <span>{tag.icon}</span>}
      {name}
    </span>
  );
};
