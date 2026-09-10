"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Target,
  FolderKanban,
  CheckCircle2,
  Circle,
  Zap,
  Focus,
  Maximize2,
  Minimize2,
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
  {
    icon: LucideIcon;
    color: string;
    borderColor: string;
    bgColor: string;
    dotColor: string;
  }
> = {
  money: {
    icon: Target,
    color: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-500/5",
    dotColor: "bg-emerald-500",
  },
  asset: {
    icon: FolderKanban,
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-500/5",
    dotColor: "bg-blue-500",
  },
  energy: {
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-500/5",
    dotColor: "bg-amber-500",
  },
  parking: {
    icon: Circle,
    color: "text-muted-foreground",
    borderColor: "border-l-muted-foreground/40",
    bgColor: "bg-muted/20",
    dotColor: "bg-muted-foreground",
  },
};

function progressBarColor(done: number, total: number) {
  if (total === 0) return "";
  if (done === total) return "bg-emerald-500";
  if (done > 0) return "bg-blue-500";
  return "bg-muted-foreground/30";
}

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

  // Build a list of all expandable node IDs for expand-all
  const allNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const branches: [BranchKey, Project[]][] = [
      ["money", moneyProjects],
      ["asset", assetProjects],
      ["parking", parkingProjects],
    ];
    for (const [key, projs] of branches) {
      if (projs.length > 0) ids.add(`branch:${key}`);
      for (const p of projs) {
        const active = tasks.filter(
          (t) =>
            t.project_id === p.id &&
            (t.status === "TODO" || t.status === "IN_PROGRESS")
        );
        if (active.length > 0) ids.add(`project:${p.id}`);
      }
    }
    if (energyTasks.length > 0) ids.add("branch:energy");
    return ids;
  }, [moneyProjects, assetProjects, parkingProjects, energyTasks, tasks]);

  // Expanded state — Set of node IDs
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(allNodeIds) // expanded by default
  );

  // Focus mode — when set, only this project's branch is shown
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
    setFocusProjectId(null);
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(allNodeIds));
    setFocusProjectId(null);
  }, [allNodeIds]);

  const focusProject = useCallback(
    (projectId: string) => {
      // Toggle: if already focused on this project, reset to full tree
      setFocusProjectId((prev) => {
        if (prev === projectId) {
          setExpanded(new Set(allNodeIds));
          return null;
        }
        // Focus on new project — expand only the path to it
        const next = new Set<string>();
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          if (project.category === "CASH_NOW" || project.category === "CASH_ENGINE")
            next.add("branch:money");
          else if (project.category === "ASSET") next.add("branch:asset");
          else if (project.category === "PARKING") next.add("branch:parking");
          next.add(`project:${projectId}`);
        }
        setExpanded(next);
        return projectId;
      });
    },
    [projects, allNodeIds]
  );

  const showAll = useCallback(() => {
    setFocusProjectId(null);
    setExpanded(new Set(allNodeIds));
  }, [allNodeIds]);

  const isExpanded = (id: string) => expanded.has(id);

  // Determine which branches to render
  const showMoney = !focusProjectId || moneyProjects.some((p) => p.id === focusProjectId);
  const showAsset = !focusProjectId || assetProjects.some((p) => p.id === focusProjectId);
  const showEnergy = !focusProjectId;
  const showParking = !focusProjectId || parkingProjects.some((p) => p.id === focusProjectId);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("workspace.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("workspace.subtitle")}
          </p>
        </div>
      </div>

      {/* Tree controls */}
      {hasAnyProjects && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={collapseAll}>
            <Minimize2 className="size-3.5" /> {t("workspace.collapseAll")}
          </Button>
          <Button size="sm" variant="outline" onClick={expandAll}>
            <Maximize2 className="size-3.5" /> {t("workspace.expandAll")}
          </Button>
          {focusProjectId && (
            <Button size="sm" variant="secondary" onClick={showAll}>
              <Focus className="size-3.5" /> {t("workspace.showAll")}
            </Button>
          )}
        </div>
      )}

      {/* Goal node */}
      {cashTarget ? (
        <div className="rounded-lg border-2 border-foreground/20 bg-foreground/5 px-4 py-3">
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
          {showMoney && moneyProjects.length > 0 && (
            <Branch
              branchKey="money"
              label={t("workspace.money")}
              count={moneyProjects.length}
              expanded={isExpanded("branch:money")}
              onToggle={() => toggle("branch:money")}
            >
              {moneyProjects
                .filter((p) => !focusProjectId || p.id === focusProjectId)
                .map((p) => (
                  <ProjectNode
                    key={p.id}
                    project={p}
                    tasks={tasks.filter((t) => t.project_id === p.id)}
                    subtasks={subtasks}
                    expanded={isExpanded(`project:${p.id}`)}
                    onToggle={() => toggle(`project:${p.id}`)}
                  >
                    <FocusButton
                      onClick={() => focusProject(p.id)}
                    />
                  </ProjectNode>
                ))}
            </Branch>
          )}

          {/* ASSET branch */}
          {showAsset && assetProjects.length > 0 && (
            <Branch
              branchKey="asset"
              label={t("workspace.asset")}
              count={assetProjects.length}
              expanded={isExpanded("branch:asset")}
              onToggle={() => toggle("branch:asset")}
            >
              {assetProjects
                .filter((p) => !focusProjectId || p.id === focusProjectId)
                .map((p) => (
                  <ProjectNode
                    key={p.id}
                    project={p}
                    tasks={tasks.filter((t) => t.project_id === p.id)}
                    subtasks={subtasks}
                    expanded={isExpanded(`project:${p.id}`)}
                    onToggle={() => toggle(`project:${p.id}`)}
                  >
                    <FocusButton
                      onClick={() => focusProject(p.id)}
                    />
                  </ProjectNode>
                ))}
            </Branch>
          )}

          {/* ENERGY branch */}
          {showEnergy && energyTasks.length > 0 && (
            <Branch
              branchKey="energy"
              label={t("workspace.energy")}
              count={energyTasks.length}
              expanded={isExpanded("branch:energy")}
              onToggle={() => toggle("branch:energy")}
            >
              {energyTasks.map((et) => (
                <div
                  key={et.id}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent/40"
                >
                  <Zap className="size-3.5 text-amber-500" />
                  <span className="flex-1">{et.title}</span>
                  {et.completed ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="size-3.5 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </Branch>
          )}

          {/* PARKING branch */}
          {showParking && parkingProjects.length > 0 && (
            <Branch
              branchKey="parking"
              label={t("workspace.parking")}
              count={parkingProjects.length}
              expanded={isExpanded("branch:parking")}
              onToggle={() => toggle("branch:parking")}
            >
              {parkingProjects
                .filter((p) => !focusProjectId || p.id === focusProjectId)
                .map((p) => (
                  <ProjectNode
                    key={p.id}
                    project={p}
                    tasks={tasks.filter((t) => t.project_id === p.id)}
                    subtasks={subtasks}
                    expanded={isExpanded(`project:${p.id}`)}
                    onToggle={() => toggle(`project:${p.id}`)}
                  >
                    <FocusButton
                      onClick={() => focusProject(p.id)}
                    />
                  </ProjectNode>
                ))}
            </Branch>
          )}
        </div>
      )}
    </div>
  );
}

function FocusButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={t("workspace.focus")}
      className="shrink-0 rounded p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
    >
      <Focus className="size-3" />
    </button>
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
  expanded,
  onToggle,
  children,
}: {
  branchKey: BranchKey;
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const meta = BRANCH_META[branchKey];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border-l-2 pl-3 transition-colors", meta.borderColor, meta.bgColor)}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-1.5 text-left transition-colors hover:bg-accent/30"
      >
        <Icon className={cn("size-4 shrink-0", meta.color)} />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-4 space-y-1 pb-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ProjectNode({
  project,
  tasks,
  subtasks,
  expanded,
  onToggle,
  children,
}: {
  project: Project;
  tasks: Task[];
  subtasks: Subtask[];
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  const meta = PROJECT_CATEGORY_META[project.category as ProjectCategory];
  const activeTasks = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  );

  return (
    <div>
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50">
        {activeTasks.length > 0 ? (
          <ChevronRight
            onClick={onToggle}
            className={cn(
              "size-3.5 shrink-0 cursor-pointer text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="text-sm shrink-0">{meta.emoji}</span>
        <Link
          href={`/app/projects/${project.id}`}
          prefetch
          className="flex-1 truncate text-sm font-medium hover:underline"
        >
          {project.title}
        </Link>
        <span className="shrink-0 text-xs text-muted-foreground">
          {t("workspace.activeTasks").replace("{count}", String(activeTasks.length))}
        </span>
        {children}
      </div>
      <div
        className={cn(
          "grid transition-all duration-200",
          expanded && activeTasks.length > 0 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-6 space-y-0.5">
            {activeTasks.map((task) => (
              <TaskNode key={task.id} task={task} subtasks={subtasks} />
            ))}
          </div>
        </div>
      </div>
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
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent/40">
      <span className="shrink-0 text-xs">{taskMeta.emoji}</span>
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
      {/* Progress bar */}
      {total > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full transition-all duration-300", progressBarColor(done, total))}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {done}/{total}
          </span>
        </div>
      )}
      {isInProgress && (
        <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
