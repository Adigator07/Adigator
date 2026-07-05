import fs from "fs";

const src = fs.readFileSync("app/api/analyze-creative/route.ts", "utf8");
const lines = src.split(/\r?\n/);

const header = `/**
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

`;

const idx = (prefix) => lines.findIndex((l) => l.startsWith(prefix));

const chunks = [
  lines.slice(idx("function createOpenAIClient"), idx("function normalizeGoal")),
  lines.slice(idx("function normalizeSignalLevel"), idx("function classifyCtaPressure")),
  lines.slice(idx("async function normalizeImageForVision"), idx("function buildGoalPromptSection")),
  lines.slice(idx("function buildGoalPromptSection"), idx("function applyPlatformToneGuard")),
  lines.slice(idx("function applyPlatformToneGuard"), idx("function mergeProgrammaticAdsDynamicEval")),
  lines.slice(idx("async function extractSignalsWithRetry"), idx("function classifyCtaPressure")),
  lines.slice(idx("const EXTRACTION_SYSTEM_PROMPT")),
];

let body = chunks.map((c) => c.join("\n")).join("\n\n");
body = body
  .replace("function createOpenAIClient", "export function createOpenAIClient")
  .replace("function normalizeExtraction", "export function normalizeExtraction")
  .replace("function normalizeAIAnalysis", "export function normalizeAIAnalysis")
  .replace("function fallbackExtractionSignals", "export function fallbackExtractionSignals")
  .replace("async function normalizeImageForVision", "export async function normalizeImageForVision")
  .replace("function buildExtractionSystemPrompt", "export function buildExtractionSystemPrompt")
  .replace("async function extractSignalsWithRetry", "export async function extractSignalsWithRetry")
  .replace("function applyPlatformToneGuard", "export function applyPlatformToneGuard");

fs.mkdirSync("app/lib/engines", { recursive: true });
fs.writeFileSync("app/lib/engines/creativeExtraction.ts", header + body);
console.log("wrote creativeExtraction.ts");
