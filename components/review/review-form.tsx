"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertReviewAction } from "@/app/app/review/actions";
import type { DailyReview } from "@/lib/types";

export function ReviewForm({
  date,
  review,
}: {
  date: string;
  review: DailyReview | null;
}) {
  const [pending, startTransition] = useTransition();

  const save = (fd: FormData) => {
    startTransition(async () => {
      const res = await upsertReviewAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Review saved ✓");
    });
  };

  return (
    <form action={save} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <div className="space-y-2">
        <label className="text-sm font-medium">💰 Money moved</label>
        <p className="text-xs text-muted-foreground">
          How much money did you move closer today?
        </p>
        <Input
          type="number"
          name="money_moved"
          defaultValue={review?.money_moved ?? 0}
          min={0}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">What worked?</label>
        <Textarea
          name="what_worked"
          defaultValue={review?.what_worked ?? ""}
          rows={2}
          placeholder="What moved you forward…"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">What distracted?</label>
        <Textarea
          name="what_distracted"
          defaultValue={review?.what_distracted ?? ""}
          rows={2}
          placeholder="What pulled you off focus…"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          name="notes"
          defaultValue={review?.notes ?? ""}
          rows={2}
          placeholder="Anything else…"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save review"}
      </Button>
    </form>
  );
}
