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
import { setDailyPlanTaskAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Task } from "@/lib/types";

export function TaskPicker({
  slot,
  candidates,
  trigger,
  emptyHint,
}: {
  slot: "big_win" | "money" | "asset";
  candidates: Task[];
  trigger: ReactNode;
  emptyHint?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const filtered = candidates.filter((t2) =>
    t2.title.toLowerCase().includes(query.toLowerCase())
  );

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
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("taskPicker.noTasks")}
              </p>
            ) : (
              filtered.map((task) => (
                <button
                  key={task.id}
                  onClick={() => pick(task.id)}
                  disabled={pending}
                  className="block w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30 hover:bg-accent"
                >
                  {task.title}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
