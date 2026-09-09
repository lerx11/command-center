"use client";

import Link from "next/link";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import type { Task } from "@/lib/types";

export function CurrentFocus({
  todayTasks,
}: {
  todayTasks: Task[];
}) {
  const t = useT();
  if (todayTasks.length === 0) return null;
  const first = todayTasks[0];

  return (
    <Link
      href={`/app/focus?task=${encodeURIComponent(first.id)}&mode=pomodoro`}
      prefetch
      className="block"
    >
      <div className="group flex items-center justify-center gap-3 rounded-xl border border-foreground/20 bg-foreground text-background transition-transform hover:scale-[1.01] active:scale-[0.99]">
        <Crosshair className="size-5" />
        <span className="py-5 text-base font-semibold uppercase tracking-wider">
          {t("today.startFocus")}
        </span>
      </div>
    </Link>
  );
}
