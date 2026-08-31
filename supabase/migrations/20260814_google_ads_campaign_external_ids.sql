-- Make campaigns storage work with Firebase UIDs and Google Ads external IDs.
-- Google campaign IDs are numeric strings (not UUIDs); Firebase UIDs are not auth.users UUIDs.

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_user_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaigns'
      AND column_name = 'user_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.campaigns
      ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_user_platform_external_uidx
  ON public.campaigns (user_id, platform, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS campaigns_user_platform_updated_idx
  ON public.campaigns (user_id, platform, updated_at DESC);
