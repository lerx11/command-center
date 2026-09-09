import { createClient } from "@/utils/supabase/server";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SettingsView
      profile={profile as { name: string | null } | null}
      email={user.email ?? null}
    />
  );
}
