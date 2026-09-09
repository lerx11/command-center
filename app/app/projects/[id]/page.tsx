import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getT } from "@/lib/i18n";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskMenu } from "@/components/tasks/task-menu";
import { ProjectForm } from "@/components/projects/project-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskActionsClient } from "./task-actions-client";
import {
  PROJECT_CATEGORY_META,
  TASK_TYPE_META,
} from "@/lib/constants";
import type { Project, Task } from "@/lib/types";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { t } = await getT();

  // All three queries depend only on `id` — fetch them in parallel.
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
            <Badge variant="outline" className="uppercase">
              {p.status}
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
                  <TaskActionsClient key={tsk.id} task={tsk} projects={allProjects} />
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
