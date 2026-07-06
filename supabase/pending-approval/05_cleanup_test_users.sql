-- ═══════════════════════════════════════════════════════════════════════════════
-- PENDING APPROVAL — STEP 5 of 6 (OPTIONAL)
-- Run in a NEW Supabase SQL Editor tab.
-- Marks automated E2E test accounts as pending (safe to skip if none exist).
-- ═══════════════════════════════════════════════════════════════════════════════

update public.profiles
set status = 'pending_verification'::public.user_status
where email like '%@adigator-e2e.test';

-- Verify
select id, email, status
from public.profiles
where email like '%@adigator-e2e.test';
