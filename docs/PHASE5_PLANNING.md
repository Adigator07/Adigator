# Phase 5 Planning — Native Engine, Preview Engine & Provider Abstraction

> **Status:** Planning only. Do not implement until explicitly approved.  
> **Prerequisites:** Phase 3 and Phase 4 complete (local). Staging E2E pending.  
> **Authoritative context:** [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)

---

## 1. Executive Summary

Phases 3–4 established the **validation brain pipeline**: Campaign, Creative, Landing, Technical, and Alignment engines under the Validation Orchestrator, with hash-based reuse and immutable validation versions.

Phase 5 addresses the **rendering and asset-generation layer** that today lives in parallel systems:

| Current system | Location | AI usage |
|---|---|---|
| Preview Engine (contextual environments) | `app/api/preview-engine/route.ts`, `app/lib/preview-engine/` | OpenAI inline |
| Preview Templates (Google/Meta native copy) | `app/api/preview-templates/route.ts` | OpenAI inline |
| Preview Studio (Step 4 UI) | `app/components/PreviewStudio/`, `ContextualPreviewEngine.tsx` | Mostly static templates; optional `/api/preview-engine` |
| Creative extraction | `app/lib/engines/creativeExtraction.ts` | OpenAI inline |
| Legacy monolith | `app/api/analyze-creative/route.ts` | OpenAI inline |

Phase 5 goal: **extract Native and Preview engines**, introduce a **provider abstraction layer**, and prepare for **multi-model support (Gemini)** without breaking existing Preview Tool flows.

---

## 2. Engine Responsibilities (Proposed)

### 2.1 Preview Engine

**Purpose:** Generate **placement-context preview assets** — environment chrome, slot layout, contextual copy blocks, and landing-page preview content — so creatives appear in realistic publisher contexts (news, commerce, social, etc.).

**Owns:**

- Environment family selection (`news`, `commerce`, `social`, …)
- Slot/placement mapping (inline, sidebar, feed-card, leaderboard, …)
- Deterministic template assembly (`buildPreviewEngineOutput`)
- Optional AI-generated environment **content blocks** (headlines, bylines, surrounding page copy)
- Device framing (desktop / mobile / tablet)
- Output contract: `PreviewEngineOutput` (`app/lib/preview-engine/types.ts`)

**Does not own:**

- Creative Brain extraction (Phase 3)
- Campaign / landing validation (Phase 4)
- Safe-zone geometry math (stays deterministic in `PreviewStudio` components)
- PPTX export (application code)

**Inputs (from Brains + workflow):**

| Input | Source |
|---|---|
| `vertical`, `goal`, `device` | Campaign Brain / workflow state |
| `analyzerOutput` | Creative Brain analysis payload (compact) |
| `ctaText`, `headline` | Creative Brain extraction |
| `creativeSize`, `creativeType` | Technical validation / creative metadata |
| `preferredEnvironment` | User selection in Preview Studio |

**Outputs:**

- `PreviewEngineOutput` — render-ready JSON consumed by `ContextualPreviewEngine` and programmatic preview components
- Optional: `PreviewBrain` record (future) — hash of inputs + generated environment for reuse

**Provider role:** AI generates **surrounding page content** only. Layout, slot selection, and renderer family remain **application-controlled**.

---

### 2.2 Native Engine

**Purpose:** Generate and validate **platform-native ad asset variants** — responsive headlines, descriptions, native recommendation cards, and multi-format copy sets for Google Ads, Meta Ads, and programmatic native placements.

**Owns:**

- Native copy generation (headlines, descriptions, primary text, CTA variants)
- Responsive asset set assembly per platform placement spec
- Native format compatibility checks (character limits, required fields)
- Crop / safe-zone **recommendations** (coordinates fed to existing `*CropSimulation` components; math stays deterministic)

**Does not own:**

- Full creative vision analysis (Creative Intelligence)
- Placement environment rendering (Preview Engine)
- Live ad platform API upload

**Inputs:**

| Input | Source |
|---|---|
| Platform + placement | Workflow / platform brain |
| Creative Brain | Extracted text, objects, tone, CTA |
| Campaign Brain | Goal, vertical, audience, offer |
| Placement specs | `app/constants/googleSpecs.ts`, Meta equivalents |

**Outputs:**

- `NativeAssetBundle` (proposed type) — per-placement copy variants + metadata
- Optional: `NativeBrain` record — hash-keyed stored native asset sets for reuse

**Provider role:** AI generates **copy variants**; character-limit enforcement and spec validation remain **deterministic**.

---

### 2.3 Relationship Between Engines

```
                    Validation Orchestrator (Phase 4)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   Campaign Brain      Creative Brain       Landing Brain
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    Alignment / Validation Brain
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
   Preview Engine                            Native Engine
   (environment + slots)                  (copy + native formats)
         │                                         │
         ▼                                         ▼
   Preview Studio UI                      Platform preview templates
   Step 4 / ContextualPreviewEngine       Google/Meta native cards
```

