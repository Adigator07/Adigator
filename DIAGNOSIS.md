# Frontend-API Data Flow Diagnosis

## Problem Summary
Backend API returns correct data structure with keys `behavioral_response`, `attention_analysis`, `strategic_recommendations`, but frontend UI displays "analysis unavailable" / "strategic analysis incomplete".

---

## DIAGNOSIS

### 1. API Response Structure (Correct ✅)
**File:** `app/api/analyze-creative/route.ts` (lines ~1000-1015)

API returns:
```javascript
{
  campaign_context: { goal, vertical, platform },
  main_strategic_problem: string,
  why_audience_may_resist: string,
  business_consequence: string,
  attention_analysis: { first_focus, attention_path, friction_points, cta_visibility, ... },
  behavioral_response: { perceived_message, emotional_state, likely_objection, trust_gap, ... },
  strategic_recommendations: [ { issue, priority, recommended_change, ... }, ... ],
  expected_improvement: string,
  strategic_alignment_score: { value: number, rationale: string }
}
```

### 2. API Response Parsing (Correct ✅)
**File:** `app/components/PreviewTool.jsx` (lines 579-601)

API response is JSON-parsed correctly:
```javascript
const analysisRes = await fetch("/api/analyze-creative", { method: "POST", body: formData });
if (!analysisRes.ok) { ... }
const aiJson = await analysisRes.json();  // ✅ PARSED
const data = normalizeOpenAIAnalysis(aiJson, goal, verticalForApi, visualMetrics);
results.push({ creative, data });
```

