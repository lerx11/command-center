import { z } from "zod";

// NOTE: validation messages are i18n keys (looked up via t() at render time).
export const loginSchema = z.object({
  email: z.string().email("validations.validEmail"),
  password: z.string().min(6, "validations.minLength6"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, "validations.enterName").max(80),
  email: z.string().email("validations.validEmail"),
  password: z.string().min(6, "validations.minLength6"),
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("validations.validEmail"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "validations.minLength6"),
    confirmPassword: z.string().min(6, "validations.minLength6"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validations.passwordsDoNotMatch",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const projectSchema = z.object({
  title: z.string().min(1, "validations.titleRequired").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.enum(["CASH_NOW", "CASH_ENGINE", "ASSET", "PARKING"]),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "PARKED"]),
});
export type ProjectValues = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  title: z.string().min(1, "validations.titleRequired").max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  project_id: z.string().uuid().nullable(),
  type: z.enum(["BIG_WIN", "MONEY", "ASSET", "ENERGY", "OTHER"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "PARKED", "CANCELLED"]),
  priority: z.enum(["HIGH", "NORMAL", "LOW"]),
  due_date: z.string().nullable(),
});
export type TaskValues = z.infer<typeof taskSchema>;

export const energyTaskSchema = z.object({
  category: z.enum(["BODY", "MIND", "RECOVERY"]),
  title: z.string().min(1).max(200),
});
export type EnergyTaskValues = z.infer<typeof energyTaskSchema>;

export const parkingIdeaSchema = z.object({
  title: z.string().min(1, "validations.whatCameToMind").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  project_id: z.string().uuid().nullable(),
});
export type ParkingIdeaValues = z.infer<typeof parkingIdeaSchema>;

export const cashTargetSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  min_target: z.coerce.number().min(0).nullable(),
  max_target: z.coerce.number().min(0).nullable(),
  received: z.coerce.number().min(0).nullable(),
  in_progress: z.coerce.number().min(0).nullable(),
  expected: z.coerce.number().min(0).nullable(),
});
export type CashTargetValues = z.infer<typeof cashTargetSchema>;

export const dailyReviewSchema = z.object({
  date: z.string(),
  money_moved: z.coerce.number().min(0).nullable(),
  what_worked: z.string().max(4000).optional().or(z.literal("")),
  what_distracted: z.string().max(4000).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});
export type DailyReviewValues = z.infer<typeof dailyReviewSchema>;

export const profileSchema = z.object({
  name: z.string().min(1).max(80),
});
export type ProfileValues = z.infer<typeof profileSchema>;

