"use client";

import { useT } from "@/components/i18n/i18n-provider";

export default function OfflinePage() {
  const t = useT();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
        {t("brand.command")}
      </p>
      <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight">
        {t("brand.center")}
      </h1>
      <p className="mt-6 max-w-sm text-sm text-muted-foreground">
        {t("offline.description")}
      </p>
    </div>
  );
}
