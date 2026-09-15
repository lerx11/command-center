// Shared gamification logic. Used by server actions (task completion,
// pomodoro completion) to compute and persist achievements.

// Recognized achievement keys.
export const ACHIEVEMENT_KEYS = [
  "first_task",
  "core_master",
  "pomodoro_master",
  "streak_7",
  "streak_30",
] as const;
export type AchievementKey = (typeof ACHIEVEMENT_KEYS)[number];

export function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Unique calendar dates (YYYY-MM-DD) for a list of ISO timestamps.
function distinctDates(isoArray: string[]): Set<string> {
  return new Set(isoArray.map((iso) => iso.slice(0, 10)));
}

export function currentStreak(dates: Set<string>): number {
  const active = new Set<string>(dates);
  active.add(todayStr());
  let streak = 0;
  const check = new Date(todayStr() + "T00:00:00Z");
  for (let i = 0; i < 366; i++) {
    if (active.has(shift(new Date(check), -i))) streak++;
    else break;
  }
  return streak;
}

function shift(base: Date, days: number): string {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type SupabaseLike = {
  from: (table: string) => any;
};

/**
 * Compute a user's current gamification context.
 */
export async function computeUserContext(
  supabase: SupabaseLike,
  userId: string
) {
  const fromISORef = startOfTodayISO();

  const [{ data: doneTasks }, { data: sessions }, { data: plan }, { data: slotTasksData }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("completed_at, status")
        .eq("user_id", userId)
        .eq("status", "DONE")
        .gte("completed_at", fromISORef),
      supabase
        .from("focus_sessions")
        .select("started_at")
        .eq("user_id", userId)
        .gte("started_at", fromISORef),
      supabase
        .from("daily_plans")
        .select("id, big_win_task_id, money_task_id, asset_task_id")
        .eq("user_id", userId)
        .eq("date", todayStr())
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id, status")
        .eq("user_id", userId)
        .neq("status", "CANCELLED"),
    ]);

  // Aggregate activity dates across all history for streaks (parallel).
  const [{ data: allDone }, { data: allSessions }] = await Promise.all([
    supabase
      .from("tasks")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("status", "DONE")
      .not("completed_at", "is", null),
    supabase
      .from("focus_sessions")
      .select("started_at")
      .eq("user_id", userId),
  ]);

  const activityDates = distinctDates([
    ...(allDone ?? []).map((r: any) => r.completed_at as string),
    ...(allSessions ?? []).map((r: any) => r.started_at as string),
  ]);

  const tasksDoneToday = (doneTasks ?? []).length;

  // Core complete = today's plan has 3 slots and all are marked DONE.
  const slotTaskMap = new Map<string, string>(
    (slotTasksData ?? []).map((t: any) => [t.id as string, t.status as string])
  );
  let coreComplete = false;
  if (plan) {
    const slotIds = [plan.big_win_task_id, plan.money_task_id, plan.asset_task_id].filter(
      Boolean
    ) as string[];
    coreComplete =
      slotIds.length === 3 && slotIds.every((id) => slotTaskMap.get(id) === "DONE");
  }

  const focusSessionsToday = (sessions ?? []).length;
  const streak = currentStreak(activityDates);

  return {
    tasksDoneToday,
    coreComplete,
    focusSessionsToday,
    streak,
  };
}

/**
 * Persist any newly unlocked achievements; returns the list of newly unlocked
 * achievement keys.
 */
export async function syncAchievements(
  supabase: SupabaseLike,
  userId: string,
  ctx: Awaited<ReturnType<typeof computeUserContext>>
): Promise<AchievementKey[]> {
  const toUnlock: AchievementKey[] = [];
  if (ctx.tasksDoneToday >= 1) toUnlock.push("first_task");
  if (ctx.coreComplete) toUnlock.push("core_master");
  if (ctx.focusSessionsToday >= 4) toUnlock.push("pomodoro_master");
  if (ctx.streak >= 7) toUnlock.push("streak_7");
  if (ctx.streak >= 30) toUnlock.push("streak_30");
  if (toUnlock.length === 0) return [];

  const { data: existing } = await supabase
    .from("achievements")
    .select("key")
    .eq("user_id", userId);
  const have = new Set((existing ?? []).map((r: any) => r.key as string));

  const fresh = toUnlock.filter((key) => !have.has(key));
  if (fresh.length > 0) {
    await supabase
      .from("achievements")
      .insert(fresh.map((key) => ({ user_id: userId, key })));
  }
  return fresh;
}