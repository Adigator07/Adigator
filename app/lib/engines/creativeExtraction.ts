/**
 * Creative Brain extraction layer — OpenAI vision extraction extracted from analyze-creative.
 * @see docs/AI_ARCHITECTURE.md
 */

import OpenAI from "openai";
import sharp from "sharp";
import { buildGoogleGoalPromptSection } from "@/app/lib/analyzers/google";
import { buildMetaGoalPromptSection } from "@/app/lib/analyzers/meta";
import { buildProgrammaticGoalPromptSection } from "@/app/lib/analyzers/programmatic";
import {
  ADIGATOR_ANALYZER_IDENTITY,
  STRICT_ANALYZER_RULES,
  buildActivePlatformBrainPrompt,
  buildExtractionUserPromptLock,
  buildFinalValidationChecklist,
  enforcePlatformFeedbackTone,
  type AnalyzerPlatform,
} from "@/app/lib/analyzers/platformBrain";
import { buildCampaignBriefSystemPromptSection } from "@/app/lib/campaignBriefValidation";

export type SignalLevel = "low" | "moderate" | "high";
export type CtaPressure = "soft" | "moderate" | "aggressive";
export type PlatformContext = "google_ads" | "meta_ads" | "programmatic";
export type CampaignGoal =
  | "awareness"
  | "traffic"
  | "conversion"
  | "lead_generation"
  | "engagement"
  | "app_installs"
  | "video_views"
  | "retargeting"
  | "consideration";

export interface ExtractionSignals {
  headline: string;
  cta: string;
  primary_message: string;
  visual_elements: string[];
  dominant_colors: string[];
  text_density: SignalLevel;
  layout_structure: string;
  brand_presence: SignalLevel;
  emotional_cues: string[];
  readability: SignalLevel;
  hierarchy_observations: string;
  trust_markers: string[];
  urgency_signals: string[];
  audience_clues: string[];
  creative_type_hint?: string;
  composition_notes?: string;
  inferred_vertical?: string;
}

export interface ExtractionMeta {
  ocr_failed: boolean;
  ocr_error: string | null;
  extracted_text: string;
  cta_text: string;
  retry_count: number;
  timed_out: boolean;
  text_available: boolean;
}

export interface AIAnalysisOutput {
  overall_score: number;
  vertical_match?: boolean;
  goal_match?: boolean;
  platform_fit: boolean;
  explicit_vertical_match?: boolean;
  explicit_goal_match?: boolean;
  status: "Approved" | "Needs Improvement" | "Rejected";
  scores: {
    visual_impact: number;
    cta_strength: number;
    brand_clarity: number;
    platform_fit_score: number;
    audience_relevance: number;
  };
  issues: Array<{ type: "error" | "warning" | "info"; message: string }>;
  vertical_feedback: string;
  goal_feedback: string;
  expert_insight: string;
  brief_alignment_raw?: Record<string, unknown> | null;
  google_ads_dynamic_eval?: Record<string, unknown>;
  meta_ads_dynamic_eval?: Record<string, unknown>;
  programmatic_ads_dynamic_eval?: Record<string, unknown>;
}

export function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}


function normalizeSignalLevel(value: unknown, fallback: SignalLevel = "moderate"): SignalLevel {
  return value === "low" || value === "moderate" || value === "high" ? value : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function inferCtaFromText(...values: unknown[]): string {
  const corpus = values
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!corpus) return "";

  const match = corpus.match(/\b(shop now|buy now|learn more|get started|sign up|subscribe|download|book now|order now|claim offer|try now|start now|contact us|apply now|request demo|view plans|explore now|watch now|register now)\b/i);
  return match?.[1] || "";
}

