"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";
import { QuickCaptureFab } from "./quick-capture-fab";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { FocusSessionProvider } from "@/components/focus/focus-session-provider";
import { CelebrationOverlay } from "@/components/gamification/celebration";

export function AppShell({
  profileName,
  children,
}: {
  profileName: string;
  children: ReactNode;
}) {
  return (
    <FocusSessionProvider>
      <KeyboardShortcuts />
      <CelebrationOverlay />
      <div className="flex min-h-svh">
        {/* Desktop sidebar */}
        <Sidebar profileName={profileName} />
        {/* Main content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <MobileHeader />
          <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-8 sm:px-6 md:py-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
      {/* Mobile bottom nav */}
      <BottomNav />
      {/* Floating quick-capture (mobile + desktop) */}
      <QuickCaptureFab />
    </FocusSessionProvider>
  );
}
