-- =============================================================================
-- PREVIEW TOOL TABLES — Run in Supabase SQL Editor
-- Fixes: analysis_sessions missing + creatives schema mismatch
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── 1. analysis_sessions (workflow persistence) ───────────────────────────────
create table if not exists public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
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
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_analysis_sessions_updated_at on public.analysis_sessions;
create trigger trg_analysis_sessions_updated_at
before update on public.analysis_sessions
for each row execute function public.set_analysis_sessions_updated_at();

alter table public.analysis_sessions enable row level security;

drop policy if exists "analysis_sessions_select_own" on public.analysis_sessions;
create policy "analysis_sessions_select_own"
on public.analysis_sessions for select using (auth.uid() = user_id);

drop policy if exists "analysis_sessions_insert_own" on public.analysis_sessions;
create policy "analysis_sessions_insert_own"
on public.analysis_sessions for insert with check (auth.uid() = user_id);

drop policy if exists "analysis_sessions_update_own" on public.analysis_sessions;
create policy "analysis_sessions_update_own"
on public.analysis_sessions for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "analysis_sessions_delete_own" on public.analysis_sessions;
create policy "analysis_sessions_delete_own"
on public.analysis_sessions for delete using (auth.uid() = user_id);

-- ── 2. creatives (create or upgrade legacy schema) ──────────────────────────
create table if not exists public.creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creative_name text not null,
  creative_type text not null,
  file_url text null,
  uploaded_at timestamptz not null default now()
);

-- Upgrade old creatives table that used `name`, `size`, `valid`, etc.
alter table public.creatives add column if not exists creative_name text;
alter table public.creatives add column if not exists creative_type text;
alter table public.creatives add column if not exists file_url text;
alter table public.creatives add column if not exists uploaded_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creatives' and column_name = 'name'
  ) then
    execute $sql$
      update public.creatives
      set creative_name = coalesce(creative_name, name)
      where creative_name is null and name is not null
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creatives' and column_name = 'size'
  ) then
    execute $sql$
      update public.creatives
      set creative_type = coalesce(creative_type, size, 'unknown')
      where creative_type is null
    $sql$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creatives' and column_name = 'created_at'
  ) then
    execute $sql$
      update public.creatives
      set uploaded_at = coalesce(uploaded_at, created_at, now())
      where uploaded_at is null
    $sql$;
  end if;
end $$;

update public.creatives
set creative_name = coalesce(creative_name, 'Untitled Creative')
where creative_name is null;

update public.creatives
set creative_type = coalesce(creative_type, 'image')
where creative_type is null;

update public.creatives
set uploaded_at = coalesce(uploaded_at, now())
where uploaded_at is null;

create index if not exists idx_creatives_user_uploaded
  on public.creatives(user_id, uploaded_at desc);

alter table public.creatives enable row level security;

drop policy if exists "creatives_select_own" on public.creatives;
create policy "creatives_select_own"
on public.creatives for select using (auth.uid() = user_id);

drop policy if exists "creatives_insert_own" on public.creatives;
create policy "creatives_insert_own"
on public.creatives for insert with check (auth.uid() = user_id);

drop policy if exists "creatives_update_own" on public.creatives;
create policy "creatives_update_own"
on public.creatives for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "creatives_delete_own" on public.creatives;
create policy "creatives_delete_own"
on public.creatives for delete using (auth.uid() = user_id);

-- ── 3. analyzer_results (if missing) ─────────────────────────────────────────
create table if not exists public.analyzer_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creative_id uuid not null references public.creatives(id) on delete cascade,
  platform text not null,
  goal text not null,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analyzer_results enable row level security;

drop policy if exists "analyzer_results_select_own" on public.analyzer_results;
create policy "analyzer_results_select_own"
on public.analyzer_results for select using (auth.uid() = user_id);

drop policy if exists "analyzer_results_insert_own" on public.analyzer_results;
create policy "analyzer_results_insert_own"
on public.analyzer_results for insert with check (auth.uid() = user_id);

-- ── 4. activity_logs (if missing) ────────────────────────────────────────────
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  action_label text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_select_own" on public.activity_logs;
create policy "activity_logs_select_own"
on public.activity_logs for select using (auth.uid() = user_id);

drop policy if exists "activity_logs_insert_own" on public.activity_logs;
create policy "activity_logs_insert_own"
on public.activity_logs for insert with check (auth.uid() = user_id);

-- ── 5. Storage bucket for creative files ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('creative-assets', 'creative-assets', true)
on conflict (id) do nothing;

drop policy if exists "creative_assets_select_own" on storage.objects;
create policy "creative_assets_select_own"
on storage.objects for select
using (bucket_id = 'creative-assets' and auth.role() = 'authenticated');

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

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
