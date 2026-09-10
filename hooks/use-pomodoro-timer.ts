"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveFocusSessionAction, moveTaskToTomorrowAction } from "@/app/app/tasks/actions";
import { formatDuration } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";
import { useFocusSession } from "@/components/focus/focus-session-provider";

// Pomodoro configuration — see locales/ru.json focus.pomodoro.
const DURATIONS = [25, 50, 90] as const;
export type PomodoroDuration = (typeof DURATIONS)[number];

const DEFAULT_DURATION: PomodoroDuration = 25;
const SHORT_BREAK = 5 * 60; // seconds
const LONG_BREAK = 15 * 60; // seconds
const SESSIONS_BEFORE_LONG_BREAK = 4;

const DURATION_STORAGE_KEY = "pomodoro-duration";
const SOUND_STORAGE_KEY = "pomodoro-sound";

export function getDefaultDuration(): PomodoroDuration {
  if (typeof window === "undefined") return DEFAULT_DURATION;
  const stored = Number(window.localStorage.getItem(DURATION_STORAGE_KEY));
  return (DURATIONS as readonly number[]).includes(stored)
    ? (stored as PomodoroDuration)
    : DEFAULT_DURATION;
}

export function saveDefaultDuration(d: PomodoroDuration) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DURATION_STORAGE_KEY, String(d));
}

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
}

// One quiet chime — generated via Web Audio API, no external assets.
function playChime() {
  if (typeof window === "undefined") return;
  if (!getSoundEnabled()) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880; // A5 — soft, not startling.
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
    osc.onended = () => ctx.close();
  } catch {
    // Silently ignore — sound is opt-in feedback, not a critical path.
  }
}

type Phase =
  | "idle" // duration selection (before a session starts)
  | "running" // pomodoro countdown
  | "paused" // pomodoro paused
  | "sessionComplete" // session ended, awaiting user choice
  | "break" // break countdown
  | "breakDone"; // break ended, awaiting "continue"

export function usePomodoroTimer(taskId: string | null, taskTitle: string) {
  const t = useT();
  const { session, startSession, pauseSession, resumeSession, clearSession } =
    useFocusSession();
  const [duration, setDurationState] = useState<PomodoroDuration>(DEFAULT_DURATION);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATION * 60);
  const [remainingAtPause, setRemainingAtPause] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wallRef = useRef<number>(0);

  // On mount: read saved duration
  useEffect(() => {
    setDurationState(getDefaultDuration());
    setSecondsLeft(getDefaultDuration() * 60);
  }, []);

  // Restore from global session on mount
  useEffect(() => {
    if (session && session.taskId === taskId && session.mode === "pomodoro") {
      // Calculate secondsLeft from elapsed
      const totalSeconds = session.durationMinutes * 60;
      const elapsed = session.elapsedSeconds;
      const remaining = Math.max(0, totalSeconds - elapsed);
      if (remaining > 0 && !session.isPaused) {
        setPhase("running");
        setSecondsLeft(remaining);
      } else if (remaining > 0 && session.isPaused) {
        setPhase("paused");
        setSecondsLeft(remaining);
      } else {
        // Session ended while away
        handleSessionEnd();
      }
      setSessionNumber(session.sessionNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown ticking
  useEffect(() => {
    if (phase !== "running" && phase !== "break") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    wallRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - wallRef.current) / 1000);
      if (elapsed > 0) {
        wallRef.current += elapsed * 1000;
        setSecondsLeft((s) => {
          const next = s - elapsed;
          if (next <= 0) {
            if (phase === "running") handleSessionEnd();
            else handleBreakEnd();
            return 0;
          }
          return next;
        });
      }
    }, 1000);

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (phase === "running" || phase === "break") {
        const now = Date.now();
        const elapsed = Math.floor((now - wallRef.current) / 1000);
        if (elapsed > 0) {
          wallRef.current += elapsed * 1000;
          setSecondsLeft((s) => {
            const next = s - elapsed;
            if (next <= 0) {
              if (phase === "running") handleSessionEnd();
              else handleBreakEnd();
              return 0;
            }
            return next;
          });
        }
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            const now2 = Date.now();
            const el = Math.floor((now2 - wallRef.current) / 1000);
            if (el > 0) {
              wallRef.current += el * 1000;
              setSecondsLeft((s) => {
                const next = s - el;
                if (next <= 0) {
                  if (phase === "running") handleSessionEnd();
                  else handleBreakEnd();
                  return 0;
                }
                return next;
              });
            }
          }, 1000);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const setDuration = useCallback((d: PomodoroDuration) => {
    setDurationState(d);
    saveDefaultDuration(d);
    if (phase === "idle") setSecondsLeft(d * 60);
  }, [phase]);

  const start = useCallback(() => {
    const startedAt = new Date().toISOString();
    startSession({
      taskId: taskId!,
      taskTitle,
      startedAt,
      durationMinutes: duration,
      sessionNumber: 1,
      mode: "pomodoro",
    });
    setSecondsLeft(duration * 60);
    setPhase("running");
  }, [duration, taskId, taskTitle, startSession]);

  const pause = useCallback(() => {
    if (phase === "running") {
      pauseSession();
      setRemainingAtPause(secondsLeft);
      setPhase("paused");
    }
  }, [phase, secondsLeft, pauseSession]);

  const resume = useCallback(() => {
    if (phase === "paused") {
      resumeSession();
      setPhase("running");
    }
  }, [phase, resumeSession]);

  const handleSessionEnd = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playChime();

    if (taskId && session) {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("startedAt", session.startedAt);
      fd.set("durationSeconds", String(duration * 60 - secondsLeft));
      const res = await saveFocusSessionAction(fd);
      if (res?.error) toast.error(t(res.error));
    }
    clearSession();
    setPhase("sessionComplete");
  }, [duration, secondsLeft, taskId, session, clearSession, t]);

  const completeEarly = useCallback(() => {
    handleSessionEnd();
  }, [handleSessionEnd]);

  const startBreak = useCallback(() => {
    const long = sessionNumber >= SESSIONS_BEFORE_LONG_BREAK;
    setIsLongBreak(long);
    setSecondsLeft(long ? LONG_BREAK : SHORT_BREAK);
    setPhase("break");
  }, [sessionNumber]);

  const handleBreakEnd = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playChime();
    setPhase("breakDone");
  }, []);

  const skipBreak = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("breakDone");
  }, []);

  const nextSession = useCallback(() => {
    const next = isLongBreak ? 1 : sessionNumber + 1;
    setSessionNumber(next);
    const startedAt = new Date().toISOString();
    startSession({
      taskId: taskId!,
      taskTitle,
      startedAt,
      durationMinutes: duration,
      sessionNumber: next,
      mode: "pomodoro",
    });
    setSecondsLeft(duration * 60);
    setPhase("running");
  }, [duration, isLongBreak, sessionNumber, taskId, taskTitle, startSession]);

  const exitToToday = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    clearSession();
    setPhase("idle");
  }, [clearSession]);

  const moveTaskToTomorrow = useCallback(async () => {
    if (!taskId) return;
    const fd = new FormData();
    fd.set("id", taskId);
    const res = await moveTaskToTomorrowAction(fd);
    if (res?.error) toast.error(t(res.error));
  }, [taskId, t]);

  return {
    phase,
    duration,
    setDuration,
    secondsLeft,
    display: formatDuration(Math.max(0, secondsLeft)),
    sessionNumber,
    isLongBreak,
    start,
    pause,
    resume,
    completeEarly,
    startBreak,
    skipBreak,
    nextSession,
    exitToToday,
    moveTaskToTomorrow,
  };
}