✅ **Line where API response is .json()-parsed:** 
**[PreviewTool.jsx:600](app/components/PreviewTool.jsx#L600)**

---

### 3. Data Transformation (BROKEN ❌)
**File:** `app/components/PreviewTool.jsx` (lines 259-360)

**CRITICAL BUG:** `normalizeOpenAIAnalysis()` transforms NEW API structure to OLD schema that no longer exists:

```javascript
// NEW API returns these ✅
const aiJson = {
  main_strategic_problem: "...",
  behavioral_response: { perceived_message: "...", emotional_state: "...", ... },
  strategic_recommendations: [ { issue: "...", ... } ],
  // ... etc
}

// normalizeOpenAIAnalysis() EXPECTS these (WRONG!) ❌
const normalized = {
  overall_score: aiJson?.overall_score,  // ❌ NOT IN NEW API
  improvements: Array.isArray(aiJson?.improvements) ? aiJson.improvements : [],  // ❌ NOT IN NEW API
  weaknesses: Array.isArray(aiJson?.weaknesses) ? aiJson.weaknesses : [],  // ❌ NOT IN NEW API
  subscores: aiJson?.subscores || {},  // ❌ NOT IN NEW API
  cta: aiJson?.cta || null,  // ❌ NOT IN NEW API
  goal_alignment: aiJson?.goal_alignment || {},  // ❌ NOT IN NEW API
  vertical_alignment: aiJson?.vertical_alignment || {},  // ❌ NOT IN NEW API
  engagement_forecast: aiJson?.engagement_forecast || "...",  // ❌ NOT IN NEW API
  // ALL FIELDS ARE UNDEFINED
}
```

❌ **Lines where data is being transformed to wrong schema:**
**[PreviewTool.jsx:259-360](app/components/PreviewTool.jsx#L259-L360)**

---

### 4. UI Reading Mismatched Data (BROKEN ❌)
**File:** `app/components/AnalysisPanel.jsx` (lines 1-300)

AnalysisPanel receives data with all undefined fields:
```javascript
export default function AnalysisPanel({ analysisResult, campaignGoal, platform, onDownloadReport }) {
  // analysisResult contains data from normalizeOpenAIAnalysis()
  // All new API fields are missing, so reads fall through to "unavailable" states

  const behavioral = getBehavioralResponse(data);  // ❌ Tries to read old schema
  const recommendations = getValidatedRecommendations(data);  // ❌ Tries to read old schema
  // ...renders "analysis unavailable" because fields are missing
}
```

**Lines with mismatches:**

| UI Component | Tries to Read | API Actually Has |
|---|---|---|
| `strategicPresentation.js` (line 24) | `behavioral?.perceived_message` | ✅ `behavioral_response.perceived_message` |
| `AttentionFlow()` (line 77) | `attention.friction_points` | ✅ `attention_analysis.friction_points` |
| `BehavioralField()` (line 95) | Various `behavioral` fields | ✅ In `behavioral_response` object |
| `Section()` (line 47) | Title/subtitle props | ✅ Should come from new structure |

**Status:** The validator in `strategicPresentation.js:isValidStrategicPayload()` CORRECTLY expects NEW fields (line 3-6), but receives OLD normalized data with all those fields missing.

---

### 5. /preview Page (Correct ✅)
**File:** `app/preview/page.tsx`

Uses dynamic import of PreviewTool with no ssr, which correctly loads live state. No hardcoded values. ✅

---

### 6. Async Timing (Correct ✅)
**File:** `app/components/PreviewTool.jsx` (lines 560-610)

Proper state management:
```javascript
const [analysisResults, setAnalysisResults] = useState([]);  // initialized
// ... analysis runs ...
setAnalysisResults(results);  // state is updated
// ... data flows to AnalysisPanel
```

No "never-flips-true" guards. State updates properly. ✅

---

## Root Cause

**The `normalizeOpenAIAnalysis()` function is a bridge between an OLD API schema and a NEW one. The function was designed for an older API that returned different field names, and it's still being used to transform the NEW API response into the OLD schema — which then breaks downstream components expecting NEW field names.**

Chain of failure:
1. API returns NEW structure ✅
2. `.json()` parses it correctly ✅
3. `normalizeOpenAIAnalysis()` **transforms NEW → OLD** ❌
4. `strategicPresentation.js` expects NEW structure ❌
5. Fields are undefined → UI shows "unavailable" ❌

---

## Data Key Mapping

| OLD Schema (normalizeOpenAIAnalysis) | NEW Schema (API Returns) | Status |
|---|---|---|
| `overall_score` | NOT PROVIDED | ❌ Missing |
| `improvements` | NOT PROVIDED | ❌ Missing |
| `weaknesses` | NOT PROVIDED | ❌ Missing |
| `subscores` | NOT PROVIDED | ❌ Missing |
| `cta` | Part of extraction | ❌ Different location |
| `goal_alignment` | NOT PROVIDED | ❌ Missing |
| `vertical_alignment` | NOT PROVIDED | ❌ Missing |
| `engagement_forecast` | NOT PROVIDED | ❌ Missing |
| `platform_fit` | NOT PROVIDED | ❌ Missing |
| N/A | `main_strategic_problem` | ✅ In API, new field |
| N/A | `behavioral_response` | ✅ In API, new field |
| N/A | `attention_analysis` | ✅ In API, new field |
| N/A | `strategic_recommendations` | ✅ In API, new field |

---

## FIXES REQUIRED

### Fix 1: Remove/Bypass `normalizeOpenAIAnalysis()`
**File:** `app/components/PreviewTool.jsx` (line 596)

**Current (WRONG):**
```javascript
const data = normalizeOpenAIAnalysis(aiJson, goal, verticalForApi, visualMetrics);
results.push({ creative, data });
```

**Fixed:**
```javascript
// Pass API response directly — it already has the correct structure
results.push({ creative, data: aiJson });
```

### Fix 2: Update AnalysisPanel Data Reading
**File:** `app/components/AnalysisPanel.jsx`

**Current (WRONG):**
```javascript
const behavioral = getBehavioralResponse(data);  // Looks for OLD schema
```

**Fixed:**
Already correct! `getBehavioralResponse()` in `strategicPresentation.js` (line 175) reads `payload?.behavioral_response`, which matches the NEW API.

The issue is that `normalizeOpenAIAnalysis()` is stripping out the `behavioral_response` field before it reaches this validator.

### Fix 3: Update Error Handling in PreviewTool
**File:** `app/components/PreviewTool.jsx` (line 590)

**Current (WRONG):**
```javascript
const data = normalizeOpenAIAnalysis({ overall_score: null }, goal, verticalForApi, visualMetrics);
results.push({ creative, data: { ...data, error: apiError } });
```

**Fixed:**
```javascript
// Use minimal error marker instead of normalizing empty schema
results.push({ 
  creative, 
  data: { 
    error: apiError,
    main_strategic_problem: undefined,
    behavioral_response: undefined,
    attention_analysis: undefined,
    strategic_recommendations: undefined,
    strategic_alignment_score: undefined,
  } 
});
```

---

## Validation

After fixes, the flow will be:

1. ✅ API returns `{ main_strategic_problem, behavioral_response, attention_analysis, ... }`
2. ✅ `.json()` parses it
3. ✅ **Passed directly to AnalysisPanel** (no transformation)
4. ✅ `strategicPresentation.js` reads correct fields
5. ✅ UI renders with real data

**Expected Result:** Strategic warning, behavioral analysis, recommendations, and attention flow will all display with real data instead of "unavailable".
