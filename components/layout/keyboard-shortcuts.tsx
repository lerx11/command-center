"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
}

const ROUTE_SHORTCUTS: Record<string, string> = {
  n: "/app/today", // new task — open today (where the new-task flow lives)
  f: "/app/focus",
  p: "/app/parking",
  t: "/app/today",
  r: "/app/review",
  w: "/app/workspace",
};

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  // Prefetch shortcut-target routes once on mount so keyboard nav is instant.
  useEffect(() => {
    Object.values(ROUTE_SHORTCUTS).forEach((href) => {
      router.prefetch(href);
    });
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;

      // Esc closes modals / dialogs — Radix handles it natively, nothing extra.
      if (e.key === "Escape") return;

      const key = e.key.toLowerCase();
      if (ROUTE_SHORTCUTS[key]) {
        e.preventDefault();
        router.push(ROUTE_SHORTCUTS[key]);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname]);
  return null;
}
