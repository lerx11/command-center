"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { profileSchema } from "@/lib/validations";
import { logoutAction } from "@/app/(auth)/actions";

export { logoutAction };

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid name" };

  const { error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name })
    .eq("id", user.id);
  if (error) return { error: "Could not update profile." };

  revalidatePath("/app/settings", "layout");
  revalidatePath("/app", "layout");
  return { success: true as const };
}
