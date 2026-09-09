"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { projectSchema } from "@/lib/validations";
import { MAX_ACTIVE_PROJECTS } from "@/lib/constants";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function countActiveProjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ACTIVE");
  return count ?? 0;
}

export async function createProjectAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    category: formData.get("category"),
    status: formData.get("status") || "ACTIVE",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };

  // Soft limit: warn when activating beyond MAX_ACTIVE_PROJECTS.
  if (
    parsed.data.status === "ACTIVE" &&
    parsed.data.category !== "PARKING"
  ) {
    const active = await countActiveProjects(supabase, user.id);
    if (active >= MAX_ACTIVE_PROJECTS) {
      return {
        error: "errors.activeProjectsLimit",
        limit: true as const,
      };
    }
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    category: parsed.data.category,
    status: parsed.data.status,
    position: 0,
  });
  if (error) return { error: "errors.couldNotCreateProject" };

  revalidatePath("/app/projects");
  return { success: true as const };
}

// Force-create even if the active limit is exceeded (user confirmed the warning).
export async function forceCreateProjectAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    category: formData.get("category"),
    status: formData.get("status") || "ACTIVE",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    category: parsed.data.category,
    status: parsed.data.status,
    position: 0,
  });
  if (error) return { error: "errors.couldNotCreateProject" };

  revalidatePath("/app/projects");
  return { success: true as const };
}

export async function updateProjectAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    category: formData.get("category"),
    status: formData.get("status"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };

  const { error } = await supabase
    .from("projects")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      category: parsed.data.category,
      status: parsed.data.status,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotUpdateProject" };

  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${id}`);
  return { success: true as const };
}

export async function setProjectStatusAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "PARKED";

  if (status === "ACTIVE") {
    const [activeCount, currentCat] = await Promise.all([
      countActiveProjects(supabase, user.id),
      supabase
        .from("projects")
        .select("category, status")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    const wasActive = currentCat.data?.status === "ACTIVE";
    if (!wasActive && activeCount >= MAX_ACTIVE_PROJECTS && currentCat.data?.category !== "PARKING") {
      return {
        error: "errors.activeProjectsLimitShort",
        limit: true as const,
      };
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotUpdateProject" };

  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${id}`);
  return { success: true as const };
}

export async function deleteProjectAction(formData: FormData) {
  const { supabase, user } = await getUser();
  if (!user) return { error: "errors.notAuthenticated" };

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "errors.couldNotDeleteProject" };

  revalidatePath("/app/projects");
  redirect(`/app/projects`);
  return { success: true as const };
}
