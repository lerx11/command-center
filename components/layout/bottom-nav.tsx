"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Crosshair, FolderKanban, ParkingSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app/today", label: "Today", icon: CalendarCheck },
  { href: "/app/focus", label: "Focus", icon: Crosshair },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/parking", label: "Parking", icon: ParkingSquare },
];

export function BottomNav() {
  const pathname = usePathname();

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
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
