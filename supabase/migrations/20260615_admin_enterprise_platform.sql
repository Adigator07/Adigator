-- Enterprise Admin Platform tables (extends profiles)
-- Apply via Supabase SQL editor or: supabase db push

create extension if not exists "pgcrypto";

-- Extend profiles for admin user management
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

create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_admin_role on public.profiles(admin_role);
create index if not exists idx_profiles_last_login on public.profiles(last_login_at desc nulls last);

-- Sync admin_role from legacy role
update public.profiles
set admin_role = 'admin'::public.admin_role_type
where role = 'admin' and admin_role is null;

-- ── admin_user_sessions ───────────────────────────────────────────────────────
create table if not exists public.admin_user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device text null,
  browser text null,
  os text null,
  ip_address text null,
  location text null,
  login_time timestamptz not null default now(),
  logout_time timestamptz null,
  duration int null,
  current_page text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_admin_sessions_user_login on public.admin_user_sessions(user_id, login_time desc);
create index if not exists idx_admin_sessions_login_time on public.admin_user_sessions(login_time desc);

-- ── admin_user_activity ─────────────────────────────────────────────────────
create table if not exists public.admin_user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  page text null,
  action text not null,
  feature text null,
  device text null,
  browser text null,
  ip_address text null,
  timestamp timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_admin_activity_user_ts on public.admin_user_activity(user_id, timestamp desc);
create index if not exists idx_admin_activity_action on public.admin_user_activity(action);
create index if not exists idx_admin_activity_feature on public.admin_user_activity(feature);

-- ── admin_feature_permissions ─────────────────────────────────────────────────
create table if not exists public.admin_feature_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles(id) on delete cascade,
  role_name text null,
  feature_name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature_name)
);

create index if not exists idx_admin_feature_perm_role on public.admin_feature_permissions(role_name);

-- ── admin_audit_logs ──────────────────────────────────────────────────────────
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_user_id uuid null references public.profiles(id) on delete set null,
  description text not null,
  ip_address text null,
  device text null,
  browser text null,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists idx_admin_audit_admin_ts on public.admin_audit_logs(admin_id, timestamp desc);
create index if not exists idx_admin_audit_target on public.admin_audit_logs(target_user_id);
create index if not exists idx_admin_audit_action on public.admin_audit_logs(action);

-- ── admin_notifications ───────────────────────────────────────────────────────
do $$ begin
  create type public.admin_notification_type as enum ('success', 'warning', 'error', 'security', 'info');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.admin_notification_status as enum ('unread', 'read', 'archived');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type public.admin_notification_type not null default 'info',
  status public.admin_notification_status not null default 'unread',
  user_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notifications_status on public.admin_notifications(status, created_at desc);

-- ── admin_feature_usage ─────────────────────────────────────────────────────────
create table if not exists public.admin_feature_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature_name text not null,
  usage_count int not null default 0,
  last_used timestamptz not null default now(),
  unique (user_id, feature_name)
);

create index if not exists idx_admin_feature_usage_feature on public.admin_feature_usage(feature_name, usage_count desc);

-- ── admin_error_logs ──────────────────────────────────────────────────────────
do $$ begin
  create type public.error_severity as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_error_logs (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  error_message text not null,
  stack_trace text null,
  severity public.error_severity not null default 'medium',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_error_logs_service on public.admin_error_logs(service, created_at desc);

-- ── admin_role_definitions ──────────────────────────────────────────────────────
create table if not exists public.admin_role_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  hierarchy int not null default 0,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.admin_role_definitions (name, display_name, hierarchy, permissions)
values
  ('super_admin', 'Super Admin', 100, '["*"]'::jsonb),
  ('admin', 'Admin', 80, '["users:read","users:write","reports:read","audit:read","permissions:write"]'::jsonb),
  ('moderator', 'Moderator', 60, '["users:read","users:suspend","audit:read"]'::jsonb),
  ('support', 'Support', 40, '["users:read","support:write"]'::jsonb),
  ('user', 'User', 10, '["dashboard:read"]'::jsonb)
on conflict (name) do nothing;

-- Default feature permissions by role
insert into public.admin_feature_permissions (role_name, feature_name, enabled)
select r.name, f.feature, true
from public.admin_role_definitions r
cross join (
  values ('Dashboard'), ('Reports'), ('Analytics'), ('Settings'), ('Billing'), ('AdminPanel'), ('PreviewTool'), ('Communications')
) as f(feature)
where r.name in ('super_admin', 'admin')
on conflict do nothing;

-- RLS: service role / admin only for admin tables
alter table public.admin_user_sessions enable row level security;
alter table public.admin_user_activity enable row level security;
alter table public.admin_feature_permissions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_feature_usage enable row level security;
alter table public.admin_error_logs enable row level security;
alter table public.admin_role_definitions enable row level security;

create or replace function public.is_admin_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (p.role = 'admin' or p.admin_role in ('super_admin', 'admin', 'moderator', 'support'))
  );
$$;

-- Admin read policies
drop policy if exists "admin_sessions_select" on public.admin_user_sessions;
create policy "admin_sessions_select" on public.admin_user_sessions for select using (public.is_admin_user() or auth.uid() = user_id);

drop policy if exists "admin_activity_select" on public.admin_user_activity;
create policy "admin_activity_select" on public.admin_user_activity for select using (public.is_admin_user() or auth.uid() = user_id);

drop policy if exists "admin_audit_select" on public.admin_audit_logs;
create policy "admin_audit_select" on public.admin_audit_logs for select using (public.is_admin_user());

drop policy if exists "admin_notifications_select" on public.admin_notifications;
create policy "admin_notifications_select" on public.admin_notifications for select using (public.is_admin_user() or auth.uid() = user_id);

drop policy if exists "admin_feature_usage_select" on public.admin_feature_usage;
create policy "admin_feature_usage_select" on public.admin_feature_usage for select using (public.is_admin_user() or auth.uid() = user_id);

drop policy if exists "admin_error_logs_select" on public.admin_error_logs;
create policy "admin_error_logs_select" on public.admin_error_logs for select using (public.is_admin_user());

drop policy if exists "admin_permissions_select" on public.admin_feature_permissions;
create policy "admin_permissions_select" on public.admin_feature_permissions for select using (public.is_admin_user() or auth.uid() = user_id);

drop policy if exists "admin_roles_select" on public.admin_role_definitions;
create policy "admin_roles_select" on public.admin_role_definitions for select using (public.is_admin_user());

-- Admins can update profiles (user management)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update using (public.is_admin_user());

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles for select using (public.is_admin_user() or auth.uid() = id);