Preview and Native engines are **downstream of validation**. They consume Brain objects; they do not mutate validation versions unless the user explicitly triggers a new preview/native generation task.

---

## 3. Provider Abstraction Layer (Proposed)

### 3.1 Design Principles

1. **Engines depend on contracts, not vendors** — same pattern as `engineContracts.ts`.
2. **OpenAI remains default** until Gemini is explicitly enabled per engine.
3. **No provider logic in UI or routes** — routes call engines; engines call providers.
4. **Graceful degradation** — deterministic fallbacks (already in preview-engine) stay mandatory.
5. **Observability** — every call records `providerId`, `modelId`, `latencyMs`, `tokenUsage` (optional).

### 3.2 Proposed Module Layout

```
app/lib/providers/
  types.ts              # Provider contracts
  registry.ts           # Provider selection from env/config
  openai/
    client.ts             # Shared OpenAI client factory
    chatProvider.ts       # Text/JSON completion
    visionProvider.ts     # Image + text (creative extraction)
  gemini/
    client.ts             # Future
    chatProvider.ts       # Future
    visionProvider.ts     # Future
  resilience.ts           # Retry, backoff (reuse orchestrator policy)
```

### 3.3 Core Interfaces

```typescript
/** Provider-agnostic completion request */
export type ProviderChatRequest = {
  systemPrompt?: string;
  userPrompt: string;
  responseFormat?: "text" | "json";
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

export type ProviderVisionRequest = ProviderChatRequest & {
  imageBase64: string;
  mimeType: string;
};

export type ProviderUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ProviderResult<T> = {
  status: "success" | "failed" | "degraded";
  data: T | null;
  providerId: string;
  modelId: string;
  latencyMs: number;
  usage?: ProviderUsage;
  error?: string;
};

export interface ChatCompletionProvider {
  readonly providerId: string;
  completeJson<T>(request: ProviderChatRequest): Promise<ProviderResult<T>>;
  completeText(request: ProviderChatRequest): Promise<ProviderResult<string>>;
}

export interface VisionCompletionProvider {
  readonly providerId: string;
  analyzeImage<T>(request: ProviderVisionRequest): Promise<ProviderResult<T>>;
}

export type ProviderRegistry = {
  chat: ChatCompletionProvider;
  vision: VisionCompletionProvider;
};
```

### 3.4 Provider Selection (Config)

| Env variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI auth | required today |
| `OPENAI_MODEL` | Default chat/vision model | `gpt-4o` |
| `AI_CHAT_PROVIDER` | `openai` \| `gemini` | `openai` |
| `AI_VISION_PROVIDER` | `openai` \| `gemini` | `openai` |
| `GEMINI_API_KEY` | Gemini auth | optional |
| `GEMINI_MODEL` | Default Gemini model | TBD |

Per-engine overrides (future): `PREVIEW_ENGINE_PROVIDER`, `NATIVE_ENGINE_PROVIDER`, `CREATIVE_ENGINE_PROVIDER`.

### 3.5 Migration Path for Existing OpenAI Calls

| Current location | Phase 5 action |
|---|---|
| `creativeExtraction.ts` | Inject `VisionCompletionProvider` |
| `preview-engine/route.ts` | Extract to `previewIntelligence.ts`; inject `ChatCompletionProvider` |
| `preview-templates/route.ts` | Move into Native Engine; inject provider |
| `analyze-creative/route.ts` | Already thin; continues delegating to extraction |
| `url/urlAlignment.ts` | Low priority; inject provider when touched |

---

## 4. Workflow Impact & Backward Compatibility

### 4.1 What Stays the Same

| Flow | Impact |
|---|---|
| Preview Tool Steps 1–3 | **No change** — campaign setup, creative upload, analysis |
| `/api/validate-campaign` | **No change** to request/response contract |
| `/api/analyze-creative` | **No change** — guest fallback preserved |
| Preview Studio Step 4 static templates | **No change** — 26 hardcoded templates remain default |
| `ContextualPreviewEngine` cache behavior | **No change** — client-side preview cache preserved |
| Brain tables + validation versions | **No change** — preview/native are additive |

### 4.2 What Changes (Behind the Scenes)

| Area | Change | User-visible? |
|---|---|---|
| `/api/preview-engine` | Thin wrapper → `previewIntelligence` engine | No (same JSON shape) |
| `/api/preview-templates` | Thin wrapper → `nativeIntelligence` engine | No |
| OpenAI client creation | Centralized in `app/lib/providers/` | No |
| Env vars | Optional `AI_*_PROVIDER` flags | No (until Gemini enabled) |

### 4.3 Optional Future Enhancements (Not Phase 5a)

- `preview_brains` / `native_brains` tables for hash-based preview reuse (cost reduction)
- Orchestrator task types: `preview_regeneration`, `native_asset_generation`
- Validation version linking to preview snapshots

These are **out of scope** for initial Phase 5 unless explicitly approved.

### 4.4 Risk Matrix

