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
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const filtered = candidates.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (taskId: string) => {
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("slot", slot);
    startTransition(async () => {
      const res = await setDailyPlanTaskAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      toast.success("Added to today ✓");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a task</DialogTitle>
          <DialogDescription>
            {emptyHint ?? "Pick the one task that matters for this slot."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            autoFocus
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No tasks available. Create one first.
              </p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick(t.id)}
                  disabled={pending}
                  className="block w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30 hover:bg-accent"
                >
                  {t.title}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
