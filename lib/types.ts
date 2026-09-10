// Row types for the COMMAND CENTER database.
import type {
  ProjectCategory,
  ProjectStatus,
  TaskType,
  TaskStatus,
  TaskPriority,
  EnergyCategory,
  ParkingStatus,
} from "@/lib/constants";

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
};

export type Subtask = {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type DailyPlan = {
  id: string;
  user_id: string;
  date: string;
  big_win_task_id: string | null;
  money_task_id: string | null;
  asset_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EnergyTask = {
  id: string;
  user_id: string;
  daily_plan_id: string | null;
  category: EnergyCategory;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type ParkingIdea = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ParkingStatus;
  project_id: string | null;
  created_at: string;
  converted_at: string | null;
};

export type FocusSession = {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
};

export type DailyReview = {
  id: string;
  user_id: string;
  date: string;
  completed_summary: string | null;
  money_moved: number | null;
  what_worked: string | null;
  what_distracted: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CashTarget = {
  id: string;
  user_id: string;
  period: string;
  min_target: number | null;
  max_target: number | null;
  received: number | null;
  in_progress: number | null;
  expected: number | null;
  created_at: string;
  updated_at: string;
};
