import { createClient } from "@/utils/supabase/server";
import { todayISO } from "@/lib/utils";
import { WorkspaceTree } from "@/components/workspace/workspace-tree";
import type {
  CashTarget as CashTargetType,
  EnergyTask,
  Goal,
  Project,
  Subtask,
  Task,
} from "@/lib/types";

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const DEFAULT_GOALS: Array<{
  title: string;
  min_amount: number;
  max_amount: number;
}> = [
  { title: "86 000 ₽", min_amount: 86000, max_amount: 86000 },
  { title: "300 000 ₽", min_amount: 300000, max_amount: 300000 },
  { title: "1 000 000 ₽", min_amount: 1000000, max_amount: 1000000 },
  { title: "10 000 000 ₽", min_amount: 10000000, max_amount: 10000000 },
];

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
    { data: goalsData },
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
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
  ]);

  // Seed default milestone goals on first visit (idempotent).
  let goals = (goalsData ?? []) as Goal[];
  if (goals.length === 0) {
    const rows = DEFAULT_GOALS.map((g, i) => ({
      user_id: user.id,
      title: g.title,
      min_amount: g.min_amount,
      max_amount: g.max_amount,
      position: i,
      status: i === 0 ? "ACTIVE" : "LOCKED",
    }));
    const { data: seeded } = await supabase.from("goals").insert(rows).select("*");
    goals = (seeded ?? []) as Goal[];
  }

  const energyTasks = planData ? ((energyData ?? []) as EnergyTask[]) : [];

  return (
    <WorkspaceTree
      cashTarget={(ct ?? null) as CashTargetType | null}
      goals={goals}
      projects={(projectsData ?? []) as Project[]}
      tasks={(tasksData ?? []) as Task[]}
      subtasks={(subtasksData ?? []) as Subtask[]}
      energyTasks={energyTasks}
    />
  );
}
