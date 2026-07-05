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
