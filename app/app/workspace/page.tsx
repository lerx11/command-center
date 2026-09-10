import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";
import { WorkspaceTree } from "@/components/workspace/workspace-tree";
import type {
  CashTarget as CashTargetType,
  EnergyTask,
  Project,
  Subtask,
  Task,
} from "@/lib/types";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayISO();

  const [
    { data: ct },
    { data: projectsData },
    { data: tasksData },
    { data: subtasksData },
    { data: energyData },
    { data: planData },
  ] = await Promise.all([
    supabase
      .from("cash_targets")
      .select("*")
      .eq("user_id", user.id)
      .eq("period", currentPeriod())
      .maybeSingle(),
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "DONE")
      .neq("status", "CANCELLED")
      .order("created_at", { ascending: false }),
    supabase.from("subtasks").select("*").order("position", { ascending: true }),
    supabase
      .from("energy_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true }),
    supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
  ]);

  const energyTasks = planData ? ((energyData ?? []) as EnergyTask[]) : [];

  return (
    <WorkspaceTree
      cashTarget={(ct ?? null) as CashTargetType | null}
      projects={(projectsData ?? []) as Project[]}
      tasks={(tasksData ?? []) as Task[]}
      subtasks={(subtasksData ?? []) as Subtask[]}
      energyTasks={energyTasks}
    />
  );
}
