"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Crosshair, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskMenu } from "@/components/tasks/task-menu";
import { TaskPicker } from "./task-picker";
import { setTaskStatusAction, clearDailyPlanSlotAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Project, Task } from "@/lib/types";

type Slot = "big_win" | "money" | "asset";

export function TodaySlotCard({
  slot,
  task,
  candidates,
  projects,
  emphasize,
}: {
  slot: Slot;
  task: Task | null;
  candidates: Task[];
  projects: Project[];
  emphasize?: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  const labelKey =
    slot === "big_win"
      ? "today.oneBigWin"
      : slot === "money"
      ? "today.money"
      : "today.asset";
  const emoji = slot === "big_win" ? "🎯" : slot === "money" ? "💰" : "🏗️";

  const complete = () => {
    const fd = new FormData();
    fd.set("id", task!.id);
    fd.set("status", "DONE");
    startTransition(async () => {
      const res = await setTaskStatusAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.done"));
    });
  };

  const clear = () => {
    const fd = new FormData();
    fd.set("slot", slot);
    startTransition(async () => {
      const res = await clearDailyPlanSlotAction(fd);
      if (res?.error) toast.error(t(res.error));
    });
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-card p-5 transition-all ${
        emphasize
          ? "border-foreground/20 shadow-lg"
          : "border-border/60 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {emoji} {t(labelKey)}
        </p>
        {task && (
          <button
            onClick={clear}
            disabled={pending}
            aria-label={t("today.removeFromToday")}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {task ? (
        <>
          <p className="mt-3 text-lg font-semibold leading-snug">
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/app/focus?task=${task.id}`}>
                <Crosshair className="size-4" /> {t("common.focus")}
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={complete}
              disabled={pending}
            >
              <Check className="size-4" /> {t("common.done")}
            </Button>
            <TaskMenu task={task} projects={projects} withEditButton={false} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">
            {slot === "big_win"
              ? t("today.bigWinHint")
              : slot === "money"
              ? t("today.moneyHint")
              : t("today.assetHint")}
          </p>
          <TaskPicker
            slot={slot}
            candidates={candidates}
            trigger={
              <Button size="sm" variant="outline" className="mt-4 w-full">
                {t("common.choose")}
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}
