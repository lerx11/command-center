"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Crosshair, FolderKanban, Map, ParkingSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";
import { useFocusSession } from "@/components/focus/focus-session-provider";

const ITEMS = [
  { href: "/app/today", key: "nav.today", icon: CalendarCheck },
  { href: "/app/focus", key: "nav.focus", icon: Crosshair },
  { href: "/app/workspace", key: "nav.workspace", icon: Map },
  { href: "/app/projects", key: "nav.projects", icon: FolderKanban },
  { href: "/app/parking", key: "nav.parking", icon: ParkingSquare },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const { session } = useFocusSession();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          // Show a green dot on Focus if there's an active session
          const showActiveDot =
            item.href === "/app/focus" && session && !session.isPaused;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                prefetch
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="size-5" />
                  {showActiveDot && (
                    <span className="absolute -right-1 -top-0.5 flex size-2">
                      <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
