import ru from "@/locales/ru.json";
import en from "@/locales/en.json";

export type Locale = "ru" | "en";

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALES: Locale[] = ["ru", "en"];

export const TRANSLATIONS: Record<Locale, typeof ru> = {
  ru: ru as typeof ru,
  en: en as typeof en,
};

export const LOCALE_COOKIE = "locale";
export const LOCALE_STORAGE_KEY = "cc-locale";

/**
 * Detect locale from Accept-Language header. Russian if the primary
 * language starts with "ru", otherwise English.
 */
export function detectBrowserLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const primary = acceptLanguage.split(",")[0]?.trim() ?? "";
  return primary.toLowerCase().startsWith("ru") ? "ru" : "en";
}

/** Synchronous translation helper for Server Actions / any context with a known locale. */
export function translate(locale: Locale, key: string): string {
  const dict = TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];
  const value = getNested(dict, key);
  if (typeof value === "string") return value;
  const fallback = getNested(TRANSLATIONS[DEFAULT_LOCALE], key);
  if (typeof fallback === "string") return fallback;
  return key;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNested(obj: any, path: string): unknown {
  return path
    .split(".")
    .reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}
