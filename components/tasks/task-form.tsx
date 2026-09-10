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
import {
  createTaskAction,
  updateTaskAction,
  addToTodayAction,
  parkTaskAction,
} from "@/app/app/tasks/actions";
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
import { SubtaskList } from "./subtask-list";
import { useT } from "@/components/i18n/i18n-provider";
import type { Project, Subtask, Task } from "@/lib/types";

export function TaskForm({
  task,
  projects,
  subtasks,
  trigger,
  defaultType = "OTHER",
  defaultProjectId,
  onCreated,
}: {
  task?: Task;
  projects: Project[];
  subtasks?: Subtask[];
  trigger: ReactNode;
  defaultType?: TaskValues["type"];
  defaultProjectId?: string | null;
  onCreated?: (taskId: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

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
      next_action: task?.next_action ?? "",
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
    fd.set("next_action", values.next_action ?? "");
    if (task) fd.set("id", task.id);

    startTransition(async () => {
      if (task) {
        const res = await updateTaskAction(fd);
        if (res?.error) {
          toast.error(t(res.error));
          return;
        }
        form.reset();
        toast.success(t("toasts.taskUpdated"));
        setOpen(false);
      } else {
        const res = await createTaskAction(fd);
        if (res?.error) {
          toast.error(t(res.error));
          return;
        }
        form.reset();
        toast.success(t("toasts.taskCreated"));
        if (res.success && res.taskId) {
          setCreatedTaskId(res.taskId);
          onCreated?.(res.taskId);
        }
      }
    });
  };

  const addAndClose = () => {
    if (!createdTaskId) return;
    const fd = new FormData();
    fd.set("taskId", createdTaskId);
    startTransition(async () => {
      const res = await addToTodayAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      toast.success(t("toasts.addedToToday"));
      setCreatedTaskId(null);
      setOpen(false);
    });
  };

  const parkAndClose = () => {
    if (!createdTaskId) return;
    const fd = new FormData();
    fd.set("id", createdTaskId);
    fd.set("status", "PARKED");
    startTransition(async () => {
      const res = await parkTaskAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      toast.success(t("toasts.movedToParking"));
      setCreatedTaskId(null);
      setOpen(false);
    });
  };

  const keepAndClose = () => {
    setCreatedTaskId(null);
    setOpen(false);
  };

  const watchType = form.watch("type");
  const watchProject = form.watch("project_id");

  // Post-creation options screen.
  if (createdTaskId) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) keepAndClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("taskForm.postCreateTitle")}</DialogTitle>
            <DialogDescription>
              {t("taskForm.postCreateDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={addAndClose}
              disabled={pending}
            >
              {t("taskForm.addToToday")}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={keepAndClose}
              disabled={pending}
            >
              {t("taskForm.keepInProject")}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={parkAndClose}
              disabled={pending}
            >
              {t("common.park")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{task ? t("taskForm.editTask") : t("taskForm.newTask")}</DialogTitle>
          <DialogDescription>{t("taskForm.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="-mr-2 space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("taskForm.titleLabel")}</label>
              <Input autoFocus {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {t(form.formState.errors.title.message ?? "")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("taskForm.descriptionLabel")}</label>
              <Textarea rows={2} {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("taskForm.nextActionLabel")}</label>
              <Input
                {...form.register("next_action")}
                placeholder={t("common.nextAction")}
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("taskForm.projectLabel")}</label>
                <Select
                  value={watchProject ?? "none"}
                  onValueChange={(v) =>
                    form.setValue("project_id", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("taskForm.placeholderNoProject")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.noProject")}</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("taskForm.typeLabel")}</label>
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
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TASK_TYPE_META[type].emoji} {TASK_TYPE_META[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("taskForm.priorityLabel")}</label>
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
                <label className="text-sm font-medium">{t("taskForm.dueDateLabel")}</label>
                <Input
                  type="date"
                  value={form.watch("due_date") ?? ""}
                  onChange={(e) =>
                    form.setValue("due_date", e.target.value || null)
                  }
                />
              </div>
            </div>
            {task && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("taskForm.subtasksLabel")}</label>
                <SubtaskList taskId={task.id} subtasks={subtasks ?? []} />
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2 border-t border-border/50 pt-3 mt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? t("common.saving") : task ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
