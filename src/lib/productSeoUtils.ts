import type { Product } from '../types/product';

interface ProductSeoMetadata {
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  simpleTastingNotes: string;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1).trim() + '…';
};

/**
 * Strip HTML tags and clean text
 */
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract simple tasting notes from product
 */
const extractSimpleTastingNotes = (product: Product, language: 'en' | 'ar'): string => {
  const notes = language === 'ar' 
    ? (product.tastingNotesAr || product.notesAr || product.tastingNotes || product.notes)
    : (product.tastingNotes || product.notes || product.tastingNotesAr || product.notesAr);

  if (!notes) return '';

  // Strip HTML and clean
  const cleanNotes = stripHtml(notes);

  // Split by common separators
  const notesList = cleanNotes
    .split(/[,،;·|]/)
    .map(note => note.trim())
    .filter(note => note.length > 0 && note.length < 30); // Keep only reasonable length notes

  // Take first 3-5 notes
  const selectedNotes = notesList.slice(0, 5);

  return selectedNotes.join(', ');
};

/**
 * Generate SEO metadata for a product
 */
export const generateProductSeoMetadata = (
  product: Product,
  language: 'en' | 'ar' = 'en'
): ProductSeoMetadata => {
  const productName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const categoryName = product.category
    ? language === 'ar' && product.category.nameAr
      ? product.category.nameAr
      : product.category.name
    : '';

  // OG Title: max 60 characters
  const ogTitle = truncate(
    categoryName ? `${productName} - ${categoryName}` : productName,
    60
  );

  // Get description
  const rawDescription = language === 'ar' 
    ? (product.descriptionAr || product.description)
    : (product.description || product.descriptionAr);

  const cleanDescription = rawDescription ? stripHtml(rawDescription) : '';

  // Get simple tasting notes for inclusion
  const simpleTastingNotes = extractSimpleTastingNotes(product, language);

  // OG Description: max 140 characters - include tasting notes if available
  let ogDescription: string;
  if (cleanDescription && simpleTastingNotes) {
    const notesText = language === 'ar' 
      ? `نكهات: ${simpleTastingNotes}`
      : `Tasting notes of ${simpleTastingNotes}`;
    
    // Try to fit description + notes within 140 chars
    const descWithNotes = `${cleanDescription}. ${notesText}`;
    ogDescription = truncate(descWithNotes, 140);
  } else if (cleanDescription) {
    ogDescription = truncate(cleanDescription, 140);
  } else if (simpleTastingNotes) {
    const notesText = language === 'ar'
      ? `${productName}. نكهات: ${simpleTastingNotes}`
      : `${productName}. Tasting notes of ${simpleTastingNotes}`;
    ogDescription = truncate(notesText, 140);
  } else {
    ogDescription = language === 'ar'
      ? truncate(`${productName} من سبيريت هب كافيه. قهوة مختصة محمصة طازجة في عمان.`, 140)
      : truncate(`${productName} from Spirit Hub Cafe. Fresh roasted specialty coffee in Oman.`, 140);
  }

  // Twitter Title: same as ogTitle
  const twitterTitle = ogTitle;

  // Twitter Description: max 180 characters (more space than OG) - include more details
  let twitterDescription: string;
  if (cleanDescription && simpleTastingNotes) {
    const notesText = language === 'ar'
      ? `نكهات: ${simpleTastingNotes}`
      : `For filter, with tasting notes of ${simpleTastingNotes}`;
    
    const descWithNotes = `${cleanDescription}. ${notesText}`;
    twitterDescription = truncate(descWithNotes, 180);
  } else if (cleanDescription) {
    twitterDescription = truncate(cleanDescription, 180);
  } else if (simpleTastingNotes) {
    const notesText = language === 'ar'
      ? `${productName} من سبيريت هب كافيه. نكهات: ${simpleTastingNotes}`
      : `${productName} from Spirit Hub Cafe. For filter, with tasting notes of ${simpleTastingNotes}`;
    twitterDescription = truncate(notesText, 180);
  } else {
    twitterDescription = language === 'ar'
      ? truncate(
          `${productName} من سبيريت هب كافيه. قهوة مختصة محمصة طازجة في مسقط، عمان. توصيل سريع وجودة مضمونة.`,
          180
        )
      : truncate(
          `${productName} from Spirit Hub Cafe. Fresh roasted specialty coffee in Muscat, Oman. Fast delivery, guaranteed quality.`,
          180
        );
  }

  return {
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    simpleTastingNotes,
  };
};

/**
 * Generate product share text for social media
 */
export const generateProductShareText = (
  product: Product,
  language: 'en' | 'ar' = 'en'
): string => {
  const productName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const metadata = generateProductSeoMetadata(product, language);

  if (language === 'ar') {
    const notes = metadata.simpleTastingNotes
      ? ` 🌟 نكهات: ${metadata.simpleTastingNotes}`
      : '';
    return `☕ ${productName}\n\n${metadata.twitterDescription}${notes}`;
  }

  const notes = metadata.simpleTastingNotes
    ? ` 🌟 Tasting Notes: ${metadata.simpleTastingNotes}`
    : '';
  return `☕ ${productName}\n\n${metadata.twitterDescription}${notes}`;
};
