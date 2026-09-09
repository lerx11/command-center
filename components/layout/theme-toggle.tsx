"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/i18n/i18n-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-full sm:w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">
          <span className="flex items-center gap-2">
            <Moon className="size-4" /> {t("theme.dark")}
          </span>
        </SelectItem>
        <SelectItem value="light">
          <span className="flex items-center gap-2">
            <Sun className="size-4" /> {t("theme.light")}
          </span>
        </SelectItem>
        <SelectItem value="system">
          <span className="flex items-center gap-2">
            <Monitor className="size-4" /> {t("theme.system")}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
