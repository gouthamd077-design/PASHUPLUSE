import React, { createContext, useContext, useState } from 'react';
import en from './en.json';
import hi from './hi.json';
import kn from './kn.json';

const translations = { en, hi, kn };

const I18nContext = createContext({
  language: 'kn',
  setLanguage: () => {},
  t: (key) => key,
  getLocalized: (obj) => '',
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('pashupulse_lang') || 'kn';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('pashupulse_lang', lang);
  };

  const t = (key) => {
    const dict = translations[language] || translations.kn || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.kn || obj.en || Object.values(obj)[0] || '';
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, getLocalized }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
