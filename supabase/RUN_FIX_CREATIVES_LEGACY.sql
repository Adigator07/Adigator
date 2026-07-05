-- =============================================================================
-- FIX: uuid = bigint error when running RUN_STAGING_SETUP / RUN_PREVIEW_TOOL_TABLES
--
-- Cause: An older public.creatives table (or related tables) used bigint
-- columns. RLS policies use auth.uid() = user_id (uuid), which fails when
-- user_id is bigint.
--
-- Run this FIRST in Supabase SQL Editor, then re-run RUN_STAGING_SETUP.sql
-- =============================================================================

create extension if not exists "pgcrypto";

do $$
declare
  id_udt text;
  user_udt text;
  has_rows boolean;
begin
  if to_regclass('public.creatives') is null then
    raise notice 'creatives table does not exist — nothing to fix';
    return;
  end if;

  select c.udt_name into id_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'creatives' and c.column_name = 'id';

  select c.udt_name into user_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'creatives' and c.column_name = 'user_id';

  raise notice 'creatives.id type: %, creatives.user_id type: %', id_udt, user_udt;

  if id_udt is distinct from 'uuid' or user_udt is distinct from 'uuid' then
    select exists (select 1 from public.creatives limit 1) into has_rows;

    if has_rows then
      if to_regclass('public.creatives_legacy_incompatible') is null then
        alter table public.creatives rename to creatives_legacy_incompatible;
        raise notice 'Renamed incompatible creatives → creatives_legacy_incompatible';
      else
        drop table public.creatives cascade;
        raise notice 'Dropped incompatible creatives table';
      end if;
    else
      drop table public.creatives cascade;
      raise notice 'Dropped empty incompatible creatives table';
    end if;
  else
    raise notice 'creatives schema already uses uuid — no change needed';
  end if;
end $$;

do $$
declare
  creative_id_udt text;
begin
  if to_regclass('public.analyzer_results') is null then
    return;
  end if;

  select c.udt_name into creative_id_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'analyzer_results' and c.column_name = 'creative_id';

  if creative_id_udt is distinct from 'uuid' then
    drop table public.analyzer_results cascade;
    raise notice 'Dropped incompatible analyzer_results table';
  end if;
end $$;

do $$
declare
  user_udt text;
begin
  if to_regclass('public.activity_logs') is null then
    return;
  end if;

  select c.udt_name into user_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'activity_logs' and c.column_name = 'user_id';

  if user_udt is distinct from 'uuid' then
    drop table public.activity_logs cascade;
    raise notice 'Dropped incompatible activity_logs table';
  end if;
end $$;

notify pgrst, 'reload schema';
