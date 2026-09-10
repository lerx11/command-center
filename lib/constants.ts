// Enums shared between SQL (check constraints) and the TypeScript layer.

export const PROJECT_CATEGORIES = [
  "CASH_NOW",
  "CASH_ENGINE",
  "ASSET",
  "PARKING",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "PARKED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_TYPES = ["BIG_WIN", "MONEY", "ASSET", "ENERGY", "OTHER"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "PARKED",
  "CANCELLED",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["HIGH", "NORMAL", "LOW"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ENERGY_CATEGORIES = ["BODY", "MIND", "RECOVERY"] as const;
export type EnergyCategory = (typeof ENERGY_CATEGORIES)[number];

export const PARKING_STATUSES = ["NEW", "LATER", "CONVERTED"] as const;
export type ParkingStatus = (typeof PARKING_STATUSES)[number];

export const MAX_ACTIVE_PROJECTS = 3;

export const PROJECT_CATEGORY_META: Record<
  ProjectCategory,
  { label: string; emoji: string; description: string }
> = {
  CASH_NOW: {
    label: "Cash Now",
    emoji: "💰",
    description: "Things that can bring money right now.",
  },
  CASH_ENGINE: {
    label: "Cash Engine",
    emoji: "🚀",
    description: "Things that can create recurring income.",
  },
  ASSET: {
    label: "Assets",
    emoji: "🏗️",
    description: "Long-term projects and assets.",
  },
  PARKING: {
    label: "Parking",
    emoji: "🅿️",
    description: "Projects you are not working on right now.",
  },
};

export const TASK_TYPE_META: Record<
  TaskType,
  { label: string; emoji: string; short: string }
> = {
  BIG_WIN: { label: "One Big Win", emoji: "🎯", short: "Big Win" },
  MONEY: { label: "Money", emoji: "💰", short: "Money" },
  ASSET: { label: "Asset", emoji: "🏗️", short: "Asset" },
  ENERGY: { label: "Energy", emoji: "⚡", short: "Energy" },
  OTHER: { label: "Other", emoji: "📋", short: "Other" },
};

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string }> = {
  HIGH: { label: "High" },
  NORMAL: { label: "Normal" },
  LOW: { label: "Low" },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    badgeClass:
      "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    dotClass: "bg-emerald-500",
  },
  PAUSED: {
    label: "Paused",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  PARKED: {
    label: "Parked",
    badgeClass: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
};

export const ENERGY_CATEGORY_META: Record<
  EnergyCategory,
  { label: string; emoji: string; placeholder: string }
> = {
  BODY: { label: "Body", emoji: "💪", placeholder: "30 minutes of movement" },
  MIND: { label: "Mind", emoji: "🧠", placeholder: "10 minutes to clear thoughts" },
  RECOVERY: {
    label: "Recovery",
    emoji: "🌙",
    placeholder: "Finish work on time",
  },
};

export const NAV_ITEMS = [
  { href: "/app/today", label: "Today", key: "today" },
  { href: "/app/focus", label: "Focus", key: "focus" },
  { href: "/app/projects", label: "Projects", key: "projects" },
  { href: "/app/parking", label: "Parking", key: "parking" },
] as const;

export const SIDEBAR_ITEMS = [
  ...NAV_ITEMS,
  { href: "/app/workspace", label: "Workspace", key: "workspace" },
  { href: "/app/review", label: "Review", key: "review" },
  { href: "/app/dashboard", label: "Dashboard", key: "dashboard" },
] as const;
