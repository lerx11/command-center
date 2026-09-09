"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTimer } from "@/hooks/use-focus-timer";
import { useT } from "@/components/i18n/i18n-provider";
import type { Task } from "@/lib/types";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function FocusTimer({ task }: { task: Task }) {
  const router = useRouter();
  const t = useT();
  const { phase, display, pause, resume, complete } = useFocusTimer(task.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/app/today");
        return;
      }
      if (isTyping(e.target)) return;
      if (e.key === " ") {
        e.preventDefault();
        if (phase === "running") pause();
        else if (phase === "paused") resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, pause, resume, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <div className="focus-veil absolute inset-0 -z-10" />
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
        {t("focus.title")}
      </p>
      <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">
        {task.title}
      </h1>

      <p className="mt-12 font-mono text-6xl tabular text-foreground sm:text-8xl">
        {display}
      </p>

      {phase === "completed" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("focus.sessionSaved")}
        </p>
      ) : (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {phase === "running" ? (
            <Button variant="outline" size="lg" onClick={pause}>
              <Pause className="size-4" /> {t("common.pause")}
            </Button>
          ) : (
            <Button variant="outline" size="lg" onClick={resume}>
              <Play className="size-4" /> {t("common.resume")}
            </Button>
          )}
          <Button size="lg" onClick={complete}>
            <Check className="size-4" /> {t("common.complete")}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => router.push("/app/today")}>
            <X className="size-4" /> {t("common.exit")}
          </Button>
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        {t("focus.shortcutHint")}
      </p>
    </div>
  );
}
