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
import { quickCaptureAction } from "@/app/app/parking/actions";

export function QuickCaptureFab() {
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
        toast.error(res.error);
        return;
      }
      setValue("");
      setOpen(false);
      toast.success("Saved to Parking Lot ✓");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="New idea"
          className="fixed bottom-20 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:size-14"
        >
          <Plus className="size-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Parking Lot</DialogTitle>
          <DialogDescription>
            What came to mind? It won&apos;t become a task until you decide.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Idea…"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              }
            }}
          />
          <Button onClick={save} disabled={pending || !value.trim()} className="w-full">
            {pending ? "Saving…" : "Save idea"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
