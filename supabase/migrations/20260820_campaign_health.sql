-- Campaign health monitors, alerts, and audit history.
-- Optional persistence for scheduled checks. The workspace UI also stores this locally.

CREATE TABLE IF NOT EXISTS public.campaign_health_workspaces (
  owner_id text PRIMARY KEY,
  interval_minutes integer NOT NULL DEFAULT 60,
  workspace jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_health_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_health_workspaces_select_own ON public.campaign_health_workspaces
  FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY campaign_health_workspaces_insert_own ON public.campaign_health_workspaces
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY campaign_health_workspaces_update_own ON public.campaign_health_workspaces
  FOR UPDATE USING (auth.uid()::text = owner_id);