export function normalizeExtraction(raw: Record<string, unknown>): ExtractionSignals {
  // New combined format nests extraction signals under "signals"; fall back to top-level for backward compat.
  // OpenAI output may vary slightly in key naming (camelCase vs snake_case, or renamed fields).
  const s = (raw.signals && typeof raw.signals === "object" ? raw.signals : raw) as Record<string, unknown>;

  const pickString = (a: unknown, b: unknown) => (typeof a === "string" ? a : typeof b === "string" ? b : "");
  const pickArrayStrings = (a: unknown, b: unknown) => {
    const arrA = normalizeStringArray(a);
    if (arrA.length > 0) return arrA;
    return normalizeStringArray(b);
  };

  // Visual elements can come back as either:
  // - visual_elements: string[]
  // - dominant_visual_cue: string
  // - dominant_visual_cue: { label: string } (rare)
  const dominantVisualCue =
    (typeof s.dominant_visual_cue === "string" ? s.dominant_visual_cue : null) ??
    (typeof (s.dominant_visual_cue as any)?.label === "string" ? (s.dominant_visual_cue as any).label : null);

  const visualElementsArr = pickArrayStrings(s.visual_elements, (s as any).visualElements);

  const headline = pickString(s.headline, (s as any).title);
  const primaryMessage = pickString(s.primary_message, (s as any).primaryMessage);
  const cta = pickString(
    s.cta,
    (s as any).cta_text
      || (s as any).ctaText
      || (s as any).call_to_action
      || (s as any).callToAction
      || (s as any).button_text
      || (s as any).buttonText
      || (s as any).action_text
      || (s as any).actionText,
  ) || inferCtaFromText(headline, primaryMessage, (s as any).extracted_text, (s as any).visible_text);

  return {
    headline,
    cta,
    primary_message: primaryMessage,
    visual_elements:
      visualElementsArr.length > 0
        ? visualElementsArr
        : dominantVisualCue
          ? [dominantVisualCue]
          : ["creative_asset"],
    dominant_colors: pickArrayStrings(s.dominant_colors, (s as any).dominantColors),
    text_density: normalizeSignalLevel((s as any).text_density ?? (s as any).textDensity),
    layout_structure: pickString(s.layout_structure, (s as any).layoutStructure),
    brand_presence: normalizeSignalLevel((s as any).brand_presence ?? (s as any).brandPresence),
    emotional_cues: pickArrayStrings(s.emotional_cues, (s as any).emotionalCues),
    readability: normalizeSignalLevel((s as any).readability),
    hierarchy_observations: pickString(s.hierarchy_observations, (s as any).hierarchyObservations),
    trust_markers: pickArrayStrings(s.trust_markers, (s as any).trustMarkers),
    urgency_signals: pickArrayStrings(s.urgency_signals, (s as any).urgencySignals),
    audience_clues: pickArrayStrings(s.audience_clues, (s as any).audienceClues),
    creative_type_hint:
      typeof s.creative_type_hint === "string"
        ? s.creative_type_hint
        : typeof (s as any).creativeTypeHint === "string"
          ? (s as any).creativeTypeHint
          : undefined,
    composition_notes:
      typeof s.composition_notes === "string"
        ? s.composition_notes
        : typeof (s as any).compositionNotes === "string"
          ? (s as any).compositionNotes
          : undefined,
    inferred_vertical:
      typeof s.inferred_vertical === "string"
        ? s.inferred_vertical
        : typeof (s as any).inferredVertical === "string"
          ? (s as any).inferredVertical
          : undefined,
  };
}


