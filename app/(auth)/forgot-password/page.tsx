"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations";
import { forgotPasswordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useT } from "@/components/i18n/i18n-provider";

export default function ForgotPasswordPage() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordValues) => {
    const fd = new FormData();
    fd.set("email", values.email);

    startTransition(async () => {
      const res = await forgotPasswordAction(fd);
      if (res?.error) {
        toast.error(t(res.error));
        return;
      }
      if (res?.success) {
        toast.success(t(res.success));
        setSent(true);
      }
    });
  };

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t("auth.resetPassword")}</CardTitle>
        <CardDescription>
          {t("auth.resetDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            {t("auth.resetSent")}
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t("auth.email")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {t(form.formState.errors.email.message ?? "")}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("auth.sending") : t("auth.sendResetLink")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
