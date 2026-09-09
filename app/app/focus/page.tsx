import { createClient } from "@/utils/supabase/server";
import { getT } from "@/lib/i18n";
import { FocusTimer } from "@/components/focus/focus-timer";
import { PomodoroTimer } from "@/components/focus/pomodoro-timer";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Task } from "@/lib/types";

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

  if (!rawTaskId || !UUID_RE.test(rawTaskId)) {
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

  const taskId = rawTaskId;

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

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

  // mode=pomodoro (or no mode — Pomodoro is the default from Today's BIG_WIN/MONEY/ASSET).
  if (mode === "free") return <FocusTimer task={task as Task} />;
  return <PomodoroTimer task={task as Task} />;
}
