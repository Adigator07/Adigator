import fs from "fs";

const brain = fs.readFileSync("supabase/RUN_BRAIN_TABLES.sql", "utf8");
const preview = fs.readFileSync("supabase/RUN_PREVIEW_TOOL_TABLES.sql", "utf8");
const programmatic = fs.readFileSync("supabase/migrations/20260628_programmatic_campaigns.sql", "utf8");

const link = `
-- Link programmatic_campaigns to validation versions (after brain tables exist)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'programmatic_campaigns'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'validation_versions'
  ) then
    alter table public.programmatic_campaigns
      add column if not exists latest_validation_version_id uuid null
        references public.validation_versions(id) on delete set null;
  end if;
end $$;

notify pgrst, 'reload schema';
`;

const header = `-- =============================================================================
-- ADIGATOR STAGING SETUP — paste entire file into Supabase SQL Editor (staging)
-- Safe to re-run (IF NOT EXISTS / idempotent policies)
--
-- Sections:
--   1. Brain tables (Creative Brain reuse)
--   2. Preview Tool tables (sessions, creatives, analyzer_results, activity_logs)
--   3. Programmatic campaigns API persistence
--   4. Validation version link on programmatic_campaigns
-- =============================================================================

`;

const out =
  header
  + "\n-- ===================== SECTION 1: BRAIN TABLES =====================\n\n"
  + brain
  + "\n\n-- ===================== SECTION 2: PREVIEW TOOL TABLES =====================\n\n"
  + preview
  + "\n\n-- ===================== SECTION 3: PROGRAMMATIC CAMPAIGNS =====================\n\n"
  + programmatic
  + "\n\n-- ===================== SECTION 4: VALIDATION VERSION LINK =====================\n"
  + link;

fs.writeFileSync("supabase/RUN_STAGING_SETUP.sql", out);
console.log("Wrote supabase/RUN_STAGING_SETUP.sql");
