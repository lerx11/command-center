"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TaskMenu } from "@/components/tasks/task-menu";
import { moveTaskToTomorrowAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Project, Task } from "@/lib/types";

export function WhatToMove({
  unfinished,
  projects,
}: {
  unfinished: Task[];
  projects: Project[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  if (unfinished.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
        {t("review.nothingToMove")}
      </p>
    );
  }

  const move = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await moveTaskToTomorrowAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.movedToTomorrow"));
    });
  };

  return (
    <div className="space-y-2">
      {unfinished.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
        >
          <p className="min-w-0 flex-1 truncate text-sm">{task.title}</p>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => move(task.id)}
          >
            {t("review.moveToTomorrow")}
          </Button>
          <TaskMenu task={task} projects={projects} />
        </div>
      ))}
    </div>
  );
}
