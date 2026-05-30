-- =============================================================================
-- FIX CONVERSATIONS RLS — Run in Supabase SQL Editor
-- Fixes: "new row violates row-level security policy for table conversations"
-- =============================================================================

-- ── Helper: create conversation + participants atomically (bypasses RLS safely) ─
create or replace function public.create_conversation_with_participants(
  p_title text,
  p_assigned_to uuid,
  p_type text default 'direct',
  p_project_ref text default null
)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_conv public.conversations;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if p_assigned_to = v_user then
    raise exception 'Cannot start a conversation with yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_assigned_to) then
    raise exception 'Recipient not found';
  end if;

  insert into public.conversations (title, created_by, assigned_to, type, project_ref, last_message_at)
  values (
    p_title,
    v_user,
    p_assigned_to,
    coalesce(p_type, 'direct')::public.conversation_type,
    p_project_ref,
    now()
  )
  returning * into v_conv;

  insert into public.conversation_participants (conversation_id, user_id, role_in_conversation)
  values
    (v_conv.id, v_user, 'sender'),
    (v_conv.id, p_assigned_to, 'receiver');

  return v_conv;
end;
$$;

-- ── Helper: update last_message_at (bypasses RLS safely) ─────────────────────
create or replace function public.touch_conversation_last_message(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = v_user
  ) and not exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and (c.created_by = v_user or c.assigned_to = v_user)
  ) then
    raise exception 'Forbidden: not a conversation participant';
  end if;

  update public.conversations
  set last_message_at = now(), updated_at = now()
  where id = p_conversation_id;
end;
$$;

grant execute on function public.create_conversation_with_participants(text, uuid, text, text) to authenticated;
grant execute on function public.create_conversation_with_participants(text, uuid, text, text) to service_role;
grant execute on function public.touch_conversation_last_message(uuid) to authenticated;
grant execute on function public.touch_conversation_last_message(uuid) to service_role;

-- ── Reset conversations RLS policies ───────────────────────────────────────
alter table public.conversations enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
drop policy if exists "conversations_insert_creator" on public.conversations;
drop policy if exists "conversations_update_participant" on public.conversations;
drop policy if exists "conversations_insert_authenticated" on public.conversations;
drop policy if exists "conversations_update_member" on public.conversations;

create policy "conversations_select_participant" on public.conversations
  for select using (
    auth.uid() = created_by
    or auth.uid() = assigned_to
    or public.is_conversation_participant(id)
  );

create policy "conversations_insert_creator" on public.conversations
  for insert with check (auth.uid() = created_by);

create policy "conversations_update_member" on public.conversations
  for update using (
    auth.uid() = created_by
    or auth.uid() = assigned_to
    or public.is_conversation_participant(id)
  )
  with check (
    auth.uid() = created_by
    or auth.uid() = assigned_to
    or public.is_conversation_participant(id)
  );

-- ── Allow conversation creator to add participants ───────────────────────────
drop policy if exists "participants_insert_creator" on public.conversation_participants;
create policy "participants_insert_creator" on public.conversation_participants
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.created_by = auth.uid() or c.assigned_to = auth.uid())
    )
    or user_id = auth.uid()
  );

-- ── Notifications: allow sender to notify recipient ──────────────────────────
drop policy if exists "notifications_insert_participant" on public.comm_notifications;
create policy "notifications_insert_participant" on public.comm_notifications
  for insert with check (
    auth.uid() is not null
    and (
      conversation_id is null
      or public.is_conversation_participant(conversation_id)
      or exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.created_by = auth.uid() or c.assigned_to = auth.uid())
      )
    )
  );

notify pgrst, 'reload schema';
