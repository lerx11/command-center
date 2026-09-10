"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { taskSchema, energyTaskSchema } from "@/lib/validations";
import { todayISO, addDays } from "@/lib/utils";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    project_id: formData.get("project_id") || null,
    type: formData.get("type"),
    status: formData.get("status") || "TODO",
    priority: formData.get("priority") || "NORMAL",
    due_date: formData.get("due_date") || null,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      ...parsed.data,
      description: parsed.data.description ?? "",
      project_id: parsed.data.project_id ?? null,
      due_date: parsed.data.due_date || null,
    })
    .select("id")
    .single();
  if (error) return { error: "errors.couldNotCreateTask" };

  revalidatePath("/app/today");
  revalidatePath("/app/projects");
  return { success: true as const, taskId: data.id };
}

export async function updateTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    project_id: formData.get("project_id") || null,
    type: formData.get("type"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    due_date: formData.get("due_date") || null,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };

  const { error } = await supabase
    .from("tasks")
    .update({
      ...parsed.data,
      description: parsed.data.description ?? "",
      project_id: parsed.data.project_id ?? null,
      due_date: parsed.data.due_date || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotUpdateTask" };

  revalidatePath("/app/today");
  revalidatePath("/app/projects");
  return { success: true as const };
}

export async function deleteTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotDeleteTask" };

  revalidatePath("/app/today");
  revalidatePath("/app/projects");
  return { success: true as const };
}

export async function setTaskStatusAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as
    | "TODO"
    | "IN_PROGRESS"
    | "DONE"
    | "PARKED"
    | "CANCELLED";

  const patch: Record<string, unknown> = { status };
  patch.completed_at = status === "DONE" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotUpdateTask" };

  revalidatePath("/app/today");
  revalidatePath("/app/projects");
  revalidatePath("/app/review");
  return { success: true as const };
}

export async function parkTaskAction(formData: FormData) {
  const fd = new FormData();
  fd.set("id", String(formData.get("id")));
  fd.set("status", "PARKED");
  return setTaskStatusAction(fd);
}

export async function moveTaskToTomorrowAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const tomorrow = addDays(todayISO(), 1);
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: tomorrow, status: "TODO" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotMoveTask" };

  revalidatePath("/app/today");
  revalidatePath("/app/review");
  return { success: true as const };
}

// Link a task to today's daily plan as the big win / money / asset slot.
export async function setDailyPlanTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const taskId = String(formData.get("taskId"));
  const slot = String(formData.get("slot")); // big_win | money | asset
  const date = todayISO();

  const fieldMap: Record<string, string> = {
    big_win: "big_win_task_id",
    money: "money_task_id",
    asset: "asset_task_id",
  };
  const field = fieldMap[slot];
  if (!field) return { error: "errors.unknownSlot" };

  // Ensure a plan exists for today.
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

  // If a task was already in this slot, set it back to TODO (no longer today's pick).
  const { data: current } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  const previousId = (current as Record<string, string | null> | null)?.[
    field
  ] as string | undefined;
  if (previousId && previousId !== taskId) {
    await supabase
      .from("tasks")
      .update({ status: "TODO" })
      .eq("id", previousId)
      .eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("daily_plans")
    .update({ [field]: taskId })
    .eq("id", planId);
  if (error) return { error: "errors.couldNotSetTask" };

  // Mark the chosen task as IN_PROGRESS (it is now today's focus candidate).
  await supabase
    .from("tasks")
    .update({ status: "IN_PROGRESS", due_date: date })
    .eq("id", taskId)
    .eq("user_id", user.id);

  revalidatePath("/app/today");
  return { success: true as const };
}

