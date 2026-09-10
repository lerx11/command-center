"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskMenu } from "@/components/tasks/task-menu";
import { SubtaskList } from "@/components/tasks/subtask-list";
import {
  setTaskStatusAction,
  addToTodayAction,
  removeFromTodayAction,
} from "@/app/app/tasks/actions";
import { TASK_TYPE_META } from "@/lib/constants";
import { useT } from "@/components/i18n/i18n-provider";
import { todayISO } from "@/lib/utils";
import type { Project, Subtask, Task } from "@/lib/types";

export function TaskActionsClient({
  task,
  projects,
  subtasks,
}: {
  task: Task;
  projects: Project[];
  subtasks: Subtask[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const done = task.status === "DONE";
  const inToday =
    task.status === "IN_PROGRESS" && task.due_date === todayISO();

  const toggle = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", done ? "TODO" : "DONE");
    startTransition(async () => {
      const res = await setTaskStatusAction(fd);
      if (res?.error) toast.error(t(res.error));
      else if (!done) toast.success(t("toasts.taskCompleted"));
    });
  };

  const toggleToday = () => {
    const fd = new FormData();
    fd.set("taskId", task.id);
    startTransition(async () => {
      const res = inToday
        ? await removeFromTodayAction(fd)
        : await addToTodayAction(fd);
      if (res?.error) toast.error(t(res.error));
      else
        toast.success(
          inToday ? t("toasts.removedFromToday") : t("toasts.addedToToday")
        );
    });
  };

  const meta = TASK_TYPE_META[task.type];

  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={pending}
          aria-label={done ? t("today.markNotDone") : t("today.markDone")}
          className="shrink-0"
        >
          <div
            className={`flex size-5 items-center justify-center rounded border ${
              done
                ? "border-foreground bg-foreground text-background"
                : "border-input"
            }`}
          >
            {done && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-3.5"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${
              done ? "text-muted-foreground line-through" : ""
            }`}
          >
            {task.title}
          </p>
          {task.next_action && !done && (
            <p className="truncate text-xs text-muted-foreground">
              → {task.next_action}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {meta.emoji} {meta.short}
        </Badge>
        <Button
          size="sm"
          variant={inToday ? "secondary" : "outline"}
          onClick={toggleToday}
          disabled={pending}
          className="shrink-0"
        >
          {inToday ? (
            <>
              <CalendarCheck className="size-3.5" /> {t("common.inToday")}
            </>
          ) : (
            <>
              <CalendarPlus className="size-3.5" /> {t("common.addToTodayShort")}
            </>
          )}
        </Button>
        <TaskMenu task={task} projects={projects} subtasks={subtasks} />
      </div>
      {subtasks.length > 0 && (
        <div className="mt-2 pl-8">
          <SubtaskList taskId={task.id} subtasks={subtasks} variant="compact" />
        </div>
      )}
    </div>
  );
}
