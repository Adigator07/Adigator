-- ═══════════════════════════════════════════════════════════════════════════════
-- PENDING APPROVAL — STEP 3 of 6
-- Run in a NEW Supabase SQL Editor tab.
-- New profile rows default to pending until you approve them.
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.profiles
  alter column status set default 'pending_verification'::public.user_status;

-- Verify default changed
select column_name, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'status';
