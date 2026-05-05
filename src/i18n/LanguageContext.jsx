import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const STORAGE_KEY = "maye-language";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = ["en", "ar", "he"];
const isValidLanguage = (value) => SUPPORTED_LANGUAGES.includes(value);

const LanguageContext = createContext(null);

function resolveValue(obj, key) {
  return key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object") return acc[part];
    return undefined;
  }, obj);
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = rawKey.trim();
    return vars[key] == null ? "" : String(vars[key]);
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isValidLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const dir = language === "en" ? "ltr" : "rtl";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const value = useMemo(() => {
    const safeSetLanguage = (nextLanguage) => {
      setLanguage((prev) => {
        const resolved =
          typeof nextLanguage === "function" ? nextLanguage(prev) : nextLanguage;
        return isValidLanguage(resolved) ? resolved : DEFAULT_LANGUAGE;
      });
    };

    const toggleLanguage = () => {
      safeSetLanguage((prev) => {
        if (prev === "en") return "ar";
        if (prev === "ar") return "he";
        return "en";
      });
    };

    const t = (key, vars) => {
      const current = translations[language] ?? translations.en;
      const fallback = translations.en;
      const hit = resolveValue(current, key);
      const fallbackHit = resolveValue(fallback, key);
      const text =
        typeof hit === "string"
          ? hit
          : typeof fallbackHit === "string"
            ? fallbackHit
            : key;
      return interpolate(text, vars);
    };

    return { language, setLanguage: safeSetLanguage, toggleLanguage, t, dir };
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
