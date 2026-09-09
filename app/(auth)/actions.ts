"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/lib/validations";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "errors.somethingWentWrong";
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "errors.invalidEmailOrPassword" };
  }

  const redirectTo = formData.get("redirect") as string | null;
  revalidatePath("/", "layout");
  redirect(redirectTo && redirectTo.startsWith("/app") ? redirectTo : "/app/today");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${origin}/app/today`,
    },
  });

  if (error) {
    return { error: getErrorMessage(error) };
  }

  // Email confirmation may be required (default Supabase setting).
  // If the user is signed in immediately, go to onboarding → app.
  if (data.user && data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    success: "auth.checkInbox" as const,
  };
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "errors.invalidInput" };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/reset-password` }
  );

  if (error) {
    return { error: getErrorMessage(error) };
  }

  return { success: "auth.resetLinkSent" as const };
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 6) {
    return { error: "errors.passwordMinLength" };
  }
  if (password !== confirm) {
    return { error: "errors.passwordsDoNotMatch" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: getErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/app/today");
}

export async function logoutAction(_formData?: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
