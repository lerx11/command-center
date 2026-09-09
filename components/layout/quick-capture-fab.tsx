"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/components/i18n/i18n-provider";
import { quickCaptureAction } from "@/app/app/parking/actions";

export function QuickCaptureFab() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () => {
    const title = value.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("title", title);

    startTransition(async () => {
      const res = await quickCaptureAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      setValue("");
      setOpen(false);
      toast.success(t("toasts.savedToParking"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label={t("parking.newIdea")}
          className="fixed bottom-20 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:size-14"
        >
          <Plus className="size-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("parking.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("parking.dialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("parking.placeholder")}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              }
            }}
          />
          <Button onClick={save} disabled={pending || !value.trim()} className="w-full">
            {pending ? t("common.saving") : t("parking.saveIdea")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
