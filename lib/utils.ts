import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n-shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
};

const MONEY_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
};

export function formatDate(date: Date | string, locale: Locale = "ru") {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(DATE_LOCALE[locale] ?? "ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayISO() {
  // Local date in YYYY-MM-DD (not UTC) — matches the daily_plans.date column.
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatMoney(
  amount: number | null | undefined,
  locale: Locale = "ru"
) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat(MONEY_LOCALE[locale] ?? "ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}
