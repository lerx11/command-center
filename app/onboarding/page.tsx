"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { onboardingAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

type Step = 0 | 1 | 2;

const STEPS = [
  {
    badge: "🎯 ONE BIG WIN",
    title: "What should make today successful?",
    hint: "The single task that, if finished, makes the day a win.",
    placeholder: "e.g. Send 5 offers to brokers",
    nextLabel: "Continue",
  },
  {
    badge: "💰 MONEY",
    title: "What action can move money forward today?",
    hint: "A direct action connected to revenue.",
    placeholder: "e.g. Reach out to potential clients",
    nextLabel: "Continue",
  },
  {
    badge: "🏗️ ASSET",
    title: "What asset do you want to build today?",
    hint: "A long-term asset you are constructing.",
    placeholder: "e.g. Finish the real-estate AI video page",
    nextLabel: "Open Today",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(0);
  const [bigWin, setBigWin] = useState("");
  const [money, setMoney] = useState("");
  const [asset, setAsset] = useState("");
  const [pending, startTransition] = useTransition();

  const values = [bigWin, money, asset];
  const setValues = [setBigWin, setMoney, setAsset];

  const finish = () => {
    const fd = new FormData();
    if (bigWin.trim()) fd.set("bigWin", bigWin.trim());
    if (money.trim()) fd.set("money", money.trim());
    if (asset.trim()) fd.set("asset", asset.trim());

    startTransition(async () => {
      try {
        await onboardingAction(fd);
      } catch {
        toast.error("Could not save your plan. Please try again.");
      }
    });
  };

  const current = STEPS[step];
  const canContinue = values[step].trim().length > 0;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.24 0.006 240) 0%, transparent 70%)",
        }}
      />
      <div className="w-full max-w-md">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Welcome to
        </p>
        <h1 className="mb-10 text-center text-3xl font-bold tracking-tight">
          COMMAND CENTER
        </h1>

        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? "w-8 bg-foreground" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {current.badge}
          </p>
          <h2 className="text-2xl font-semibold leading-tight">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground">{current.hint}</p>
          <Input
            autoFocus
            value={values[step]}
            onChange={(e) => setValues[step](e.target.value)}
            placeholder={current.placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canContinue && step < 2) {
                e.preventDefault();
                setStep((s) => (s + 1) as Step);
              } else if (e.key === "Enter" && canContinue && step === 2) {
                e.preventDefault();
                finish();
              }
            }}
          />
          <Button
            className="w-full"
            disabled={!canContinue || pending}
            onClick={() => {
              if (step < 2) setStep((s) => (s + 1) as Step);
              else finish();
            }}
          >
            {pending ? "Setting up…" : current.nextLabel}
            {!pending && <ArrowRight className="size-4" />}
          </Button>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
