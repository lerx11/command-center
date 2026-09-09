"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { taskSchema, type TaskValues } from "@/lib/validations";
import {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_TYPE_META,
  TASK_PRIORITY_META,
} from "@/lib/constants";
import { createTaskAction, updateTaskAction } from "@/app/app/tasks/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, Task } from "@/lib/types";

export function TaskForm({
  task,
  projects,
  trigger,
  defaultType = "OTHER",
  defaultProjectId,
  onCreated,
}: {
  task?: Task;
  projects: Project[];
  trigger: ReactNode;
  defaultType?: TaskValues["type"];
  defaultProjectId?: string | null;
  onCreated?: (taskId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      project_id: task?.project_id ?? defaultProjectId ?? null,
      type: task?.type ?? defaultType,
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "NORMAL",
      due_date: task?.due_date ?? null,
    },
  });

  const onSubmit = (values: TaskValues) => {
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("description", values.description ?? "");
    fd.set(
      "project_id",
      values.project_id && values.project_id !== "none"
        ? values.project_id
        : "null"
    );
    fd.set("type", values.type);
    fd.set("status", values.status);
    fd.set("priority", values.priority);
    fd.set("due_date", values.due_date ?? "");
    if (task) fd.set("id", task.id);

    startTransition(async () => {
      const res = task
        ? await updateTaskAction(fd)
        : await createTaskAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      form.reset();
      toast.success(task ? "Task updated ✓" : "Task created ✓");
      if (!task) {
        // Best-effort: caller can route to today/project/park.
        onCreated?.("");
      }
    });
  };

  const watchType = form.watch("type");
  const watchProject = form.watch("project_id");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>Keep it small and finishable.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input autoFocus {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea rows={2} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={watchProject ?? "none"}
                onValueChange={(v) =>
                  form.setValue("project_id", v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={watchType}
                onValueChange={(v) =>
                  form.setValue("type", v as TaskValues["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TASK_TYPE_META[t].emoji} {TASK_TYPE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) =>
                  form.setValue("priority", v as TaskValues["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due date</label>
              <Input
                type="date"
                value={form.watch("due_date") ?? ""}
                onChange={(e) =>
                  form.setValue("due_date", e.target.value || null)
                }
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Saving…" : task ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
