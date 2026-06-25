-- ═══════════════════════════════════════════════════════════════════════════════
-- ORGANIZATIONS SETUP — paste this ENTIRE file into Supabase SQL Editor and Run
-- Do NOT run INSERT statements alone — tables must be created first (this file).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Required helper (safe if already exists from admin migration)
create or replace function public.is_admin_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (p.role = 'admin' or p.admin_role in ('super_admin', 'admin', 'moderator', 'support'))
  );
$$;

-- ── STEP 1: Create tables ─────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

do $$ begin
  create type public.org_status as enum ('active', 'suspended', 'trial');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.org_member_role as enum ('owner', 'org_admin', 'team_lead', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.org_member_status as enum ('active', 'invited', 'suspended');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.org_status not null default 'active',
  plan text not null default 'standard',
  industry text null,
  website text null,
  logo_url text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizations_status on public.organizations(status);
create index if not exists idx_organizations_created on public.organizations(created_at desc);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index if not exists idx_teams_org on public.teams(organization_id);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid null references public.teams(id) on delete set null,
  member_role public.org_member_role not null default 'member',
  status public.org_member_status not null default 'active',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_org_members_org on public.organization_members(organization_id);
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_team on public.organization_members(team_id);
create index if not exists idx_org_members_role on public.organization_members(organization_id, member_role);

create or replace function public.is_org_admin_for(org_uuid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_uuid
      and m.user_id = auth.uid()
      and m.member_role in ('owner', 'org_admin')
      and m.status = 'active'
  );
$$;

create or replace function public.is_org_member_for(org_uuid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_uuid
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "organizations_select_admin" on public.organizations;
create policy "organizations_select_admin" on public.organizations for select using (public.is_admin_user());

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations for select using (public.is_org_member_for(id));

drop policy if exists "organizations_insert_admin" on public.organizations;
create policy "organizations_insert_admin" on public.organizations for insert with check (public.is_admin_user());

drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations for update using (public.is_admin_user());

drop policy if exists "organizations_update_org_admin" on public.organizations;
create policy "organizations_update_org_admin" on public.organizations for update using (public.is_org_admin_for(id));

drop policy if exists "teams_select_admin" on public.teams;
create policy "teams_select_admin" on public.teams for select using (public.is_admin_user());

drop policy if exists "teams_select_member" on public.teams;
create policy "teams_select_member" on public.teams for select using (public.is_org_member_for(organization_id));

drop policy if exists "teams_manage_org_admin" on public.teams;
create policy "teams_manage_org_admin" on public.teams for all
using (public.is_org_admin_for(organization_id))
with check (public.is_org_admin_for(organization_id));

drop policy if exists "org_members_select_admin" on public.organization_members;
create policy "org_members_select_admin" on public.organization_members for select using (public.is_admin_user());

drop policy if exists "org_members_select_self" on public.organization_members;
create policy "org_members_select_self" on public.organization_members for select using (user_id = auth.uid());

drop policy if exists "org_members_select_org_peer" on public.organization_members;
create policy "org_members_select_org_peer" on public.organization_members for select using (public.is_org_member_for(organization_id));

drop policy if exists "org_members_manage_org_admin" on public.organization_members;
create policy "org_members_manage_org_admin" on public.organization_members for all
using (public.is_org_admin_for(organization_id))
with check (public.is_org_admin_for(organization_id));

-- Verify tables exist (should return 3 rows)
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('organizations', 'teams', 'organization_members')
order by table_name;

-- ── STEP 2 (OPTIONAL): Create sample org — uncomment and set YOUR email ─────────
-- Run STEP 1 first. Then uncomment below, replace the email, and run again.

/*
insert into public.organizations (name, slug)
values ('My Company', 'my-company')
on conflict (slug) do nothing;

insert into public.teams (organization_id, name, description)
select o.id, 'General', 'Default team'
from public.organizations o
where o.slug = 'my-company'
on conflict (organization_id, name) do nothing;

insert into public.organization_members (organization_id, user_id, team_id, member_role, status)
select o.id, p.id, t.id, 'owner', 'active'
from public.organizations o
cross join public.profiles p
join public.teams t on t.organization_id = o.id and t.name = 'General'
where o.slug = 'my-company'
  and p.email = 'YOUR_EMAIL@example.com'
on conflict (organization_id, user_id) do nothing;
*/