export async function clearDailyPlanSlotAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const slot = String(formData.get("slot")); // big_win | money | asset
  const fieldMap: Record<string, string> = {
    big_win: "big_win_task_id",
    money: "money_task_id",
    asset: "asset_task_id",
  };
  const field = fieldMap[slot];
  if (!field) return { error: "errors.unknownSlot" };

  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id, big_win_task_id, money_task_id, asset_task_id")
    .eq("user_id", user.id)
    .eq("date", todayISO())
    .maybeSingle();
  if (!plan) return { success: true as const };

  const planRow = plan as unknown as Record<string, string | null>;
  const currentTaskId = planRow[field];
  if (currentTaskId) {
    await supabase
      .from("tasks")
      .update({ status: "TODO" })
      .eq("id", currentTaskId)
      .eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("daily_plans")
    .update({ [field]: null })
    .eq("id", planRow.id);
  if (error) return { error: "errors.couldNotClearSlot" };

  revalidatePath("/app/today");
  return { success: true as const };
}

// Energy tasks
export async function createEnergyTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const parsed = energyTaskSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };

  // Ensure today's plan exists (energy tasks attach to it).
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
    category: parsed.data.category,
    title: parsed.data.title,
    completed: false,
  });
  if (error) return { error: "errors.couldNotCreateEnergyTask" };

  revalidatePath("/app/today");
  return { success: true as const };
}

export async function toggleEnergyTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const completed = formData.get("completed") === "true";

  const { error } = await supabase
    .from("energy_tasks")
    .update({ completed: !completed })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotUpdateEnergyTask" };

  revalidatePath("/app/today");
  return { success: true as const };
}

export async function deleteEnergyTaskAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("energy_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotDeleteEnergyTask" };

  revalidatePath("/app/today");
  return { success: true as const };
}

// Focus session persistence
export async function saveFocusSessionAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const taskId = String(formData.get("taskId") || "null");
  const startedAt = String(formData.get("startedAt"));
  const durationSeconds = Number(formData.get("durationSeconds") || 0);

  const { error } = await supabase.from("focus_sessions").insert({
    user_id: user.id,
    task_id: taskId === "null" ? null : taskId,
    started_at: startedAt,
    ended_at: new Date().toISOString(),
    duration_seconds: Math.max(0, Math.floor(durationSeconds)),
  });
  if (error) return { error: "errors.couldNotSaveFocusSession" };

  revalidatePath("/app/dashboard");
  revalidatePath("/app/today");
  return { success: true as const };
}

// Add a task to today's plan — auto-assigns slot based on task type.
export async function addToTodayAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const taskId = String(formData.get("taskId"));

  // Fetch the task to determine its type.
  const { data: task } = await supabase
    .from("tasks")
    .select("type")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!task) return { error: "errors.taskNotFound" };

  const typeToSlot: Record<string, string> = {
    BIG_WIN: "big_win",
    MONEY: "money",
    ASSET: "asset",
    OTHER: "big_win",
  };
  const slot = typeToSlot[task.type] ?? "big_win";

  // Delegate to setDailyPlanTaskAction logic.
  const fd = new FormData();
  fd.set("taskId", taskId);
  fd.set("slot", slot);
  return setDailyPlanTaskAction(fd);
}

// Remove a task from today's plan (finds and clears whichever slot it occupies).
export async function removeFromTodayAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const taskId = String(formData.get("taskId"));
  const date = todayISO();

  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id, big_win_task_id, money_task_id, asset_task_id")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  if (!plan) return { success: true as const };

  const planRow = plan as unknown as Record<string, string | null>;
  const slots: Array<[string, string | null]> = [
    ["big_win", planRow.big_win_task_id],
    ["money", planRow.money_task_id],
    ["asset", planRow.asset_task_id],
  ];

  let cleared = false;
  for (const [slot, id] of slots) {
    if (id === taskId) {
      const fd = new FormData();
      fd.set("slot", slot);
      await clearDailyPlanSlotAction(fd);
      cleared = true;
      break;
    }
  }

  if (cleared) {
    await supabase
      .from("tasks")
      .update({ status: "TODO" })
      .eq("id", taskId)
      .eq("user_id", user.id);
  }

  revalidatePath("/app/today");
  return { success: true as const };
}
