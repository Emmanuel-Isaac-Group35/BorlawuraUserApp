import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import messages from './local/index';

let languageCode = 'en';

// Try to get device language
try {
  const { getLocales } = require('expo-localization');
  if (getLocales && typeof getLocales === 'function') {
    const locales = getLocales();
    if (locales && Array.isArray(locales) && locales.length > 0) {
      const firstLocale = locales[0];
      if (firstLocale && firstLocale.languageCode) {
        languageCode = firstLocale.languageCode;
      }
    }
  }
} catch (e) {
  // Use default language if expo-localization fails
}

// Initialize i18n with default values
const defaultResources = messages || { en: { translation: {} } };

i18n
  .use(initReactI18next)
  .init({
    lng: languageCode,
    fallbackLng: 'en',
    debug: false,
    resources: defaultResources,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
  });

export default i18n;
