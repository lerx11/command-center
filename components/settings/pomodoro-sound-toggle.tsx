"use client";

import { useEffect, useState } from "react";
import { getSoundEnabled, setSoundEnabled } from "@/hooks/use-pomodoro-timer";
import { useT } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function PomodoroSoundToggle() {
  const t = useT();
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Read the saved preference on mount — avoids SSR/client mismatch.
  useEffect(() => {
    setMounted(true);
    setEnabled(getSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  };

  if (!mounted) {
    // Render a stable placeholder during SSR / first paint.
    return (
      <div className="inline-flex rounded-md border p-0.5 opacity-50">
        <span className="rounded px-3 py-1 text-xs">{t("focus.pomodoro.soundOn")}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-md border p-0.5">
      <button
        onClick={enabled ? undefined : toggle}
        className={cn(
          "rounded px-3 py-1 text-xs transition-colors",
          enabled
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t("focus.pomodoro.soundOn")}
      </button>
      <button
        onClick={enabled ? toggle : undefined}
        className={cn(
          "rounded px-3 py-1 text-xs transition-colors",
          !enabled
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t("focus.pomodoro.soundOff")}
      </button>
    </div>
  );
}
