"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { updateProfileAction, logoutAction } from "@/app/app/settings/actions";
import type { Profile } from "@/lib/types";

export function SettingsView({
  profile,
  email,
}: {
  profile: Pick<Profile, "name"> | null;
  email: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(profile?.name ?? "");

  const save = () => {
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const res = await updateProfileAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Profile updated ✓");
    });
  };

  const logout = () => {
    const fd = new FormData();
    startTransition(async () => {
      try {
        await logoutAction(fd);
      } catch {
        toast.error("Could not log out.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name is shown in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={email ?? ""} disabled className="opacity-70" />
          </div>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Dark mode is the default.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={logout} disabled={pending}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