export function normalizeAIAnalysis(raw: Record<string, unknown>): AIAnalysisOutput | null {
  // Only normalize if the model returned the new combined format
  if (typeof raw.overallScore !== "number" && typeof raw.overall_score !== "number") return null;

  const overallScore = typeof raw.overallScore === "number"
    ? raw.overallScore
    : (typeof raw.overall_score === "number" ? raw.overall_score : 50);
  const clamped = Math.max(0, Math.min(100, Math.round(overallScore)));
  const scoresRaw = (raw.scores && typeof raw.scores === "object"
    ? raw.scores : {}) as Record<string, unknown>;

  const normalizeScore = (v: unknown) =>
    typeof v === "number" ? Math.max(0, Math.min(100, Math.round(v))) : 50;

  const explicitVerticalMatch = typeof raw.verticalMatch === "boolean"
    ? raw.verticalMatch
    : typeof raw.vertical_match === "boolean"
      ? raw.vertical_match
      : undefined;
  const explicitGoalMatch = typeof raw.goalMatch === "boolean"
    ? raw.goalMatch
    : typeof raw.goal_match === "boolean"
      ? raw.goal_match
      : undefined;

  return {
    overall_score: clamped,
    vertical_match: explicitVerticalMatch,
    goal_match: explicitGoalMatch,
    explicit_vertical_match: explicitVerticalMatch,
    explicit_goal_match: explicitGoalMatch,
    platform_fit: typeof raw.platformFit === "boolean" ? raw.platformFit : true,
    status: (["Approved", "Needs Improvement", "Rejected"] as const).includes(raw.status as "Approved" | "Needs Improvement" | "Rejected")
      ? raw.status as "Approved" | "Needs Improvement" | "Rejected"
      : clamped >= 75 ? "Approved" : clamped >= 40 ? "Needs Improvement" : "Rejected",
    scores: {
      visual_impact: normalizeScore(scoresRaw.visualImpact),
      cta_strength: normalizeScore(scoresRaw.ctaStrength),
      brand_clarity: normalizeScore(scoresRaw.brandClarity),
      platform_fit_score: normalizeScore(scoresRaw.platformFitScore),
      audience_relevance: normalizeScore(scoresRaw.audienceRelevance),
    },
    issues: Array.isArray(raw.issues)
      ? (raw.issues as unknown[]).filter((i) => i && typeof i === "object").map((i) => {
          const issue = i as Record<string, unknown>;
          return {
            type: (["error", "warning", "info"] as const).includes(issue.type as "error" | "warning" | "info")
              ? issue.type as "error" | "warning" | "info"
              : "warning" as const,
            message: typeof issue.message === "string" ? issue.message : String(issue.message ?? ""),
          };
        })
      : [],
    vertical_feedback: typeof raw.verticalFeedback === "string" ? raw.verticalFeedback : "",
    goal_feedback: typeof raw.goalFeedback === "string" ? raw.goalFeedback : "",
    expert_insight: typeof raw.expertInsight === "string" ? raw.expertInsight : "",
    brief_alignment_raw: (raw.briefAlignment || raw.brief_alignment) && typeof (raw.briefAlignment || raw.brief_alignment) === "object"
      ? (raw.briefAlignment || raw.brief_alignment) as Record<string, unknown>
      : null,
    ...(raw.google_ads_dynamic_eval && typeof raw.google_ads_dynamic_eval === "object" ? {
      google_ads_dynamic_eval: (() => {
        const d = raw.google_ads_dynamic_eval as any;
        return {
          campaign_goal_focus: typeof d.campaign_goal_focus === "string" ? d.campaign_goal_focus : "",
          purpose: typeof d.purpose === "string" ? d.purpose : "",
          detected_signals: Array.isArray(d.detected_signals) ? d.detected_signals.map(String) : [],
          missing_signals: Array.isArray(d.missing_signals) ? d.missing_signals.map(String) : [],
          avoided_elements_found: Array.isArray(d.avoided_elements_found) ? d.avoided_elements_found.map(String) : [],
          metrics: Array.isArray(d.metrics) ? d.metrics.map((m: any) => ({
            label: typeof m.label === "string" ? m.label : String(m.label || ""),
            score: typeof m.score === "number" ? Math.max(0, Math.min(100, Math.round(m.score))) : 50
          })) : [],
          best_analyzer_questions: Array.isArray(d.best_analyzer_questions) ? d.best_analyzer_questions.map((q: any) => ({
            question: typeof q.question === "string" ? q.question : String(q.question || ""),
            response: typeof q.response === "string" ? q.response : String(q.response || "")
          })) : [],
          vertical_specific_signals: Array.isArray(d.vertical_specific_signals) ? d.vertical_specific_signals.map(String) : [],
        };
      })()
    } : {}),
    ...(raw.meta_ads_dynamic_eval && typeof raw.meta_ads_dynamic_eval === "object" ? {
      meta_ads_dynamic_eval: (() => {
        const d = raw.meta_ads_dynamic_eval as any;
        return {
          campaign_goal_focus: typeof d.campaign_goal_focus === "string" ? d.campaign_goal_focus : "",
          purpose: typeof d.purpose === "string" ? d.purpose : "",
          detected_signals: Array.isArray(d.detected_signals) ? d.detected_signals.map(String) : [],
          missing_signals: Array.isArray(d.missing_signals) ? d.missing_signals.map(String) : [],
          avoided_elements_found: Array.isArray(d.avoided_elements_found) ? d.avoided_elements_found.map(String) : [],
          metrics: Array.isArray(d.metrics) ? d.metrics.map((m: any) => ({
            label: typeof m.label === "string" ? m.label : String(m.label || ""),
            score: typeof m.score === "number" ? Math.max(0, Math.min(100, Math.round(m.score))) : 50
          })) : [],
          best_analyzer_questions: Array.isArray(d.best_analyzer_questions) ? d.best_analyzer_questions.map((q: any) => ({
            question: typeof q.question === "string" ? q.question : String(q.question || ""),
            response: typeof q.response === "string" ? q.response : String(q.response || "")
          })) : [],
          vertical_specific_signals: Array.isArray(d.vertical_specific_signals) ? d.vertical_specific_signals.map(String) : [],
        };
      })()
    } : {}),
    ...(raw.programmatic_ads_dynamic_eval && typeof raw.programmatic_ads_dynamic_eval === "object" ? {
      programmatic_ads_dynamic_eval: (() => {
        const d = raw.programmatic_ads_dynamic_eval as any;
        return {
          campaign_goal_focus: typeof d.campaign_goal_focus === "string" ? d.campaign_goal_focus : "",
          purpose: typeof d.purpose === "string" ? d.purpose : "",
          detected_signals: Array.isArray(d.detected_signals) ? d.detected_signals.map(String) : [],
          missing_signals: Array.isArray(d.missing_signals) ? d.missing_signals.map(String) : [],
          avoided_elements_found: Array.isArray(d.avoided_elements_found) ? d.avoided_elements_found.map(String) : [],
          metrics: Array.isArray(d.metrics) ? d.metrics.map((m: any) => ({
            label: typeof m.label === "string" ? m.label : String(m.label || ""),
            score: typeof m.score === "number" ? Math.max(0, Math.min(100, Math.round(m.score))) : 50
          })) : [],
          best_analyzer_questions: Array.isArray(d.best_analyzer_questions) ? d.best_analyzer_questions.map((q: any) => ({
            question: typeof q.question === "string" ? q.question : String(q.question || ""),
            response: typeof q.response === "string" ? q.response : String(q.response || "")
          })) : [],
          vertical_specific_signals: Array.isArray(d.vertical_specific_signals) ? d.vertical_specific_signals.map(String) : [],
          environment_modules: Array.isArray(d.environment_modules)
            ? d.environment_modules
                .filter((m: unknown) => m && typeof m === "object")
                .map((m: any) => ({
                  module: typeof m.module === "string" ? m.module : String(m.module || ""),
                  finding: typeof m.finding === "string" ? m.finding : String(m.finding || ""),
                }))
            : [],
        };
      })()
    } : {}),
  };
}

