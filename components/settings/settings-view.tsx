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
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { useT } from "@/components/i18n/i18n-provider";
import { updateProfileAction, logoutAction } from "@/app/app/settings/actions";
import type { Profile } from "@/lib/types";

export function SettingsView({
  profile,
  email,
}: {
  profile: Pick<Profile, "name"> | null;
  email: string | null;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(profile?.name ?? "");

  const save = () => {
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const res = await updateProfileAction(fd);
      if (res?.error) toast.error(t(res.error));
      else toast.success(t("toasts.profileUpdated"));
    });
  };

  const logout = () => {
    const fd = new FormData();
    startTransition(async () => {
      try {
        await logoutAction(fd);
      } catch {
        toast.error(t("toasts.couldNotLogout"));
      }
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("settings.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("settings.email")}</label>
            <Input value={email ?? ""} disabled className="opacity-70" />
          </div>
          <Button onClick={save} disabled={pending}>
            {pending ? t("common.saving") : t("settings.saveProfile")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("theme.title")}</CardTitle>
          <CardDescription>{t("theme.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("language.title")}</CardTitle>
          <CardDescription>{t("language.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageToggle />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{t("settings.account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={logout} disabled={pending}>
            {t("settings.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
