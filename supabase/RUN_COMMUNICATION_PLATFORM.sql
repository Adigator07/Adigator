-- =============================================================================
-- ADIGATOR COMMUNICATION PLATFORM — RUN THIS IN SUPABASE SQL EDITOR
-- =============================================================================
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Copy ALL contents of THIS file (not the file path)
--   3. Paste into the editor and click "Run"
--
-- DO NOT paste: supabase/migrations/20260527_communication_platform.sql
-- That is a file path, not SQL — it will cause a syntax error.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('admin', 'usa_client', 'end_client');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.conversation_status as enum ('active', 'archived', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.conversation_type as enum ('direct', 'project');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.participant_role as enum ('sender', 'receiver', 'observer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_type as enum ('text', 'file', 'creative', 'system_event');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_status as enum ('pending', 'in_review', 'approved', 'revision_requested');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.comm_activity_event_type as enum (
    'message_sent', 'file_uploaded', 'creative_assigned', 'message_opened',
    'file_viewed', 'review_started', 'review_submitted', 'user_joined',
    'user_left', 'status_changed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum (
    'new_message', 'creative_assigned', 'review_request', 'review_done', 'mention'
  );
exception when duplicate_object then null;
end $$;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text null,
  avatar_url text null,
  role public.user_role not null default 'end_client',
  company_name text null,
  phone text null,
  timezone text null default 'America/New_York',
  is_online boolean not null default false,
  last_seen_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- Backfill profiles for users who signed up before this migration
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  coalesce(
    (u.raw_user_meta_data->>'role')::public.user_role,
    'end_client'::public.user_role
  )
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'end_client'::public.user_role
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- ── conversations ────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid not null references public.profiles(id) on delete restrict,
  status public.conversation_status not null default 'active',
  type public.conversation_type not null default 'direct',
  project_ref text null,
  last_message_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_created_by on public.conversations(created_by);
create index if not exists idx_conversations_assigned_to on public.conversations(assigned_to);
create index if not exists idx_conversations_last_message on public.conversations(last_message_at desc nulls last);

-- ── conversation_participants ────────────────────────────────────────────────
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_in_conversation public.participant_role not null default 'sender',
  joined_at timestamptz not null default now(),
  last_read_at timestamptz null,
  unique (conversation_id, user_id)
);

create index if not exists idx_participants_user on public.conversation_participants(user_id);
create index if not exists idx_participants_conversation on public.conversation_participants(conversation_id);

-- ── messages ─────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  type public.message_type not null default 'text',
  body text null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  edited_at timestamptz null,
  deleted_at timestamptz null
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, sent_at desc);
create index if not exists idx_messages_sender on public.messages(sender_id);

-- ── attachments ──────────────────────────────────────────────────────────────
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  file_name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  file_url text null,
  thumbnail_url text null,
  storage_key text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_attachments_message on public.attachments(message_id);

-- ── creative_reviews ─────────────────────────────────────────────────────────
create table if not exists public.creative_reviews (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  status public.review_status not null default 'pending',
  review_note text null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_creative_reviews_attachment on public.creative_reviews(attachment_id);
create index if not exists idx_creative_reviews_conversation on public.creative_reviews(conversation_id);

-- ── comm_activity_events ─────────────────────────────────────────────────────
create table if not exists public.comm_activity_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  related_message_id uuid null references public.messages(id) on delete set null,
  related_attachment_id uuid null references public.attachments(id) on delete set null,
  event_type public.comm_activity_event_type not null,
  event_data jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_comm_activity_conversation on public.comm_activity_events(conversation_id, occurred_at desc);
create index if not exists idx_comm_activity_user on public.comm_activity_events(user_id);

-- ── comm_notifications ───────────────────────────────────────────────────────
create table if not exists public.comm_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid null references public.conversations(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comm_notifications_recipient on public.comm_notifications(recipient_id, created_at desc);

-- ── message_read_receipts ────────────────────────────────────────────────────
create table if not exists public.message_read_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (message_id, user_id)
);

-- ── Helper functions ─────────────────────────────────────────────────────────
create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conv_id and cp.user_id = auth.uid()
  );
