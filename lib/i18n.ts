import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  TRANSLATIONS,
  detectBrowserLocale,
  translate as sharedTranslate,
  type Locale,
} from "@/lib/i18n-shared";

export type { Locale } from "@/lib/i18n-shared";
export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  TRANSLATIONS,
  detectBrowserLocale,
  sharedTranslate as translate,
};

/**
 * Resolve the locale on the server: cookie → Accept-Language → default.
 * The cookie is kept in sync with localStorage by the client I18nProvider.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (fromCookie && LOCALES.includes(fromCookie)) return fromCookie;

  const hdrs = await headers();
  const acceptLanguage = hdrs.get("accept-language");
  return detectBrowserLocale(acceptLanguage);
}

/**
 * Server-side translation function. Use in Server Components / Server Actions.
 * Falls back to the default locale's string, then to the key itself.
 */
export async function getT() {
  const locale = await getLocale();
  const dict = TRANSLATIONS[locale];
  const t = (key: string): string => {
    const value = getNested(dict, key);
    if (typeof value === "string") return value;
    const fallback = getNested(TRANSLATIONS[DEFAULT_LOCALE], key);
    if (typeof fallback === "string") return fallback;
    return key;
  };
  return { locale, t };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNested(obj: any, path: string): unknown {
  return path
    .split(".")
    .reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}
