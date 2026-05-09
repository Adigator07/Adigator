# Adigator Codebase Audit Report

**Generated:** May 9, 2026  
**Purpose:** Comprehensive mapping of integrations, logic consolidation, and pipeline dependencies

---

## 1. LOCALANALYZER.JS IMPORTS & REFERENCES

**Files to delete/replace:**

| File | Line | Reference |
|------|------|-----------|
| [app/lib/creativeValidation.js](app/lib/creativeValidation.js#L1) | 1 | `import { PLATFORM_SIZES } from "./localAnalyzer"` |
| [app/components/PreviewTool.jsx](app/components/PreviewTool.jsx#L13) | 13 | `import { analyzeCreativeLocal, PLATFORM_SIZES, GOAL_CTA } from "../lib/localAnalyzer"` |

**Functions used from localAnalyzer:**
- `analyzeCreativeLocal()`
- `PLATFORM_SIZES`
- `GOAL_CTA`
- `recommendedTemplates()` - [app/lib/localAnalyzer.js](app/lib/localAnalyzer.js#L59)

---

## 2. SCORING LOGIC IMPLEMENTATION

### Core Scoring Engines

| File | Line | Logic Type | Details |
|------|------|-----------|---------|
| [app/api/analyze/route.ts](app/api/analyze/route.ts#L7) | 7-34 | `computeDynamicScore()` | Main scoring function with contribution map |
| [app/lib/ai.ts](app/lib/ai.ts#L22-27) | 22-27 | Type definitions | `conversionScore`, `verticalFitScore` |
| [app/components/AnalysisPanel.jsx](app/components/AnalysisPanel.jsx#L24) | 24-62 | `rankVerdict()`, `sc()`, `scBg()`, `scoreLabel()` | Scoring utility functions |
| [app/lib/decision-engine.ts](app/lib/decision-engine.ts#L12) | 12 | `recommendation: string` interface | Paired with scoring |
| [app/lib/useAnalysisStore.ts](app/lib/useAnalysisStore.ts#L41) | 41 | `optimizations[]` | Optimization recommendations with scoring |

### Specific Score Fields

| File | Line | Score Type |
|------|------|----------|
| [app/lib/ai.ts](app/lib/ai.ts#L22-28) | 22-28 | `conversionScore`, `verticalFitScore`, `cta`, `recommendedCTAs` |
| [app/api/analyze/route.ts](app/api/analyze/route.ts#L138) | 138 | `score`, `contributions` |
| [app/api/process/route.ts](app/api/process/route.ts#L81) | 81 | Sentiment mapping from `conversionScore` |

### CTA Scoring

| File | Line | Logic |
|------|------|-------|
| [generateDataset.js](generateDataset.js#L218) | 218-223 | `scoreCTA(cta_type)` - CTA strength scoring |
| [generateDataset.js](generateDataset.js#L227) | 227-243 | `generateScores(stage, cta_type, urgency)` - Combined scoring |

---

## 3. INTELLIGENCE REGISTRY USAGE

**Registry imports found in:**

| File | Line | Import |
|------|------|--------|
| [app/lib/layout-intelligence/metrics.ts](app/lib/layout-intelligence/metrics.ts#L1) | 1 | `import type { IntelligenceProfile }` |
| [app/lib/layout-intelligence/weights.ts](app/lib/layout-intelligence/weights.ts#L1) | 1 | `import type { IntelligenceProfile }` |
| [app/lib/layout-intelligence/types.ts](app/lib/layout-intelligence/types.ts#L1) | 1 | `import type { IntelligenceProfile }` |
| [app/lib/ocr-normalization/cta-engine.ts](app/lib/ocr-normalization/cta-engine.ts#L1) | 1 | `import type { IntelligenceProfile }` |
| [app/lib/ocr-normalization/classifier.ts](app/lib/ocr-normalization/classifier.ts#L1) | 1 | `import type { IntelligenceProfile }` |
| [app/lib/ocr-normalization/pipeline.ts](app/lib/ocr-normalization/pipeline.ts#L7) | 7 | Multiple imports from registry |
| [app/lib/ocr-normalization/types.ts](app/lib/ocr-normalization/types.ts#L1) | 1 | `import { CampaignGoal, IntelligenceProfile, VerticalKey }` |

**Registry data location:**
- [app/lib/intelligence-registry/types.ts](app/lib/intelligence-registry/types.ts)
- [app/lib/intelligence-registry/profile-data.ts](app/lib/intelligence-registry/profile-data.ts#L65-266) - Design psychology rules with vertical-specific recommendations

---

## 4. GOOGLE CLOUD VISION OCR INTEGRATION

### Primary OCR Implementation

| File | Line | Function/Code |
|------|------|---------------|
| [app/lib/ocr.ts](app/lib/ocr.ts#L2) | 2 | `OCR Service - Google Cloud Vision API` |
| [app/lib/ocr.ts](app/lib/ocr.ts#L6-8) | 6-8 | Import `ImageAnnotatorClient`, type definitions |

### Current Integration Points

| File | Line | Context |
|------|------|---------|
| [app/api/process/route.ts](app/api/process/route.ts#L177) | 177 | `ocrResult.confidence` combined with AI confidence |
| [app/api/process/route.ts](app/api/process/route.ts#L193-209) | 193-209 | OCR results with confidence scoring |
| [app/analyzer/page.tsx](app/analyzer/page.tsx#L59) | 59 | UI label: "Google Cloud Vision OCR" |
| [app/lib/vision.ts](app/lib/vision.ts) | - | Image preprocessing & validation (paired with OCR) |
| [app/lib/analyzer/ocr-parser.ts](app/lib/analyzer/ocr-parser.ts#L4) | 4 | Parses raw OCR text from Google Vision |

### Configuration Files

| File | Line | Note |
|------|------|------|
| [package.json](package.json#L12) | 12 | `@google-cloud/vision: ^5.3.6` |
| [app/google-key.json](app/google-key.json) | - | Service account credentials |

**Status:** Google Cloud Vision is actively integrated and used as primary OCR engine.

---

## 5. OPENAI VISION INTEGRATION

### Primary AI Implementation

| File | Line | Function/Code |
|------|------|---------------|
| [app/lib/ai.ts](app/lib/ai.ts#L6) | 6 | `import OpenAI from "openai"` |
| [app/lib/ai.ts](app/lib/ai.ts#L35-42) | 35-42 | `getOpenAIClient()` initialization |
| [app/lib/ai.ts](app/lib/ai.ts#L58) | 58 | Client instantiation in `analyzeCreative()` |
| [app/lib/ai.ts](app/lib/ai.ts#L230) | 230 | `OPENAI CALL` comment block |

### Extended AI Usage

| File | Line | Purpose |
|------|------|---------|
| [app/lib/analyzer/ai-analyzer.ts](app/lib/analyzer/ai-analyzer.ts#L4) | 4 | "Calls OpenAI ONLY after vision, OCR, and funnel heuristics" |
| [app/lib/analyzer/ai-analyzer.ts](app/lib/analyzer/ai-analyzer.ts#L122-145) | 122-145 | Full OpenAI integration with signal inputs |
| [app/api/preview-engine/route.ts](app/api/preview-engine/route.ts#L11) | 11 | OpenAI client for preview generation |
| [app/api/preview-engine/route.ts](app/api/preview-engine/route.ts#L190) | 190 | Model: `process.env.OPENAI_MODEL || "gpt-4o"` |
| [app/api/creative-insights/route.ts](app/api/creative-insights/route.ts#L53) | 53 | provider: "openai" |

### Configuration

| File | Line | Note |
|------|------|------|
| [package.json](package.json#L21) | 21 | `openai: ^4.0.0` |
| [.env.local](app/google-key.json) | - | `OPENAI_API_KEY` required |

**Status:** OpenAI GPT-4 is primary AI engine for structured analysis.

---

## 6. CTA DETECTION LOGIC

### Core CTA Engine

| File | Line | Logic |
|------|------|-------|
| [app/lib/ocr-normalization/cta-engine.ts](app/lib/ocr-normalization/cta-engine.ts) | - | Primary CTA detection logic |
| [app/lib/analyzer/cta-detector.ts](app/lib/analyzer/cta-detector.ts#L170) | 170 | Confidence threshold: `If confidence < 80% → return CTA null` |
| [app/lib/analyzer/cta-detector.ts](app/lib/analyzer/cta-detector.ts#L255) | 255 | `confidence_score` field (0.0-1.0) |

### CTA State Detection

**States defined in:** [app/lib/ocr-normalization/README.md](app/lib/ocr-normalization/README.md#L38-54)
- `explicit` - Clear button CTA
- `implicit` - Emotional directional messaging
- `none` - No candidate passes confidence thresholds

### CTA Scoring

| File | Line | Code |
|------|------|------|
| [generateDataset.js](generateDataset.js#L19-41) | 19-41 | CTA pools: SOFT, MEDIUM, HARD, IMPLICIT |
| [generateDataset.js](generateDataset.js#L176-182) | 176-182 | `getCTAConfidence()` - Confidence levels by type |
| [app/api/analyze/route.ts](app/api/analyze/route.ts#L8-22) | 8-22 | `ctaDetected: boolean`, `ctaStrength: "low"|"medium"|"high"` |

### CTA Datasets

- **Awareness CTAs:** [app/docs/awareness-dataset.md](app/docs/awareness-dataset.md#L33-1552)
- **Consideration CTAs:** [app/docs/consideration-dataset.md](app/docs/consideration-dataset.md#L3-2645)
- **Conversion CTAs:** [app/docs/conversion-dataset.md](app/docs/conversion-dataset.md#L45-3147)

---

## 7. LAYOUT INTELLIGENCE LOGIC

### Core Layout Engine

| File | Line | Purpose |
|------|------|---------|
| [app/lib/layout-intelligence/engine.ts](app/lib/layout-intelligence/engine.ts#L22) | 22 | `analyzeLayout(input: LayoutIntelligenceInput)` |
| [app/lib/layout-intelligence/metrics.ts](app/lib/layout-intelligence/metrics.ts#L49) | 49 | `scoreTextDensity()` |
| [app/lib/layout-intelligence/metrics.ts](app/lib/layout-intelligence/metrics.ts#L64) | 64 | `scoreWhitespace()` |
| [app/lib/layout-intelligence/metrics.ts](app/lib/layout-intelligence/metrics.ts#L126) | 126 | `scoreMobileReadability()` |

### Layout Result Types

| File | Line | Type |
|------|------|------|
| [app/lib/layout-intelligence/types.ts](app/lib/layout-intelligence/types.ts#L63) | 63 | `LayoutIntelligenceInput` |
| [app/lib/layout-intelligence/types.ts](app/lib/layout-intelligence/types.ts#L68) | 68 | `LayoutIntelligenceResult` |
| [app/lib/layout-intelligence/types.ts](app/lib/layout-intelligence/types.ts#L76) | 76 | `recommendations: string[]` |

### Recommendations Engine

| File | Line | Logic |
|------|------|-------|
| [app/lib/layout-intelligence/engine.ts](app/lib/layout-intelligence/engine.ts#L19) | 19 | `import { buildLayoutRecommendations }` |
| [app/lib/layout-intelligence/engine.ts](app/lib/layout-intelligence/engine.ts#L90) | 90 | `recommendations: buildLayoutRecommendations(metrics)` |
| [app/lib/layout-intelligence/recommendations.ts](app/lib/layout-intelligence/recommendations.ts#L3) | 3 | `buildLayoutRecommendations()` function |

---

## 8. RECOMMENDATION GENERATION

### Primary Recommendation Sources

| File | Line | Type |
|------|------|------|
| [app/lib/decision-engine.ts](app/lib/decision-engine.ts#L12) | 12 | `recommendation: string` interface |
| [app/lib/decision-engine.ts](app/lib/decision-engine.ts#L44-66) | 44-66 | Decision rules with recommendations |
| [app/lib/layout-intelligence/recommendations.ts](app/lib/layout-intelligence/recommendations.ts#L3) | 3 | Layout-specific recommendations |
| [app/lib/creativeValidation.js](app/lib/creativeValidation.js#L26-46) | 26-46 | Validation recommendations |

### CTA Recommendations

| File | Line | Logic |
|------|------|-------|
| [app/lib/ai.ts](app/lib/ai.ts#L27) | 27 | `recommendedCTAs: string[]` |
| [app/components/AnalysisPanel.jsx](app/components/AnalysisPanel.jsx#L853) | 853 | `CTARecommendationStrip()` component |
| [app/lib/localAnalyzer.js](app/lib/localAnalyzer.js#L59) | 59 | `recommendedTemplates(goal)` |

### Design Psychology Rules

| File | Line | Vertical |
|------|------|----------|
| [app/lib/intelligence-registry/profile-data.ts](app/lib/intelligence-registry/profile-data.ts#L65) | 65 | Brand consistency (general) |
| [app/lib/intelligence-registry/profile-data.ts](app/lib/intelligence-registry/profile-data.ts#L201-266) | 201-266 | Vertical-specific rules (automotive, banking, retail, etc.) |

### Recommendations Display

| File | Line | Component |
|------|------|-----------|
| [app/components/ContextualPreviewEngine.tsx](app/components/ContextualPreviewEngine.tsx#L334-338) | 334-338 | Recommendations section |
| [app/components/PreviewTool.jsx](app/components/PreviewTool.jsx#L709) | 709 | "Recommended CTAs" display |

---

## 9. CONFIDENCE SCORING MECHANISMS

### Confidence Calculation

| File | Line | Logic |
|------|------|-------|
| [app/api/analyze/route.ts](app/api/analyze/route.ts#L39-54) | 39-54 | `computeSignalConfidence()` - signal coverage |
| [app/api/process/route.ts](app/api/process/route.ts#L177) | 177 | Combined confidence: `(ocr + ai + quality) / 3` |
| [app/lib/analyzer/ai-analyzer.ts](app/lib/analyzer/ai-analyzer.ts#L163) | 163 | `confidence: Math.min(1, Math.max(0, Number(...)))` |

### Confidence Scoring by Component

| Component | File | Line | Mechanism |
|-----------|------|------|-----------|
| OCR Confidence | [app/api/process/route.ts](app/api/process/route.ts#L208) | 208 | `ocrConfidence: ocrResult.confidence` |
| AI Confidence | [app/api/process/route.ts](app/api/process/route.ts#L209) | 209 | `aiConfidence: analysis.confidence` |
| CTA Confidence | [generateDataset.js](generateDataset.js#L176-182) | 176-182 | CTA type → confidence range |
| Signal Coverage | [app/api/analyze/route.ts](app/api/analyze/route.ts#L53) | 53 | `signals.filter(Boolean).length / signals.length` |

### Confidence Visualization

| File | Line | Component |
|------|------|-----------|
| [app/components/AnalysisPanel.jsx](app/components/AnalysisPanel.jsx#L302) | 302 | `ConfidenceRing()` SVG visualization |
| [app/components/AnalysisPanel.jsx](app/components/AnalysisPanel.jsx#L242) | 242 | Confidence percentage display |
| [app/lib/analyzer/cta-detector.ts](app/lib/analyzer/cta-detector.ts#L170) | 170 | Confidence threshold (80%+) for CTA validity |

---

## 10. TESTS & SPECIFICATIONS

### Test Suite

| File | Line | Purpose |
|------|------|---------|
| [test-pipeline.ts](test-pipeline.ts) | - | Main test suite (referenced but not directly shown in search) |

### Test Documentation

| File | Line | Section |
|------|------|---------|
| [GETTING_STARTED.md](GETTING_STARTED.md#L116-145) | 116-145 | Phase 6: Test the System (includes test commands) |
| [GETTING_STARTED.md](GETTING_STARTED.md#L143-145) | 143-145 | Test command: `node test-pipeline.ts` |
| [OCR_AND_AI_PIPELINE_README.md](OCR_AND_AI_PIPELINE_README.md#L262-274) | 262-274 | Testing section |
| [OCR_QUICK_REFERENCE.md](OCR_QUICK_REFERENCE.md#L194-222) | 194-222 | Test procedures |

### Test Checklist

| File | Line | Items |
|------|------|-------|
| [GETTING_STARTED.md](GETTING_STARTED.md#L248) | 248 | Test suite passes, confidence metrics, OCR extraction |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md#L284-304) | 284-304 | Testing verification items |

### API Specs

| File | Line | Endpoint |
|------|------|----------|
| [app/api/analyze/route.ts](app/api/analyze/route.ts#L7-145) | 7-145 | `/api/analyze` - Dynamic scoring |
| [app/api/process/route.ts](app/api/process/route.ts) | - | `/api/process` - Full pipeline with confidence |
| [app/api/creative-insights/route.ts](app/api/creative-insights/route.ts) | - | `/api/creative-insights` - Structured analysis |
| [app/api/preview-engine/route.ts](app/api/preview-engine/route.ts) | - | `/api/preview-engine` - Context-aware previews |

---

## CONSOLIDATION OPPORTUNITIES

### 1. Scoring Logic (Fragmented)
- **Current:** `computeDynamicScore()` in `/api/analyze` + OpenAI-based scoring + CTA scoring
- **Issue:** Multiple scoring sources, not consolidated
- **Recommendation:** Create unified scoring engine at `lib/scoring-engine.ts`

### 2. CTA Detection (Split)
- **Current:** CTA engine in `/lib/ocr-normalization/cta-engine.ts` + CTA detector in `/lib/analyzer/cta-detector.ts`
- **Issue:** Potential duplication
- **Recommendation:** Consolidate into single CTA analyzer

### 3. LocalAnalyzer (Deprecated)
- **Current:** 2 imports still active
- **Issue:** Functionality should move to intelligence registry + decision engine
- **Recommendation:** Migrate functions and remove file

### 4. Intelligence Registry (Underused)
- **Current:** Imported by layout-intelligence, ocr-normalization, but could be used more broadly
- **Recommendation:** Use registry for all vertical-specific logic (CTA expectations, design rules, scoring weights)

### 5. Recommendation Generation (Scattered)
- **Current:** Multiple places generate recommendations (layout, decision-engine, validation, ai-analyzer)
- **Recommendation:** Centralize in unified recommendation engine

---

## API ENDPOINT SUMMARY

| Endpoint | Type | Current Use | Status |
|----------|------|------------|--------|
| `/api/analyze` | POST | Dynamic scoring | Active |
| `/api/analyze-v2` | POST | Alternative analysis | Active |
| `/api/process` | POST | Full pipeline | Active |
| `/api/preview-engine` | POST | Context-aware UI | Active |
| `/api/creative-insights` | POST | Structured insights | Active |
| `/api/preprocess` | POST | Image prep | Active |

---

## DEPENDENCY SUMMARY

| Dependency | Version | Purpose | Used By |
|-----------|---------|---------|---------|
| `openai` | ^4.0.0 | AI analysis | ai.ts, ai-analyzer.ts, preview-engine |
| `@google-cloud/vision` | ^5.3.6 | OCR | ocr.ts |
| Next.js | Latest | Framework | All |
| Tailwind CSS | Latest | Styling | All components |

---

## KEY FILES TO REVIEW

1. **Consolidation Priority:**
   - [app/lib/localAnalyzer.js](app/lib/localAnalyzer.js) - **Delete after migration**
   - [app/lib/decision-engine.ts](app/lib/decision-engine.ts) - **Centralize recommendations**
   - [app/lib/scoring-engine.ts](app/lib/scoring-engine.ts) - **Create new**

2. **Enhancement Targets:**
   - [app/lib/intelligence-registry/profile-data.ts](app/lib/intelligence-registry/profile-data.ts) - Expand registry usage
   - [app/lib/layout-intelligence/](app/lib/layout-intelligence/) - Already well-structured
   - [app/lib/ocr-normalization/](app/lib/ocr-normalization/) - Review for consolidation

3. **API Layer:**
   - [app/api/analyze/route.ts](app/api/analyze/route.ts) - Review scoring logic
   - [app/api/preview-engine/route.ts](app/api/preview-engine/route.ts) - OpenAI integration point

---

**End of Audit Report**
