"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const DEFAULT_GOALS: Array<{
  title: string;
  min_amount: number;
  max_amount: number;
}> = [
  { title: "86 000 ₽", min_amount: 86000, max_amount: 86000 },
  { title: "300 000 ₽", min_amount: 300000, max_amount: 300000 },
  { title: "1 000 000 ₽", min_amount: 1000000, max_amount: 1000000 },
  { title: "10 000 000 ₽", min_amount: 10000000, max_amount: 10000000 },
];

// Seed the default milestone goals on first use. Idempotent.
export async function seedDefaultGoalsAction() {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const { data: existing } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  if (existing && existing.length > 0) return { success: true as const };

  const rows = DEFAULT_GOALS.map((g, i) => ({
    user_id: user.id,
    title: g.title,
    min_amount: g.min_amount,
    max_amount: g.max_amount,
    position: i,
    status: i === 0 ? "ACTIVE" : "LOCKED",
  }));
  const { error } = await supabase.from("goals").insert(rows);
  if (error) return { error: "errors.couldNotCreateGoal" };

  revalidatePath("/app/workspace");
  revalidatePath("/app/today");
  return { success: true as const };
}

// Mark a goal as achieved; unlocks the next LOCKED goal as ACTIVE.
export async function markGoalAchievedAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));

  // Find the goal and its position.
  const { data: goal } = await supabase
    .from("goals")
    .select("id, position, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!goal) return { error: "errors.goalNotFound" };

  // If a different goal is currently ACTIVE, lock it first.
  await supabase
    .from("goals")
    .update({ status: "LOCKED" })
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .neq("id", goal.id);

  // Mark the selected goal achieved.
  await supabase
    .from("goals")
    .update({ status: "ACHIEVED" })
    .eq("id", goal.id)
    .eq("user_id", user.id);

  // Promote the next LOCKED goal (by position) to ACTIVE.
  const { data: nextGoals } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "LOCKED")
    .gt("position", goal.position)
    .order("position", { ascending: true })
    .limit(1);
  const next = nextGoals?.[0];
  if (next) {
    await supabase
      .from("goals")
      .update({ status: "ACTIVE" })
      .eq("id", next.id)
      .eq("user_id", user.id);
  }

  // Re-target the active goal's projects: projects that pointed at the old
  // active goal (now achieved) are released. Projects without a goal stay on
  // whichever goal becomes ACTIVE.
  await supabase
    .from("projects")
    .update({ goal_id: null })
    .eq("user_id", user.id)
    .eq("goal_id", goal.id);

  revalidatePath("/app/workspace");
  revalidatePath("/app/today");
  return { success: true as const };
}

// Set a specific goal as ACTIVE (unlocking it), locking the current active one.
export async function setActiveGoalAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  await supabase
    .from("goals")
    .update({ status: "LOCKED" })
    .eq("user_id", user.id)
    .eq("status", "ACTIVE");

  await supabase
    .from("goals")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/app/workspace");
  revalidatePath("/app/today");
  return { success: true as const };
}

// Create a custom goal (positioned after existing goals, LOCKED by default; or
// ACTIVE if there is no active goal yet).
export async function createGoalAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const title = String(formData.get("title") || "").trim();
  const min = Number(formData.get("min_amount")) || 0;
  const max = Number(formData.get("max_amount")) || min;
  if (!title) return { error: "errors.titleRequired" };

  const { data: goals } = await supabase
    .from("goals")
    .select("id, status, position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const last = goals?.[0];
  const { data: activeRows } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .limit(1);
  const hasActive = (activeRows?.length ?? 0) > 0;

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title,
    min_amount: min,
    max_amount: max,
    position: (last?.position ?? -1) + 1,
    status: hasActive ? "LOCKED" : "ACTIVE",
  });
  if (error) return { error: "errors.couldNotCreateGoal" };

  revalidatePath("/app/workspace");
  revalidatePath("/app/today");
  return { success: true as const };
}

// Make the active goal's cash amount the current target in Today (reads the
// ACTIVE goal). Helper used by pages.
export async function getActiveGoal() {
  const { supabase, user } = await getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();
  return data as unknown;
}