"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Trash2,
  ParkingSquare,
  CalendarPlus,
  CalendarMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  deleteTaskAction,
  parkTaskAction,
  addToTodayAction,
  removeFromTodayAction,
} from "@/app/app/tasks/actions";
import { TaskForm } from "./task-form";
import { useT } from "@/components/i18n/i18n-provider";
import { todayISO } from "@/lib/utils";
import type { Project, Task } from "@/lib/types";

export function TaskMenu({
  task,
  projects,
  withEditButton = true,
}: {
  task: Task;
  projects: Project[];
  withEditButton?: boolean;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  // A task is "in today" if it's IN_PROGRESS with today's due_date.
  const inToday =
    task.status === "IN_PROGRESS" && task.due_date === todayISO();

  const park = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", "PARKED");
    startTransition(async () => {
      const res = await parkTaskAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.movedToParking"));
    });
  };

  const addToToday = () => {
    const fd = new FormData();
    fd.set("taskId", task.id);
    startTransition(async () => {
      const res = await addToTodayAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.addedToToday"));
    });
  };

  const removeFromToday = () => {
    const fd = new FormData();
    fd.set("taskId", task.id);
    startTransition(async () => {
      const res = await removeFromTodayAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.removedFromToday"));
    });
  };

  const del = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      const res = await deleteTaskAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.deleted"));
    });
  };

  const editTrigger: ReactNode = (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground hover:text-foreground"
    >
      {t("common.edit")}
    </Button>
  );

  return (
    <div className="flex items-center">
      {withEditButton && (
        <TaskForm task={task} projects={projects} trigger={editTrigger} />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={pending}
            aria-label={t("taskMenu.actions")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {inToday ? (
            <DropdownMenuItem onClick={removeFromToday}>
              <CalendarMinus className="size-4" />
              {t("common.removeFromToday")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={addToToday}>
              <CalendarPlus className="size-4" />
              {t("common.addToToday")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={park}>
            <ParkingSquare className="size-4" />
            {t("common.park")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={del}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
