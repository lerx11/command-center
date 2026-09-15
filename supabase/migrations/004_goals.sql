-- Migration: Add `goals` table + link projects to goals
-- Run this in Supabase Dashboard → SQL Editor if the DB already exists.
-- Idempotent: safe to re-run.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  min_amount numeric not null default 0,
  max_amount numeric not null default 0,
  position integer not null default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ACHIEVED', 'LOCKED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user on public.goals(user_id);

-- Optionally link a project to a specific goal. Projects with NULL goal_id
-- belong to the active goal by default.
alter table public.projects add column if not exists goal_id uuid references public.goals(id);

alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);