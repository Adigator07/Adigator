-- Unified campaigns table for Google Ads, Meta Ads, and Programmatic snapshots.
-- Programmatic campaigns in programmatic_campaigns remain supported for backward compatibility.

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google_ads', 'meta_ads', 'programmatic')),
  campaign_name text NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_user_platform_idx
  ON public.campaigns (user_id, platform);

CREATE INDEX IF NOT EXISTS campaigns_user_name_idx
  ON public.campaigns (user_id, lower(campaign_name));

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select_own ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY campaigns_insert_own ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY campaigns_update_own ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY campaigns_delete_own ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);
