import sharp from "sharp";
import { createOpenAIClient } from "@/app/lib/engines/creativeExtraction";
import { VIDEO_ANALYSIS_SCORE_KEYS } from "@/app/lib/video/videoSpecs";
import {
  validateVideoForPlatforms,
  type VideoMetadataInput,
} from "@/app/lib/video/videoValidation";

export interface VideoFrameInput {
  timeLabel: string;
  buffer: Buffer;
  mimeType?: string;
}

export interface TimestampedIssue {
  time: string;
  issue: string;
  severity: "Low" | "Medium" | "High";
  suggestion: string;
}

export interface VideoAnalysisOutput {
  validation_results: Record<string, { pass: boolean; errors: string[] }>;
  analysis_report: Record<string, number>;
  timestamped_issues: TimestampedIssue[];
  recommendations: string[];
  final_score: number;
  estimated_token_usage: number;
  estimated_usd_cost: string;
  media_type: "video";
}

const VIDEO_JSON_SHAPE = `Required JSON shape:
{
  "validation_results": {
    "<Platform>": { "pass": true, "errors": [] }
  },
  "analysis_report": {
    "campaign_goal_alignment": 0,
    "vertical_alignment": 0,
    "brief_alignment": 0,
    "brand_visibility": 0,
    "cta_analysis": 0,
    "text_readability": 0,
    "visual_quality": 0,
    "audio_quality": 0,
    "hook_strength": 0,
    "message_clarity": 0,
    "product_visibility": 0,
    "scene_flow": 0,
    "engagement_potential": 0,
    "platform_compliance": 0,
    "accessibility": 0,
    "pacing": 0,
    "risk_detection": 0,
    "final_launch_readiness_score": 0
  },
  "timestamped_issues": [
    { "time": "00:03", "issue": "...", "severity": "Medium", "suggestion": "..." }
  ],
  "recommendations": ["..."],
  "final_score": 0,
  "estimated_token_usage": 0,
  "estimated_usd_cost": ""
}`;

const VIDEO_COMMON_RULES = `Rules:
- Score every analysis_report field from 0-100.
- Analyze the hook (first 3-5s), storytelling, scene flow, pacing, message clarity, CTA, on-screen text readability, subtitle/caption presence, brand & logo & product visibility, visual quality, and estimated audio/voice/music quality.
- Note timestamped issues with MM:SS time labels matching the provided frames (e.g. weak hook, CTA too small, logo disappears, text hard to read, CTA appears too late).
- Keep recommendations short and actionable.
- estimated_usd_cost may be blank if unknown.
- This is a VIDEO ad. Never reference banner sizes, Responsive Display Ads, image dimensions, or display placement rules.`;

function buildMetaVideoSystemPrompt() {
  return `You are a senior Meta Ads (Facebook/Instagram) VIDEO creative QA analyst.
Evaluate the video against official Meta video guidance for Feed, Stories, and Reels, then return JSON only.

${VIDEO_JSON_SHAPE}

Meta video guidance:
- Container: MP4 or MOV, H.264 video + AAC audio; max 4GB.
- Aspect ratios: Feed 1:1 or 4:5, Stories/Reels 9:16 (full-screen vertical).
- Reels/Stories duration <= 60s; Feed/in-stream can be longer.
- Respect vertical safe zones (top ~250px / bottom ~300px on 1080x1920) so text/CTA/logo are not clipped by UI.
- Sound-on optional: recommend captions/subtitles for muted auto-play.

${VIDEO_COMMON_RULES}
- Use "Meta" as the key inside validation_results.`;
}

function buildGoogleVideoSystemPrompt() {
  return `You are a senior Google Ads / YouTube VIDEO creative QA analyst.
Evaluate the video against official Google/YouTube video guidance for skippable, non-skippable, and in-feed video ads, then return JSON only.

${VIDEO_JSON_SHAPE}

Google/YouTube video guidance:
- Container: MP4 (H.264) recommended, also WebM; very high max file size.
- Aspect ratios: 16:9 standard, 9:16 for Shorts/vertical, 1:1 supported.
- Non-skippable ads <= 60s; skippable ads recommended under 3 minutes.
- Strong branding and a clear CTA early; front-load the hook because viewers can skip after 5s.
- Recommend captions for accessibility and muted viewing.

${VIDEO_COMMON_RULES}
- Use "Google" as the key inside validation_results.`;
}

function buildProgrammaticVideoSystemPrompt() {
  return `You are a senior Programmatic / open-web VIDEO creative QA analyst (VAST in-stream, out-stream, and CTV-friendly packs).
Evaluate the video against programmatic exchange expectations, then return JSON only.

${VIDEO_JSON_SHAPE}

Programmatic video guidance:
- Container: MP4 (H.264 + AAC) preferred for broad DSP/SSP acceptance; WebM optionally for some buyers.
- Aspect ratios: 16:9 for classic in-stream, 9:16 for vertical/out-stream, 1:1 and 4:5 where supported.
- Prefer 15s or 30s for standard in-stream; keep under 120s for broader package acceptance.
- Keep on-screen text and CTA away from player chrome; plan companion banners (300x250 / 728x90) when the buy requires them.
- Front-load the hook; many environments auto-play muted — captions matter.
- Never grade against Meta Reels safe zones or YouTube-only skip rules unless the campaign explicitly targets those environments.

${VIDEO_COMMON_RULES}
- Use "Programmatic" as the key inside validation_results.`;
}

