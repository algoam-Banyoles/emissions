import i18n, { languageToLocale } from "@/i18n/config";

function currentLocale() {
  return languageToLocale(i18n.language);
}

export function formatDate(value: Date | string | number) {
  return new Intl.DateTimeFormat(currentLocale()).format(new Date(value));
}

export function formatDateTime(value: Date | string | number) {
  return new Intl.DateTimeFormat(currentLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatNumber(value: number, fractionDigits = 2) {
  return new Intl.NumberFormat(currentLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat(currentLocale(), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUnit(value: number, unit: "kilometer" | "meter" | "ton" | "kilogram") {
  return new Intl.NumberFormat(currentLocale(), {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: 2,
  }).format(value);
}
