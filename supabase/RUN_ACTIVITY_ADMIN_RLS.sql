-- =============================================================================
-- ACTIVITY LOGS — Admin-only read access
-- Run in Supabase SQL Editor after core tables exist.
-- Users can still INSERT (background tracking); only admins can SELECT.
-- =============================================================================

drop policy if exists "activity_logs_select_own" on public.activity_logs;

drop policy if exists "activity_logs_select_admin" on public.activity_logs;
create policy "activity_logs_select_admin"
on public.activity_logs for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'admin'
  )
);

notify pgrst, 'reload schema';

-- Grant admin role to a user:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
