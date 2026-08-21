"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n/types";

const STORAGE_KEY = "cut-salon-lang";

type LanguageContextValue = {
  lang: Language;
  setLang: (language: Language) => void;
  isArabic: boolean;
  dir: "rtl" | "ltr";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (storedLanguage === "ar" || storedLanguage === "en") {
      setLang(storedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang: (language: Language) => {
      window.localStorage.setItem(STORAGE_KEY, language);
      setLang(language);
    },
    isArabic: lang === "ar",
    dir: lang === "ar" ? "rtl" as const : "ltr" as const,
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
