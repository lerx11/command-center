"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFocusSession } from "@/components/focus/focus-session-provider";
import { PageLoading } from "@/components/shared/loading";

/**
 * Client component rendered when /app/focus is loaded without a ?task= param.
 * Checks if there's an active focus session and redirects to the task.
 * If no session — shows the "no task" state (handled by parent).
 */
export function FocusRecovery({ notFound }: { notFound: React.ReactNode }) {
  const router = useRouter();
  const { session } = useFocusSession();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for session to hydrate from localStorage
    if (session) {
      const params = new URLSearchParams();
      params.set("task", session.taskId);
      if (session.mode === "free") params.set("mode", "free");
      router.replace(`/app/focus?${params.toString()}`);
    } else {
      // Give localStorage a moment to hydrate before showing "not found"
      const timer = setTimeout(() => setChecked(true), 300);
      return () => clearTimeout(timer);
    }
  }, [session, router]);

  // If no session after hydration check, show the "not found" fallback
  if (!session && checked) return <>{notFound}</>;

  // While checking or redirecting — show loading
  return (
    <div className="flex min-h-svh items-center justify-center">
      <PageLoading />
    </div>
  );
}
