"use client";

import { Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/i18n-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function Loading({ label }: { label?: string }) {
  const t = useT();
  const display = label ?? t("loading.default");
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {display}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

/**
 * Full-page loading skeleton used by route `loading.tsx` files.
 * Mirrors the max-width container of AppShell so layout does not shift.
 */
export function PageLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Hero / stat block */}
      <Skeleton className="h-32 w-full" />

      {/* Cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>

      {/* Section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
