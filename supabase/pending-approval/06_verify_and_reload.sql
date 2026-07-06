-- ═══════════════════════════════════════════════════════════════════════════════
-- PENDING APPROVAL — STEP 6 of 6
-- Run last in a NEW Supabase SQL Editor tab.
-- Confirms setup + reloads PostgREST schema cache.
-- ═══════════════════════════════════════════════════════════════════════════════

-- All users and their approval status
select
  id,
  email,
  full_name,
  role,
  admin_role,
  status,
  created_at
from public.profiles
order by created_at desc;

-- Count by status
select status, count(*) as user_count
from public.profiles
group by status
order by status;

notify pgrst, 'reload schema';