export function fallbackExtractionSignals(reason: string): ExtractionSignals {
  return {
    headline: "",
    cta: "",
    primary_message: "",
    visual_elements: ["creative_asset"],
    dominant_colors: [],
    text_density: "moderate",
    layout_structure: `Fallback extraction used: ${reason}`,
    brand_presence: "moderate",
    emotional_cues: [],
    readability: "moderate",
    hierarchy_observations: "Layout hierarchy inferred without OCR text extraction.",
    trust_markers: [],
    urgency_signals: [],
    audience_clues: [],
  };
}

export async function normalizeImageForVision(buffer: Buffer): Promise<{ mimeType: "image/png"; base64: string; width: number; height: number }> {
  const oriented = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await oriented.metadata();

  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;
  const maxVisionEdge = 2048;
  const shouldDownscale = originalWidth > maxVisionEdge || originalHeight > maxVisionEdge;
  const shouldUpscale = !shouldDownscale && originalWidth > 0 && originalWidth < 900;

  let transformed = oriented.clone();
  if (shouldDownscale) {
    transformed = transformed.resize({
      width: maxVisionEdge,
      height: maxVisionEdge,
      fit: "inside",
      withoutEnlargement: true,
    });
  } else if (shouldUpscale) {
    transformed = transformed.resize({ width: 900, withoutEnlargement: false });
  }

  const png = await transformed.png({ compressionLevel: 6 }).toBuffer();

  return {
    mimeType: "image/png",
    base64: png.toString("base64"),
    width: originalWidth,
    height: originalHeight,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function buildGoalPromptSection(platform: PlatformContext, goal: CampaignGoal, vertical: string): string {
  if (platform === "meta_ads") return buildMetaGoalPromptSection(goal, vertical);
  if (platform === "programmatic") return buildProgrammaticGoalPromptSection(goal, vertical);
  return buildGoogleGoalPromptSection(goal, vertical);
}

export function buildExtractionSystemPrompt(
  platform: PlatformContext,
  goal: CampaignGoal,
  vertical: string,
  campaignBrief?: string,
): string {
  const analyzerPlatform = platform as AnalyzerPlatform;
  const briefSection = campaignBrief?.trim()
    ? buildCampaignBriefSystemPromptSection(analyzerPlatform, goal, vertical, campaignBrief)
    : "";
  return [
    ADIGATOR_ANALYZER_IDENTITY,
    STRICT_ANALYZER_RULES,
    EXTRACTION_SYSTEM_PROMPT,
    buildActivePlatformBrainPrompt(analyzerPlatform),
    buildGoalPromptSection(platform, goal, vertical),
    briefSection,
    buildFinalValidationChecklist(analyzerPlatform, goal, vertical, Boolean(campaignBrief?.trim())),
  ].filter(Boolean).join("\n\n");
}

export function applyPlatformToneGuard(
  platform: PlatformContext,
  analysis: AIAnalysisOutput | null,
  goal: CampaignGoal,
  vertical: string,
): AIAnalysisOutput | null {
  if (!analysis) return null;
  const guarded = enforcePlatformFeedbackTone({
    platform: platform as AnalyzerPlatform,
    goal,
    vertical,
    expert_insight: analysis.expert_insight,
    goal_feedback: analysis.goal_feedback,
    vertical_feedback: analysis.vertical_feedback,
    issues: analysis.issues,
  });
  return { ...analysis, issues: guarded.issues ?? analysis.issues };
}
export async function extractSignalsWithRetry(params: {
  openai: OpenAI;
  mimeType: "image/png";
  base64: string;
  extractionUserPrompt: string;
  systemPrompt: string;
}): Promise<{ parsed: Record<string, unknown>; meta: ExtractionMeta; aiAnalysis: AIAnalysisOutput | null }> {
  const { openai, mimeType, base64, extractionUserPrompt, systemPrompt } = params;
  let lastError: Error | null = null;
  let timedOut = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const completion = await withTimeout(
        openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o",
          max_tokens: 2800,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: "high",
                  },
                },
                { type: "text", text: extractionUserPrompt },
              ],
            },
          ],
        }),
        20000,
        "OpenAI vision extraction"
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new Error("No extraction output from model");
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const extraction = normalizeExtraction(parsed);
      const extractedText = [extraction.headline, extraction.primary_message, extraction.cta]
        .filter((text) => typeof text === "string" && text.trim().length > 0)
        .join(" ")
        .trim();

      return {
        parsed,
        aiAnalysis: normalizeAIAnalysis(parsed),
        meta: {
          ocr_failed: false,
          ocr_error: null,
          extracted_text: extractedText,
          cta_text: extraction.cta?.trim() ? extraction.cta : "unavailable",
          retry_count: attempt - 1,
          timed_out: false,
          text_available: extractedText.length > 0,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown OCR extraction error");
      lastError = err;
      timedOut = timedOut || /timed out/i.test(err.message);
      console.error("[ocr] extraction attempt failed", {
        attempt,
        error: err.message,
        stack: err.stack,
      });
    }
  }

  const fallbackMeta: ExtractionMeta = {
    ocr_failed: true,
    ocr_error: lastError?.message || "OCR extraction failed",
    extracted_text: "",
    cta_text: "unavailable",
    retry_count: 1,
    timed_out: timedOut,
    text_available: false,
  };

  return {
    parsed: fallbackExtractionSignals(fallbackMeta.ocr_error || "OCR extraction failed") as unknown as Record<string, unknown>,
    aiAnalysis: null,
    meta: fallbackMeta,
  };
}
const EXTRACTION_SYSTEM_PROMPT = `## CORE ANALYSIS RULES (platform-specific brain is injected separately — obey ONLY the active platform block)

1. Analyze using the user's selected Platform, Campaign Goal, and Industry Vertical — never generic advice.
2. Check platform fit, goal alignment, and vertical match independently and together.
3. Behave like a human strategist: name specific elements, state the problem, prescribe the fix.
4. Score strictly — high scores must be earned with visible evidence.
5. Never hallucinate — only describe what is visible in the image.
6. Apply the ACTIVE platform scoring lens from the injected platform brain (Google ≠ Meta ≠ Programmatic).

## SCORING SYSTEM

Return scores as integers from 0 to 100.

Score Dimensions (interpret through ACTIVE platform brain):
- visualImpact: Platform-appropriate attention capture (Google=intent scan clarity, Meta=thumb-stop, Programmatic=banner standout)
- ctaStrength: Clarity and urgency of CTA for this platform and goal (0=no CTA, 50=generic CTA, 100=goal-aligned dominant CTA)
- brandClarity: Brand identity clarity at platform-appropriate recognition speed
- platformFitScore: Fit to ACTIVE platform norms only (never score as if on a different platform)
- audienceRelevance: Connection to vertical + goal audience on this platform

Overall Score Formula:
overallScore = (visualImpact × 0.20) + (ctaStrength × 0.25) + (brandClarity × 0.20) + (platformFitScore × 0.20) + (audienceRelevance × 0.15)

Apply heavy penalties:
- If verticalMatch = false → subtract 25 points from overallScore
- If goalMatch = false → subtract 20 points from overallScore
- If platformFit = false → subtract 15 points from overallScore
- If briefAlignment.creativeMatchesBrief = false → subtract 30 points from overallScore
- If briefAlignment.goalSettingsMismatch = true → subtract 15 points from overallScore

## CAMPAIGN BRIEF VALIDATION (when Client Brief is provided in user message)

The brief is the **primary validation authority**. Evaluate creative and settings against it before generic goal/vertical heuristics.

Brief validation steps:
1. Parse brief for: product/subject, audience, offer, tone, mandatory elements, implied objective, implied industry.
2. Compare creative visuals and copy to each brief requirement.
3. Compare selected Campaign Goal to brief objective — flag goalSettingsMismatch if they conflict.
4. Compare selected Industry Vertical to brief context — flag verticalSettingsMismatch if they conflict.
5. Assess ACTIVE platform delivery fit for brief requirements (Google=intent/clarity, Meta=thumb-stop/emotion, Programmatic=banner scan/viewability).

When brief is absent, set briefAlignment fields to null/false flags and briefSummary explaining brief was not provided.

Status Thresholds:
- Approved → overallScore ≥ 75
- Needs Improvement → overallScore 40–74
- Rejected → overallScore < 40

## MISMATCH DETECTION RULES

Vertical Mismatch: If the creative does not visually belong to the selected industry vertical, set verticalMatch: false and state what the creative actually appears to represent. Name the detected category explicitly (e.g. "Consumer Products", "Fashion Apparel", "Technology SaaS") — never soften a clear mismatch.

Creative Category Detection (mandatory):
- Identify the literal product/service category shown (creativeCategory) independent of the selected vertical.
- If the creative shows consumer packaged goods, household products, appliances, or generic retail products while vertical is Fashion, set verticalMatch: false and creativeCategory: "Consumer Products".
- Provide suggestedVertical as the campaign vertical this creative actually belongs to (e.g. ecommerce, fashion, technology).
Goal Mismatch: If the creative lacks the key elements required for the selected campaign goal, set goalMatch: false and state what is missing.
Platform Mismatch: If the creative format, style, or structure does not suit the selected platform, set platformFit: false.

## INDUSTRY VERTICAL DETECTION GUIDE

Use these signals to confirm or dispute the declared vertical. Only confirm what is visually and textually present.

- Healthcare: Medical imagery (stethoscope, hospital, pills, doctors), wellness/health symbols, clinical settings, patient-focused messaging, health app UI, pharmaceutical branding
- Technology: Devices (laptops, phones, tablets), software UIs, product dashboards, tech company branding, code/data visuals, innovation/AI messaging, free trial or demo CTAs
- Automotive: Cars, bikes, trucks, vehicle interiors, roads, speed/performance visuals, dealership branding, EV charging, automotive logos
- News/Media: Headlines, newspaper layouts, broadcast graphics, news anchor imagery, breaking news visuals, editorial photography
- Sports: Athletes, stadiums, sports equipment, team jerseys, live action sports photography, score graphics, sports brand logos
- Business/Finance: Corporate imagery, charts/graphs, office settings, finance app UI, professional headshots, B2B messaging, ROI/revenue language
- Luxury: Premium aesthetics, high-end product photography, gold/black/white palette, exclusive language, fashion/jewelry/watches, aspirational lifestyle
- Travel: Destinations, landscapes, airports, luggage, travel photography, booking/flight visuals, passport imagery, hotel exteriors
- Hotels: Hotel room/lobby/pool photography, hospitality branding, room service, hotel exterior, resort amenities
- Restaurants/Food: Food photography, restaurant interiors, chefs, plating/cuisine visuals, menu items, delivery app UIs, beverage imagery
- Banking/FinTech: Bank cards, mobile banking UI, money/currency, financial logos, loan/savings messaging, secure payment visuals
- Real Estate: Property photos (interior/exterior), floor plans, agent branding, For Sale/Rent messaging, home features, location maps
- Education/EdTech: Students, classrooms, learning platforms UI, books, certificates, course imagery, university/school branding
- Gaming: Game characters, controllers, gaming setup, high-energy visuals, esports imagery, game logo/UI, dark/neon aesthetics
- Entertainment/OTT: Movie/show posters, streaming platform UI, actors/content stills, binge-watching scenarios, OTT app screenshots
- E-commerce/Retail: Product photography, shopping cart UI, pricing labels, discount badges, online store layouts, packaging shots
- Fashion: Models wearing clothing, runway/editorial photography, clothing/accessories close-ups, lookbook layouts, designer logos, "new collection" or "new arrival" messaging, seasonal campaign visuals, fashion brand identity (clean high-contrast photography, aspirational body language, style-forward typography)

## HUMAN-LIKE ANALYSIS GUIDELINES

Think like a senior strategist, but frame every insight through the ACTIVE platform brain injected above:
- Google: intent, clarity, CTA/offer, search-user readiness — not social scroll language.
- Meta: emotion, thumb-stop, shareability, social-native — not keyword/search language.
- Programmatic: banner scan speed, viewability, publisher clutter — not Reels/Instagram language.

## PLATFORM DYNAMIC EVALUATION

Goal-specific rules and metrics are in the ACTIVE PLATFORM + ACTIVE CAMPAIGN GOAL sections injected above.
Populate ONLY the matching dynamic_eval block (google_ads_dynamic_eval OR meta_ads_dynamic_eval OR programmatic_ads_dynamic_eval).

## RESPONSE FORMAT

Return a single valid JSON object with EXACTLY this structure — no markdown, no backticks, no preamble:

{
  "overallScore": <integer 0-100>,
  "verticalMatch": <true|false>,
  "creativeCategory": "<granular category label e.g. Consumer Products, Fashion Apparel, Technology SaaS>",
  "suggestedVertical": "<healthcare|technology|automotive|fashion|ecommerce|food|...|unknown>",
  "goalMatch": <true|false>,
  "platformFit": <true|false>,
  "status": "<Approved|Needs Improvement|Rejected>",
  "scores": {
    "visualImpact": <0-100>,
    "ctaStrength": <0-100>,
    "brandClarity": <0-100>,
    "platformFitScore": <0-100>,
    "audienceRelevance": <0-100>
  },
  "issues": [
    { "type": "<error|warning|info>", "message": "<specific actionable feedback>" }
  ],
  "verticalFeedback": "<one specific sentence: vertical match for ACTIVE platform only — name industry signals seen>",
  "goalFeedback": "<one specific sentence: goal optimization for ACTIVE platform only — cite CTA/offer/hook evidence>",
  "expertInsight": "<2-3 sentences: human strategist tone, ACTIVE platform vocabulary only, references goal + vertical + brief when provided, predicts performance — never generic>",
  "briefAlignment": {
    "creativeMatchesBrief": <true|false|null — null if no brief provided>,
    "briefMatchScore": <integer 0-100|null>,
    "briefSummary": "<2-3 sentences: holistic brief compliance verdict>",
    "alignedElements": ["<brief requirement visibly met — be specific>"],
    "misalignedElements": [
      {
        "element": "<headline|visual|CTA|offer|audience|tone|product|brand>",
        "briefExpectation": "<what the brief requires>",
        "creativeReality": "<what the creative actually shows>",
        "severity": "<critical|moderate|minor>"
      }
    ],
    "missingFromCreative": ["<required brief element absent>"],
    "unexpectedInCreative": ["<creative element that contradicts brief>"],
    "goalSettingsMismatch": <true|false|null>,
    "briefImpliedGoal": "<awareness|consideration|conversion|traffic|lead_generation|engagement|app_installs|retargeting|null>",
    "goalConflictExplanation": "<if selected goal conflicts with brief, explain what is wrong and why — else empty string>",
    "verticalSettingsMismatch": <true|false|null>,
    "briefImpliedVertical": "<healthcare|technology|automotive|fashion|ecommerce|finance|banking|travel|hotels|food|luxury|real_estate|education|gaming|entertainment|sports|fitness|news_media|null>",
    "verticalConflictExplanation": "<if vertical setting conflicts with brief, explain — else empty string>",
    "platformRequirementsStatus": "<aligned|partially_aligned|misaligned>",
    "platformFindings": ["<ACTIVE platform-specific brief compliance finding>"],
    "briefFeedback": "<detailed paragraph: brief-grounded analysis with evidence from creative>",
    "recommendations": ["<specific actionable fix tied to a brief mismatch — max 5>"]
  },
  "signals": {
    "creative_type_hint": "<product_hero|lifestyle|ugc|corporate|offer_promotional|testimonial|animated|minimalist|text_heavy|hybrid>",
    "composition_notes": "<string>",
    "headline": "<string>",
    "cta": "<string>",
    "primary_message": "<string>",
    "visual_elements": ["<string>"],
    "dominant_colors": ["<string>"],
    "text_density": "<low|moderate|high>",
    "layout_structure": "<string>",
    "brand_presence": "<low|moderate|high>",
    "emotional_cues": ["<string>"],
    "readability": "<low|moderate|high>",
    "hierarchy_observations": "<string>",
    "trust_markers": ["<string>"],
    "urgency_signals": ["<string>"],
    "audience_clues": ["<string>"],
    "inferred_vertical": "<healthcare|technology|automotive|news_media|sports|fitness|finance|luxury|travel|hotels|food|banking|real_estate|education|gaming|entertainment|ecommerce|fashion|unknown>"
  },
  "google_ads_dynamic_eval": {
    "campaign_goal_focus": "<string>",
    "purpose": "<string>",
    "detected_signals": ["<string>"],
    "missing_signals": ["<string>"],
    "avoided_elements_found": ["<string>"],
    "metrics": [
      { "label": "<string>", "score": <0-100> }
    ],
    "best_analyzer_questions": [
      { "question": "<string>", "response": "<string>" }
    ],
    "vertical_specific_signals": ["<string>"]
  },
  "meta_ads_dynamic_eval": {
    "campaign_goal_focus": "<string>",
    "purpose": "<string>",
    "detected_signals": ["<string>"],
    "missing_signals": ["<string>"],
    "avoided_elements_found": ["<string>"],
    "metrics": [
      { "label": "<string>", "score": <0-100> }
    ],
    "best_analyzer_questions": [
      { "question": "<string>", "response": "<string>" }
    ],
    "vertical_specific_signals": ["<string>"]
  },
  "programmatic_ads_dynamic_eval": {
    "campaign_goal_focus": "<string>",
    "purpose": "<string>",
    "detected_signals": ["<string>"],
    "missing_signals": ["<string>"],
    "avoided_elements_found": ["<string>"],
    "metrics": [
      { "label": "<string>", "score": <0-100> }
    ],
    "best_analyzer_questions": [
      { "question": "<string>", "response": "<string>" }
    ],
    "vertical_specific_signals": ["<string>"],
    "environment_modules": [
      { "module": "<Banner Blindness Detection|Viewability Optimization|Publisher Environment Compatibility|Display Readability|Motion Efficiency (Video/HTML5)|Ad Fatigue Risk>", "finding": "<string>" }
    ]
  }
}

Note: Output ONLY the platform-specific block that matches the platform being analyzed.
- If platform is Google Ads → include "google_ads_dynamic_eval" only
- If platform is Meta Ads → include "meta_ads_dynamic_eval" only
- If platform is Programmatic → include "programmatic_ads_dynamic_eval" only (with all 6 environment_modules)

Issue severity guide:
- error: Critical problem for this platform + goal (wrong vertical, missing CTA on conversion, unreadable at display scan speed)
- warning: Significant platform-specific issue (use ACTIVE platform framing in every message)
- info: Optimization opportunity with a concrete change

Every issue.message must be platform-specific and non-generic. Forbidden phrases in issues: "creative looks good", "CTA can improve", "audience unclear" without specifics.

Minimum 2 issues per creative. Maximum 6 issues. Name the element, describe the problem, suggest the fix using ACTIVE platform logic only.`;
