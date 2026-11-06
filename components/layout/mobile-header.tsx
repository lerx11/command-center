"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

export function MobileHeader() {
  const pathname = usePathname();
  const t = useT();
  const settingsActive =
    pathname === "/app/settings" || pathname.startsWith("/app/settings/");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <Link href="/app/today" prefetch className="flex flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("brand.command")}
        </span>
        <span className="text-base font-bold uppercase tracking-tight">
          {t("brand.center")}
        </span>
      </Link>
      <Link
        href="/app/settings"
        prefetch
        aria-label={t("nav.settings")}
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-colors",
          settingsActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        )}
      >
        <SettingsIcon className="size-5" />
      </Link>
    </header>
  );
}
