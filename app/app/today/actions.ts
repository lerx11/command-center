"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function upsertCashTargetAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const period = currentPeriod();
  const min = Number(formData.get("min_target") || 0);
  const max = Number(formData.get("max_target") || 0);
  const received = Number(formData.get("received") || 0);
  const in_progress = Number(formData.get("in_progress") || 0);
  const expected = Number(formData.get("expected") || 0);

  const { error } = await supabase
    .from("cash_targets")
    .upsert(
      {
        user_id: user.id,
        period,
        min_target: isNaN(min) ? 0 : min,
        max_target: isNaN(max) ? 0 : max,
        received: isNaN(received) ? 0 : received,
        in_progress: isNaN(in_progress) ? 0 : in_progress,
        expected: isNaN(expected) ? 0 : expected,
      },
      { onConflict: "user_id, period" }
    );
  if (error) return { error: "errors.couldNotSaveCashTarget" };

  revalidatePath("/app/today");
  return { success: true as const };
}

// Create a quick one-line energy task for today.
export async function quickEnergyCreateAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const category = String(formData.get("category")) as "BODY" | "MIND" | "RECOVERY";
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "errors.titleRequired" };

  const date = todayISO();
  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  let planId = plan?.id;
  if (!planId) {
    const { data: np, error } = await supabase
      .from("daily_plans")
      .insert({ user_id: user.id, date })
      .select("id")
      .single();
    if (error || !np) return { error: "errors.couldNotPreparePlan" };
    planId = np.id;
  }

  const { error } = await supabase.from("energy_tasks").insert({
    user_id: user.id,
    daily_plan_id: planId,
    category,
    title,
    completed: false,
  });
  if (error) return { error: "errors.couldNotAddEnergyTask" };

  revalidatePath("/app/today");
  return { success: true as const };
}
