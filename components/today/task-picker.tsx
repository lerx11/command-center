"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setDailyPlanTaskAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Project, Task } from "@/lib/types";

export function TaskPicker({
  slot,
  candidates,
  projects,
  trigger,
  emptyHint,
}: {
  slot: "big_win" | "money" | "asset";
  candidates: Task[];
  projects: Project[];
  trigger: ReactNode;
  emptyHint?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filtered = candidates.filter((t2) => {
    const matchesQuery = t2.title
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesProject =
      projectFilter === "all" || t2.project_id === projectFilter;
    return matchesQuery && matchesProject;
  });

  const pick = (taskId: string) => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("slot", slot);
    startTransition(async () => {
      const res = await setDailyPlanTaskAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      setOpen(false);
      setQuery("");
      setProjectFilter("all");
      toast.success(t("toasts.addedToToday"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("taskPicker.title")}</DialogTitle>
          <DialogDescription>
            {emptyHint ?? t("taskPicker.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            autoFocus
            placeholder={t("taskPicker.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {projects.length > 0 && (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("taskPicker.allProjects")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("taskPicker.allProjects")}
                </SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("taskPicker.noTasks")}
              </p>
            ) : (
              filtered.map((task) => {
                const project = projects.find((p) => p.id === task.project_id);
                return (
                  <button
                    key={task.id}
                    onClick={() => pick(task.id)}
                    disabled={pending}
                    className="block w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30 hover:bg-accent"
                  >
                    <p className="truncate">{task.title}</p>
                    {project && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {project.title}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
