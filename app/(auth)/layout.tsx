import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.24 0.006 240) 0%, transparent 70%)",
        }}
      />
      <Link
        href="/login"
        className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
      >
        COMMAND
        <br />
        <span className="text-foreground">CENTER</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
