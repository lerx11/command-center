"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";
import { saveFocusSessionAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";

type Phase = "running" | "paused" | "completed";

export function useFocusTimer(taskId: string | null) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("running");
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const pause = useCallback(() => setPhase("paused"), []);
  const resume = useCallback(() => setPhase("running"), []);

  const complete = useCallback(async () => {
    setPhase("completed");
    if (intervalRef.current) clearInterval(intervalRef.current);
    const fd = new FormData();
    fd.set("taskId", taskId ?? "null");
    fd.set("startedAt", startedAtRef.current.toISOString());
    fd.set("durationSeconds", String(seconds));
    const res = await saveFocusSessionAction(fd);
    if (res?.error) toast.error(t(res.error));
    else toast.success(t("toasts.focusSessionCompleted"));
  }, [seconds, taskId, t]);

  // Spacebar toggles pause/resume (when not typing) — handled in component.
  return {
    phase,
    seconds,
    display: formatDuration(seconds),
    pause,
    resume,
    complete,
  };
}
