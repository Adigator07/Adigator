-- =============================================================================
-- ADIGATOR STAGING SETUP — paste entire file into Supabase SQL Editor (staging)
-- Safe to re-run (IF NOT EXISTS / idempotent policies)
--
-- Sections:
--   1. Brain tables (Creative Brain reuse)
--   2. Preview Tool tables (sessions, creatives, analyzer_results, activity_logs)
--   3. Programmatic campaigns API persistence
--   4. Validation version link on programmatic_campaigns
-- =============================================================================


-- ===================== SECTION 1: BRAIN TABLES =====================

-- =============================================================================
-- BRAIN TABLES — Run in Supabase SQL Editor
-- Creates campaign_brains, creative_brains, landing_page_brains,
-- validation_brains, validation_versions (+ RLS).
-- Safe to re-run (IF NOT EXISTS / idempotent policies).
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── campaign_brains ──────────────────────────────────────────────────────────
create table if not exists public.campaign_brains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  brief_summary text not null default '',
  campaign_goal text not null default '',
  vertical text not null default '',
  target_audience text not null default '',
  offer text not null default '',
  cta text not null default '',
  platform text not null default '',
  objective_mapping jsonb not null default '{}'::jsonb,
  content_hash text not null,
  competitor_insights jsonb null,
  audience_insights jsonb null,
  recommendations jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaign_brains_campaign
  on public.campaign_brains (campaign_id, created_at desc);
create index if not exists idx_campaign_brains_hash
  on public.campaign_brains (campaign_id, content_hash);
create index if not exists idx_campaign_brains_user
  on public.campaign_brains (user_id, created_at desc);

-- ── creative_brains ──────────────────────────────────────────────────────────
create table if not exists public.creative_brains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  creative_id text not null,
  campaign_brain_id uuid not null references public.campaign_brains(id) on delete cascade,
  extracted_text text not null default '',
  detected_objects jsonb not null default '[]'::jsonb,
  detected_brands jsonb not null default '[]'::jsonb,
  visual_analysis jsonb not null default '{}'::jsonb,
  sentiment text not null default '',
  compliance_signals jsonb not null default '{}'::jsonb,
  content_hash text not null,
  emotional_triggers jsonb null,
  attention_score numeric null,
  creative_recommendations jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_creative_brains_creative
  on public.creative_brains (creative_id, created_at desc);
create index if not exists idx_creative_brains_hash
  on public.creative_brains (creative_id, content_hash);
create index if not exists idx_creative_brains_campaign
  on public.creative_brains (campaign_id, created_at desc);
create index if not exists idx_creative_brains_campaign_brain
  on public.creative_brains (campaign_brain_id);

-- ── landing_page_brains ────────────────────────────────────────────────────────
create table if not exists public.landing_page_brains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  landing_url text not null,
  headline text not null default '',
  offer text not null default '',
  cta text not null default '',
  page_intent text not null default '',
  conversion_elements jsonb not null default '[]'::jsonb,
  trust_signals jsonb not null default '[]'::jsonb,
  content_hash text not null,
  page_speed_insights jsonb null,
  seo_signals jsonb null,
  mobile_experience_signals jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_landing_page_brains_url
  on public.landing_page_brains (landing_url, created_at desc);
create index if not exists idx_landing_page_brains_hash
  on public.landing_page_brains (landing_url, content_hash);
create index if not exists idx_landing_page_brains_campaign
  on public.landing_page_brains (campaign_id, created_at desc);

-- ── validation_brains ──────────────────────────────────────────────────────────
create table if not exists public.validation_brains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  campaign_brain_id uuid not null references public.campaign_brains(id) on delete restrict,
  creative_brain_ids uuid[] not null default '{}',
  landing_brain_id uuid not null references public.landing_page_brains(id) on delete restrict,
  validation_results jsonb not null default '{}'::jsonb,
  overall_score numeric not null default 0,
  launch_readiness text not null default 'unknown',
  recommendations jsonb null,
  warning_flags jsonb null,
  optimization_suggestions jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_validation_brains_campaign
  on public.validation_brains (campaign_id, created_at desc);

-- ── validation_versions ────────────────────────────────────────────────────────
create table if not exists public.validation_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  version_number integer not null,
  task_type text not null default 'campaign_setup',
  trigger_reason text not null default '',
  campaign_brain_id uuid null references public.campaign_brains(id) on delete set null,
  creative_brain_ids uuid[] not null default '{}',
  landing_brain_id uuid null references public.landing_page_brains(id) on delete set null,
  validation_brain_id uuid null references public.validation_brains(id) on delete set null,
  status text not null default 'success',
  validation_quality text not null default 'full',
  missing_modules text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint validation_versions_campaign_version_unique
    unique (user_id, campaign_id, version_number)
);

create index if not exists idx_validation_versions_campaign
  on public.validation_versions (campaign_id, version_number desc);
create index if not exists idx_validation_versions_user
  on public.validation_versions (user_id, created_at desc);

