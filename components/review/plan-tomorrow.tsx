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
import { useT } from "@/components/i18n/i18n-provider";
import type { Task } from "@/lib/types";

const SLOTS = [
  { key: "big_win", labelKey: "today.oneBigWin" },
  { key: "money", labelKey: "today.money" },
  { key: "asset", labelKey: "today.asset" },
] as const;

export function PlanTomorrow({ candidates }: { candidates: Task[] }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = (fd: FormData) => {
    startTransition(async () => {
      const res = await planTomorrowAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      toast.success(t("toasts.tomorrowPlanned"));
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
              {t(slot.labelKey)}
            </label>
            <select
              name={slot.key}
              defaultValue="none"
              className={cn(selectClass)}
            >
              <option value="none">{t("common.none")}</option>
              {candidates.map((task) => (
                <option key={task.id} value={task.id}>
                  {TASK_TYPE_META[task.type].emoji} {task.title}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("review.energyX3")}
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
        {pending ? t("review.planning") : t("review.planTomorrow")}
      </Button>
    </form>
  );
}
