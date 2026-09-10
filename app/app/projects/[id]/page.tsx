import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getT } from "@/lib/i18n";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskActionsClient } from "./task-actions-client";
import {
  PROJECT_CATEGORY_META,
  PROJECT_STATUS_META,
  TASK_TYPE_META,
} from "@/lib/constants";
import type { Project, Subtask, Task } from "@/lib/types";

// Heavy client forms — lazy-load to reduce initial bundle.
const TaskForm = dynamic(
  () => import("@/components/tasks/task-form").then((m) => m.TaskForm)
);
const ProjectForm = dynamic(
  () => import("@/components/projects/project-form").then((m) => m.ProjectForm)
);

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { t } = await getT();

  // Fetch project, all projects, and tasks in parallel.
  const [
    { data: project },
    { data: projects },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!project) notFound();

  const allProjects = (projects ?? []) as Project[];
  const p = project as unknown as Project;
  const taskList = (tasks ?? []) as Task[];
  const meta = PROJECT_CATEGORY_META[p.category];

  // Fetch subtasks for all tasks in this project.
  const taskIds = taskList.map((t) => t.id);
  const { data: subtasksData } = taskIds.length > 0
    ? await supabase
        .from("subtasks")
        .select("*")
        .in("task_id", taskIds)
        .order("position", { ascending: true })
    : { data: [] as Subtask[] | null };
  const subtasks = (subtasksData ?? []) as Subtask[];

  const todo = taskList.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  );
  const done = taskList.filter((t) => t.status === "DONE");
  const parked = taskList.filter((t) => t.status === "PARKED");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {meta.emoji} {meta.label}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.title}</h1>
            {p.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {p.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`uppercase ${PROJECT_STATUS_META[p.status]?.badgeClass ?? ""}`}
            >
              <span className={`mr-1 inline-block size-1.5 rounded-full ${PROJECT_STATUS_META[p.status]?.dotClass ?? ""}`} />
              {PROJECT_STATUS_META[p.status]?.label ?? p.status}
            </Badge>
            <ProjectForm
              project={p}
              trigger={
                <Button variant="outline" size="sm">
                  {t("projects.editProjectButton")}
                </Button>
              }
            />
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            {t("projects.tasks")}
          </h2>
          <TaskForm
            projects={allProjects}
            defaultProjectId={p.id}
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> {t("projects.addTask")}
              </Button>
            }
          />
        </div>

        {taskList.length === 0 ? (
          <EmptyState
            title={t("projects.noTasks")}
            description={t("projects.noTasksHint")}
          />
        ) : (
          <div className="space-y-6">
            {todo.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("projects.todo")}
                </p>
                {todo.map((tsk) => (
                  <TaskActionsClient
                    key={tsk.id}
                    task={tsk}
                    projects={allProjects}
                    subtasks={subtasks.filter((s) => s.task_id === tsk.id)}
                  />
                ))}
              </div>
            )}
            {done.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("projects.done")}
                </p>
                {done.map((tsk) => (
                  <TaskActionsClient
                    key={tsk.id}
                    task={tsk}
                    projects={allProjects}
                    subtasks={subtasks.filter((s) => s.task_id === tsk.id)}
                  />
                ))}
              </div>
            )}
            {parked.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("projects.parked")}
                </p>
                {parked.map((tsk) => (
                  <TaskActionsClient
                    key={tsk.id}
                    task={tsk}
                    projects={allProjects}
                    subtasks={subtasks.filter((s) => s.task_id === tsk.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
