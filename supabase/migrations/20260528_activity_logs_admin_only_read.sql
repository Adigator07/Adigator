-- Restrict activity_logs reads to admins only.
-- Users may still INSERT their own rows (background tracking via /api/activity/log).

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

-- Service role / admin API routes bypass RLS when using service key.
notify pgrst, 'reload schema';
