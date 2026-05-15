-- Analysis sessions persistence for Analyzer / Preview workflows.
-- Run this migration in Supabase SQL editor or migration runner.

create extension if not exists "uuid-ossp";

create table if not exists public.analysis_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_goal text null,
  vertical text null,
  creative_url text null,
  platform text null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_analysis_sessions_user_id_created_at
  on public.analysis_sessions(user_id, created_at desc);

create or replace function public.set_analysis_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_analysis_sessions_updated_at on public.analysis_sessions;
create trigger trg_analysis_sessions_updated_at
before update on public.analysis_sessions
for each row
execute procedure public.set_analysis_sessions_updated_at();

alter table public.analysis_sessions enable row level security;

-- Users can only access their own sessions.
drop policy if exists "analysis_sessions_select_own" on public.analysis_sessions;
create policy "analysis_sessions_select_own"
on public.analysis_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "analysis_sessions_insert_own" on public.analysis_sessions;
create policy "analysis_sessions_insert_own"
on public.analysis_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "analysis_sessions_update_own" on public.analysis_sessions;
create policy "analysis_sessions_update_own"
on public.analysis_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "analysis_sessions_delete_own" on public.analysis_sessions;
create policy "analysis_sessions_delete_own"
on public.analysis_sessions
for delete
using (auth.uid() = user_id);
