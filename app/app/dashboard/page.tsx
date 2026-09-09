import { createClient } from "@/utils/supabase/server";
import { todayISO, formatDuration, formatMoney } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Crosshair, Coins, CheckCircle2, Timer, Wallet } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
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

  const [
    bigWinsToday,
    moneyToday,
    tasksToday,
    bigWinsWeek,
    moneyWeek,
    tasksWeek,
  ] = await Promise.all([
    run("BIG_WIN", "today"),
    run("MONEY", "today"),
    run("ALL", "today"),
    run("BIG_WIN", "week"),
    run("MONEY", "week"),
    run("ALL", "week"),
  ]);

  // Focus time.
  const { data: todayFocus } = await supabase
    .from("focus_sessions")
    .select("duration_seconds")
    .eq("user_id", user.id)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd);
  const todayFocusSeconds = (todayFocus ?? []).reduce(
    (acc, r: { duration_seconds: number }) => acc + (r.duration_seconds ?? 0),
    0
  );

  const { data: weekFocus } = await supabase
    .from("focus_sessions")
    .select("duration_seconds")
    .eq("user_id", user.id)
    .gte("started_at", weekStart);
  const weekFocusSeconds = (weekFocus ?? []).reduce(
    (acc, r: { duration_seconds: number }) => acc + (r.duration_seconds ?? 0),
    0
  );

  // Money moved (reviews).
  const { data: todayReview } = await supabase
    .from("daily_reviews")
    .select("money_moved")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  const todayMoney = todayReview?.money_moved ?? 0;

  const { data: weekReviews } = await supabase
    .from("daily_reviews")
    .select("money_moved")
    .eq("user_id", user.id)
    .gte("date", startOfWeek.toISOString().slice(0, 10));
  const weekMoney = (weekReviews ?? []).reduce(
    (acc, r: { money_moved: number | null }) => acc + (r.money_moved ?? 0),
    0
  );

  const metrics = [
    {
      label: "Big Wins",
      icon: Crosshair,
      today: bigWinsToday,
      week: bigWinsWeek,
    },
    {
      label: "Money actions",
      icon: Coins,
      today: moneyToday,
      week: moneyWeek,
    },
    {
      label: "Tasks done",
      icon: CheckCircle2,
      today: tasksToday,
      week: tasksWeek,
    },
    {
      label: "Focus time",
      icon: Timer,
      today: formatDuration(todayFocusSeconds),
      week: formatDuration(weekFocusSeconds),
    },
    {
      label: "Money moved",
      icon: Wallet,
      today: formatMoney(todayMoney),
      week: formatMoney(weekMoney),
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <EmptyState
          title="No activity yet this week."
          description="Complete a task or run a focus session to see your progress here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

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
                      Today
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular">
                      {m.today}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      This week
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
    </div>
  );
}
