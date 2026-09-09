import { createClient } from "@/utils/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_META,
  MAX_ACTIVE_PROJECTS,
  type ProjectCategory,
} from "@/lib/constants";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (projects ?? []) as Project[];

  const activeCount = list.filter((p) => p.status === "ACTIVE").length;
  const byCategory = (cat: ProjectCategory) =>
    list
      .filter((p) => p.category === cat)
      .sort((a, b) =>
        a.status === "ACTIVE" && b.status !== "ACTIVE"
          ? -1
          : a.status !== "ACTIVE" && b.status === "ACTIVE"
          ? 1
          : 0
      );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active projects:{" "}
            <span
              className={
                activeCount >= MAX_ACTIVE_PROJECTS
                  ? "font-semibold text-foreground"
                  : ""
              }
            >
              {activeCount}
            </span>{" "}
            / {MAX_ACTIVE_PROJECTS}
          </p>
        </div>
        <ProjectForm
          trigger={
            <Button>
              <Plus className="size-4" /> New project
            </Button>
          }
        />
      </header>

      {list.length === 0 ? (
        <EmptyState
          title="Create your first project"
          description="Group related tasks under one focus. Start with what can bring money now."
          action={
            <ProjectForm
              trigger={
                <Button>
                  <Plus className="size-4" /> New project
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="space-y-10">
          {PROJECT_CATEGORIES.map((cat) => {
            const items = byCategory(cat);
            if (items.length === 0) return null;
            const meta = PROJECT_CATEGORY_META[cat];
            return (
              <section key={cat}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    {meta.label}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {meta.description}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
