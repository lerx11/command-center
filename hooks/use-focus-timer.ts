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
  // Wall-clock reference for accurate elapsed time — survives background throttling.
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastTickRef.current) / 1000);
    if (elapsed > 0) {
      lastTickRef.current += elapsed * 1000;
      setSeconds((s) => s + elapsed);
    }
  }, []);

  useEffect(() => {
    if (phase !== "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 1000);

    const onVisibilityChange = () => {
      if (document.hidden) {
        // Tab going to background — stop the interval to save CPU/battery.
        // The wall-clock reference preserves elapsed time.
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (phase === "running") {
        // Tab back to foreground — catch up elapsed time, then resume ticking.
        tick();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(tick, 1000);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, tick]);

  const pause = useCallback(() => setPhase("paused"), []);
  const resume = useCallback(() => {
    lastTickRef.current = Date.now();
    setPhase("running");
  }, []);

  const complete = useCallback(async () => {
    setPhase("completed");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const fd = new FormData();
    fd.set("taskId", taskId ?? "null");
    fd.set("startedAt", startedAtRef.current.toISOString());
    fd.set("durationSeconds", String(seconds));
    const res = await saveFocusSessionAction(fd);
    if (res?.error) toast.error(t(res.error));
    else toast.success(t("toasts.focusSessionCompleted"));
  }, [seconds, taskId, t]);

  return {
    phase,
    seconds,
    display: formatDuration(seconds),
    pause,
    resume,
    complete,
  };
}
