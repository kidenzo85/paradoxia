import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage, getCurrentLanguage } from '../../i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    changeLanguage(newLang as keyof typeof languages);
    
    // Update URL parameter for sharing
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <select
      value={currentLang}
      onChange={handleLanguageChange}
      className={`bg-transparent text-gray-300 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
        currentLang === 'ar' ? 'text-right' : 'text-left'
      }`}
      title="Select language"
      style={{ colorScheme: 'dark' }}
    >
      {Object.entries(languages).map(([code, { nativeName }]) => (
        <option
          key={code}
          value={code}
          className="bg-gray-900 text-white"
        >
          {nativeName}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;