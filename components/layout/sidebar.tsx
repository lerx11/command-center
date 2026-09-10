"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Crosshair,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Map,
  ParkingSquare,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

const ITEMS = [
  { href: "/app/today", key: "nav.today", icon: CalendarCheck },
  { href: "/app/workspace", key: "nav.workspace", icon: Map },
  { href: "/app/focus", key: "nav.focus", icon: Crosshair },
  { href: "/app/projects", key: "nav.projects", icon: FolderKanban },
  { href: "/app/parking", key: "nav.parking", icon: ParkingSquare },
  { href: "/app/review", key: "nav.review", icon: ListChecks },
  { href: "/app/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
] as const;

export function Sidebar({ profileName }: { profileName: string }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 md:flex">
      <div className="px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("brand.command")}
        </p>
        <p className="text-lg font-bold uppercase tracking-tight">{t("brand.center")}</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border/60 px-3 py-4">
        <Link
          href="/app/settings"
          prefetch
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/app/settings"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          <SettingsIcon className="size-4" />
          {t("nav.settings")}
        </Link>
        <p className="mt-3 truncate px-3 text-xs text-muted-foreground">
          {profileName}
        </p>
      </div>
    </aside>
  );
}
