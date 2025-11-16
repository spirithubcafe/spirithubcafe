import type { Product } from '../types/product';

interface ProductSeoMetadata {
  ogDescription: string;
  simpleTastingNotes: string;
}

const truncate = (text: string, max: number) => text.length <= max ? text : text.substring(0, max - 1).trim() + '…';

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const extractTastingNotes = (product: Product, lang: 'en' | 'ar'): string => {
  const notes = lang === 'ar' 
    ? (product.tastingNotesAr || product.notesAr || product.tastingNotes || product.notes)
    : (product.tastingNotes || product.notes);

  if (!notes) return '';
  
  return stripHtml(notes)
    .split(/[,،;·|]/)
    .map(n => n.trim())
    .filter(n => n.length > 0 && n.length < 30)
    .slice(0, 5)
    .join(', ');
};

const buildDescription = (base: string, notes: string, lang: 'en' | 'ar', max: number): string => {
  if (!notes) return truncate(base, max);
  const prefix = lang === 'ar' ? 'نكهات:' : 'For filter, with tasting notes of';
  return truncate(`${base}. ${prefix} ${notes}`, max);
};

export const generateProductSeoMetadata = (product: Product, lang: 'en' | 'ar' = 'en'): ProductSeoMetadata => {
  const desc = stripHtml((lang === 'ar' ? product.descriptionAr : product.description) || '');
  const notes = extractTastingNotes(product, lang);
  const name = (lang === 'ar' && product.nameAr) ? product.nameAr : product.name;
  
  const fallback = lang === 'ar'
    ? `${name} من سبيريت هب كافيه. قهوة مختصة محمصة طازجة في عمان`
    : `${name} from Spirit Hub Cafe. Fresh roasted specialty coffee in Oman`;

  return {
    ogDescription: buildDescription(desc || fallback, notes, lang, 160),
    simpleTastingNotes: notes,
  };
};
