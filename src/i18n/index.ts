import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';

// Available languages
export const languages = {
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'French', nativeName: 'Français' },
  zh: { name: 'Chinese', nativeName: '中文' }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      zh: { translation: zh }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'zh'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'navigator', 'localStorage', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      cookieMinutes: 10080 // 7 days
    }
  });

// Utility function to change language
export const changeLanguage = (lang: keyof typeof languages) => {
  return i18n.changeLanguage(lang);
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Get language name in native format
export const getLanguageName = (lang: string) => {
  return languages[lang as keyof typeof languages]?.nativeName || lang;
};

export default i18n;