| Risk | Mitigation |
|---|---|
| Preview Studio regression | Static template path unchanged; AI path behind feature flag |
| Latency increase from abstraction | Provider layer is thin; no extra network hops |
| Gemini quality mismatch | Per-engine provider override + fallback to OpenAI |
| Monolith re-growth | Routes stay thin; engines own logic |

---

## 5. Phased Implementation Plan

Mirrors Phases 3–4: **incremental extraction**, local E2E after each sub-phase, staging when available.

### Phase 5a — Provider Foundation (no user-facing change)

**Scope:**

- Create `app/lib/providers/types.ts`, `registry.ts`, `openai/chatProvider.ts`, `openai/visionProvider.ts`
- Refactor `creativeExtraction.ts` to use `VisionCompletionProvider`
- Unit-level smoke: creative E2E still passes

**Exit criteria:**

- Local `test:e2e:creative-brain` passes
- No direct `new OpenAI()` in `creativeExtraction.ts`
- `AI_ARCHITECTURE.md` updated

**Estimated effort:** 1–2 days

---

### Phase 5b — Preview Engine Extraction

**Scope:**

- Create `app/lib/engines/previewIntelligence.ts`
- Move AI content generation from `preview-engine/route.ts` into engine
- Inject `ChatCompletionProvider`; preserve `buildFallbackContent` deterministic path
- Optional: `PreviewBrain` hash stub (in-memory or DB — decision gate)

**Exit criteria:**

- `/api/preview-engine` response shape unchanged
- Preview Studio Step 4 manual QA (programmatic contextual preview)
- Local preview smoke script (new, lightweight)

**Estimated effort:** 2–3 days

---

### Phase 5c — Native Engine Extraction

**Scope:**

- Create `app/lib/engines/nativeIntelligence.ts`
- Extract logic from `preview-templates/route.ts`
- Define `NativeAssetBundle` type in `app/lib/brains/types.ts` (or `app/lib/engines/nativeTypes.ts`)
- Deterministic spec validation (character limits, required fields)
- Wire Google/Meta preview components to consume `NativeAssetBundle` when present; fallback to current behavior

**Exit criteria:**

- `/api/preview-templates` response shape unchanged
- Google/Meta preview cards render with static or native-generated copy
- No regression in `templateRegistry` flows

**Estimated effort:** 3–4 days

---

### Phase 5d — Gemini Provider (Optional Sub-Phase)

**Scope:**

- Implement `app/lib/providers/gemini/*`
- Enable via `AI_CHAT_PROVIDER=gemini` for Preview Engine only (pilot)
- Compare output quality; keep OpenAI as default

**Exit criteria:**

- Preview Engine works with both providers
- Feature flag / env guard documented
- No impact on validation pipeline

**Estimated effort:** 2–3 days (depends on Gemini API access)

---

### Phase 5e — Orchestrator Integration (Optional)

**Scope:**

- Add `preview` and `native` as optional downstream engines (not in critical validation path)
- Task types: explicit user-triggered only
- Hash reuse for preview/native outputs

**Exit criteria:**

- Validation orchestrator unchanged for `creative_addition` / `campaign_setup`
- New tasks documented in `programmaticWorkflow.ts`

**Estimated effort:** 2 days

**Approval required** — this sub-phase changes orchestrator surface area.

---

## 6. Testing Strategy

| Layer | Test |
|---|---|
| Provider | Mock provider injection in engine unit tests |
| Creative reuse | Existing `e2e-creative-brain-reuse.mjs` (regression) |
| Preview | New `e2e-preview-engine-smoke.mjs` — POST `/api/preview-engine`, assert JSON schema |
| Native | New `e2e-native-templates-smoke.mjs` — POST `/api/preview-templates` |
| UI | Manual Preview Studio QA checklist (per platform) |
| Staging | Full checklist from `STAGING_VERIFICATION.md` when deployment exists |

---

## 7. Pending Infrastructure (Not Phase 5)

These remain blocked until a staging deployment exists:

- [ ] Staging app deployment with env vars
- [ ] Staging E2E (`test:e2e:creative-brain:staging`)
- [ ] Staging Preview Tool UI validation
- [ ] Network verification: `/api/validate-campaign` in Creative Addition flow

---

## 8. Approval Checklist (Before Starting Phase 5)

- [ ] Review and approve engine responsibility split (§2)
- [ ] Approve provider interface design (§3)
- [ ] Confirm backward compatibility approach (§4)
- [ ] Select sub-phases to implement (5a required; 5d/5e optional)
- [ ] Confirm Gemini API access and pilot scope (if 5d)
- [ ] Staging deployment timeline (parallel track)

---

## 9. Current Work Mode (Until Phase 5 Approved)

While Phase 5 remains in planning:

- **Bug fixes** — address Preview Tool errors, schema drift, activity log columns
- **UI polish** — Preview Studio, programmatic workflow panels
- **Performance** — preview client cache, reduce redundant API calls
- **Production hardening** — env validation, error boundaries, logging
- **Architecture stability** — no new engines; extend Phase 4 only for critical fixes

---

*This document is planning-only. Implementation must not begin until explicit approval.*
