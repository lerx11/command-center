"use client";

import Link from "next/link";
import { Crosshair, Pause, Play, X } from "lucide-react";
import { useFocusSession } from "@/components/focus/focus-session-provider";
import { useT } from "@/components/i18n/i18n-provider";
import { formatDuration } from "@/lib/utils";

function fmt(seconds: number, mode: "pomodoro" | "free") {
  if (mode === "pomodoro") {
    // For pomodoro, show remaining time
    const remaining = Math.max(0, seconds);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return formatDuration(seconds);
}

export function MiniFocusIndicator() {
  const t = useT();
  const { session, pauseSession, resumeSession, clearSession } = useFocusSession();

  if (!session) return null;

  const display = fmt(session.elapsedSeconds, session.mode);
  const isPomodoro = session.mode === "pomodoro";

  return (
    <div className="border-t border-border/60 px-3 py-2">
      <Link
        href={`/app/focus?task=${encodeURIComponent(session.taskId)}`}
        prefetch
        className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-sm transition-colors hover:bg-foreground/10"
      >
        <div className="relative flex size-5 items-center justify-center">
          {session.isPaused ? (
            <Pause className="size-3.5 text-muted-foreground" />
          ) : (
            <>
              <span className="absolute inline-flex size-3 animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {t("focus.miniFocus")} · {display}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {session.taskTitle}
          </p>
        </div>
      </Link>
      <div className="mt-1 flex items-center gap-1 px-3">
        <button
          onClick={() => session.isPaused ? resumeSession() : pauseSession()}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {session.isPaused ? (
            <Play className="size-3" />
          ) : (
            <Pause className="size-3" />
          )}
        </button>
        <button
          onClick={() => clearSession()}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
