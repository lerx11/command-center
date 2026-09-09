import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getT } from "@/lib/i18n";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { t } = await getT();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell profileName={profile?.name || user.email?.split("@")[0] || t("profile.fallbackName")}>
      {children}
    </AppShell>
  );
}
