"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { TaskMenu } from "@/components/tasks/task-menu";
import { setTaskStatusAction } from "@/app/app/tasks/actions";
import { TASK_TYPE_META } from "@/lib/constants";
import { useT } from "@/components/i18n/i18n-provider";
import type { Project, Task } from "@/lib/types";

export function TaskActionsClient({
  task,
  projects,
}: {
  task: Task;
  projects: Project[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const done = task.status === "DONE";

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

  const meta = TASK_TYPE_META[task.type];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5">
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
      </div>
      <Badge variant="secondary" className="text-[10px]">
        {meta.emoji} {meta.short}
      </Badge>
      <TaskMenu task={task} projects={projects} />
    </div>
  );
}
