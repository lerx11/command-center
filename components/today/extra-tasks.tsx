"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  addToTodayExtraAction,
  removeFromTodayExtraAction,
} from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import { TASK_TYPE_META } from "@/lib/constants";
import type { Project, Subtask, Task } from "@/lib/types";

export function ExtraTasks({
  tasks,
  projects,
  subtasks,
  candidates,
}: {
  tasks: Task[];
  projects: Project[];
  subtasks: Subtask[];
  candidates: Task[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);

  // Tasks that can be added to Extra (not already in Extra or Core)
  const existingIds = new Set(tasks.map((t) => t.id));
  const available = candidates.filter((c) => !existingIds.has(c.id));

  const removeTask = (taskId: string) => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    startTransition(async () => {
      const res = await removeFromTodayExtraAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.removedFromToday"));
    });
  };

  const addTask = (taskId: string) => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    startTransition(async () => {
      const res = await addToTodayExtraAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.addedToToday"));
      setShowPicker(false);
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("today.extraToday")}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setShowPicker((s) => !s)}
          disabled={pending}
        >
          <Plus className="size-3" /> {t("today.addExtra")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("today.extraTodayHint")}</p>

      {showPicker && available.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-card p-2 space-y-1">
          {available.map((c) => {
            const meta = TASK_TYPE_META[c.type];
            const proj = projects.find((p) => p.id === c.project_id);
            return (
              <button
                key={c.id}
                onClick={() => addTask(c.id)}
                disabled={pending}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <Plus className="size-3 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{c.title}</span>
                {proj && (
                  <span className="text-xs text-muted-foreground">{proj.title}</span>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {meta.emoji} {meta.short}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const meta = TASK_TYPE_META[task.type];
            const done = task.status === "DONE";
            const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
            const subDone = taskSubtasks.filter((s) => s.completed).length;
            const proj = projects.find((p) => p.id === task.project_id);
            return (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                ) : (
                  <Link
                    href={`/app/focus?task=${encodeURIComponent(task.id)}`}
                    prefetch
                    className="flex size-4 shrink-0 items-center justify-center rounded-full border border-input transition-colors hover:border-foreground"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {task.title}
                  </p>
                  {task.next_action && !done && (
                    <p className="truncate text-xs text-muted-foreground">
                      → {task.next_action}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {proj && (
                      <span className="text-xs text-muted-foreground">{proj.title}</span>
                    )}
                    {taskSubtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {subDone}/{taskSubtasks.length}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {meta.emoji} {meta.short}
                </Badge>
                <button
                  onClick={() => removeTask(task.id)}
                  disabled={pending}
                  className="shrink-0 rounded p-1 text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={t("today.removeExtra")}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !showPicker && (
          <p className="rounded-lg border border-dashed border-border/40 p-4 text-center text-sm text-muted-foreground">
            {t("today.extraTodayHint")}
          </p>
        )
      )}
    </section>
  );
}
