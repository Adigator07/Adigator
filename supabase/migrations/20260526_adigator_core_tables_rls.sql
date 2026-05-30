-- Core Adigator tables (creatives, analyzer_results, activity_logs) with RLS.
-- Safe to run when tables already exist — uses IF NOT EXISTS and idempotent policies.

create extension if not exists "pgcrypto";

-- ── creatives ────────────────────────────────────────────────────────────────
create table if not exists public.creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creative_name text not null,
  creative_type text not null,
  file_url text null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_creatives_user_uploaded
  on public.creatives(user_id, uploaded_at desc);

alter table public.creatives enable row level security;

drop policy if exists "creatives_select_own" on public.creatives;
create policy "creatives_select_own"
on public.creatives for select
using (auth.uid() = user_id);

drop policy if exists "creatives_insert_own" on public.creatives;
create policy "creatives_insert_own"
on public.creatives for insert
with check (auth.uid() = user_id);

drop policy if exists "creatives_update_own" on public.creatives;
create policy "creatives_update_own"
on public.creatives for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "creatives_delete_own" on public.creatives;
create policy "creatives_delete_own"
on public.creatives for delete
using (auth.uid() = user_id);

-- ── analyzer_results ─────────────────────────────────────────────────────────
create table if not exists public.analyzer_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creative_id uuid not null references public.creatives(id) on delete cascade,
  platform text not null,
  goal text not null,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analyzer_results_user_created
  on public.analyzer_results(user_id, created_at desc);

create index if not exists idx_analyzer_results_creative
  on public.analyzer_results(creative_id, created_at desc);

alter table public.analyzer_results enable row level security;

drop policy if exists "analyzer_results_select_own" on public.analyzer_results;
create policy "analyzer_results_select_own"
on public.analyzer_results for select
using (auth.uid() = user_id);

drop policy if exists "analyzer_results_insert_own" on public.analyzer_results;
create policy "analyzer_results_insert_own"
on public.analyzer_results for insert
with check (auth.uid() = user_id);

drop policy if exists "analyzer_results_update_own" on public.analyzer_results;
create policy "analyzer_results_update_own"
on public.analyzer_results for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "analyzer_results_delete_own" on public.analyzer_results;
create policy "analyzer_results_delete_own"
on public.analyzer_results for delete
using (auth.uid() = user_id);

-- ── activity_logs ────────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  action_label text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user_created
  on public.activity_logs(user_id, created_at desc);

create index if not exists idx_activity_logs_action_type
  on public.activity_logs(user_id, action_type);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_select_own" on public.activity_logs;
create policy "activity_logs_select_own"
on public.activity_logs for select
using (auth.uid() = user_id);

drop policy if exists "activity_logs_insert_own" on public.activity_logs;
create policy "activity_logs_insert_own"
on public.activity_logs for insert
with check (auth.uid() = user_id);

-- ── creative asset storage ───────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('creative-assets', 'creative-assets', true)
on conflict (id) do nothing;

drop policy if exists "creative_assets_select_own" on storage.objects;
create policy "creative_assets_select_own"
on storage.objects for select
using (
  bucket_id = 'creative-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "creative_assets_insert_own" on storage.objects;
create policy "creative_assets_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'creative-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "creative_assets_update_own" on storage.objects;
create policy "creative_assets_update_own"
on storage.objects for update
using (
  bucket_id = 'creative-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "creative_assets_delete_own" on storage.objects;
create policy "creative_assets_delete_own"
on storage.objects for delete
using (
  bucket_id = 'creative-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
