// Translation resources - manually import translation files
import enTranslations from './en/translations';

const messages: Record<string, { translation: Record<string, string> }> = {
  en: { translation: enTranslations || {} },
  // Add more languages as needed
};

export default messages;
