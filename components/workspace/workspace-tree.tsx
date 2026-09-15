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
  Flag,
  Lock,
  Trophy,
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
  Goal,
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

function splitProjects(projects: Project[]) {
  return {
    money: projects.filter(
      (p) => p.category === "CASH_NOW" || p.category === "CASH_ENGINE"
    ),
    asset: projects.filter((p) => p.category === "ASSET"),
    parking: projects.filter((p) => p.category === "PARKING"),
  };
}

function goalRank(status: string) {
  return status === "ACTIVE" ? 0 : status === "ACHIEVED" ? 1 : 2;
}

export function WorkspaceTree({
  cashTarget,
  goals,
  projects,
  tasks,
  subtasks,
  energyTasks,
}: {
  cashTarget: CashTargetType | null;
  goals?: Goal[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  energyTasks: EnergyTask[];
}) {
  const t = useT();

  const hasGoals = (goals?.length ?? 0) > 0;
  const activeGoal = hasGoals
    ? goals!.find((g) => g.status === "ACTIVE") ?? goals![0]
    : null;
  const sortedGoals = hasGoals
    ? [...goals!].sort((a, b) => {
        const r = goalRank(a.status) - goalRank(b.status);
        return r !== 0 ? r : a.position - b.position;
      })
    : null;

  // Projects belonging to a goal: explicitly linked, or (when null) the active goal.
  const goalProjects = (g: Goal) =>
    projects.filter(
      (p) => p.goal_id === g.id || (p.goal_id == null && g.status === "ACTIVE")
    );

  const hasAnyProjects = projects.length > 0;

  // Collapsed state for the top-level goal sections.
  const [collapsedGoals, setCollapsedGoals] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (hasGoals) {
      for (const g of goals!) if (g.status !== "ACTIVE") s.add(g.id);
    }
    return s;
  });

  const toggleGoal = (id: string) =>
    setCollapsedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const [treeSeed, setTreeSeed] = useState(0);
  const [expandMode, setExpandMode] = useState<"default" | "all" | "none">(
    "default"
  );
  const collapseAll = () => {
    setExpandMode("none");
    setTreeSeed((v) => v + 1);
  };
  const expandAll = () => {
    setExpandMode("all");
    setTreeSeed((v) => v + 1);
  };

  // Single-goal fallback (no goals table): all projects belong to one scope.
  const fallbackProjects = splitProjects(projects);

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
        </div>
      )}

      {/* Goal node */}
      {hasGoals && activeGoal ? (
        <div className="group rounded-lg border-2 border-foreground/20 bg-foreground/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Flag className="size-5 text-foreground" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("goals.currentTarget")}
              </p>
              <p className="text-lg font-bold">
                {formattedAmount(activeGoal.min_amount)} –{" "}
                {formattedAmount(activeGoal.max_amount)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("goals.active")}
            </span>
          </div>
        </div>
      ) : cashTarget ? (
        <div className="group rounded-lg border-2 border-foreground/20 bg-foreground/5 px-4 py-3">
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

      {!hasAnyProjects ? (
        <EmptyProjectsCard />
      ) : sortedGoals ? (
        <div className="space-y-3">
          {sortedGoals.map((goal) => {
            const g = splitProjects(goalProjects(goal));
            const collapsed = collapsedGoals.has(goal.id);
            return (
              <GoalSection
                key={goal.id}
                goal={goal}
                collapsed={collapsed}
                onToggle={() => toggleGoal(goal.id)}
              >
                <TreeBody
                  seedKey={`${goal.id}:${treeSeed}`}
                  expandMode={expandMode}
                  moneyProjects={g.money}
                  assetProjects={g.asset}
                  parkingProjects={g.parking}
                  energyTasks={goal.status === "ACTIVE" ? energyTasks : []}
                  tasks={tasks}
                  subtasks={subtasks}
                />
              </GoalSection>
            );
          })}
        </div>
      ) : (
        <TreeBody
          seedKey={`single:${treeSeed}`}
          expandMode={expandMode}
          moneyProjects={fallbackProjects.money}
          assetProjects={fallbackProjects.asset}
          parkingProjects={fallbackProjects.parking}
          energyTasks={energyTasks}
          tasks={tasks}
          subtasks={subtasks}
        />
      )}
    </div>
  );
}

