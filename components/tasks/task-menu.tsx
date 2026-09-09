"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, ParkingSquare } from "lucide-react";
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
} from "@/app/app/tasks/actions";
import { TaskForm } from "./task-form";
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
  const [pending, startTransition] = useTransition();

  const park = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", "PARKED");
    startTransition(async () => {
      const res = await parkTaskAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Moved to Parking ✓");
    });
  };

  const del = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      const res = await deleteTaskAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Deleted ✓");
    });
  };

  const editTrigger: ReactNode = (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground hover:text-foreground"
    >
      Edit
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
            aria-label="Task actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {withEditButton && (
            <>
              <DropdownMenuItem onClick={park}>
                <ParkingSquare className="size-4" />
                Park
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {!withEditButton && (
            <DropdownMenuItem onClick={park}>
              <ParkingSquare className="size-4" />
              Park
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={del}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
