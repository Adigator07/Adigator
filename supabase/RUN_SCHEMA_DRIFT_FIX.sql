-- Fix common local/staging schema drift without re-running full setup.
-- Safe to run multiple times. Paste into Supabase SQL Editor.

-- activity_logs: action_label column (older tables may lack it)
alter table public.activity_logs add column if not exists action_label text null;

-- creatives: optional columns used by /api/creatives
alter table public.creatives add column if not exists ad_size text null;
alter table public.creatives add column if not exists validation_status text null;
alter table public.creatives add column if not exists is_valid boolean null;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
