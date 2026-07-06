-- ═══════════════════════════════════════════════════════════════════════════════
-- PENDING APPROVAL — STEP 4 of 6
-- Run in a NEW Supabase SQL Editor tab.
-- Auto-creates profiles as pending_verification on auth.users signup (email + Google).
-- Does NOT change status for existing users on conflict.
-- ═══════════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'end_client'::public.user_role
    ),
    coalesce(
      (new.raw_user_meta_data->>'status')::public.user_status,
      'pending_verification'::public.user_status
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

-- Verify trigger exists
select tgname, tgrelid::regclass
from pg_trigger
where tgname = 'on_auth_user_created_profile';