-- Optional link when programmatic_campaigns exists
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'programmatic_campaigns'
  ) then
    alter table public.programmatic_campaigns
      add column if not exists latest_validation_version_id uuid null
        references public.validation_versions(id) on delete set null;
  end if;
end $$;

-- ── RLS ────────────────────────────────────────────────────────────────────────
alter table public.campaign_brains enable row level security;
drop policy if exists "campaign_brains_select_own" on public.campaign_brains;
create policy "campaign_brains_select_own" on public.campaign_brains for select using (auth.uid() = user_id);
drop policy if exists "campaign_brains_insert_own" on public.campaign_brains;
create policy "campaign_brains_insert_own" on public.campaign_brains for insert with check (auth.uid() = user_id);

alter table public.creative_brains enable row level security;
drop policy if exists "creative_brains_select_own" on public.creative_brains;
create policy "creative_brains_select_own" on public.creative_brains for select using (auth.uid() = user_id);
drop policy if exists "creative_brains_insert_own" on public.creative_brains;
create policy "creative_brains_insert_own" on public.creative_brains for insert with check (auth.uid() = user_id);

alter table public.landing_page_brains enable row level security;
drop policy if exists "landing_page_brains_select_own" on public.landing_page_brains;
create policy "landing_page_brains_select_own" on public.landing_page_brains for select using (auth.uid() = user_id);
drop policy if exists "landing_page_brains_insert_own" on public.landing_page_brains;
create policy "landing_page_brains_insert_own" on public.landing_page_brains for insert with check (auth.uid() = user_id);

alter table public.validation_brains enable row level security;
drop policy if exists "validation_brains_select_own" on public.validation_brains;
create policy "validation_brains_select_own" on public.validation_brains for select using (auth.uid() = user_id);
drop policy if exists "validation_brains_insert_own" on public.validation_brains;
create policy "validation_brains_insert_own" on public.validation_brains for insert with check (auth.uid() = user_id);

alter table public.validation_versions enable row level security;
drop policy if exists "validation_versions_select_own" on public.validation_versions;
create policy "validation_versions_select_own" on public.validation_versions for select using (auth.uid() = user_id);
drop policy if exists "validation_versions_insert_own" on public.validation_versions;
create policy "validation_versions_insert_own" on public.validation_versions for insert with check (auth.uid() = user_id);


-- ===================== SECTION 2: PREVIEW TOOL TABLES =====================

-- =============================================================================
-- PREVIEW TOOL TABLES — Run in Supabase SQL Editor
-- Fixes: analysis_sessions missing + creatives schema mismatch
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── 1b. Fix legacy creatives schema (bigint id/user_id breaks RLS: uuid = bigint) ──
do $$
declare
  id_udt text;
  user_udt text;
  has_rows boolean;
begin
  if to_regclass('public.creatives') is null then
    return;
  end if;

  select c.udt_name into id_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'creatives' and c.column_name = 'id';

  select c.udt_name into user_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'creatives' and c.column_name = 'user_id';

  if id_udt is distinct from 'uuid' or user_udt is distinct from 'uuid' then
    select exists (select 1 from public.creatives limit 1) into has_rows;

    if has_rows then
      if to_regclass('public.creatives_legacy_incompatible') is null then
        alter table public.creatives rename to creatives_legacy_incompatible;
      else
        drop table public.creatives cascade;
      end if;
    else
      drop table public.creatives cascade;
    end if;
  end if;
end $$;

-- analyzer_results FK requires creatives.id uuid — drop incompatible legacy table
do $$
declare
  creative_id_udt text;
begin
  if to_regclass('public.analyzer_results') is null then
    return;
  end if;

  select c.udt_name into creative_id_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'analyzer_results' and c.column_name = 'creative_id';

  if creative_id_udt is distinct from 'uuid' then
    drop table public.analyzer_results cascade;
  end if;
end $$;

-- activity_logs user_id must be uuid for RLS policies
do $$
declare
  user_udt text;
begin
  if to_regclass('public.activity_logs') is null then
    return;
  end if;

  select c.udt_name into user_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'activity_logs' and c.column_name = 'user_id';

  if user_udt is distinct from 'uuid' then
    drop table public.activity_logs cascade;
  end if;
end $$;

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
alter table public.creatives add column if not exists user_id uuid references auth.users(id) on delete cascade;
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
-- Ensure action_label exists on legacy tables before create-if-not-exists skips
alter table public.activity_logs add column if not exists action_label text null;

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


-- ===================== SECTION 3: PROGRAMMATIC CAMPAIGNS =====================

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


-- ===================== SECTION 4: VALIDATION VERSION LINK =====================

-- Link programmatic_campaigns to validation versions (after brain tables exist)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'programmatic_campaigns'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'validation_versions'
  ) then
    alter table public.programmatic_campaigns
      add column if not exists latest_validation_version_id uuid null
        references public.validation_versions(id) on delete set null;
  end if;
end $$;

notify pgrst, 'reload schema';