/** Dynamic prompt routing: each ad platform gets its own video QA brain. */
function buildVideoSystemPrompt(platform: string) {
  if (platform === "google_ads") return buildGoogleVideoSystemPrompt();
  if (platform === "programmatic") return buildProgrammaticVideoSystemPrompt();
  return buildMetaVideoSystemPrompt();
}

async function normalizeFrame(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1280, height: 720, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
}

function clampScore(value: unknown, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeSeverity(value: unknown): TimestampedIssue["severity"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  return "Medium";
}

export function normalizeVideoAnalysisPayload(raw: Record<string, unknown>): VideoAnalysisOutput {
  const analysis_report: Record<string, number> = {};
  const rawReport =
    raw.analysis_report && typeof raw.analysis_report === "object"
      ? (raw.analysis_report as Record<string, unknown>)
      : {};

  VIDEO_ANALYSIS_SCORE_KEYS.forEach((key) => {
    analysis_report[key] = clampScore(rawReport[key], 0);
  });

  const timestamped_issues = Array.isArray(raw.timestamped_issues)
    ? raw.timestamped_issues
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const row = item as Record<string, unknown>;
          return {
            time: String(row.time || "00:00"),
            issue: String(row.issue || ""),
            severity: normalizeSeverity(row.severity),
            suggestion: String(row.suggestion || ""),
          };
        })
        .filter((item) => item.issue)
    : [];

  const recommendations = Array.isArray(raw.recommendations)
    ? raw.recommendations.filter((item): item is string => typeof item === "string")
    : [];

  const validation_results =
    raw.validation_results && typeof raw.validation_results === "object"
      ? Object.fromEntries(
          Object.entries(raw.validation_results as Record<string, unknown>).map(([key, value]) => {
            const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
            const errors = Array.isArray(row.errors)
              ? row.errors.filter((item): item is string => typeof item === "string")
              : [];
            return [key, { pass: Boolean(row.pass), errors }];
          }),
        )
      : {};

  return {
    validation_results,
    analysis_report,
    timestamped_issues,
    recommendations,
    final_score: clampScore(raw.final_score, analysis_report.final_launch_readiness_score || 0),
    estimated_token_usage: clampScore(raw.estimated_token_usage, 0),
    estimated_usd_cost: String(raw.estimated_usd_cost || ""),
    media_type: "video",
  };
}

