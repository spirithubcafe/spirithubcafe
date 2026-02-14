import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';

const resources = {
  ar: {
    translation: ar
  },
  en: {
    translation: en
  }
};

// NOTE: LanguageDetector is intentionally NOT used here to avoid SSR/client
// hydration mismatches (React error #418). The saved language preference is
// restored after hydration in AppContext via safeStorage.
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Arabic as default language – deterministic for SSR & client
    fallbackLng: 'ar',
    
    interpolation: {
      escapeValue: false
    },
  });

export default i18n;