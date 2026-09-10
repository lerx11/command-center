-- Migration: Add next_action field to tasks + subtasks table
-- Run this in Supabase Dashboard → SQL Editor if the DB already exists.
-- Idempotent: safe to re-run.

-- 1. Add next_action column to tasks (if not exists)
alter table public.tasks add column if not exists next_action text;

-- 2. Create subtasks table
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subtasks_task_id on public.subtasks(task_id);
create index if not exists idx_subtasks_user_id on public.subtasks(user_id);

alter table public.subtasks enable row level security;

drop policy if exists "subtasks_select_own" on public.subtasks;
create policy "subtasks_select_own" on public.subtasks
  for select using (auth.uid() = user_id);
drop policy if exists "subtasks_insert_own" on public.subtasks;
create policy "subtasks_insert_own" on public.subtasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "subtasks_update_own" on public.subtasks;
create policy "subtasks_update_own" on public.subtasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "subtasks_delete_own" on public.subtasks;
create policy "subtasks_delete_own" on public.subtasks
  for delete using (auth.uid() = user_id);

-- 3. Add updated_at trigger for subtasks
drop trigger if exists set_updated_at on public.subtasks;
create trigger set_updated_at before update on public.subtasks
  for each row execute function public.touch_updated_at();