$$;

create or replace function public.get_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.creative_reviews enable row level security;
alter table public.comm_activity_events enable row level security;
alter table public.comm_notifications enable row level security;
alter table public.message_read_receipts enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (public.is_conversation_participant(id));

drop policy if exists "conversations_insert_creator" on public.conversations;
create policy "conversations_insert_creator" on public.conversations
  for insert with check (auth.uid() = created_by);

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant" on public.conversations
  for update
  using (public.is_conversation_participant(id))
  with check (public.is_conversation_participant(id));

drop policy if exists "participants_select_member" on public.conversation_participants;
create policy "participants_select_member" on public.conversation_participants
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "participants_insert_creator" on public.conversation_participants;
create policy "participants_insert_creator" on public.conversation_participants
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

drop policy if exists "participants_update_own" on public.conversation_participants;
create policy "participants_update_own" on public.conversation_participants
  for update using (user_id = auth.uid());

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    public.is_conversation_participant(conversation_id) and sender_id = auth.uid()
  );

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update using (sender_id = auth.uid());

drop policy if exists "attachments_select_participant" on public.attachments;
create policy "attachments_select_participant" on public.attachments
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_participant(m.conversation_id)
    )
  );

drop policy if exists "attachments_insert_participant" on public.attachments;
create policy "attachments_insert_participant" on public.attachments
  for insert with check (uploader_id = auth.uid());

drop policy if exists "reviews_select_participant" on public.creative_reviews;
create policy "reviews_select_participant" on public.creative_reviews
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "reviews_insert_reviewer" on public.creative_reviews;
create policy "reviews_insert_reviewer" on public.creative_reviews
  for insert with check (
    reviewer_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "reviews_update_own" on public.creative_reviews;
create policy "reviews_update_own" on public.creative_reviews
  for update using (reviewer_id = auth.uid());

drop policy if exists "activity_select_participant" on public.comm_activity_events;
create policy "activity_select_participant" on public.comm_activity_events
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "activity_insert_participant" on public.comm_activity_events;
create policy "activity_insert_participant" on public.comm_activity_events
  for insert with check (
    user_id = auth.uid() and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "notifications_select_own" on public.comm_notifications;
create policy "notifications_select_own" on public.comm_notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "notifications_update_own" on public.comm_notifications;
create policy "notifications_update_own" on public.comm_notifications
  for update using (recipient_id = auth.uid());

drop policy if exists "notifications_insert_system" on public.comm_notifications;
drop policy if exists "notifications_insert_participant" on public.comm_notifications;
create policy "notifications_insert_participant" on public.comm_notifications
  for insert with check (
    conversation_id is not null
    and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "receipts_select_participant" on public.message_read_receipts;
create policy "receipts_select_participant" on public.message_read_receipts
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_participant(m.conversation_id)
    )
  );

drop policy if exists "receipts_insert_own" on public.message_read_receipts;
create policy "receipts_insert_own" on public.message_read_receipts
  for insert with check (user_id = auth.uid());

-- ── Realtime (safe — skips if already added) ─────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.comm_activity_events;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.comm_notifications;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

-- ── Storage bucket ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('communication-files', 'communication-files', false)
on conflict (id) do nothing;

drop policy if exists "comm_files_select_participant" on storage.objects;
create policy "comm_files_select_participant" on storage.objects
  for select using (bucket_id = 'communication-files' and auth.role() = 'authenticated');

drop policy if exists "comm_files_insert_own" on storage.objects;
create policy "comm_files_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'communication-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "comm_files_delete_own" on storage.objects;
create policy "comm_files_delete_own" on storage.objects
  for delete using (
    bucket_id = 'communication-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Done! Set your role (replace email): ─────────────────────────────────────
-- UPDATE public.profiles SET role = 'usa_client' WHERE email = 'you@example.com';
-- UPDATE public.profiles SET role = 'end_client' WHERE email = 'client@example.com';
