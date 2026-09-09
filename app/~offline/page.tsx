export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
        Command
      </p>
      <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight">
        Center
      </h1>
      <p className="mt-6 max-w-sm text-sm text-muted-foreground">
        You&apos;re offline. Reconnect to continue planning your day.
      </p>
    </div>
  );
}
