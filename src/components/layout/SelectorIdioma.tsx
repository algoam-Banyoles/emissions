import { useTranslation } from "react-i18next";

import { supportedLanguages, type SupportedLanguage } from "@/i18n/config";

const flags: Record<SupportedLanguage, string> = {
  ca: "CA",
  es: "ES",
  en: "EN",
  fr: "FR",
};

export function SelectorIdioma() {
  const { i18n, t } = useTranslation();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span>{t("language.label")}</span>
      <select
        className="h-9 rounded-md border px-2"
        value={i18n.language.split("-")[0]}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {flags[lang]} · {t(`language.${lang}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
