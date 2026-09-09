"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveFocusSessionAction, moveTaskToTomorrowAction } from "@/app/app/tasks/actions";
import { formatDuration } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

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

export function usePomodoroTimer(taskId: string | null) {
  const t = useT();
  const [duration, setDurationState] = useState<PomodoroDuration>(DEFAULT_DURATION);
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATION * 60);
  const [sessionNumber, setSessionNumber] = useState(1); // 1-based; resets at LONG_BREAK.
  const [isLongBreak, setIsLongBreak] = useState(false);
  const startedAtRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: read saved duration from localStorage (client-only to avoid hydration mismatch).
  useEffect(() => {
    setDurationState(getDefaultDuration());
    setSecondsLeft(getDefaultDuration() * 60);
  }, []);

  // Countdown tick — only runs in running/break phases.
  useEffect(() => {
    if (phase !== "running" && phase !== "break") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Phase end — handle in the next effect via phase transition.
          if (phase === "running") handleSessionEnd();
          else handleBreakEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const setDuration = useCallback((d: PomodoroDuration) => {
    setDurationState(d);
    saveDefaultDuration(d);
    if (phase === "idle") setSecondsLeft(d * 60);
  }, [phase]);

  const start = useCallback(() => {
    startedAtRef.current = new Date();
    setSecondsLeft(duration * 60);
    setPhase("running");
  }, [duration]);

  const pause = useCallback(() => {
    if (phase === "running") setPhase("paused");
  }, [phase]);

  const resume = useCallback(() => {
    if (phase === "paused") setPhase("running");
  }, [phase]);

  // Called when the Pomodoro countdown reaches 0 (or user hits Complete).
  const handleSessionEnd = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playChime();

    // Persist the focus_session (same storage path as the free timer).
    if (taskId && startedAtRef.current) {
      const fd = new FormData();
      fd.set("taskId", taskId);
      fd.set("startedAt", startedAtRef.current.toISOString());
      fd.set("durationSeconds", String(duration * 60 - secondsLeft));
      const res = await saveFocusSessionAction(fd);
      if (res?.error) toast.error(t(res.error));
    }
    setPhase("sessionComplete");
  }, [duration, secondsLeft, taskId, t]);

  // Called when user explicitly completes a session early.
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

  // After "Continue" → start the next pomodoro session.
  const nextSession = useCallback(() => {
    const next = isLongBreak ? 1 : sessionNumber + 1;
    setSessionNumber(next);
    startedAtRef.current = new Date();
    setSecondsLeft(duration * 60);
    setPhase("running");
  }, [duration, isLongBreak, sessionNumber]);

  // Move the task to tomorrow (uses the existing server action) and exit.
  const exitToToday = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("idle");
  }, []);

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
