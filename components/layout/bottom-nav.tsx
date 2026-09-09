"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Crosshair, FolderKanban, ParkingSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

const ITEMS = [
  { href: "/app/today", key: "nav.today", icon: CalendarCheck },
  { href: "/app/focus", key: "nav.focus", icon: Crosshair },
  { href: "/app/projects", key: "nav.projects", icon: FolderKanban },
  { href: "/app/parking", key: "nav.parking", icon: ParkingSquare },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
