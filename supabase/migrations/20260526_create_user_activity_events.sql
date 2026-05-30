-- Per-user activity tracking for dashboard analytics and audit history.
-- Run in Supabase SQL editor after analysis_sessions migration.

create table if not exists public.user_activity_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  platform text null,
  campaign_goal text null,
  vertical text null,
  creative_name text null,
  creative_size text null,
  step integer null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_events_user_created
  on public.user_activity_events(user_id, created_at desc);

create index if not exists idx_user_activity_events_type
  on public.user_activity_events(user_id, event_type);

alter table public.user_activity_events enable row level security;

drop policy if exists "user_activity_events_select_own" on public.user_activity_events;
create policy "user_activity_events_select_own"
on public.user_activity_events
for select
using (auth.uid() = user_id);

drop policy if exists "user_activity_events_insert_own" on public.user_activity_events;
create policy "user_activity_events_insert_own"
on public.user_activity_events
for insert
with check (auth.uid() = user_id);