export async function runVideoCreativeAnalysis({
  frames,
  metadata,
  goal,
  platform,
  vertical,
  campaignBrief,
  campaignProductFocus,
  landingUrl,
}: {
  frames: VideoFrameInput[];
  metadata: VideoMetadataInput;
  goal: string;
  platform: string;
  vertical: string;
  campaignBrief?: string;
  campaignProductFocus?: string;
  landingUrl?: string;
}): Promise<VideoAnalysisOutput> {
  // Validate against the SELECTED platform's official video spec (independent Google/Meta/Programmatic rules).
  const targetPlatforms: Array<"meta_ads" | "google_ads" | "programmatic"> =
    platform === "google_ads"
      ? ["google_ads"]
      : platform === "programmatic"
        ? ["programmatic"]
        : ["meta_ads"];
  const deterministic = validateVideoForPlatforms(metadata, targetPlatforms);
  const openai = createOpenAIClient();
  if (!openai) {
    throw new Error("OpenAI is not configured for video analysis.");
  }
  if (!frames.length) {
    throw new Error("At least one video frame is required for analysis.");
  }

  const normalizedFrames = await Promise.all(
    frames.map(async (frame) => ({
      timeLabel: frame.timeLabel,
      buffer: await normalizeFrame(frame.buffer),
    })),
  );

  const userText = [
    `Campaign objective: ${goal || "video_views"}`,
    `Primary platform: ${platform || "meta_ads"}`,
    `Vertical: ${vertical || "unknown"}`,
    `Campaign brief: ${campaignBrief?.trim() || "Not provided"}`,
    `Product focus: ${campaignProductFocus?.trim() || "Not provided"}`,
    `Landing URL: ${landingUrl?.trim() || "Not provided"}`,
    `Video metadata: ${metadata.width}x${metadata.height}, ${metadata.durationSeconds}s, ${metadata.mimeType}, ${metadata.fileSizeBytes} bytes`,
    `Frames provided: ${normalizedFrames.map((frame) => frame.timeLabel).join(", ")}`,
    "Analyze the full video using the provided key frames and output the required JSON.",
  ].join("\n");

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    max_tokens: 2800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildVideoSystemPrompt(platform) },
      {
        role: "user",
        content: [
          ...normalizedFrames.map((frame) => ({
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame.buffer.toString("base64")}`,
              detail: "low" as const,
            },
          })),
          { type: "text" as const, text: userText },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const normalized = normalizeVideoAnalysisPayload(parsed);

  // Deterministic platform validation is authoritative and overrides any model-provided results.
  normalized.validation_results = {
    ...normalized.validation_results,
    ...deterministic,
  };

  normalized.estimated_token_usage =
    normalized.estimated_token_usage || response.usage?.total_tokens || 0;

  return normalized;
}

export interface VideoStrategicContext {
  goal?: string;
  vertical?: string;
  campaignBrief?: string;
}

/** Turn a 0-100 video sub-score into the alignment object shape the analyzer UI consumes. */
function scoreToAlignment(score: number, reason: string) {
  const value = Number.isFinite(score) ? score : 0;
  const isAligned = value >= 70 ? true : value >= 45 ? null : false;
  return { isAligned, value, reason };
}

export function mapVideoAnalysisToStrategicPayload(
  videoAnalysis: VideoAnalysisOutput,
  creativeName = "Video creative",
  context: VideoStrategicContext = {},
) {
  const report = videoAnalysis.analysis_report;

  const goalScore = scoreToAlignment(
    report.campaign_goal_alignment,
    `Video ${report.campaign_goal_alignment >= 70 ? "supports" : report.campaign_goal_alignment >= 45 ? "partially supports" : "does not clearly support"} the ${context.goal || "campaign"} objective (score ${report.campaign_goal_alignment}/100).`,
  );
  const verticalScore = scoreToAlignment(
    report.vertical_alignment,
    `Video content ${report.vertical_alignment >= 70 ? "matches" : report.vertical_alignment >= 45 ? "partially matches" : "does not clearly match"} the ${context.vertical || "selected"} vertical (score ${report.vertical_alignment}/100).`,
  );
  const briefProvided = Boolean(context.campaignBrief?.trim());
  const briefScore = scoreToAlignment(
    report.brief_alignment,
    briefProvided
      ? `Video ${report.brief_alignment >= 70 ? "reflects" : report.brief_alignment >= 45 ? "partially reflects" : "diverges from"} the campaign brief (score ${report.brief_alignment}/100).`
      : "",
  );

  return {
    media_type: "video",
    goal_alignment: {
      is_aligned: goalScore.isAligned,
      selected_goal: context.goal || null,
      detected_goal: context.goal || null,
      fit_score: goalScore.value,
      reason: goalScore.reason,
    },
    vertical_alignment: {
      is_aligned: verticalScore.isAligned,
      selected_vertical: context.vertical || null,
      detected_vertical: context.vertical || null,
      product_category: context.vertical || null,
      fit_score: verticalScore.value,
      reason: verticalScore.reason,
      evidence: [],
    },
    brief_alignment: {
      brief_provided: briefProvided,
      alignment_status: !briefProvided
        ? "not_evaluated"
        : briefScore.isAligned === true
          ? "aligned"
          : briefScore.isAligned === false
            ? "misaligned"
            : "partially_aligned",
      alignment_score: briefProvided ? briefScore.value : null,
      creative_matches_brief: briefProvided ? briefScore.isAligned : null,
      summary: briefScore.reason,
      expected_focus: "",
      is_aligned: briefProvided ? briefScore.isAligned : null,
      reason: briefScore.reason,
    },
    main_strategic_problem:
      videoAnalysis.timestamped_issues[0]?.issue ||
      "Video creative requires optimization before launch.",
    business_consequence:
      videoAnalysis.recommendations[0] ||
      "Launching without addressing video QA issues may reduce performance and increase rework.",
    strategic_alignment_score: {
      value: videoAnalysis.final_score,
      rationale: `Video launch readiness score based on ${creativeName}.`,
    },
    attention_analysis: {
      friction_points: videoAnalysis.timestamped_issues.map((item) => item.issue),
      attention_path: videoAnalysis.recommendations.slice(0, 3),
    },
    strategic_recommendations: videoAnalysis.recommendations.map((message, index) => ({
      issue: message,
      priority: index === 0 ? "High" : "Medium",
      recommendation: message,
    })),
    video_analysis: videoAnalysis,
    ai_analysis: {
      overall_score: videoAnalysis.final_score,
      status:
        videoAnalysis.final_score >= 80
          ? "Approved"
          : videoAnalysis.final_score >= 60
            ? "Needs Improvement"
            : "Rejected",
      scores: {
        visual_impact: report.visual_quality || 0,
        cta_strength: report.cta_analysis || 0,
        brand_clarity: report.brand_visibility || 0,
        platform_fit_score: report.platform_compliance || 0,
        audience_relevance: report.engagement_potential || 0,
      },
      issues: videoAnalysis.timestamped_issues.map((item) => ({
        type: item.severity === "High" ? "error" : "warning",
        message: `${item.time} — ${item.issue}`,
      })),
      expert_insight: videoAnalysis.recommendations.join(" "),
    },
  };
}
