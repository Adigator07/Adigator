# Adigator AI Architecture

> **Authoritative specification** for Adigator's AI-driven campaign validation system. Engineers and agents must treat this document as the single source of truth for how the AI layer, workflow orchestration, and data model behave. Do not introduce new AI providers, workflow branches, or architectural shortcuts that aren't described here. If something is ambiguous, flag it and ask — do not invent behavior.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, full-stack.

---

## 1. Vision

Adigator is a **Pre-Launch Campaign Validation Platform**. It validates ad campaigns — creatives, landing pages, and campaign strategy — for consistency and platform-readiness *before* launch, across Google Ads, Meta Ads, and Programmatic/IAB display.

The AI layer's job is to **understand** campaign context, validate alignment between the pieces of a campaign, and assist decision-making.

The application code's job is to **control** everything else: business rules, workflows, storage, validation state, and versioning.

**This split is non-negotiable.** AI never owns business logic. Application code never tries to "understand" content semantically — that's the AI layer's job.

---

## 2. Core Principles

1. **AI Understands. Code Controls.** — AI provides intelligence; application code owns workflows, state transitions, and business rules.
2. **Reuse Stored Data to Reduce API Costs.** — Never re-analyze unchanged inputs. Load existing Brains from storage when hashes match.
3. **Version Every Validation.** — Validation records are immutable. Every new run creates a new version. Nothing is overwritten.
4. **Keep Engines Modular.** — Each AI engine is swappable independently. Engines communicate only through typed Brain objects.

---

## 3. AI Engines

| Engine | Provider | Responsible For | Output |
|---|---|---|---|
| **Campaign Intelligence** | OpenAI | Campaign Brief, Objective, Platform, Vertical | **Campaign Brain** |
| **Creative Intelligence** | OpenAI | Headlines, CTAs, Messaging, Brand Info, Objects/Visual Elements, Tone of Voice | **Creative Brain** |
| **Landing Page Intelligence** | OpenAI | Landing Page Content, CTA, Offers, Trust Signals | **Landing Page Brain** |
| **Alignment Engine** | OpenAI | Compares Campaign + Creative + Landing Page Brains | **Validation Brain** |
| **Native & Preview Engine** | Gemini (future) | Native Ad Assets, Responsive Content, Image Crops, Placement Previews | Preview/render assets |
| **Technical Validation** | Application Code (no AI) | Dimensions, File Formats, Safe Zones, URLs, UTMs, HTTPS, Redirects, Platform Compatibility | Pass/fail technical checks |

**Technical Validation must remain 100% deterministic** — no AI calls.

The Alignment Engine only runs after Campaign Brain, Creative Brain, and Landing Page Brain all exist (fresh or reused).

---

## 4. Architecture Flow

```
User Input
    ↓
Validation Orchestrator
    ↓
Campaign Engine
    ↓
Creative Engine
    ↓
Landing Page Engine
    ↓
Technical Validation
    ↓
Alignment Engine
    ↓
Recommendation Engine
    ↓
Report Generator
    ↓
Database
```

The **Validation Orchestrator** decides which engines need to run based on what changed — it does not blindly run the full pipeline on every request.

---

## 5. Change Detection for Brain Reuse

### Decision

Use **content hash + field-level tracking**.

### Hashes generated for

- Campaign Brief Text
- Creative Assets (image bytes hash)
- Landing Page URL + fetched content hash
- Platform Configuration
- Campaign Goal
- Vertical
- CTA
- Target Audience
- Offer Details

### Staleness rules

**Campaign-Level Brain** — rebuild only if brief, goal, vertical, audience, or landing page changes.

**Creative-Level Brain** — rebuild only if new creative added, existing creative replaced, creative text changes, or creative image changes.

Implementation: `app/lib/brains/staleness.ts`, `app/lib/brains/hashing.ts`.

---

## 6. Brain Object Schema

Brains use **ID references only** — no embedded snapshots inside other brains.

TypeScript contracts: `app/lib/brains/types.ts`.

### CampaignBrain (required)

`id`, `campaignId`, `briefSummary`, `campaignGoal`, `vertical`, `targetAudience`, `offer`, `cta`, `platform`, `objectiveMapping`, `hash`, `createdAt`, `updatedAt`

Optional: `competitorInsights`, `audienceInsights`, `recommendations`

### CreativeBrain (required)

`id`, `creativeId`, `campaignBrainId`, `extractedText`, `detectedObjects`, `detectedBrands`, `visualAnalysis`, `sentiment`, `complianceSignals`, `hash`, `createdAt`, `updatedAt`

Optional: `emotionalTriggers`, `attentionScore`, `creativeRecommendations`

### LandingPageBrain (required)

`id`, `landingUrl`, `headline`, `offer`, `cta`, `pageIntent`, `conversionElements`, `trustSignals`, `hash`, `createdAt`, `updatedAt`

Optional: `pageSpeedInsights`, `seoSignals`, `mobileExperienceSignals`

### ValidationBrain (required)

`id`, `campaignBrainId`, `creativeBrainIds`, `landingBrainId`, `validationResults`, `overallScore`, `launchReadiness`, `createdAt`

Optional: `recommendations`, `warningFlags`, `optimizationSuggestions`

---

## 7. Validation Version Hierarchy

### Decision

Start with **campaign-level versioning**. No Ad Group / Ad Set entities yet.

```
Campaign
└── Validation Version
    ├── Campaign Brain (reference)
    ├── Creative Brain references
    ├── Landing Brain (reference)
    └── Validation Brain (immutable snapshot)
```

Examples: Version 1 = initial validation; Version 2 = new creative; Version 3 = landing page update; Version 4 = goal change.

