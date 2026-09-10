"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "cc-focus-session";

export type FocusSessionData = {
  taskId: string;
  taskTitle: string;
  startedAt: string; // ISO
  durationMinutes: number;
  elapsedSeconds: number;
  isPaused: boolean;
  sessionNumber: number;
  mode: "pomodoro" | "free";
};

type FocusSessionContextValue = {
  session: FocusSessionData | null;
  startSession: (data: Omit<FocusSessionData, "elapsedSeconds" | "isPaused">) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  clearSession: () => void;
  updateElapsed: (seconds: number) => void;
};

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

export function useFocusSession() {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) {
    throw new Error("useFocusSession must be used within FocusSessionProvider");
  }
  return ctx;
}

export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<FocusSessionData | null>(null);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<FocusSessionData | null>(null);

  // Keep ref in sync for interval access
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as FocusSessionData;
        // Recalculate elapsed from wall-clock if session was running
        if (!data.isPaused) {
          const now = Date.now();
          const started = new Date(data.startedAt).getTime();
          const elapsed = Math.floor((now - started) / 1000);
          data.elapsedSeconds = elapsed;
        }
        setSession(data);
      }
    } catch {
      // ignore parse errors
    }
    setMounted(true);
  }, []);

  // Persist to localStorage whenever session changes
  useEffect(() => {
    if (!mounted) return;
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session, mounted]);

  // Global ticking — only runs when session is active and not paused
  useEffect(() => {
    if (!mounted) return;
    if (!session || session.isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Tick every second using wall-clock for accuracy
    const tick = () => {
      const s = sessionRef.current;
      if (!s || s.isPaused) return;
      const now = Date.now();
      const started = new Date(s.startedAt).getTime();
      const elapsed = Math.floor((now - started) / 1000);
      setSession((prev) =>
        prev ? { ...prev, elapsedSeconds: elapsed } : prev
      );
    };

    intervalRef.current = setInterval(tick, 1000);

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        tick(); // catch up
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
  }, [session?.isPaused, mounted, session?.taskId]);

  const startSession = useCallback(
    (data: Omit<FocusSessionData, "elapsedSeconds" | "isPaused">) => {
      setSession({
        ...data,
        elapsedSeconds: 0,
        isPaused: false,
      });
    },
    []
  );

  const pauseSession = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, isPaused: true } : prev));
  }, []);

  const resumeSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      // Recalculate startedAt so elapsed continues from current value
      const newStartedAt = new Date(
        Date.now() - prev.elapsedSeconds * 1000
      ).toISOString();
      return { ...prev, isPaused: false, startedAt: newStartedAt };
    });
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
  }, []);

  const updateElapsed = useCallback((seconds: number) => {
    setSession((prev) => (prev ? { ...prev, elapsedSeconds: seconds } : prev));
  }, []);

  const value: FocusSessionContextValue = {
    session,
    startSession,
    pauseSession,
    resumeSession,
    clearSession,
    updateElapsed,
  };

  return (
    <FocusSessionContext.Provider value={value}>
      {children}
    </FocusSessionContext.Provider>
  );
}
