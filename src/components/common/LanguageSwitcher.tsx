import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage, getCurrentLanguage, getLanguageName } from '../../i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    changeLanguage(newLang as keyof typeof languages);
  };

  return (
    <select
      value={currentLang}
      onChange={handleLanguageChange}
      className="bg-transparent text-gray-300 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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