"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  createSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from "@/app/app/tasks/actions";
import { updateSubtaskAction } from "@/app/app/tasks/actions";
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
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);

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
      setAdding(false);
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

  if (total === 0 && variant === "compact") return null;

  const pct = total > 0 ? (done / total) * 100 : 0;
  const barColor =
    done === total && total > 0
      ? "bg-emerald-500"
      : done > 0
        ? "bg-blue-500"
        : "bg-muted-foreground/30";

  return (
    <div className="space-y-1.5">
      {/* Progress header — clickable to expand/collapse */}
      {total > 0 && (
        <button
          onClick={() => setExpanded((s) => !s)}
          className="flex w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={`size-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
          <span>
            {t("common.subtasks")}: {done}/{total}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </button>
      )}

      {/* Expanded subtask list */}
      {expanded && (
        <div className="space-y-1">
          {subtasks.map((st) => (
            <SubtaskItem
              key={st.id}
              subtask={st}
              pending={pending}
              onToggle={toggle}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      {/* Inline add subtask */}
      {variant === "default" && (
        <div className="flex items-center gap-2">
          {adding ? (
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                } else if (e.key === "Escape") {
                  setNewTitle("");
                  setAdding(false);
                }
              }}
              onBlur={() => {
                if (!newTitle.trim()) {
                  setAdding(false);
                  setNewTitle("");
                }
              }}
              placeholder={t("common.addSubtask")}
              className="h-8 text-sm"
              maxLength={200}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-3" /> {t("common.addSubtask")}
            </button>
          )}
        </div>
      )}

      {/* Inline add for compact variant (shown when expanded) */}
      {variant === "compact" && expanded && (
        <div className="flex items-center gap-2">
          {adding ? (
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                } else if (e.key === "Escape") {
                  setNewTitle("");
                  setAdding(false);
                }
              }}
              onBlur={() => {
                if (!newTitle.trim()) {
                  setAdding(false);
                  setNewTitle("");
                }
              }}
              placeholder={t("common.addSubtask")}
              className="h-7 text-xs"
              maxLength={200}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-3" /> {t("common.addSubtask")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SubtaskItem({
  subtask,
  pending,
  onToggle,
  onRemove,
}: {
  subtask: Subtask;
  pending: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const t = useT();
  const [pendingEdit, startEditTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const saveEdit = () => {
    const title = editTitle.trim();
    if (!title || title === subtask.title) {
      setEditing(false);
      return;
    }
    const fd = new FormData();
    fd.set("id", subtask.id);
    fd.set("title", title);
    fd.set("completed", String(subtask.completed));
    startEditTransition(async () => {
      const res = await updateSubtaskAction(fd);
      if (res?.error) toast.error(t(res.error));
      setEditing(false);
    });
  };

  return (
    <div className="flex items-center gap-2 rounded border border-border/40 px-2 py-1.5">
      <button
        onClick={() => onToggle(subtask.id, subtask.completed)}
        disabled={pending}
        className="shrink-0"
      >
        <div
          className={`flex size-4 items-center justify-center rounded border ${
            subtask.completed
              ? "border-foreground bg-foreground text-background"
              : "border-input"
          }`}
        >
          {subtask.completed && <Check className="size-3" strokeWidth={3} />}
        </div>
      </button>
      {editing ? (
        <Input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveEdit();
            } else if (e.key === "Escape") {
              setEditTitle(subtask.title);
              setEditing(false);
            }
          }}
          onBlur={saveEdit}
          className="h-6 flex-1 text-sm"
          maxLength={200}
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className={`flex-1 cursor-text text-sm ${
            subtask.completed ? "text-muted-foreground line-through" : ""
          }`}
        >
          {subtask.title}
        </p>
      )}
      <button
        onClick={() => onRemove(subtask.id)}
        disabled={pending}
        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
