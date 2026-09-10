-- Migration: Add daily_plan_extra_tasks table for EXTRA TODAY tasks
-- Run this in Supabase Dashboard → SQL Editor if the DB already exists.
-- Idempotent: safe to re-run.

create table if not exists public.daily_plan_extra_tasks (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.daily_plans(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_plan_extra_plan on public.daily_plan_extra_tasks(daily_plan_id);
create index if not exists idx_daily_plan_extra_task on public.daily_plan_extra_tasks(task_id);
create index if not exists idx_daily_plan_extra_user on public.daily_plan_extra_tasks(user_id);

alter table public.daily_plan_extra_tasks enable row level security;

drop policy if exists "daily_plan_extra_select_own" on public.daily_plan_extra_tasks;
create policy "daily_plan_extra_select_own" on public.daily_plan_extra_tasks
  for select using (auth.uid() = user_id);
drop policy if exists "daily_plan_extra_insert_own" on public.daily_plan_extra_tasks;
create policy "daily_plan_extra_insert_own" on public.daily_plan_extra_tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "daily_plan_extra_update_own" on public.daily_plan_extra_tasks;
create policy "daily_plan_extra_update_own" on public.daily_plan_extra_tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "daily_plan_extra_delete_own" on public.daily_plan_extra_tasks;
create policy "daily_plan_extra_delete_own" on public.daily_plan_extra_tasks
  for delete using (auth.uid() = user_id);
