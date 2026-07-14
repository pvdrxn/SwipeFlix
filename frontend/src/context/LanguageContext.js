import React, { createContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { t as translate } from "../i18n";
import { setTmdbLanguage } from "../services/tmdb";

const LANGUAGE_KEY = "@swipeflix_language";

export const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, params) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored && ["en", "es", "ru"].includes(stored)) {
        setLanguageState(stored);
        setTmdbLanguage(stored);
      }
    }).catch(() => {});
  }, []);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    setTmdbLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
  }, []);

  const t = useCallback((key, params = {}) => {
    return translate(key, language, params);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
