"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useT } from "@/components/i18n/i18n-provider";
import { playSuccess, playTimerEnd } from "@/lib/sound";
import { cn } from "@/lib/utils";

export type CelebrationKind = "task" | "core" | "achievement" | "pomodoro";

const ACHIEVEMENT_TITLES: Record<string, { icon: string; key: string }> = {
  first_task: { icon: "✓", key: "firstTask" },
  core_master: { icon: "🎉", key: "coreMaster" },
  pomodoro_master: { icon: "🍅", key: "pomodoroMaster" },
  streak_7: { icon: "🔥", key: "streak7" },
  streak_30: { icon: "🏆", key: "streak30" },
};

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
};

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#facc15",
];

// Trigger a celebration from anywhere in the app.
export function celebrate(kind: CelebrationKind, message?: string) {
  window.dispatchEvent(
    new CustomEvent("app:celebrate", { detail: { kind, message } })
  );
}

export function CelebrationOverlay() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<CelebrationKind>("task");
  const [message, setMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const { kind: k, message: m } = (e as CustomEvent).detail || {};
      setKind(k);
      setMessage(m ?? null);
      setParticles(
        Array.from({ length: 50 }, (_, i) => ({
          id: i + Date.now(),
          left: 15 + Math.random() * 70,
          delay: Math.random() * 0.25,
          duration: 1.4 + Math.random() * 1.1,
          color: COLORS[i % COLORS.length],
          size: 6 + Math.random() * 6,
          rotate: Math.random() * 360,
        }))
      );
      // Louder sound for big moments; quieter chime for single tasks.
      const volume =
        k === "achievement" || k === "core" ? 0.5 : 0.4;
      if (k === "pomodoro") playTimerEnd(0.7);
      else playSuccess(volume);
      setVisible(true);
      const id = window.setTimeout(() => setVisible(false), 1900);
      timers.current.push(id);
    };
    window.addEventListener("app:celebrate", onEvent);
    return () => {
      window.removeEventListener("app:celebrate", onEvent);
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const headline =
    kind === "achievement"
      ? t("gamification.achievementUnlocked")
      : kind === "core"
      ? t("gamification.coreComplete")
      : kind === "pomodoro"
      ? t("gamification.pomodoroComplete")
      : t("gamification.taskDone");
  const accent =
    kind === "achievement"
      ? "text-amber-400"
      : kind === "core"
      ? "text-emerald-400"
      : "text-emerald-500";

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-0 z-[999] flex items-center justify-center transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Confetti */}
      {visible &&
        particles.map((p) => (
          <span
            key={p.id}
            className="absolute top-0 block rounded-sm"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      {/* Popup */}
      {visible && (
        <div className="animate-pop pointer-events-none flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card/95 px-6 py-5 shadow-2xl backdrop-blur">
          {kind === "achievement" ? (
            <>
              <span className="text-4xl">{ACHIEVEMENT_TITLES[message ?? ""]?.icon ?? "🏆"}</span>
              <span className={cn("text-lg font-bold", accent)}>{headline}</span>
              {message && ACHIEVEMENT_TITLES[message] && (
                <span className="text-sm font-semibold text-foreground">
                  {t(`achievements.${ACHIEVEMENT_TITLES[message].key}`)}
                </span>
              )}
            </>
          ) : kind === "pomodoro" ? (
            <>
              <span className="text-4xl">🍅</span>
              <span className="text-lg font-bold text-amber-400">{headline}</span>
            </>
          ) : (
            <>
              <span className={cn("text-lg font-bold", accent)}>
                {headline}
              </span>
              {message && <span className="text-sm text-foreground">{message}</span>}
            </>
          )}
        </div>
      )}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity:0.4; }
        }
        @keyframes pop {
          0% { transform: scale(0.6); opacity:0; }
          60% { transform: scale(1.06); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
        .animate-pop { animation: pop 0.28s ease-out; }
      `}</style>
    </div>
  );
}