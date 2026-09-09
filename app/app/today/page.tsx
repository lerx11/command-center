import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";
import { getT } from "@/lib/i18n";
import { CommandCenterHeader } from "@/components/command-center/command-center-header";
import { CashTarget } from "@/components/today/cash-target";
import { TodaySlotCard } from "@/components/today/today-slot-card";
import { EnergySection } from "@/components/today/energy-section";
import { CurrentFocus } from "@/components/today/current-focus";
import { FocusStats } from "@/components/today/focus-stats";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type {
  CashTarget as CashTargetType,
  DailyPlan,
  EnergyTask,
  Project,
  Task,
} from "@/lib/types";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function TodayPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const date = todayISO();
  const dayStart = new Date(date + "T00:00:00").toISOString();
  const dayEnd = new Date(date + "T23:59:59").toISOString();

  // §24: new-day logic — ensure a daily plan exists for today (do NOT carry over yesterday's tasks).
  let plan: DailyPlan | null = null;
  const { data: existing } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  if (existing) {
    plan = existing as DailyPlan;
  } else {
    const { data: np } = await supabase
      .from("daily_plans")
      .insert({ user_id: user.id, date })
      .select("*")
      .single();
    if (np) plan = np as DailyPlan;
  }

  // Resolve the linked tasks (big_win / money / asset).
  const slotIds = [
    plan?.big_win_task_id,
    plan?.money_task_id,
    plan?.asset_task_id,
  ].filter(Boolean) as string[];

  // All remaining queries are independent of each other — fetch them in parallel.
  const [
    { data: found },
    { data: et },
    { data: ct },
    { data: cand },
    { data: todaySessions },
    { data: pj },
  ] = await Promise.all([
    slotIds.length > 0
      ? supabase.from("tasks").select("*").in("id", slotIds)
      : Promise.resolve({ data: [] as Task[] | null }),
    plan
      ? supabase
          .from("energy_tasks")
          .select("*")
          .eq("daily_plan_id", plan.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as EnergyTask[] | null }),
    supabase
      .from("cash_targets")
      .select("*")
      .eq("user_id", user.id)
      .eq("period", currentPeriod())
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["TODO", "IN_PROGRESS"])
      .order("created_at", { ascending: false }),
    supabase
      .from("focus_sessions")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .gte("started_at", dayStart)
      .lte("started_at", dayEnd),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
  ]);

  const slotTasks = (found ?? []) as Task[];
  const findTask = (id: string | null | undefined) =>
    id ? slotTasks.find((t) => t.id === id) ?? null : null;

  const energyTasks = (et ?? []) as EnergyTask[];
  const cashTarget = (ct ?? null) as CashTargetType | null;
  const candidates = (cand ?? []) as Task[];
  const projects = (pj ?? []) as Project[];

  const focusSessionCount = (todaySessions ?? []).length;
  const focusTotalSeconds = (todaySessions ?? []).reduce(
    (acc, r: { duration_seconds: number }) => acc + (r.duration_seconds ?? 0),
    0
  );

  const bigWin = findTask(plan?.big_win_task_id);
  const money = findTask(plan?.money_task_id);
  const asset = findTask(plan?.asset_task_id);

  const todayTasks = [bigWin, money, asset].filter(Boolean) as Task[];
  const allEmpty = !bigWin && !money && !asset;

  return (
    <div className="space-y-8">
      <CommandCenterHeader />

      <CashTarget target={cashTarget} />

      <FocusStats
        sessionCount={focusSessionCount}
        totalSeconds={focusTotalSeconds}
      />

      {allEmpty ? (
        <EmptyState
          title={t("today.nothingPlanned")}
          description={t("today.nothingPlannedHint")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <TaskForm
                projects={projects}
                defaultType="BIG_WIN"
                trigger={
                  <Button>
                    <Plus className="size-4" /> {t("today.chooseBigWin")}
                  </Button>
                }
              />
              <Button asChild variant="outline">
                <Link href="/app/projects">{t("today.viewProjects")}</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t("today.title")}
          </h2>
          <div className="grid gap-3 lg:grid-cols-3">
            <TodaySlotCard
              slot="big_win"
              task={bigWin}
              candidates={candidates}
              projects={projects}
              emphasize
            />
            <TodaySlotCard
              slot="money"
              task={money}
              candidates={candidates}
              projects={projects}
            />
            <TodaySlotCard
              slot="asset"
              task={asset}
              candidates={candidates}
              projects={projects}
            />
          </div>
        </section>
      )}

      <EnergySection energyTasks={energyTasks} />

      <CurrentFocus todayTasks={todayTasks} />
    </div>
  );
}
