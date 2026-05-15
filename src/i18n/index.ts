import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from './locales/ar.json';
import en from './locales/en.json';

const getInitialLanguage = (): 'ar' | 'en' => {
  if (typeof window !== 'undefined') {
    const ssrLang = (window as unknown as Record<string, unknown>).__SSR_LANGUAGE__;
    if (ssrLang === 'ar' || ssrLang === 'en') {
      return ssrLang;
    }
  }

  return 'ar';
};

const resources = {
  ar: {
    translation: ar
  },
  en: {
    translation: en
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'ar',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;