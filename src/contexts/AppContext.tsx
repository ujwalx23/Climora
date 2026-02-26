import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getDirection } from '@/lib/i18n';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('rim-lang') as Language) || 'en';
  });
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('rim-theme') === 'dark';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rim-lang', lang);
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      localStorage.setItem('rim-theme', !prev ? 'dark' : 'light');
      return !prev;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const dir = getDirection(language);
    document.body.setAttribute('dir', dir);
  }, [language]);

  return (
    <AppContext.Provider value={{ language, setLanguage, isDark, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
