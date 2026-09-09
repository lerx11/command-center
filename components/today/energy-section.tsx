"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  ENERGY_CATEGORIES,
  ENERGY_CATEGORY_META,
  type EnergyCategory,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  toggleEnergyTaskAction,
  deleteEnergyTaskAction,
} from "@/app/app/tasks/actions";
import { quickEnergyCreateAction } from "@/app/app/today/actions";
import type { EnergyTask } from "@/lib/types";

export function EnergySection({
  energyTasks,
}: {
  energyTasks: EnergyTask[];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ⚡ Energy
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {ENERGY_CATEGORIES.map((cat) => (
          <EnergyColumn
            key={cat}
            category={cat}
            tasks={energyTasks.filter((t) => t.category === cat)}
          />
        ))}
      </div>
    </div>
  );
}

function EnergyColumn({
  category,
  tasks,
}: {
  category: EnergyCategory;
  tasks: EnergyTask[];
}) {
  const meta = ENERGY_CATEGORY_META[category];
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const add = () => {
    if (!title.trim()) return;
    const fd = new FormData();
    fd.set("category", category);
    fd.set("title", title.trim());
    startTransition(async () => {
      const res = await quickEnergyCreateAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setTitle("");
      setAdding(false);
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider">
        {meta.emoji} {meta.label}
      </p>
      {tasks.map((t) => (
        <EnergyItem key={t.id} task={t} />
      ))}
      {adding ? (
        <div className="flex items-center gap-1.5">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={meta.placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="h-8 text-sm"
          />
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setAdding(false)}
            aria-label="Cancel"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" /> Add
        </button>
      )}
    </div>
  );
}

function EnergyItem({ task }: { task: EnergyTask }) {
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("completed", String(task.completed));
    startTransition(async () => {
      const res = await toggleEnergyTaskAction(fd);
      if (res?.error) toast.error(res.error);
    });
  };
  const del = () => {
    const fd = new FormData();
    fd.set("id", task.id);
    startTransition(async () => {
      const res = await deleteEnergyTaskAction(fd);
      if (res?.error) toast.error(res.error);
    });
  };

  return (
    <div className="group flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={pending}
        aria-label={task.completed ? "Mark not done" : "Mark done"}
        className="shrink-0"
      >
        <div
          className={`flex size-5 items-center justify-center rounded border ${
            task.completed
              ? "border-foreground bg-foreground text-background"
              : "border-input"
          }`}
        >
          {task.completed && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-3.5"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </button>
      <span
        className={`flex-1 text-sm ${
          task.completed ? "text-muted-foreground line-through" : ""
        }`}
      >
        {task.title}
      </span>
      <button
        onClick={del}
        className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="Delete energy task"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
