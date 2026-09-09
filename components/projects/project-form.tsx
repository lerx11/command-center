"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  projectSchema,
  type ProjectValues,
} from "@/lib/validations";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  PROJECT_CATEGORY_META,
} from "@/lib/constants";
import {
  createProjectAction,
  updateProjectAction,
  forceCreateProjectAction,
} from "@/app/app/projects/actions";
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
import { useT } from "@/components/i18n/i18n-provider";
import type { Project } from "@/lib/types";

export function ProjectForm({
  project,
  trigger,
}: {
  project?: Project;
  trigger: ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [limitError, setLimitError] = useState(false);
  const [lastValues, setLastValues] = useState<ProjectValues | null>(null);

  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      category: project?.category ?? "CASH_NOW",
      status: project?.status ?? "ACTIVE",
    },
  });

  const onSubmit = (values: ProjectValues) => {
    setLastValues(values);
    setLimitError(false);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, String(v ?? "")));
    if (project) fd.set("id", project.id);

    startTransition(async () => {
      const action = project ? updateProjectAction : createProjectAction;
      const res = (await action(fd)) as {
        error?: string;
        limit?: boolean;
        success?: true;
      };
      if (res?.error) {
        if (res.limit) {
          setLimitError(true);
          toast.error(t(res.error));
        } else {
          toast.error(t(res.error));
        }
        return;
      }
      setOpen(false);
      form.reset();
      toast.success(project ? t("toasts.projectUpdated") : t("toasts.projectCreated"));
    });
  };

  const forceCreate = () => {
    if (!lastValues) return;
    const fd = new FormData();
    Object.entries(lastValues).forEach(([k, v]) => fd.set(k, String(v ?? "")));
    if (project) fd.set("id", project.id);
    startTransition(async () => {
      const res = await forceCreateProjectAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      setOpen(false);
      form.reset();
      toast.success(t("toasts.projectCreated"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {project ? t("projects.editProjectTitle") : t("projects.newProjectTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("projects.formDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("projects.titleLabel")}</label>
            <Input {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {t(form.formState.errors.title.message ?? "")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("projects.descriptionLabel")}</label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("projects.category")}</label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) =>
                  form.setValue("category", v as ProjectValues["category"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PROJECT_CATEGORY_META[c].emoji}{" "}
                      {PROJECT_CATEGORY_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("projects.status")}</label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as ProjectValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? t("common.saving") : project ? t("common.save") : t("common.create")}
            </Button>
          </div>
          {limitError && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
              <p className="font-medium">
                {t("projects.limitWarning")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t("projects.limitHint")}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={forceCreate}
                disabled={pending}
              >
                {t("projects.forceCreate")}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
