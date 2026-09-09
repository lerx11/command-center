"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { QuickCaptureFab } from "./quick-capture-fab";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

export function AppShell({
  profileName,
  children,
}: {
  profileName: string;
  children: ReactNode;
}) {
  return (
    <>
      <KeyboardShortcuts />
      <div className="flex min-h-svh">
        {/* Desktop sidebar */}
        <Sidebar profileName={profileName} />
        {/* Main content */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </main>
      </div>
      {/* Mobile bottom nav */}
      <BottomNav />
      {/* Floating quick-capture (mobile + desktop) */}
      <QuickCaptureFab />
    </>
  );
}
