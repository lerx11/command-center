"use client";

import { useI18n } from "./i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n-shared";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
};

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="mr-2 text-xs text-muted-foreground">
        {t("language.title")}
      </span>
      <div
        role="radiogroup"
        aria-label={t("language.title")}
        className="inline-flex items-center rounded-md border border-border/60 p-0.5"
      >
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLocale(l)}
              className={cn(
                "min-w-9 rounded-[5px] px-2.5 py-1 text-xs font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {LABELS[l]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
