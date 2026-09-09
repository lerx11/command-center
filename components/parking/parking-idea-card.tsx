"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  moveParkingIdeaAction,
  deleteParkingIdeaAction,
  assignParkingToProjectAction,
} from "@/app/app/parking/actions";
import { formatDate } from "@/lib/utils";
import type { Project, ParkingIdea } from "@/lib/types";

export function ParkingIdeaCard({
  idea,
  projects,
}: {
  idea: ParkingIdea;
  projects: Project[];
}) {
  const [pending, startTransition] = useTransition();
  const [convertOpen, setConvertOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState("LATER");
  const [convertProject, setConvertProject] = useState("none");
  const [moveProject, setMoveProject] = useState(
    idea.project_id ?? "none"
  );

  const convert = () => {
    const fd = new FormData();
    fd.set("id", idea.id);
    fd.set("target", convertTarget);
    fd.set("projectId", convertProject);
    startTransition(async () => {
      const res = await moveParkingIdeaAction(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Converted ✓");
        setConvertOpen(false);
      }
    });
  };

  const move = () => {
    const fd = new FormData();
    fd.set("id", idea.id);
    fd.set("projectId", moveProject);
    startTransition(async () => {
      const res = await assignParkingToProjectAction(fd);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Moved ✓");
        setMoveOpen(false);
      }
    });
  };

  const del = () => {
    const fd = new FormData();
    fd.set("id", idea.id);
    startTransition(async () => {
      const res = await deleteParkingIdeaAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Deleted ✓");
    });
  };

  const project = projects.find((p) => p.id === idea.project_id);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{idea.title}</p>
          {idea.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {idea.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px] uppercase">
              {idea.status}
            </Badge>
            {project && (
              <span className="text-xs text-muted-foreground">
                {project.title}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(idea.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={pending}
            onClick={() => setConvertOpen(true)}
          >
            <ArrowRightLeft className="size-3.5" /> Convert
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                disabled={pending}
                aria-label="Idea actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                Move to project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={del}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Convert dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert to task</DialogTitle>
            <DialogDescription>
              Where should this idea go?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={convertTarget} onValueChange={setConvertTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="PROJECT">Project</SelectItem>
                <SelectItem value="LATER">Later (mark converted)</SelectItem>
              </SelectContent>
            </Select>
            {convertTarget !== "LATER" && (
              <Select value={convertProject} onValueChange={setConvertProject}>
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={convert} disabled={pending} className="w-full">
              {pending ? "Converting…" : "Convert"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to project dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to project</DialogTitle>
            <DialogDescription>
              Attach this idea to a project without converting it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={moveProject} onValueChange={setMoveProject}>
              <SelectTrigger>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={move} disabled={pending} className="w-full">
              {pending ? "Moving…" : "Move"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
