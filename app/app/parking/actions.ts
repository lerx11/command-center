"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";

// Global quick capture — new ideas always go to Parking Lot, never to Today.
export async function quickCaptureAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "What came to mind?" };

  const { error } = await supabase.from("parking_ideas").insert({
    user_id: user.id,
    title,
    description: "",
    status: "NEW",
  });

  if (error) return { error: "Could not save the idea." };

  revalidatePath("/app/parking");
  return { success: true as const };
}

export async function deleteParkingIdeaAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("parking_ideas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Could not delete." };
  revalidatePath("/app/parking");
  return { success: true as const };
}

export async function moveParkingIdeaAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id"));
  const target = String(formData.get("target") ?? ""); // TODAY | PROJECT | LATER
  const projectId = String(formData.get("projectId") || "null");

  // Mark as converted.
  const { error: updError } = await supabase
    .from("parking_ideas")
    .update({ status: "CONVERTED", converted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (updError) return { error: "Could not update the idea." };

  // Fetch the idea title to convert into a task.
  const { data: idea } = await supabase
    .from("parking_ideas")
    .select("title, description")
    .eq("id", id)
    .maybeSingle();

  if (!idea) return { error: "Idea not found." };

  if (target === "TODAY") {
    const { error: tErr } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: idea.title,
      description: idea.description ?? "",
      type: "OTHER",
      status: "TODO",
      priority: "NORMAL",
      due_date: todayISO(),
      project_id: projectId === "null" ? null : projectId,
    });
    if (tErr) return { error: "Could not convert to task." };
  } else if (target === "PROJECT") {
    const { error: tErr } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: idea.title,
      description: idea.description ?? "",
      type: "OTHER",
      status: "TODO",
      priority: "NORMAL",
      project_id: projectId === "null" ? null : projectId,
    });
    if (tErr) return { error: "Could not convert to task." };
  }
  // LATER: just marks status as converted (no task created).

  revalidatePath("/app/parking");
  revalidatePath("/app/projects");
  revalidatePath("/app/today");
  return { success: true as const };
}

export async function assignParkingToProjectAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = String(formData.get("id"));
  const projectId = String(formData.get("projectId") || "null");

  const { error } = await supabase
    .from("parking_ideas")
    .update({ project_id: projectId === "null" ? null : projectId })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Could not move." };
  revalidatePath("/app/parking");
  return { success: true as const };
}
