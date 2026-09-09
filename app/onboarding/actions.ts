"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";

export async function onboardingAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const bigWin = String(formData.get("bigWin") ?? "").trim();
  const money = String(formData.get("money") ?? "").trim();
  const asset = String(formData.get("asset") ?? "").trim();

  const date = todayISO();

  // Get or create today's daily plan.
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  let planId = existingPlan?.id;

  if (!planId) {
    const { data: newPlan, error } = await supabase
      .from("daily_plans")
      .insert({ user_id: user.id, date })
      .select("id")
      .single();
    if (error || !newPlan) {
      redirect("/app/today");
    }
    planId = newPlan.id;
  }

  // Create the three starter tasks and link them to the plan.
  const seeds: Array<{ title: string; type: string; field: string }> = [];
  if (bigWin) seeds.push({ title: bigWin, type: "BIG_WIN", field: "big_win_task_id" });
  if (money) seeds.push({ title: money, type: "MONEY", field: "money_task_id" });
  if (asset) seeds.push({ title: asset, type: "ASSET", field: "asset_task_id" });

  const updates: Record<string, string> = {};

  for (const seed of seeds) {
    const { data: task } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: seed.title,
        type: seed.type,
        status: "TODO",
        priority: seed.type === "BIG_WIN" ? "HIGH" : "NORMAL",
        due_date: date,
      })
      .select("id")
      .single();

    if (task) {
      updates[seed.field] = task.id;
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("daily_plans").update(updates).eq("id", planId);
  }

  revalidatePath("/app/today", "layout");
  redirect("/app/today");
}
