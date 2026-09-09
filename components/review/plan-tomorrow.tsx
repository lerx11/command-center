"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { planTomorrowAction } from "@/app/app/review/actions";
import {
  ENERGY_CATEGORIES,
  ENERGY_CATEGORY_META,
  TASK_TYPE_META,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

const SLOTS = [
  { key: "big_win", label: "🎯 ONE BIG WIN" },
  { key: "money", label: "💰 MONEY" },
  { key: "asset", label: "🏗️ ASSET" },
];

export function PlanTomorrow({ candidates }: { candidates: Task[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = (fd: FormData) => {
    startTransition(async () => {
      const res = await planTomorrowAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Tomorrow planned ✓");
      router.push("/app/today");
    });
  };

  const selectClass =
    "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <form action={save} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {SLOTS.map((slot) => (
          <div key={slot.key} className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {slot.label}
            </label>
            <select
              name={slot.key}
              defaultValue="none"
              className={cn(selectClass)}
            >
              <option value="none">— None —</option>
              {candidates.map((t) => (
                <option key={t.id} value={t.id}>
                  {TASK_TYPE_META[t.type].emoji} {t.title}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ⚡ Energy ×3
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ENERGY_CATEGORIES.map((cat) => {
            const meta = ENERGY_CATEGORY_META[cat];
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  {meta.emoji} {meta.label}
                </p>
                <Input
                  name="energy_title"
                  placeholder={meta.placeholder}
                  className="h-9"
                />
                <input type="hidden" name="energy_category" value={cat} />
              </div>
            );
          })}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Planning…" : "Plan tomorrow"}
      </Button>
    </form>
  );
}
