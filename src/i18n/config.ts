import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ca from "@/i18n/locales/ca.json";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";

export const supportedLanguages = ["ca", "es", "en", "fr"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const LANGUAGE_STORAGE_KEY = "emissionsv2.language";

function resolveInitialLanguage(): SupportedLanguage {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }

  const fromBrowser = window.navigator.language.toLowerCase().split("-")[0];
  if (supportedLanguages.includes(fromBrowser as SupportedLanguage)) {
    return fromBrowser as SupportedLanguage;
  }

  return "ca";
}

void i18n.use(initReactI18next).init({
  resources: {
    ca: { translation: ca },
    es: { translation: es },
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: "ca",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lang) => {
  if (supportedLanguages.includes(lang as SupportedLanguage)) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }
});

export function getLanguageForApi(): SupportedLanguage {
  const lang = i18n.language.toLowerCase().split("-")[0];
  if (supportedLanguages.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  return "ca";
}

export function languageToLocale(lang: string): string {
  switch (lang) {
    case "es":
      return "es-ES";
    case "en":
      return "en-US";
    case "fr":
      return "fr-FR";
    case "ca":
    default:
      return "ca-ES";
  }
}

export default i18n;
