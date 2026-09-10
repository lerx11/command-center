"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Target,
  FolderKanban,
  CheckCircle2,
  Circle,
  Zap,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/i18n-provider";
import {
  PROJECT_CATEGORY_META,
  TASK_TYPE_META,
  type ProjectCategory,
} from "@/lib/constants";
import type {
  CashTarget as CashTargetType,
  EnergyTask,
  Project,
  Subtask,
  Task,
} from "@/lib/types";

type BranchKey = "money" | "asset" | "energy" | "parking";

const BRANCH_META: Record<
  BranchKey,
  { icon: LucideIcon; color: string; borderColor: string; bgColor: string }
> = {
  money: {
    icon: Target,
    color: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
  },
  asset: {
    icon: FolderKanban,
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-500/5",
  },
  energy: {
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
  },
  parking: {
    icon: Circle,
    color: "text-muted-foreground",
    borderColor: "border-l-muted",
    bgColor: "bg-muted/30",
  },
};

export function WorkspaceTree({
  cashTarget,
  projects,
  tasks,
  subtasks,
  energyTasks,
}: {
  cashTarget: CashTargetType | null;
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  energyTasks: EnergyTask[];
}) {
  const t = useT();

  // Group projects by branch
  const moneyProjects = projects.filter(
    (p) => p.category === "CASH_NOW" || p.category === "CASH_ENGINE"
  );
  const assetProjects = projects.filter((p) => p.category === "ASSET");
  const parkingProjects = projects.filter((p) => p.category === "PARKING");

  const hasAnyProjects = projects.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("workspace.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("workspace.subtitle")}
        </p>
      </div>

      {/* Goal node */}
      {cashTarget ? (
        <div className="rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-foreground" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("workspace.goal")}
              </p>
              <p className="text-lg font-bold">
                ${cashTarget.min_target?.toLocaleString() ?? 0} – ${cashTarget.max_target?.toLocaleString() ?? 0}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("workspace.cashTarget")}
            </span>
          </div>
        </div>
      ) : (
        <EmptyGoalCard />
      )}

      {/* Empty state */}
      {!hasAnyProjects && cashTarget ? (
        <EmptyProjectsCard />
      ) : (
        <div className="space-y-2">
          {/* MONEY branch */}
          {moneyProjects.length > 0 && (
            <Branch
              branchKey="money"
              label={t("workspace.money")}
              count={moneyProjects.length}
            >
              {moneyProjects.map((p) => (
                <ProjectNode
                  key={p.id}
                  project={p}
                  tasks={tasks.filter((t) => t.project_id === p.id)}
                  subtasks={subtasks}
                />
              ))}
            </Branch>
          )}

          {/* ASSET branch */}
          {assetProjects.length > 0 && (
            <Branch
              branchKey="asset"
              label={t("workspace.asset")}
              count={assetProjects.length}
            >
              {assetProjects.map((p) => (
                <ProjectNode
                  key={p.id}
                  project={p}
                  tasks={tasks.filter((t) => t.project_id === p.id)}
                  subtasks={subtasks}
                />
              ))}
            </Branch>
          )}

          {/* ENERGY branch */}
          {energyTasks.length > 0 && (
            <Branch
              branchKey="energy"
              label={t("workspace.energy")}
              count={energyTasks.length}
            >
              {energyTasks.map((et) => (
                <div
                  key={et.id}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm"
                >
                  <Zap className="size-3.5 text-amber-500" />
                  <span className="flex-1">{et.title}</span>
                  {et.completed && (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  )}
                </div>
              ))}
            </Branch>
          )}

          {/* PARKING branch — collapsed by default */}
          {parkingProjects.length > 0 && (
            <Branch
              branchKey="parking"
              label={t("workspace.parking")}
              count={parkingProjects.length}
              defaultCollapsed
            >
              {parkingProjects.map((p) => (
                <ProjectNode
                  key={p.id}
                  project={p}
                  tasks={tasks.filter((t) => t.project_id === p.id)}
                  subtasks={subtasks}
                />
              ))}
            </Branch>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyGoalCard() {
  const t = useT();
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
      <Target className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{t("workspace.noGoal")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("workspace.noGoalHint")}</p>
      <Button asChild size="sm" variant="outline" className="mt-3">
        <Link href="/app/today">{t("workspace.setGoal")}</Link>
      </Button>
    </div>
  );
}

function EmptyProjectsCard() {
  const t = useT();
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
      <FolderKanban className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">{t("workspace.noProjects")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("workspace.noProjectsHint")}</p>
      <Button asChild size="sm" variant="outline" className="mt-3">
        <Link href="/app/projects">{t("workspace.createProject")}</Link>
      </Button>
    </div>
  );
}

function Branch({
  branchKey,
  label,
  count,
  defaultCollapsed = false,
  children,
}: {
  branchKey: BranchKey;
  label: string;
  count: number;
  defaultCollapsed?: boolean;
  children: ReactNode;
}) {
  const t = useT();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const meta = BRANCH_META[branchKey];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border-l-2 pl-3", meta.borderColor)}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 py-1.5 text-left"
      >
        <Icon className={cn("size-4", meta.color)} />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">
          ({count})
        </span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform",
            !collapsed && "rotate-90"
          )}
        />
      </button>
      {!collapsed && <div className="ml-4 space-y-1 pb-1">{children}</div>}
    </div>
  );
}

function ProjectNode({
  project,
  tasks,
  subtasks,
}: {
  project: Project;
  tasks: Task[];
  subtasks: Subtask[];
}) {
  const t = useT();
  const [collapsed, setCollapsed] = useState(true);
  const meta = PROJECT_CATEGORY_META[project.category as ProjectCategory];
  const activeTasks = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  );

  return (
    <div>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent/50"
      >
        {activeTasks.length > 0 ? (
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              !collapsed && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3.5" />
        )}
        <span className="text-sm">{meta.emoji}</span>
        <Link
          href={`/app/projects/${project.id}`}
          prefetch
          className="flex-1 truncate text-sm font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {project.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          {t("workspace.activeTasks").replace("{count}", String(activeTasks.length))}
        </span>
      </button>
      {!collapsed && activeTasks.length > 0 && (
        <div className="ml-6 space-y-0.5">
          {activeTasks.map((task) => (
            <TaskNode key={task.id} task={task} subtasks={subtasks} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskNode({ task, subtasks }: { task: Task; subtasks: Subtask[] }) {
  const t = useT();
  const taskSubtasks = subtasks.filter((s) => s.task_id === task.id);
  const done = taskSubtasks.filter((s) => s.completed).length;
  const total = taskSubtasks.length;
  const taskMeta = TASK_TYPE_META[task.type];
  const isInProgress = task.status === "IN_PROGRESS";

  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent/40">
      <span className="text-xs">{taskMeta.emoji}</span>
      <Link
        href={`/app/focus?task=${task.id}`}
        prefetch
        className={cn(
          "flex-1 truncate text-sm",
          isInProgress && "font-medium"
        )}
      >
        {task.title}
      </Link>
      {task.next_action && (
        <span className="hidden truncate text-xs text-muted-foreground sm:inline">
          → {task.next_action}
        </span>
      )}
      {total > 0 && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {t("workspace.subtaskProgress")
            .replace("{done}", String(done))
            .replace("{total}", String(total))}
        </span>
      )}
      {isInProgress && (
        <span className="size-1.5 rounded-full bg-blue-500" title={task.status} />
      )}
    </div>
  );
}
