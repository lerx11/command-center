"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Pause,
  Play,
  CheckCircle2,
  ParkingSquare as ParkIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ProjectForm } from "./project-form";
import {
  setProjectStatusAction,
  deleteProjectAction,
} from "@/app/app/projects/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  const setStatus = (status: Project["status"]) => {
    const fd = new FormData();
    fd.set("id", project.id);
    fd.set("status", status);
    startTransition(async () => {
      const res = await setProjectStatusAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      toast.success(t("toasts.updated"));
    });
  };

  const del = () => {
    const fd = new FormData();
    fd.set("id", project.id);
    startTransition(async () => {
      const res = await deleteProjectAction(fd);
      if (res?.error) toast.error(t(res.error));
    });
  };

  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <Link
        href={`/app/projects/${project.id}`}
        prefetch
        className="min-w-0 flex-1"
      >
        <p className="truncate font-medium">{project.title}</p>
        {project.description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase">
            {project.status}
          </Badge>
        </div>
      </Link>
      <div className="flex items-center">
        <ProjectForm
          project={project}
          trigger={
            <button className="rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
              {t("common.edit")}
            </button>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              disabled={pending}
              aria-label={t("projects.projectActions")}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {project.status !== "ACTIVE" && (
              <DropdownMenuItem onClick={() => setStatus("ACTIVE")}>
                <Play className="size-4" /> {t("common.activate")}
              </DropdownMenuItem>
            )}
            {project.status !== "PAUSED" && (
              <DropdownMenuItem onClick={() => setStatus("PAUSED")}>
                <Pause className="size-4" /> {t("common.pause")}
              </DropdownMenuItem>
            )}
            {project.status !== "COMPLETED" && (
              <DropdownMenuItem onClick={() => setStatus("COMPLETED")}>
                <CheckCircle2 className="size-4" /> {t("common.complete")}
              </DropdownMenuItem>
            )}
            {project.status !== "PARKED" && (
              <DropdownMenuItem onClick={() => setStatus("PARKED")}>
                <ParkIcon className="size-4" /> {t("common.park")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={del}
              className="text-destructive focus:text-destructive"
            >
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
