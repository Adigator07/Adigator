-- ═══════════════════════════════════════════════════════════════════════════════
-- PENDING APPROVAL — STEP 1 of 6
-- Run first in Supabase SQL Editor (one query tab).
-- Keeps YOUR account active so you are not locked out.
-- ═══════════════════════════════════════════════════════════════════════════════

update public.profiles
set
  status = 'active'::public.user_status,
  admin_role = coalesce(admin_role, 'super_admin'::public.admin_role_type),
  role = coalesce(role, 'admin'::public.user_role)
where email = 'k.nandhakishore48@gmail.com';

-- Verify (should show status = active)
select id, email, role, admin_role, status
from public.profiles
where email = 'k.nandhakishore48@gmail.com';
