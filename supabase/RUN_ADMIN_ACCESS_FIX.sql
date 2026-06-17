-- Run once in Supabase SQL Editor to enable Admin Console access
-- Fixes missing columns seen in dev terminal (action_label, admin_role, etc.)

create extension if not exists "pgcrypto";

-- ── activity_logs: missing action_label + admin read policy ───────────────────
alter table public.activity_logs add column if not exists action_label text null;

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

-- ── admin platform profile columns ──────────────────────────────────────────
do $$ begin
  create type public.user_status as enum ('active', 'suspended', 'banned', 'pending_verification');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.admin_role_type as enum ('super_admin', 'admin', 'moderator', 'support', 'user');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists status public.user_status not null default 'active',
  add column if not exists admin_role public.admin_role_type null,
  add column if not exists country text null,
  add column if not exists last_login_at timestamptz null;

-- ── Grant yourself admin (CHANGE EMAIL BELOW) ─────────────────────────────────
update public.profiles
set role = 'admin',
    admin_role = 'super_admin'::public.admin_role_type,
    status = 'active'::public.user_status
where email = 'YOUR_EMAIL@example.com';

-- Verify (should show role=admin, admin_role=super_admin)
select id, email, role, admin_role, status from public.profiles where role = 'admin';

notify pgrst, 'reload schema';
