"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertReviewAction } from "@/app/app/review/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { DailyReview } from "@/lib/types";

export function ReviewForm({
  date,
  review,
}: {
  date: string;
  review: DailyReview | null;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  const save = (fd: FormData) => {
    startTransition(async () => {
      const res = await upsertReviewAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.reviewSaved"));
    });
  };

  return (
    <form action={save} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("review.moneyMoved")}</label>
        <p className="text-xs text-muted-foreground">
          {t("review.moneyMovedHint")}
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
        <label className="text-sm font-medium">{t("review.whatWorked")}</label>
        <Textarea
          name="what_worked"
          defaultValue={review?.what_worked ?? ""}
          rows={2}
          placeholder={t("review.whatWorkedPlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("review.whatDistracted")}</label>
        <Textarea
          name="what_distracted"
          defaultValue={review?.what_distracted ?? ""}
          rows={2}
          placeholder={t("review.whatDistractedPlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("review.notes")}</label>
        <Textarea
          name="notes"
          defaultValue={review?.notes ?? ""}
          rows={2}
          placeholder={t("review.notesPlaceholder")}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("review.saveReview")}
      </Button>
    </form>
  );
}
