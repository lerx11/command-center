"use client";

import Link from "next/link";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";

export function CurrentFocus({
  todayTasks,
}: {
  todayTasks: Task[];
}) {
  if (todayTasks.length === 0) return null;
  const first = todayTasks[0];

  return (
    <Link href={`/app/focus?task=${first.id}`} className="block">
      <div className="group flex items-center justify-center gap-3 rounded-xl border border-foreground/20 bg-foreground text-background transition-transform hover:scale-[1.01] active:scale-[0.99]">
        <Crosshair className="size-5" />
        <span className="py-5 text-base font-semibold uppercase tracking-wider">
          Start focus
        </span>
      </div>
    </Link>
  );
}
