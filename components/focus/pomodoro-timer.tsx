"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pause, Play, Check, X, SkipForward, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoroTimer, type PomodoroDuration } from "@/hooks/use-pomodoro-timer";
import { toggleSubtaskAction } from "@/app/app/tasks/actions";
import { useT } from "@/components/i18n/i18n-provider";
import type { Subtask, Task } from "@/lib/types";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

const DURATION_OPTIONS: PomodoroDuration[] = [25, 50, 90];

export function PomodoroTimer({ task, subtasks }: { task: Task; subtasks: Subtask[] }) {
  const router = useRouter();
  const t = useT();
  const [subtaskPending, startSubtaskTransition] = useTransition();
  const {
    phase,
    duration,
    setDuration,
    display,
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
  } = usePomodoroTimer(task.id, task.title);

  // NEXT ACTION: explicit field takes priority, else first incomplete subtask.
  const firstPendingSubtask = subtasks.find((s) => !s.completed);
  const nextAction = task.next_action || firstPendingSubtask?.title || null;

  const handleNextStep = () => {
    if (!firstPendingSubtask) return;
    const fd = new FormData();
    fd.set("id", firstPendingSubtask.id);
    fd.set("completed", "false");
    startSubtaskTransition(async () => {
      const res = await toggleSubtaskAction(fd);
      if (res?.error) toast.error(t(res.error));
      else router.refresh();
    });
  };

  // Keyboard shortcuts (mirror the free timer): Space — pause/resume, Esc — exit.
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

  const sessionLabel = t("focus.pomodoro.sessionLabel")
    .replace("{n}", String(sessionNumber))
    .replace("{total}", "4");

  const handleMoveToTomorrow = () => {
    startSubtaskTransition(async () => {
      await moveTaskToTomorrow();
      router.push("/app/today");
    });
  };

  // Phase: idle — duration selection before the first session.
  if (phase === "idle") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <div className="focus-veil absolute inset-0 -z-10" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {t("focus.pomodoro.title")}
        </p>
        <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">
          {task.title}
        </h1>

        <p className="mt-10 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {t("focus.pomodoro.duration")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {DURATION_OPTIONS.map((d) => (
            <Button
              key={d}
              variant={d === duration ? "default" : "outline"}
              size="lg"
              onClick={() => setDuration(d)}
            >
              {d === 25
                ? t("focus.pomodoro.min25")
                : d === 50
                ? t("focus.pomodoro.min50")
                : t("focus.pomodoro.min90")}
            </Button>
          ))}
        </div>

        <Button size="lg" className="mt-10" onClick={start}>
          <Play className="size-4" /> {t("focus.pomodoro.start")}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="mt-3"
          onClick={() => router.push("/app/today")}
        >
          <X className="size-4" /> {t("common.exit")}
        </Button>
      </div>
    );
  }

  // Phase: session complete — prompt the user for the next step.
  if (phase === "sessionComplete") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <div className="focus-veil absolute inset-0 -z-10" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {t("focus.pomodoro.title")} · {sessionLabel}
        </p>
        <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">
          {t("focus.pomodoro.sessionComplete")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{task.title}</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={startBreak}>
            {t("focus.pomodoro.startBreak")}
          </Button>
          <Button size="lg" variant="outline" onClick={nextSession}>
            {t("focus.pomodoro.continueWorking")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleMoveToTomorrow}
          >
            {t("focus.pomodoro.moveToTomorrow")}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => router.push("/app/today")}>
            <X className="size-4" /> {t("focus.pomodoro.finished")}
          </Button>
        </div>
      </div>
    );
  }

  // Phase: break done — short prompt before the next session starts.
  if (phase === "breakDone") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <div className="focus-veil absolute inset-0 -z-10" />
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {t("focus.pomodoro.break")}
        </p>
        <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">
          {t("focus.pomodoro.breakDone")}
        </h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={nextSession}>
            {t("focus.pomodoro.nextSession")}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => router.push("/app/today")}>
            <X className="size-4" /> {t("common.exit")}
          </Button>
        </div>
      </div>
    );
  }

  // Phase: break (or session during running/paused) — show big timer.
  const isBreak = phase === "break";
  const phaseLabel = isBreak
    ? isLongBreak
      ? t("focus.pomodoro.longBreak")
      : t("focus.pomodoro.shortBreak")
    : sessionLabel;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <div className="focus-veil absolute inset-0 -z-10" />
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
        {t("focus.pomodoro.title")} · {phaseLabel}
      </p>
      <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-snug sm:text-3xl">
        {task.title}
      </h1>

      {nextAction && !isBreak && (
        <div className="mt-4 rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("common.nextAction")}
          </p>
          <p className="mt-0.5 text-lg font-medium">{nextAction}</p>
        </div>
      )}

      <p className="mt-12 font-mono text-6xl tabular text-foreground sm:text-8xl">
        {display}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {isBreak ? (
          <Button size="lg" variant="outline" onClick={skipBreak}>
            <SkipForward className="size-4" /> {t("focus.pomodoro.skipBreak")}
          </Button>
        ) : phase === "running" ? (
          <Button size="lg" variant="outline" onClick={pause}>
            <Pause className="size-4" /> {t("common.pause")}
          </Button>
        ) : (
          <Button size="lg" variant="outline" onClick={resume}>
            <Play className="size-4" /> {t("common.resume")}
          </Button>
        )}
        {!isBreak && firstPendingSubtask && (
          <Button size="lg" onClick={handleNextStep} disabled={subtaskPending}>
            <ArrowRight className="size-4" /> {t("common.doneNextStep")}
          </Button>
        )}
        {!isBreak && (
          <Button size="lg" variant="outline" onClick={completeEarly}>
            <Check className="size-4" /> {t("common.complete")}
          </Button>
        )}
        <Button
          size="lg"
          variant="ghost"
          onClick={() => {
            exitToToday();
            router.push("/app/today");
          }}
        >
          <X className="size-4" /> {t("common.exit")}
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        {t("focus.shortcutHint")}
      </p>
    </div>
  );
}
