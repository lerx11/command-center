"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO, addDays } from "@/lib/utils";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function upsertReviewAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const date = String(formData.get("date"));
  const moneyMoved = Number(formData.get("money_moved") || 0);
  const whatWorked = String(formData.get("what_worked") || "");
  const whatDistracted = String(formData.get("what_distracted") || "");
  const notes = String(formData.get("notes") || "");

  const { error } = await supabase
    .from("daily_reviews")
    .upsert(
      {
        user_id: user.id,
        date,
        money_moved: isNaN(moneyMoved) ? 0 : moneyMoved,
        what_worked: whatWorked,
        what_distracted: whatDistracted,
        notes,
      },
      { onConflict: "user_id, date" }
    );
  if (error) return { error: "errors.couldNotSaveReview" };

  revalidatePath("/app/review");
  revalidatePath("/app/dashboard");
  return { success: true as const };
}

// Plan tomorrow: set tomorrow's daily_plan slots + create energy tasks.
export async function planTomorrowAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const tomorrow = addDays(todayISO(), 1);
  const bigWinId = String(formData.get("big_win") || "null");
  const moneyId = String(formData.get("money") || "null");
  const assetId = String(formData.get("asset") || "null");
  const energyTitles = formData.getAll("energy_title") as string[];
  const energyCats = formData.getAll("energy_category") as string[];

  // Get or create tomorrow's plan.
  const { data: existing } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", tomorrow)
    .maybeSingle();
  let planId = existing?.id;
  if (!planId) {
    const { data: np, error } = await supabase
      .from("daily_plans")
      .insert({ user_id: user.id, date: tomorrow })
      .select("id")
      .single();
    if (error || !np) return { error: "errors.couldNotPrepareTomorrowPlan" };
    planId = np.id;
  }

  const update: Record<string, string | null> = {
    big_win_task_id: bigWinId === "null" ? null : bigWinId,
    money_task_id: moneyId === "null" ? null : moneyId,
    asset_task_id: assetId === "null" ? null : assetId,
  };
  const { error: updError } = await supabase
    .from("daily_plans")
    .update(update)
    .eq("id", planId);
  if (updError) return { error: "errors.couldNotSetTomorrowSlots" };

  // Energy tasks for tomorrow.
  for (let i = 0; i < energyTitles.length; i++) {
    const title = energyTitles[i]?.trim();
    const cat = energyCats[i];
    if (title && cat) {
      await supabase.from("energy_tasks").insert({
        user_id: user.id,
        daily_plan_id: planId,
        category: cat,
        title,
        completed: false,
      });
    }
  }

  revalidatePath("/app/today");
  revalidatePath("/app/review");
  return { success: true as const, tomorrow };
}
