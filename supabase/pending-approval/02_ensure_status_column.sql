-- ═══════════════════════════════════════════════════════════════════════════════
-- PENDING APPROVAL — STEP 2 of 6
-- Run in a NEW Supabase SQL Editor tab.
-- Creates user_status enum + profiles.status column if missing.
-- ═══════════════════════════════════════════════════════════════════════════════

do $$ begin
  create type public.user_status as enum (
    'active',
    'suspended',
    'banned',
    'pending_verification'
  );
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists status public.user_status not null default 'active';

create index if not exists idx_profiles_status on public.profiles(status);

-- Verify column exists
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'status';
