-- Legacy password migration support + profile hash version tracking.
-- Passwords are NEVER stored in plaintext in app tables after migration.
-- Canonical hashes live in auth.users (Supabase bcrypt).

-- Track hash version on profiles (no password material stored here).
alter table public.profiles add column if not exists password_hash_version text;
alter table public.profiles add column if not exists password_migrated_at timestamptz;

comment on column public.profiles.password_hash_version is
  'e.g. supabase_bcrypt — indicates password is managed by Supabase Auth';

-- Legacy weak hashes pending upgrade on next successful login.
create table if not exists public.auth_password_legacy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  password_hash text not null,
  hash_algorithm text not null
    check (hash_algorithm in ('plaintext', 'md5', 'sha1', 'bcrypt')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_auth_password_legacy_email
  on public.auth_password_legacy (lower(email));

create index if not exists idx_auth_password_legacy_algorithm
  on public.auth_password_legacy (hash_algorithm);

alter table public.auth_password_legacy enable row level security;

-- No client policies — service role only (server-side migration).

comment on table public.auth_password_legacy is
  'Temporary weak hashes imported from legacy systems. Removed after successful login migration to Supabase Auth.';

-- Example import for migrated users (run manually, never store plaintext in production logs):
-- insert into public.auth_password_legacy (user_id, email, password_hash, hash_algorithm)
-- values (
--   'USER_UUID',
--   'user@example.com',
--   '5f4dcc3b5aa765d61d8327deb882cf99',  -- md5('password') example only
--   'md5'
-- );
