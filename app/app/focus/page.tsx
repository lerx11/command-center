import { createClient } from "@/utils/supabase/server";
import { FocusTimer } from "@/components/focus/focus-timer";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Task } from "@/lib/types";

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const { task: taskId } = await searchParams;

  if (!taskId) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <EmptyState
          title="No task selected for focus."
          description="Pick one task from Today to focus on."
          action={
            <Button asChild>
              <Link href="/app/today">Go to Today</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <EmptyState
          title="Task not found."
          action={
            <Button asChild>
              <Link href="/app/today">Go to Today</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <FocusTimer task={task as Task} />;
}
