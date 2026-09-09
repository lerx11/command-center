import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";
import { getT } from "@/lib/i18n";
import { ReviewForm } from "@/components/review/review-form";
import { WhatToMove } from "@/components/review/what-to-move";
import { PlanTomorrow } from "@/components/review/plan-tomorrow";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_META } from "@/lib/constants";
import type { DailyReview, Project, Task } from "@/lib/types";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const date = todayISO();
  const start = new Date(date + "T00:00:00").toISOString();
  const end = new Date(date + "T23:59:59").toISOString();

  // Done today.
  const { data: done } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "DONE")
    .gte("completed_at", start)
    .lte("completed_at", end)
    .order("completed_at", { ascending: false });

  // Unfinished (today's plan tasks that are not done, plus due-today tasks).
  const { data: unfinished } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["TODO", "IN_PROGRESS"])
    .or(`due_date.eq.${date},due_date.is.null`)
    .order("created_at", { ascending: false });

  // Candidates for tomorrow (any not-done task).
  const { data: cand } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["TODO", "IN_PROGRESS"])
    .order("created_at", { ascending: false });

  // Today's review.
  const { data: reviewRow } = await supabase
    .from("daily_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  // Projects (for menus).
  const { data: pj } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const doneTasks = (done ?? []) as unknown as Task[];
  const unfinishedTasks = (unfinished ?? []) as unknown as Task[];
  const candidates = (cand ?? []) as unknown as Task[];
  const review = reviewRow as unknown as DailyReview | null;
  const projects = (pj ?? []) as unknown as Project[];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t("review.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("review.description")}
        </p>
      </header>

      {/* Done today */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("review.doneToday")}
        </h2>
        {doneTasks.length === 0 ? (
          <EmptyState
            title={t("review.noCompleted")}
            description={t("review.noCompletedHint")}
          />
        ) : (
          <div className="space-y-2">
            {doneTasks.map((tsk) => (
              <div
                key={tsk.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5"
              >
                <p className="min-w-0 flex-1 truncate text-sm line-through text-muted-foreground">
                  {tsk.title}
                </p>
                <Badge variant="secondary" className="text-[10px]">
                  {TASK_TYPE_META[tsk.type].emoji} {TASK_TYPE_META[tsk.type].short}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reflections */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("review.reflect")}
        </h2>
        <ReviewForm date={date} review={review} />
      </section>

      {/* What to move */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("review.whatToMove")}
        </h2>
        <WhatToMove unfinished={unfinishedTasks} projects={projects} />
      </section>

      {/* Plan tomorrow */}
      <section className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("review.tomorrow")}
        </h2>
        <PlanTomorrow candidates={candidates} />
      </section>
    </div>
  );
}
