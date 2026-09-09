-- =============================================================================
-- COMMAND CENTER — consolidated schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- Required extension for auth.uid()
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. PROFILES
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 2. PROJECTS
-- =============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null check (category in ('CASH_NOW','CASH_ENGINE','ASSET','PARKING')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','COMPLETED','PARKED')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_user_status on public.projects(user_id, status);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 3. TASKS
-- =============================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text default '',
  type text not null check (type in ('BIG_WIN','MONEY','ASSET','ENERGY','OTHER')),
  status text not null default 'TODO' check (status in ('TODO','IN_PROGRESS','DONE','PARKED','CANCELLED')),
  priority text not null default 'NORMAL' check (priority in ('HIGH','NORMAL','LOW')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 4. DAILY PLANS  (one plan per user per calendar day)
-- =============================================================================
create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  big_win_task_id uuid references public.tasks(id) on delete set null,
  money_task_id uuid references public.tasks(id) on delete set null,
  asset_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_plans_user_date on public.daily_plans(user_id, date);

alter table public.daily_plans enable row level security;

drop policy if exists "daily_plans_select_own" on public.daily_plans;
create policy "daily_plans_select_own" on public.daily_plans
  for select using (auth.uid() = user_id);
drop policy if exists "daily_plans_insert_own" on public.daily_plans;
create policy "daily_plans_insert_own" on public.daily_plans
  for insert with check (auth.uid() = user_id);
drop policy if exists "daily_plans_update_own" on public.daily_plans;
create policy "daily_plans_update_own" on public.daily_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "daily_plans_delete_own" on public.daily_plans;
create policy "daily_plans_delete_own" on public.daily_plans
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 5. ENERGY TASKS
-- =============================================================================
create table if not exists public.energy_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_plan_id uuid references public.daily_plans(id) on delete cascade,
  category text not null check (category in ('BODY','MIND','RECOVERY')),
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_energy_tasks_user_id on public.energy_tasks(user_id);
create index if not exists idx_energy_tasks_plan on public.energy_tasks(daily_plan_id);

alter table public.energy_tasks enable row level security;

drop policy if exists "energy_tasks_select_own" on public.energy_tasks;
create policy "energy_tasks_select_own" on public.energy_tasks
  for select using (auth.uid() = user_id);
drop policy if exists "energy_tasks_insert_own" on public.energy_tasks;
create policy "energy_tasks_insert_own" on public.energy_tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "energy_tasks_update_own" on public.energy_tasks;
create policy "energy_tasks_update_own" on public.energy_tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "energy_tasks_delete_own" on public.energy_tasks;
create policy "energy_tasks_delete_own" on public.energy_tasks
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 6. PARKING IDEAS
-- =============================================================================
create table if not exists public.parking_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'NEW' check (status in ('NEW','LATER','CONVERTED')),
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  converted_at timestamptz
);

create index if not exists idx_parking_ideas_user_id on public.parking_ideas(user_id);
create index if not exists idx_parking_ideas_status on public.parking_ideas(status);

alter table public.parking_ideas enable row level security;

drop policy if exists "parking_ideas_select_own" on public.parking_ideas;
create policy "parking_ideas_select_own" on public.parking_ideas
  for select using (auth.uid() = user_id);
drop policy if exists "parking_ideas_insert_own" on public.parking_ideas;
create policy "parking_ideas_insert_own" on public.parking_ideas
  for insert with check (auth.uid() = user_id);
drop policy if exists "parking_ideas_update_own" on public.parking_ideas;
create policy "parking_ideas_update_own" on public.parking_ideas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "parking_ideas_delete_own" on public.parking_ideas;
create policy "parking_ideas_delete_own" on public.parking_ideas
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 7. FOCUS SESSIONS
-- =============================================================================
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_focus_sessions_task_id on public.focus_sessions(task_id);

alter table public.focus_sessions enable row level security;

drop policy if exists "focus_sessions_select_own" on public.focus_sessions;
create policy "focus_sessions_select_own" on public.focus_sessions
  for select using (auth.uid() = user_id);
drop policy if exists "focus_sessions_insert_own" on public.focus_sessions;
create policy "focus_sessions_insert_own" on public.focus_sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "focus_sessions_update_own" on public.focus_sessions;
create policy "focus_sessions_update_own" on public.focus_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "focus_sessions_delete_own" on public.focus_sessions;
create policy "focus_sessions_delete_own" on public.focus_sessions
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 8. DAILY REVIEWS
-- =============================================================================
create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed_summary text default '',
  money_moved numeric(12,2) default 0,
  what_worked text default '',
  what_distracted text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_reviews_user_date on public.daily_reviews(user_id, date);

alter table public.daily_reviews enable row level security;

drop policy if exists "daily_reviews_select_own" on public.daily_reviews;
create policy "daily_reviews_select_own" on public.daily_reviews
  for select using (auth.uid() = user_id);
drop policy if exists "daily_reviews_insert_own" on public.daily_reviews;
create policy "daily_reviews_insert_own" on public.daily_reviews
  for insert with check (auth.uid() = user_id);
drop policy if exists "daily_reviews_update_own" on public.daily_reviews;
create policy "daily_reviews_update_own" on public.daily_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "daily_reviews_delete_own" on public.daily_reviews;
create policy "daily_reviews_delete_own" on public.daily_reviews
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 9. CASH TARGETS  (financial compass block — §9 of the spec)
-- =============================================================================
create table if not exists public.cash_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null, -- 'YYYY-MM'
  min_target numeric(12,2) default 0,
  max_target numeric(12,2) default 0,
  received numeric(12,2) default 0,
  in_progress numeric(12,2) default 0,
  expected numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists idx_cash_targets_user_period on public.cash_targets(user_id, period);

alter table public.cash_targets enable row level security;

drop policy if exists "cash_targets_select_own" on public.cash_targets;
create policy "cash_targets_select_own" on public.cash_targets
  for select using (auth.uid() = user_id);
drop policy if exists "cash_targets_insert_own" on public.cash_targets;
create policy "cash_targets_insert_own" on public.cash_targets
  for insert with check (auth.uid() = user_id);
drop policy if exists "cash_targets_update_own" on public.cash_targets;
create policy "cash_targets_update_own" on public.cash_targets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "cash_targets_delete_own" on public.cash_targets;
create policy "cash_targets_delete_own" on public.cash_targets
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 10. updated_at trigger for all tables with updated_at
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','projects','tasks','daily_plans','energy_tasks','daily_reviews','cash_targets'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.touch_updated_at();',
      t, t
    );
  end loop;
end $$;

-- =============================================================================
-- Done. All tables, indexes, RLS policies, FKs, and the signup trigger are in place.
-- Users only see rows where user_id = auth.uid() (or id = auth.uid() for profiles).
-- =============================================================================
