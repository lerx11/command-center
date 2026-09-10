import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/server";
import { getT } from "@/lib/i18n";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Heavy client form — lazy-load to reduce initial bundle.
const ProjectForm = dynamic(
  () => import("@/components/projects/project-form").then((m) => m.ProjectForm)
);
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_META,
  type ProjectCategory,
} from "@/lib/constants";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { t } = await getT();
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
          <h1 className="text-3xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("projects.activeProjects")}{" "}
            <span className="font-semibold text-foreground">
              {activeCount}
            </span>
          </p>
        </div>
        <ProjectForm
          trigger={
            <Button>
              <Plus className="size-4" /> {t("projects.newProject")}
            </Button>
          }
        />
      </header>

      {list.length === 0 ? (
        <EmptyState
          title={t("projects.empty")}
          description={t("projects.emptyHint")}
          action={
            <ProjectForm
              trigger={
                <Button>
                  <Plus className="size-4" /> {t("projects.newProject")}
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
