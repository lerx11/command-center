"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  TRANSLATIONS,
  type Locale,
} from "@/lib/i18n-shared";

type TFn = (key: string) => string;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (stored && LOCALES.includes(stored)) return stored;
  const nav = window.navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("ru") ? "ru" : "en";
}

function translateKey(locale: Locale, key: string): string {
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

export function I18nProvider({ children }: { children: ReactNode }) {
  // Start with the default locale on the server to avoid hydration mismatches,
  // then synchronise with the stored / detected locale on the client.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const next = detectInitialLocale();
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      // Keep the cookie in sync so Server Components / Server Actions read
      // the same locale without an extra round-trip.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = next;
    }
  }, []);

  const t = useCallback((key: string) => translateKey(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

/** Convenience hook returning just the translation function. */
export function useT(): TFn {
  return useI18n().t;
}
