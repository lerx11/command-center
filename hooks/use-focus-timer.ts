"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";
import { saveFocusSessionAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import { useFocusSession } from "@/components/focus/focus-session-provider";

type Phase = "running" | "paused" | "completed";

export function useFocusTimer(taskId: string | null, taskTitle: string) {
  const t = useT();
  const { session, startSession, pauseSession, resumeSession, clearSession } =
    useFocusSession();
  const [phase, setPhase] = useState<Phase>("running");

  // If we have a stored session for this task, resume it
  useEffect(() => {
    if (session && session.taskId === taskId && session.mode === "free") {
      setPhase(session.isPaused ? "paused" : "running");
    } else if (session && session.taskId !== taskId) {
      // Different task — start fresh
      startSession({
        taskId: taskId!,
        taskTitle,
        startedAt: new Date().toISOString(),
        durationMinutes: 0,
        sessionNumber: 1,
        mode: "free",
      });
      setPhase("running");
    } else if (!session && taskId) {
      startSession({
        taskId,
        taskTitle,
        startedAt: new Date().toISOString(),
        durationMinutes: 0,
        sessionNumber: 1,
        mode: "free",
      });
      setPhase("running");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const seconds = session?.elapsedSeconds ?? 0;

  const pause = useCallback(() => {
    pauseSession();
    setPhase("paused");
  }, [pauseSession]);

  const resume = useCallback(() => {
    resumeSession();
    setPhase("running");
  }, [resumeSession]);

  const complete = useCallback(async () => {
    setPhase("completed");
    clearSession();
    const fd = new FormData();
    fd.set("taskId", taskId ?? "null");
    fd.set("startedAt", session?.startedAt ?? new Date().toISOString());
    fd.set("durationSeconds", String(seconds));
    const res = await saveFocusSessionAction(fd);
    if (res?.error) toast.error(t(res.error));
    else toast.success(t("toasts.focusSessionCompleted"));
  }, [seconds, taskId, session, clearSession, t]);

  return {
    phase,
    seconds,
    display: formatDuration(seconds),
    pause,
    resume,
    complete,
  };
}
