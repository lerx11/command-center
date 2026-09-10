import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/server";
import { getT } from "@/lib/i18n";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/shared/loading";
import { FocusRecovery } from "@/components/focus/focus-recovery";
import Link from "next/link";
import type { Subtask, Task } from "@/lib/types";

// Heavy client-side timer components — lazy-load to reduce initial bundle.
const FocusTimer = dynamic(
  () => import("@/components/focus/focus-timer").then((m) => m.FocusTimer),
  { loading: () => <PageLoading /> }
);
const PomodoroTimer = dynamic(
  () => import("@/components/focus/pomodoro-timer").then((m) => m.PomodoroTimer),
  { loading: () => <PageLoading /> }
);

// UUID v4 format — matches what Supabase gen_random_uuid() produces.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string | string[]; mode?: string | string[] }>;
}) {
  const { t } = await getT();
  const params = await searchParams;
  // searchParams can be string | string[] — take the first value safely.
  const rawTaskId = Array.isArray(params.task) ? params.task[0] : params.task;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;

  // No task in URL — check for active session via client component
  if (!rawTaskId || !UUID_RE.test(rawTaskId)) {
    const notFound = (
      <div className="flex min-h-svh items-center justify-center">
        <EmptyState
          title={t("focus.notFound")}
          action={
            <Button asChild>
              <Link href="/app/today">{t("focus.goToToday")}</Link>
            </Button>
          }
        />
      </div>
    );
    // If there's no task param at all, try to recover from session
    if (!rawTaskId) {
      return <FocusRecovery notFound={notFound} />;
    }
    return notFound;
  }

  const taskId = rawTaskId;

  const supabase = await createClient();
  const [{ data: task, error }, { data: subtasksData }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", taskId).maybeSingle(),
    supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true }),
  ]);

  if (error || !task) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <EmptyState
          title={t("focus.notFound")}
          action={
            <Button asChild>
              <Link href="/app/today">{t("focus.goToToday")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const subtasks = (subtasksData ?? []) as Subtask[];

  // mode=pomodoro (or no mode — Pomodoro is the default from Today's BIG_WIN/MONEY/ASSET).
  if (mode === "free")
    return <FocusTimer task={task as Task} subtasks={subtasks} />;
  return <PomodoroTimer task={task as Task} subtasks={subtasks} />;
}
