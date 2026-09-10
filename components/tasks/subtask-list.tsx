"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Subtask } from "@/lib/types";

export function SubtaskList({
  taskId,
  subtasks,
  variant = "default",
}: {
  taskId: string;
  subtasks: Subtask[];
  variant?: "default" | "compact";
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");

  const add = () => {
    const title = newTitle.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("task_id", taskId);
    fd.set("title", title);
    startTransition(async () => {
      const res = await createSubtaskAction(fd);
      if (res?.error) toast.error(t(res.error));
      setNewTitle("");
    });
  };

  const toggle = (id: string, completed: boolean) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("completed", String(completed));
    startTransition(async () => {
      const res = await toggleSubtaskAction(fd);
      if (res?.error) toast.error(t(res.error));
    });
  };

  const remove = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteSubtaskAction(fd);
      if (res?.error) toast.error(t(res.error));
    });
  };

  const done = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;

  if (variant === "compact" && total === 0) return null;

  return (
    <div className="space-y-1.5">
      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t("common.subtasks")}: {done}/{total}
          </span>
          {variant === "default" && (
            <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      )}
      {variant === "default" &&
        subtasks.map((st) => (
          <div
            key={st.id}
            className="flex items-center gap-2 rounded border border-border/40 px-2 py-1.5"
          >
            <button
              onClick={() => toggle(st.id, st.completed)}
              disabled={pending}
              className="shrink-0"
            >
              <div
                className={`flex size-4 items-center justify-center rounded border ${
                  st.completed
                    ? "border-foreground bg-foreground text-background"
                    : "border-input"
                }`}
              >
                {st.completed && (
                  <Check className="size-3" strokeWidth={3} />
                )}
              </div>
            </button>
            <p
              className={`flex-1 text-sm ${
                st.completed ? "text-muted-foreground line-through" : ""
              }`}
            >
              {st.title}
            </p>
            <button
              onClick={() => remove(st.id)}
              disabled={pending}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      {variant === "default" && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={t("common.addSubtask")}
            className="h-8 text-sm"
            maxLength={200}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={add}
            disabled={pending || !newTitle.trim()}
            className="shrink-0"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
