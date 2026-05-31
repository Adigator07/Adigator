-- =============================================================================
-- FIX DATABASE — Run once in Supabase SQL Editor
-- Fixes:
--   • missing public.creatives table (Preview Tool saveCreative errors)
--   • conversation RLS blocking file uploads / new messages
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── creatives (create if missing) ─────────────────────────────────────────────
create table if not exists public.creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creative_name text not null,
  creative_type text not null,
  file_url text null,
  uploaded_at timestamptz not null default now()
);

alter table public.creatives add column if not exists creative_name text;
alter table public.creatives add column if not exists creative_type text;
alter table public.creatives add column if not exists file_url text;
alter table public.creatives add column if not exists ad_size text;
alter table public.creatives add column if not exists is_valid boolean;
alter table public.creatives add column if not exists validation_status text;

update public.creatives set creative_name = coalesce(creative_name, 'Untitled Creative') where creative_name is null;
update public.creatives set creative_type = coalesce(creative_type, 'image') where creative_type is null;
update public.creatives set uploaded_at = coalesce(uploaded_at, now()) where uploaded_at is null;

create index if not exists idx_creatives_user_uploaded on public.creatives(user_id, uploaded_at desc);

alter table public.creatives enable row level security;

drop policy if exists "creatives_select_own" on public.creatives;
create policy "creatives_select_own" on public.creatives for select using (auth.uid() = user_id);

drop policy if exists "creatives_insert_own" on public.creatives;
create policy "creatives_insert_own" on public.creatives for insert with check (auth.uid() = user_id);

drop policy if exists "creatives_update_own" on public.creatives;
create policy "creatives_update_own" on public.creatives for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "creatives_delete_own" on public.creatives;
create policy "creatives_delete_own" on public.creatives for delete using (auth.uid() = user_id);

-- ── analyzer_results (create if missing) ──────────────────────────────────────
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
create policy "analyzer_results_select_own" on public.analyzer_results for select using (auth.uid() = user_id);

drop policy if exists "analyzer_results_insert_own" on public.analyzer_results;
create policy "analyzer_results_insert_own" on public.analyzer_results for insert with check (auth.uid() = user_id);

-- ── Communication platform RLS fixes ─────────────────────────────────────────
-- Allow ANY authenticated user to start a conversation (not only Brand Owners)
drop policy if exists "conversations_insert_creator" on public.conversations;
create policy "conversations_insert_creator" on public.conversations
  for insert with check (auth.uid() = created_by);

-- Allow participants to update conversation metadata (last_message_at, etc.)
drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant" on public.conversations
  for update
  using (public.is_conversation_participant(id))
  with check (public.is_conversation_participant(id));

-- Storage bucket for creative uploads
insert into storage.buckets (id, name, public)
values ('creative-assets', 'creative-assets', true)
on conflict (id) do nothing;

drop policy if exists "creative_assets_insert_own" on storage.objects;
create policy "creative_assets_insert_own" on storage.objects for insert
with check (bucket_id = 'creative-assets' and auth.uid()::text = (storage.foldername(name))[1]);

-- Reload PostgREST schema cache so Supabase sees new tables immediately
notify pgrst, 'reload schema';

-- IMPORTANT: Also run supabase/FIX_CONVERSATIONS_RLS.sql if you see
-- "new row violates row-level security policy for table conversations"

-- Admin-only reads on activity_logs (users can still insert via /api/activity/log):
-- Run supabase/migrations/20260528_activity_logs_admin_only_read.sql