Existing `programmatic_campaigns` snapshots map to **Version 1** on first orchestrated validation (lazy backfill).

Future Ad Group / Line Item versioning can layer on without breaking this model.

Database: `supabase/migrations/20260703_brain_objects_validation_versions.sql`.

---

## 8. Campaign vs. User Scope

These coexist:

| Concern | Driven by |
|---|---|
| **Security / access control** | `ownerId`, `user_id` |
| **Workflow routing** | Campaign state, what changed, which brain is stale |

Workflow decisions must **never** depend on user history, previous sessions, or account behavior.

---

## 9. Universal Workflow

```
Platform Selection → Task Selection → Search Campaign
    ↓ Found                    ↓ Not Found
Load Campaign Context      Create Campaign Context
    ↓                            ↓
Validate Changes           Run Full Validation
    ↓                            ↓
Save New Version           Save Version 1
```

---

## 10. Task Logic

| Task | Behavior |
|---|---|
| **Campaign Setup** | Build complete context; save Version 1 |
| **Creative Addition** | Load context; validate only new creatives |
| **Creative Replacement** | Compare stored vs. replacement creatives |
| **Landing Page Update** | Compare unchanged creatives vs. updated landing page |
| **URL / UTM Update** | Validate URLs, redirects, tracking parameters only |
| **Campaign Renewal** | Reuse context; validate only changed fields |
| **Platform Migration** | Validate compatibility against target platform specs |

**Rule:** Every task triggers the *minimum* set of engine calls needed for what actually changed.

---

## 11. Error and Fallback Behavior

Never fail the entire validation if one engine fails. Return partial results.

| Outcome | When |
|---|---|
| `SUCCESS` | All engines completed |
| `PARTIAL_SUCCESS` | One or more non-foundation engines failed |
| `FAILED` | Campaign Brain failed or campaign metadata missing |

Retry policy: 2 retries with exponential backoff. If retries fail, mark engine as degraded and continue.

Only **Campaign Brain** failure blocks the full pipeline.

---

## 12. Provider Priority

1. Brain Architecture
2. Validation Versioning
3. Validation Orchestrator
4. Brain Reuse Logic
5. Native Engine
6. Preview Engine
7. Gemini Integration (alongside existing providers, not replacing)

---

## 13. Migration Strategy

**Incremental extraction** from the existing `analyze-creative` monolith:

```
analyze-creative (current)
  → Extract Creative Brain
  → Extract Landing Brain
  → Extract Campaign Brain
  → Move orchestration to Validation Orchestrator
  → Retire monolith
```

Avoid big-bang rewrites and parallel duplicate systems.

---

## 14. Execution Phases

| Phase | Scope | Status |
|---|---|---|
| **1** | Architecture doc, Brain interfaces, DB schema, migrations | Complete |
| **2** | Validation Orchestrator, hash reuse, version creation | Complete |
| **3** | Extract Creative Brain from analyze-creative | **Complete** (local E2E + manual UI) |
| **3b** | Staging E2E verification | Pending (no staging deployment) |
| **4** | Extract Landing + Campaign Brains; orchestrator ownership | **Complete** (local E2E + manual UI) |
| **5** | Native Engine, Preview Engine, provider abstraction | **Planning** — see [PHASE5_PLANNING.md](./PHASE5_PLANNING.md) |
| **6** | Gemini support, advanced optimization | Pending (sub-phase of Phase 5d) |

---

## 15. Implementation Map

| Artifact | Path |
|---|---|
| Brain types | `app/lib/brains/types.ts` |
| Content hashing | `app/lib/brains/hashing.ts` |
| Staleness evaluation | `app/lib/brains/staleness.ts` |
| Engine contracts | `app/lib/validation/engineContracts.ts` |
| Validation Orchestrator | `app/lib/validation/orchestrator.ts` |
| Creative extraction | `app/lib/engines/creativeExtraction.ts` |
| Creative Intelligence engine | `app/lib/engines/creativeIntelligence.ts` |
| Campaign Intelligence engine | `app/lib/engines/campaignIntelligence.ts` |
| Landing Page extraction | `app/lib/engines/landingPageExtraction.ts` |
| Landing Page Intelligence engine | `app/lib/engines/landingPageIntelligence.ts` |
| Alignment engine | `app/lib/engines/alignmentIntelligence.ts` |
| Technical validation engine | `app/lib/engines/technicalValidationEngine.ts` |
| Orchestrator runner (persistence) | `app/lib/validation/orchestratorRunner.ts` |
| Brain persistence (all types) | `app/lib/brains/brainPersistence.ts` |
| Creative brain persistence | `app/lib/brains/creativeBrainPersistence.ts` |
| Phase 5 planning (not implemented) | `docs/PHASE5_PLANNING.md` |
| Validate campaign API | `app/api/validate-campaign/route.ts` |
| DB migration | `supabase/migrations/20260703_brain_objects_validation_versions.sql` |
| Legacy monolith (being extracted) | `app/api/analyze-creative/route.ts` |

---

## 16. Instructions to Implementers

1. Do not merge AI logic into application code — business rules belong in code, evaluated *after* AI returns findings.
2. Do not skip the reuse check — check storage before calling any AI engine.
3. Do not overwrite validation records — always insert a new version row.
4. Keep engine interfaces provider-agnostic.
5. Technical Validation stays deterministic — no AI calls.
6. Task-based routing off campaign changes, not user history.
7. Ask for clarification when ambiguous — do not assume.
8. Update this document when architecture evolves — do not let implementation drift silently.

---

*This document supersedes ad-hoc verbal or chat-based descriptions of the AI architecture.*
