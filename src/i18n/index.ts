import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import es from './locales/es.json';

// Available languages
export const languages = {
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'French', nativeName: 'Français' },
  zh: { name: 'Chinese', nativeName: '中文' },
  ar: { name: 'Arabic', nativeName: 'العربية' },
  es: { name: 'Spanish', nativeName: 'Español' }
};

// Function to detect user's preferred language
const detectUserLanguage = (): string => {
  // 1. Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && Object.keys(languages).includes(langParam)) {
    return langParam;
  }

  // 2. Check localStorage
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang && Object.keys(languages).includes(savedLang)) {
    return savedLang;
  }

  // 3. Check browser language with fallbacks
  const browserLangs = navigator.languages || [navigator.language];
  
  for (const browserLang of browserLangs) {
    // Extract language code (e.g., 'fr-FR' -> 'fr')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Direct match
    if (Object.keys(languages).includes(langCode)) {
      return langCode;
    }
    
    // Special cases for language variants
    const languageMap: Record<string, string> = {
      'zh-cn': 'zh',
      'zh-tw': 'zh',
      'zh-hk': 'zh',
      'ar-sa': 'ar',
      'ar-eg': 'ar',
      'es-es': 'es',
      'es-mx': 'es',
      'es-ar': 'es',
      'en-us': 'en',
      'en-gb': 'en',
      'fr-fr': 'fr',
      'fr-ca': 'fr'
    };
    
    const mappedLang = languageMap[browserLang.toLowerCase()];
    if (mappedLang && Object.keys(languages).includes(mappedLang)) {
      return mappedLang;
    }
  }

  // 4. Default fallback
  return 'fr';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      zh: { translation: zh },
      ar: { translation: ar },
      es: { translation: es }
    },
    lng: detectUserLanguage(),
    fallbackLng: ['fr', 'en'],
    supportedLngs: Object.keys(languages),
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      caches: ['localStorage'],
      cookieMinutes: 10080, // 7 days
      checkWhitelist: true
    }
  });

// Utility function to change language
export const changeLanguage = (lang: keyof typeof languages) => {
  localStorage.setItem('i18nextLng', lang);
  document.documentElement.lang = lang;
  
  // Update HTML direction for RTL languages
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
  
  return i18n.changeLanguage(lang);
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language.split('-')[0];
};

// Get language name in native format
export const getLanguageName = (lang: string) => {
  return languages[lang as keyof typeof languages]?.nativeName || lang;
};

// Initialize HTML attributes on load
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  if (lng === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
});

export default i18n;