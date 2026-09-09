import { formatDate, todayISO } from "@/lib/utils";
import { getT } from "@/lib/i18n";

export async function CommandCenterHeader() {
  const { t, locale } = await getT();
  const date = formatDate(new Date(todayISO() + "T00:00:00"), locale);
  return (
    <header className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {t("brand.command")}
      </p>
      <h1 className="mt-1 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        {t("brand.center")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("header.today").replace("{date}", date)}
      </p>
    </header>
  );
}
