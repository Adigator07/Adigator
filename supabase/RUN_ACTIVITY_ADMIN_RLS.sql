-- =============================================================================
-- ACTIVITY LOGS — Admin-only read access (supports admin_role + legacy role)
-- Run in Supabase SQL Editor after core tables exist.
-- =============================================================================

drop policy if exists "activity_logs_select_own" on public.activity_logs;

drop policy if exists "activity_logs_select_admin" on public.activity_logs;
create policy "activity_logs_select_admin"
on public.activity_logs for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (
      p.role::text = 'admin'
      or p.admin_role in ('super_admin', 'admin', 'moderator', 'support')
    )
  )
);

notify pgrst, 'reload schema';