function formattedAmount(n: number) {
  return `${(n ?? 0).toLocaleString()} ₽`;
}

function GoalSection({
  goal,
  collapsed,
  onToggle,
  children,
}: {
  goal: Goal;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const t = useT();
  const isActive = goal.status === "ACTIVE";
  const Icon = isActive ? Target : goal.status === "ACHIEVED" ? Trophy : Lock;
  return (
    <div
      className={cn(
        "rounded-lg border-2 px-3 py-2 transition-colors",
        isActive
          ? "border-foreground/25 bg-foreground/5"
          : "border-border/50 bg-card/40"
      )}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-1 text-left transition-colors hover:bg-accent/30"
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            isActive
              ? "text-foreground"
              : goal.status === "ACHIEVED"
              ? "text-emerald-500"
              : "text-muted-foreground"
          )}
        />
        <span className="text-sm font-semibold">
          {goal.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {isActive
            ? t("goals.active")
            : goal.status === "ACHIEVED"
            ? t("goals.achieved")
            : t("goals.locked")}
        </span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform duration-200",
            !collapsed && "rotate-90"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 space-y-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * A fully self-contained tree body (MONEY / ASSET / ENERGY / PARKING branches)
 * with its own expand & focus state. Used once per goal.
 */
function TreeBody({
  seedKey,
  expandMode,
  moneyProjects,
  assetProjects,
  parkingProjects,
  energyTasks,
  tasks,
  subtasks,
}: {
  seedKey: string;
  expandMode: "default" | "all" | "none";
  moneyProjects: Project[];
  assetProjects: Project[];
  parkingProjects: Project[];
  energyTasks: EnergyTask[];
  tasks: Task[];
  subtasks: Subtask[];
}) {
  const t = useT();

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

  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        expandMode === "none" ? [] : expandMode === "all" ? allNodeIds : allNodeIds
      )
  );
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null);
  const [focusBranch, setFocusBranch] = useState<BranchKey | null>(null);

  const isFocused = focusProjectId !== null || focusBranch !== null;

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const showAll = useCallback(() => {
    setFocusProjectId(null);
    setFocusBranch(null);
    setExpanded(new Set(allNodeIds));
  }, [allNodeIds]);

  const focusProject = useCallback(
    (projectId: string) => {
      setFocusProjectId((prev) => {
        if (prev === projectId) {
          setExpanded(new Set(allNodeIds));
          setFocusBranch(null);
          return null;
        }
        const next = new Set<string>();
        const project = [...moneyProjects, ...assetProjects, ...parkingProjects].find(
          (p) => p.id === projectId
        );
        if (project) {
          if (project.category === "CASH_NOW" || project.category === "CASH_ENGINE")
            next.add("branch:money");
          else if (project.category === "ASSET") next.add("branch:asset");
          else if (project.category === "PARKING") next.add("branch:parking");
          next.add(`project:${projectId}`);
        }
        setExpanded(next);
        setFocusBranch(null);
        return projectId;
      });
    },
    [moneyProjects, assetProjects, parkingProjects, allNodeIds]
  );

  const focusOnBranch = useCallback(
    (branch: BranchKey) => {
      setFocusBranch((prev) => {
        if (prev === branch) {
          setExpanded(new Set(allNodeIds));
          setFocusProjectId(null);
          return null;
        }
        const next = new Set<string>();
        next.add(`branch:${branch}`);
        const branchProjects =
          branch === "money"
            ? moneyProjects
            : branch === "asset"
            ? assetProjects
            : branch === "parking"
            ? parkingProjects
            : [];
        for (const p of branchProjects) {
          const active = tasks.filter(
            (t) =>
              t.project_id === p.id &&
              (t.status === "TODO" || t.status === "IN_PROGRESS")
          );
          if (active.length > 0) next.add(`project:${p.id}`);
        }
        setExpanded(next);
        setFocusProjectId(null);
        return branch;
      });
    },
    [moneyProjects, assetProjects, parkingProjects, tasks, allNodeIds]
  );

  const isExpanded = (id: string) => expanded.has(id);

  const showMoney = !isFocused
    ? moneyProjects.length > 0
    : focusProjectId
    ? moneyProjects.some((p) => p.id === focusProjectId)
    : focusBranch === "money";
  const showAsset = !isFocused
    ? assetProjects.length > 0
    : focusProjectId
    ? assetProjects.some((p) => p.id === focusProjectId)
    : focusBranch === "asset";
  const showParking = !isFocused
    ? parkingProjects.length > 0
    : focusProjectId
    ? parkingProjects.some((p) => p.id === focusProjectId)
    : focusBranch === "parking";
  const showEnergy = !isFocused ? energyTasks.length > 0 : focusBranch === "energy";

  return (
    <div className="space-y-2">
      {isFocused && (
        <Button size="sm" variant="secondary" onClick={showAll}>
          <Focus className="size-3.5" /> {t("workspace.showAll")}
        </Button>
      )}

      {/* MONEY branch */}
      {showMoney && (
          <Branch
            branchKey="money"
            label={t("workspace.money")}
            count={moneyProjects.length}
            expanded={isExpanded("branch:money")}
            onToggle={() => toggle("branch:money")}
            onFocus={() => focusOnBranch("money")}
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
                  onFocusProject={() => focusProject(p.id)}
                >
                  <FocusButton onClick={() => focusProject(p.id)} />
                </ProjectNode>
              ))}
          </Branch>
        )}

      {/* ASSET branch */}
      {showAsset && (
          <Branch
            branchKey="asset"
            label={t("workspace.asset")}
            count={assetProjects.length}
            expanded={isExpanded("branch:asset")}
            onToggle={() => toggle("branch:asset")}
            onFocus={() => focusOnBranch("asset")}
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
                  onFocusProject={() => focusProject(p.id)}
                >
                  <FocusButton onClick={() => focusProject(p.id)} />
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
          onFocus={() => focusOnBranch("energy")}
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
      {showParking && (
          <Branch
            branchKey="parking"
            label={t("workspace.parking")}
            count={parkingProjects.length}
            expanded={isExpanded("branch:parking")}
            onToggle={() => toggle("branch:parking")}
            onFocus={() => focusOnBranch("parking")}
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
                  onFocusProject={() => focusProject(p.id)}
                >
                  <FocusButton onClick={() => focusProject(p.id)} />
                </ProjectNode>
              ))}
          </Branch>
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
  onFocus,
  children,
}: {
  branchKey: BranchKey;
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onFocus?: () => void;
  children: ReactNode;
}) {
  const meta = BRANCH_META[branchKey];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border-l-2 pl-3 transition-colors", meta.borderColor, meta.bgColor)}>
      <div className="group flex items-center">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 py-1.5 text-left transition-colors hover:bg-accent/30"
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
        {onFocus && <FocusButton onClick={onFocus} />}
      </div>
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
  onFocusProject,
  children,
}: {
  project: Project;
  tasks: Task[];
  subtasks: Subtask[];
  expanded: boolean;
  onToggle: () => void;
  onFocusProject?: () => void;
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
              <TaskNode
                key={task.id}
                task={task}
                subtasks={subtasks}
                onFocus={onFocusProject}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskNode({
  task,
  subtasks,
  onFocus,
}: {
  task: Task;
  subtasks: Subtask[];
  onFocus?: () => void;
}) {
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
        className={cn("flex-1 truncate text-sm", isInProgress && "font-medium")}
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
              className={cn(
                "h-full transition-all duration-300",
                progressBarColor(done, total)
              )}
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
      {onFocus && <FocusButton onClick={onFocus} />}
    </div>
  );
}