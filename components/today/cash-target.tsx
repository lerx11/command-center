"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { upsertCashTargetAction } from "@/app/app/today/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import type { CashTarget } from "@/lib/types";

export function CashTarget({ target }: { target: CashTarget | null }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const min = target?.min_target ?? 0;
  const max = target?.max_target ?? 0;
  const received = target?.received ?? 0;
  const inProgress = target?.in_progress ?? 0;
  const expected = target?.expected ?? 0;

  const save = (fd: FormData) => {
    startTransition(async () => {
      const res = await upsertCashTargetAction(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Saved ✓");
        setEditing(false);
      }
    });
  };

  if (editing) {
    return (
      <form
        action={save}
        className="rounded-xl border border-border/60 bg-card p-4"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cash Target
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Min" name="min_target" defaultValue={min} />
          <Field label="Max" name="max_target" defaultValue={max} />
          <Field label="Received" name="received" defaultValue={received} />
          <Field label="In work" name="in_progress" defaultValue={inProgress} />
          <Field label="Expected" name="expected" defaultValue={expected} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    );
  }

  const total = max || min;
  const progress = total > 0 ? Math.min(100, (received / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cash Target
        </p>
        <button
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Edit cash target"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      <p className="mt-1 text-xl font-semibold tabular">
        {formatMoney(min)} — {formatMoney(max)}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-foreground transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Received" value={formatMoney(received)} />
        <Metric label="In work" value={formatMoney(inProgress)} />
        <Metric label="Expected" value={formatMoney(expected)} />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Input
        type="number"
        name={name}
        defaultValue={defaultValue}
        min={0}
        className="h-8"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-medium tabular">{value}</p>
    </div>
  );
}
