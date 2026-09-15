import { createClient } from "@/utils/supabase/server";
import { todayISO, formatDuration, formatMoney, cn } from "@/lib/utils";
import { getT } from "@/lib/i18n";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Crosshair, Coins, CheckCircle2, Timer, Wallet, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const date = todayISO();
  const startOfWeek = new Date(date + "T00:00:00");
  startOfWeek.setDate(startOfWeek.getDate() - 6); // last 7 days incl. today
  const weekStart = startOfWeek.toISOString();

  const dayStart = new Date(date + "T00:00:00").toISOString();
  const dayEnd = new Date(date + "T23:59:59").toISOString();

  const run = async (
    type: "BIG_WIN" | "MONEY" | "ALL",
    range: "today" | "week"
  ) => {
    let query = supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "DONE");
    if (type !== "ALL") query = query.eq("type", type);
    if (range === "today") {
      query = query.gte("completed_at", dayStart).lte("completed_at", dayEnd);
    } else {
      query = query.gte("completed_at", weekStart);
    }
    const { count } = await query;
    return count ?? 0;
  };

  // All queries are independent — run them in a single Promise.all.
  const [
    bigWinsToday,
    moneyToday,
    tasksToday,
    bigWinsWeek,
    moneyWeek,
    tasksWeek,
    { data: todayFocus },
    { data: weekFocus },
    { data: todayReview },
    { data: weekReviews },
    { data: achRows },
  ] = await Promise.all([
    run("BIG_WIN", "today"),
    run("MONEY", "today"),
    run("ALL", "today"),
    run("BIG_WIN", "week"),
    run("MONEY", "week"),
    run("ALL", "week"),
    // Focus time.
    supabase
      .from("focus_sessions")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .gte("started_at", dayStart)
      .lte("started_at", dayEnd),
    supabase
      .from("focus_sessions")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .gte("started_at", weekStart),
    // Money moved (reviews).
    supabase
      .from("daily_reviews")
      .select("money_moved")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("daily_reviews")
      .select("money_moved")
      .eq("user_id", user.id)
      .gte("date", startOfWeek.toISOString().slice(0, 10)),
    supabase
      .from("achievements")
      .select("key")
      .eq("user_id", user.id),
  ]);

  const todayFocusSeconds = (todayFocus ?? []).reduce(
    (acc, r: { duration_seconds: number }) => acc + (r.duration_seconds ?? 0),
    0
  );
  const weekFocusSeconds = (weekFocus ?? []).reduce(
    (acc, r: { duration_seconds: number }) => acc + (r.duration_seconds ?? 0),
    0
  );
  const todayMoney = todayReview?.money_moved ?? 0;
  const weekMoney = (weekReviews ?? []).reduce(
    (acc, r: { money_moved: number | null }) => acc + (r.money_moved ?? 0),
    0
  );

  const unlockedKeys = new Set((achRows ?? []).map((r) => (r as { key: string }).key));
  const allAchievements = [
    { key: "first_task", icon: "✓", title: t("achievements.firstTask"), hint: t("achievements.firstTaskHint") },
    { key: "core_master", icon: "🎉", title: t("achievements.coreMaster"), hint: t("achievements.coreMasterHint") },
    { key: "pomodoro_master", icon: "🍅", title: t("achievements.pomodoroMaster"), hint: t("achievements.pomodoroMasterHint") },
    { key: "streak_7", icon: "🔥", title: t("achievements.streak7"), hint: t("achievements.streak7Hint") },
    { key: "streak_30", icon: "🏆", title: t("achievements.streak30"), hint: t("achievements.streak30Hint") },
  ];

  const metrics = [
    {
      label: t("dashboard.bigWins"),
      icon: Crosshair,
      today: bigWinsToday,
      week: bigWinsWeek,
    },
    {
      label: t("dashboard.moneyActions"),
      icon: Coins,
      today: moneyToday,
      week: moneyWeek,
    },
    {
      label: t("dashboard.tasksDone"),
      icon: CheckCircle2,
      today: tasksToday,
      week: tasksWeek,
    },
    {
      label: t("dashboard.focusTime"),
      icon: Timer,
      today: formatDuration(todayFocusSeconds),
      week: formatDuration(weekFocusSeconds),
    },
    {
      label: t("dashboard.moneyMoved"),
      icon: Wallet,
      today: formatMoney(todayMoney, locale),
      week: formatMoney(weekMoney, locale),
    },
  ];

  if (
    bigWinsWeek === 0 &&
    moneyWeek === 0 &&
    tasksWeek === 0 &&
    weekFocusSeconds === 0
  ) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <EmptyState
          title={t("dashboard.empty")}
          description={t("dashboard.emptyHint")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" />
                  <p className="text-xs font-medium uppercase tracking-wider">
                    {m.label}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("dashboard.today")}
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular">
                      {m.today}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("dashboard.thisWeek")}
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular">
                      {m.week}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievements */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("achievements.title")}</h2>
        </div>
        {unlockedKeys.size === 0 ? (
          <p className="text-sm text-muted-foreground">{t("achievements.nothingYet")}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allAchievements.map((a) => {
              const unlocked = unlockedKeys.has(a.key);
              return (
                <Card
                  key={a.key}
                  className={cn(
                    "border-border/60 transition-colors",
                    unlocked ? "bg-primary/5" : "opacity-50"
                  )}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="text-2xl">{a.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.hint}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
