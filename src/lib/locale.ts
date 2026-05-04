import { safeStorage } from './safeStorage';

export type ApiLanguage = 'en' | 'ar';

export const normalizeLocaleToApiLanguage = (locale?: string | null): ApiLanguage => {
  if (!locale) return 'en';
  const normalized = locale.trim().toLowerCase();
  if (normalized === 'ar' || normalized.startsWith('ar-') || normalized.startsWith('ar_')) {
    return 'ar';
  }
  return 'en';
};

export const resolveCurrentLocaleForApi = (): ApiLanguage => {
  const storedLanguage = safeStorage.getItem('spirithub-language');
  if (storedLanguage) {
    return normalizeLocaleToApiLanguage(storedLanguage);
  }

  const i18nextLanguage = safeStorage.getItem('i18nextLng');
  if (i18nextLanguage) {
    return normalizeLocaleToApiLanguage(i18nextLanguage);
  }

  if (typeof document !== 'undefined') {
    const docLang = document.documentElement?.lang;
    if (docLang) {
      return normalizeLocaleToApiLanguage(docLang);
    }
  }

  if (typeof navigator !== 'undefined') {
    return normalizeLocaleToApiLanguage(navigator.language);
  }

  return 'en';
};
