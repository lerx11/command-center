import { formatDate, todayISO } from "@/lib/utils";

export function CommandCenterHeader() {
  const date = formatDate(new Date(todayISO() + "T00:00:00"));
  return (
    <header className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Command
      </p>
      <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        Center
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Today, {date}</p>
    </header>
  );
}
