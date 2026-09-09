"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Crosshair, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskMenu } from "@/components/tasks/task-menu";
import { TaskPicker } from "./task-picker";
import { setTaskStatusAction, clearDailyPlanSlotAction } from "@/app/app/tasks/actions";
import type { Project, Task } from "@/lib/types";

type Slot = "big_win" | "money" | "asset";

const SLOT_META: Record<Slot, { label: string; emoji: string }> = {
  big_win: { label: "ONE BIG WIN", emoji: "🎯" },
  money: { label: "MONEY", emoji: "💰" },
  asset: { label: "ASSET", emoji: "🏗️" },
};

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
  const [pending, startTransition] = useTransition();
  const meta = SLOT_META[slot];

  const complete = () => {
    const fd = new FormData();
    fd.set("id", task!.id);
    fd.set("status", "DONE");
    startTransition(async () => {
      const res = await setTaskStatusAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Done ✓");
    });
  };

  const clear = () => {
    const fd = new FormData();
    fd.set("slot", slot);
    startTransition(async () => {
      const res = await clearDailyPlanSlotAction(fd);
      if (res?.error) toast.error(res.error);
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
          {meta.emoji} {meta.label}
        </p>
        {task && (
          <button
            onClick={clear}
            disabled={pending}
            aria-label="Remove from today"
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
                <Crosshair className="size-4" /> Focus
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={complete}
              disabled={pending}
            >
              <Check className="size-4" /> Done
            </Button>
            <TaskMenu task={task} projects={projects} withEditButton={false} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">
            {slot === "big_win"
              ? "What single task makes today a win?"
              : slot === "money"
              ? "What action moves money forward?"
              : "What asset are you building today?"}
          </p>
          <TaskPicker
            slot={slot}
            candidates={candidates}
            trigger={
              <Button size="sm" variant="outline" className="mt-4 w-full">
                Choose
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}
