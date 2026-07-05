-- Programmatic campaign snapshots (user-scoped, RLS).

create table if not exists public.programmatic_campaigns (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_name text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_programmatic_campaigns_user_name
  on public.programmatic_campaigns (user_id, lower(campaign_name));

create index if not exists idx_programmatic_campaigns_user_updated
  on public.programmatic_campaigns (user_id, updated_at desc);

alter table public.programmatic_campaigns enable row level security;

drop policy if exists "programmatic_campaigns_select_own" on public.programmatic_campaigns;
create policy "programmatic_campaigns_select_own"
on public.programmatic_campaigns for select
using (auth.uid() = user_id);

drop policy if exists "programmatic_campaigns_insert_own" on public.programmatic_campaigns;
create policy "programmatic_campaigns_insert_own"
on public.programmatic_campaigns for insert
with check (auth.uid() = user_id);

drop policy if exists "programmatic_campaigns_update_own" on public.programmatic_campaigns;
create policy "programmatic_campaigns_update_own"
on public.programmatic_campaigns for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "programmatic_campaigns_delete_own" on public.programmatic_campaigns;
create policy "programmatic_campaigns_delete_own"
on public.programmatic_campaigns for delete
using (auth.uid() = user_id);
