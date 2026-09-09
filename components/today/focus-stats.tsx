import { Timer } from "lucide-react";
import { getT } from "@/lib/i18n";
import { formatDuration } from "@/lib/utils";

// Server component — rendered inside Today page after focus_sessions are queried.
export async function FocusStats({
  sessionCount,
  totalSeconds,
}: {
  sessionCount: number;
  totalSeconds: number;
}) {
  const { t } = await getT();
  const time = formatDuration(totalSeconds);
  // Pluralisation in Russian: 1 → focusStatsOne, 2-4 → focusStatsFew, otherwise focusStats.
  // English uses focusStats (plural) or focusStatsOne (singular).
  let key: string;
  if (sessionCount === 0) {
    key = "today.focusStatsNone";
  } else if (sessionCount === 1) {
    key = "today.focusStatsOne";
  } else {
    const lastTwo = sessionCount % 100;
    const last = sessionCount % 10;
    if (lastTwo < 11 || lastTwo > 14) {
      if (last >= 2 && last <= 4) key = "today.focusStatsFew";
      else key = "today.focusStats";
    } else {
      key = "today.focusStats";
    }
  }
  const text = t(key)
    .replace("{sessions}", String(sessionCount))
    .replace("{time}", time);
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Timer className="size-3.5" />
      {text}
    </p>
  );
}
