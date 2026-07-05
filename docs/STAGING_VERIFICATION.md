# Staging Verification — Creative Brain Reuse (Phase 3)

Phase 3 is **complete locally** (E2E + manual UI). Phase 4 orchestrator is **complete locally** (E2E + manual UI). Do not start Phase 5 until explicitly approved. Staging E2E remains pending when a deployment exists.

## 1. Staging Supabase — SQL Editor

Open your **staging** Supabase project → **SQL Editor** → paste and run:

**`supabase/RUN_STAGING_SETUP.sql`**

If you see `ERROR: operator does not exist: uuid = bigint`, run **`supabase/RUN_FIX_CREATIVES_LEGACY.sql`** first (fixes an old `creatives` table with bigint columns), then re-run `RUN_STAGING_SETUP.sql`.

For `action_label` column errors on activity logs, run **`supabase/RUN_SCHEMA_DRIFT_FIX.sql`** (or re-run `RUN_PREVIEW_TOOL_TABLES.sql`).

This single file includes (in order):

1. Brain tables (`campaign_brains`, `creative_brains`, `validation_versions`, …)
2. Preview Tool tables (`analysis_sessions`, `creatives`, `analyzer_results`, `activity_logs`, storage)
3. `programmatic_campaigns`
4. `latest_validation_version_id` link column

Already applied brain tables only? Run **`RUN_PREVIEW_TOOL_TABLES.sql`** + programmatic migration instead.

## 2. Staging App Environment

Deploy or run staging with:

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role (E2E script only) |
| `OPENAI_API_KEY` | Same as production/staging policy |

Create **`.env.staging.local`** at repo root (gitignored) mirroring `.env.local` but pointing at **staging** Supabase.

Optional:

```env
STAGING_BASE_URL=https://your-staging-app.vercel.app
```

## 3. Run Staging E2E

```bash
# Staging app must be running and reachable
node scripts/e2e-creative-brain-reuse.mjs --staging --base-url https://your-staging-url.com
```

Or with explicit env file:

```bash
node scripts/e2e-creative-brain-reuse.mjs --base-url https://your-staging-url.com --env .env.staging.local
```

### Pass criteria (same as local)

| Check | Expected |
|---|---|
| First upload | `reused: false`, ~10s, new `creativeBrainId` |
| Re-upload same image | `reused: true`, &lt;5s, same brain id |
| Different image | `reused: false`, new brain id |
| Hash | Deterministic SHA-256 |
| `validation_versions` | v1 + v2 for two new analyses; no version on reuse |
| `creative_brains` | No duplicate row on re-upload |

## 4. Manual UI QA (local — completed)

Verified locally:

- [x] Sign in on Preview Tool
- [x] Campaign Setup → save campaign → Campaign ID lookup/reuse
- [x] Creative Addition → `/api/validate-campaign` in network tab
- [x] Re-upload same creative → `reused: true`, faster response
- [x] Activity logging without `activity_logs` schema errors
- [x] Session persistence (`/api/session/create`)
- [x] URL/UTM workflow renders without `UrlUtmWorkflowPanel` errors
- [x] No blocking console or network errors

## 5. Staging manual UI QA (pending)

When a staging deployment exists, repeat the checklist above on staging.

## 6. Local Preview Tool tables (optional)

Your dev Supabase may still be missing Preview Tool tables. Run in SQL Editor:

**`supabase/RUN_PREVIEW_TOOL_TABLES.sql`**

Plus **`supabase/migrations/20260628_programmatic_campaigns.sql`** for `/api/programmatic-campaigns`.

## 7. UrlUtmWorkflowPanel

The previous `UrlUtmWorkflowPanel is not defined` error is **resolved**: UTM fields are inlined in `PreviewTool.jsx` via `UtmParameterEditor`. The standalone `UrlUtmWorkflowPanel.tsx` component is unused and safe to keep for future reuse.

## 8. After staging passes

Proceed to Phase 5 planning review (not automatic implementation):

- See **`docs/PHASE5_PLANNING.md`** for Native Engine, Preview Engine, and provider abstraction plan
- Phase 5 implementation requires explicit approval

Previously planned Phase 4 items (now complete locally):

- Landing Brain extraction
- Campaign Brain extraction
- Full Validation Orchestrator integration
- Campaign-level invalidation logic
- Validation version linking
