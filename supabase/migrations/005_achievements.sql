-- Migration: `achievements` table (gamification)
-- Run this in Supabase Dashboard → SQL Editor. Idempotent.

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists idx_achievements_user on public.achievements(user_id);

alter table public.achievements enable row level security;

drop policy if exists "achievements_select_own" on public.achievements;
create policy "achievements_select_own" on public.achievements
  for select using (auth.uid() = user_id);
drop policy if exists "achievements_insert_own" on public.achievements;
create policy "achievements_insert_own" on public.achievements
  for insert with check (auth.uid() = user_id);
drop policy if exists "achievements_delete_own" on public.achievements;
create policy "achievements_delete_own" on public.achievements
  for delete using (auth.uid() = user_id);