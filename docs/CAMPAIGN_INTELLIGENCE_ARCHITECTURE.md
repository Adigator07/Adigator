# Campaign Intelligence Architecture

> Companion to [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md). Describes the Campaign Intelligence Studio workflow, Step 1/2 validation contracts, Google campaign-type branching (including Demand Gen), and offer-context wiring.

**Product surface:** Campaign Intelligence Studio (`PreviewTool`)  
**Core engines:** Validation Orchestrator + Technical Validation (deterministic) + Campaign / Creative / Landing / Alignment brains (AI)

---

## 1. Studio workflow

```
Step 1 — Campaign Setup
  platform, workflow task, Google campaign type (Google only),
  ad groups / objectives, offer context, brief, vertical, audience, landing URL
        ↓
Step 2 — Creative Validation
  upload → dimension/format/weight/platform rules → IndexedDB creatives
        ↓
Step 3 — Campaign Intelligence
  analyze-creative / analyze-video / validate-campaign orchestrator
        ↓
Step 4 — Preview Studio
  placement previews, safe zones, export
```

Step slugs live in `app/lib/workflowSteps.js`.

---

## 2. Step 1 — Campaign Setup contracts

| Field | Persistence | Downstream use |
|---|---|---|
| Platform (`google_ads` / `meta_ads` / `programmatic`) | Snapshot + localStorage | Adapter selection, size matrices, preview templates |
| Workflow task type | Snapshot | Required-field gating via platform adapters |
| **Google campaign type** (`display` / `responsive_display` / `demand_gen`) | Snapshot + `adigator_google_campaign_type` | Upload validation, technical engine, size groups |
| **Offer Context** (`campaignProductFocus`) | Snapshot + FormData `offer` / `campaign_product_focus` | Creative alignment, campaign brain `offer`, landing continuity |
| Campaign brief | Snapshot | Intent/insights + analyzer prompts |
| Vertical / audience / goals / ad groups | Snapshot | Goal-stage alignment and ad-group priority |
| Landing URL | Snapshot | URL validation + landing brain |

**Offer Context** is explicit Step 1 UI (`ProgrammaticStep1Fields`). It is optional for setup gating, but when present it is sent on every analysis/orchestrator request as both `campaign_product_focus` and `offer`.

**Google Campaign Type** is required for Google Ads *campaign setup* (`googleAdsAdapter` + `setupRequiredFields`).

---

## 3. Step 2 — Creative validation behavior

Deterministic upload validation lives in `app/lib/creativeValidation.js` and platform size groups in `app/lib/creativeSizeRegistry.js`.

### Programmatic
- Size/placement intelligence from IAB matrices
- **Hard file-weight limits** from `FILE_SIZE_LIMITS` in `app/constants/programmaticSpecs.ts`:
  - static image / animated GIF: **150KB**
  - HTML5 ZIP: **200KB**
  - rich media: **2MB**
- Oversize → high-severity upload issue and technical-engine **error**

### Meta Ads
- Feed / story / carousel / AN matrices
- Image format + weight guidance (30MB hard / 5MB delivery warn)

### Google Ads — by campaign type

| Type | Formats | Size / ratio rules | Weight |
|---|---|---|---|
| Display | JPG, PNG, GIF, ZIP/HTML5 | Full Google Display + companion groups | Banner guidance ~150KB; general ceiling 5MB |
| Responsive Display | Same + RDA asset focus | Responsive/native asset group preferred | RDA minimum dimension rules |
| **Demand Gen** | **JPG/PNG only** | Landscape 1.91:1, square 1:1, portrait 4:5, vertical 9:16 (`DEMAND_GEN_IMAGE_REQUIREMENTS`) | **5MB** hard |

Demand Gen size group: `demand_gen_assets` in `PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads`.

Evaluator: `evaluateDemandGenImageAsset()` in `app/constants/googleSpecs.ts`.

---

## 4. Orchestrator + technical engine

`runCampaignValidation` (`orchestratorRunner.ts`) passes:

- `offer` ← `context.offer || context.campaignProductFocus`
- `platformConfig.googleCampaignType`
- `technicalCreatives` with `fileSize` + `format`

Technical engine (`technicalValidationEngine.ts`):

- Programmatic → `FILE_SIZE_LIMITS` by mime/asset kind
- Google Demand Gen → 5MB + JPG/PNG format set
- Other platforms → generic ceiling / format set

---

## 5. Module map

| Concern | Path |
|---|---|
| Google campaign types | `app/lib/googleCampaignTypes.ts` |
| Demand Gen specs | `app/constants/googleSpecs.ts` |
| Programmatic weight limits | `app/constants/programmaticSpecs.ts` |
| Upload validation | `app/lib/creativeValidation.js` |
| Size registry | `app/lib/creativeSizeRegistry.js` |
| Google adapter | `app/lib/platforms/googleAdsAdapter.ts` |
| Step 1 fields UI | `app/components/preview-tool/ProgrammaticStep1Fields.tsx` |
| Studio state / analyze wiring | `app/components/PreviewTool.jsx` |
| Validate campaign API | `app/api/validate-campaign/route.ts` |
| Technical engine | `app/lib/engines/technicalValidationEngine.ts` |
| Unit tests | `app/**/*.test.ts` (Vitest) |

---

## 6. Testing

```bash
npm test
```

Vitest covers Demand Gen evaluation, Google campaign-type helpers, and programmatic/Demand Gen file-weight enforcement in the technical engine.

---

## 7. Non-goals (deferred polish)

- Deeper Offer Context UX (chips, templates, required gating)
- Broader Vitest coverage for Meta safe-zone / PPTX export
- CI gate wiring beyond local `npm test`
