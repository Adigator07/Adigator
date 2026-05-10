/**
 * Adigator v2 — OpenAI-Only Creative Analyzer
 *
 * POST /api/analyze-creative
 *
 * Single OpenAI Vision call replaces the entire old multi-tool pipeline:
 *   Google Vision + OCR + CTA detector + multiple AI services → ONE agent.
 *
 * Input (multipart/form-data):
 *   image    File   — ad creative image
 *   goal     string — "awareness" | "consideration" | "conversion"
 *   vertical string — industry vertical (e.g. "technology", "ecommerce")
 *   platform string — optional platform hint (e.g. "instagram", "display_ads")
 *
 * Output: OpenAIAnalysisResult JSON
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const GOAL_STAGE_RULES: Record<string, string> = {
  awareness: "Awareness creatives should prioritize emotional engagement, brand recall, low CTA pressure, low urgency, minimal information load.",
  consideration: "Consideration creatives should prioritize information clarity, trust signals, comparison support, medium CTA pressure, moderate urgency.",
  conversion: "Conversion creatives should prioritize direct CTA clarity, urgency/scarcity, offer clarity, friction reduction, and high action pressure.",
};

const VERTICAL_DETECTION_HINTS: Record<string, string[]> = {
  healthcare: ["hospital", "clinic", "doctor", "medical", "patient", "wellness", "care", "treatment", "pharma", "health"],
  technology: ["software", "saas", "platform", "cloud", "ai", "app", "tech", "automation", "digital"],
  automotive: ["car", "vehicle", "suv", "sedan", "drive", "engine", "mileage", "test drive", "dealership", "auto"],
  news_media: ["news", "headline", "breaking", "journal", "editorial", "media", "publisher"],
  sports: ["sports", "team", "match", "league", "athlete", "fitness", "score", "stadium"],
  finance: ["finance", "business", "investment", "portfolio", "market", "b2b", "enterprise", "profit", "revenue"],
  luxury: ["luxury", "premium", "exclusive", "craftsmanship", "heritage", "elite", "high-end"],
  travel: ["travel", "destination", "trip", "vacation", "holiday", "flight", "journey", "tour"],
  hotels: ["hotel", "resort", "suite", "booking", "stay", "hospitality", "check-in"],
  food: ["restaurant", "food", "menu", "dining", "meal", "chef", "delivery", "cuisine"],
  banking: ["bank", "fintech", "account", "loan", "credit", "debit", "apy", "secure", "payment", "wallet"],
  real_estate: ["real estate", "property", "home", "mortgage", "apartment", "listing", "broker", "rent"],
  education: ["education", "edtech", "course", "learn", "student", "academy", "school", "training", "certification"],
  gaming: ["game", "gaming", "play", "level", "esports", "console", "battle", "stream"],
  entertainment: ["streaming", "ott", "entertainment", "show", "movie", "series", "music", "watch"],
  ecommerce: ["shop", "store", "cart", "checkout", "sale", "discount", "product", "retail", "buy"],
};

const KNOWN_GOALS = new Set(["awareness", "consideration", "conversion"]);
const KNOWN_VERTICALS = new Set(Object.keys(VERTICAL_DETECTION_HINTS));

function normalizeGoal(goal: string): string {
  const cleaned = (goal || "").toLowerCase().trim();
  return KNOWN_GOALS.has(cleaned) ? cleaned : "awareness";
}

function normalizeVertical(vertical: string): string {
  const cleaned = (vertical || "").toLowerCase().trim();
  return KNOWN_VERTICALS.has(cleaned) ? cleaned : "technology";
}

function buildAlignmentGuidance(goal: string, vertical: string): string {
  const goalRule = GOAL_STAGE_RULES[goal] || GOAL_STAGE_RULES.awareness;
  const verticalHints = VERTICAL_DETECTION_HINTS[vertical] || VERTICAL_DETECTION_HINTS.technology;
  return [
    `Goal logic (from archived intelligence): ${goalRule}`,
    `Vertical detection anchors (from archived intelligence): ${verticalHints.join(", ")}.`,
    "If the detected stage differs from selected goal, mark goal alignment as false.",
    "If the creative's domain/category evidence does not support selected vertical, mark vertical alignment as false.",
  ].join("\n");
}

function inferDetectedVerticalFromText(vertical: string, corpus: string): string {
  const normalizedCorpus = corpus.toLowerCase();
  let bestVertical = vertical;
  let bestScore = -1;

  for (const [candidate, hints] of Object.entries(VERTICAL_DETECTION_HINTS)) {
    const score = hints.reduce((acc, keyword) => (normalizedCorpus.includes(keyword) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestVertical = candidate;
    }
  }

  return bestScore <= 0 ? "unknown" : bestVertical;
}

function buildServerSideAlignment(
  analysis: Record<string, unknown>,
  selectedGoal: string,
  selectedVertical: string
): {
  goal_alignment: Record<string, unknown>;
  vertical_alignment: Record<string, unknown>;
} {
  const detectedGoalRaw = typeof analysis.funnel_stage === "string"
    ? analysis.funnel_stage.toLowerCase().trim()
    : "unknown";
  const detectedGoal = KNOWN_GOALS.has(detectedGoalRaw) ? detectedGoalRaw : "unknown";

  const corpus = [
    typeof analysis.headline === "string" ? analysis.headline : "",
    typeof analysis.primary_message === "string" ? analysis.primary_message : "",
    typeof analysis.target_audience === "string" ? analysis.target_audience : "",
    typeof analysis.brand === "string" ? analysis.brand : "",
    typeof analysis.emotion_trigger === "string" ? analysis.emotion_trigger : "",
    Array.isArray(analysis.visual_elements) ? analysis.visual_elements.join(" ") : "",
  ].join(" ");

  const detectedVertical = inferDetectedVerticalFromText(selectedVertical, corpus);
  const goalAligned = detectedGoal === "unknown" ? false : detectedGoal === selectedGoal;
  const verticalAligned = detectedVertical === "unknown" ? false : detectedVertical === selectedVertical;

  return {
    goal_alignment: {
      selected_goal: selectedGoal,
      detected_goal: detectedGoal,
      is_aligned: goalAligned,
      confidence: goalAligned ? 70 : 60,
      reason: goalAligned
        ? "Creative signals align with selected campaign goal."
        : "Creative signals do not align with selected campaign goal.",
    },
    vertical_alignment: {
      selected_vertical: selectedVertical,
      detected_vertical: detectedVertical,
      is_aligned: verticalAligned,
      confidence: verticalAligned ? 70 : 60,
      reason: verticalAligned
        ? "Creative signals align with selected industry vertical."
        : "Creative signals do not align with selected industry vertical.",
    },
  };
}

const SYSTEM_PROMPT = `You are a Senior Advertising Intelligence Analyst with deep expertise in digital marketing, conversion optimization, and consumer psychology.

You will receive an ad creative image and analyze it using the following 10-step chain-of-thought reasoning:

STEP 1 — Visual Detection
Identify all visual elements: images, icons, product shots, people, backgrounds, color scheme, visual style.

STEP 2 — Text & Messaging Extraction
Extract all visible text: headline, subheadline, body copy, taglines, disclaimers, pricing.

STEP 3 — Brand Recognition
Identify brand name, logo placement, brand colors, visual identity consistency.

STEP 4 — Layout & Hierarchy Analysis
Analyze visual flow, focal point, information hierarchy, white space usage, composition balance.

STEP 5 — CTA Identification
Locate and evaluate the call-to-action: text, button style, placement, urgency, clarity.

STEP 6 — Emotional Psychology Analysis
Identify emotional triggers: fear, desire, aspiration, urgency, social proof, trust signals.

STEP 7 — Audience Targeting
Determine target demographic, psychographic profile, purchase intent signals.

STEP 8 — Platform Optimization
Evaluate creative suitability for Instagram, Facebook, display ads, and native ad placements.

STEP 9 — Conversion Strength Evaluation
Score conversion readiness based on: CTA clarity, value proposition, trust signals, urgency, offer appeal.

STEP 10 — UX Issues Detection + Performance Prediction
Identify clutter, readability issues, mobile optimization, visual noise. Predict performance tier.

After your analysis, respond ONLY with valid JSON matching this exact schema (no markdown, no explanation):

{
  "brand": "detected brand name or empty string",
  "headline": "main headline text or empty string",
  "cta": "call-to-action text or empty string",
  "primary_message": "core value proposition in one sentence",
  "visual_elements": ["list", "of", "detected", "visual", "elements"],
  "emotion_trigger": "primary emotional trigger (e.g. aspiration, urgency, trust, fear)",
  "target_audience": "specific audience description",
  "layout_hierarchy": {
    "attention_flow": "describe how eye moves through the ad",
    "visual_focus": "primary focal point description"
  },
  "platform_fit": {
    "instagram": "excellent|good|fair|poor — brief reason",
    "facebook": "excellent|good|fair|poor — brief reason",
    "display_ads": "excellent|good|fair|poor — brief reason"
  },
  "conversion_score": 0,
  "overall_score": 0,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "subscores": {
    "visual_clarity": 0,
    "message_clarity": 0,
    "cta_strength": 0,
    "brand_presence": 0,
    "emotional_resonance": 0,
    "layout_hierarchy": 0,
    "platform_fit_score": 0,
    "audience_alignment": 0
  },
  "grade": "Elite Creative|Strong Performer|Needs Optimization|High Risk Creative",
  "funnel_stage": "awareness|consideration|conversion",
  "engagement_forecast": "HIGH|MEDIUM|LOW",
  "goal_alignment": {
    "selected_goal": "awareness|consideration|conversion",
    "detected_goal": "awareness|consideration|conversion|unknown",
    "is_aligned": true,
    "confidence": 0,
    "reason": "brief reason"
  },
  "vertical_alignment": {
    "selected_vertical": "healthcare|technology|automotive|news_media|sports|finance|luxury|travel|hotels|food|banking|real_estate|education|gaming|entertainment|ecommerce",
    "detected_vertical": "healthcare|technology|automotive|news_media|sports|finance|luxury|travel|hotels|food|banking|real_estate|education|gaming|entertainment|ecommerce|unknown",
    "is_aligned": true,
    "confidence": 0,
    "reason": "brief reason"
  }
}

All numeric scores must be integers from 0 to 100.
overall_score is the weighted composite: (visual_clarity * 0.2) + (message_clarity * 0.2) + (cta_strength * 0.2) + (emotional_resonance * 0.15) + (brand_presence * 0.1) + (layout_hierarchy * 0.1) + (platform_fit_score * 0.05).
grade must match: overall_score >= 82 → "Elite Creative", >= 70 → "Strong Performer", >= 55 → "Needs Optimization", else → "High Risk Creative".
goal_alignment and vertical_alignment must be evaluated strictly against selected goal and selected vertical.`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const openai = createOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: "Server misconfiguration: OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const goal = normalizeGoal((formData.get("goal") as string) || "awareness");
    const vertical = normalizeVertical((formData.get("vertical") as string) || "technology");
    const platform = (formData.get("platform") as string) || "display_ads";

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Upload an image." }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Image too large. Max 20MB." }, { status: 413 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const alignmentGuidance = buildAlignmentGuidance(goal, vertical);

    const userPrompt = `Analyze this ad creative.

Campaign goal: ${goal}
Industry vertical: ${vertical}
Primary platform: ${platform}

  Alignment logic:
  ${alignmentGuidance}

Apply all 10 analysis steps and return the JSON schema exactly.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
            { type: "text", text: userPrompt },
          ],
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    // Attach meta
    analysis.goal = goal;
    analysis.vertical = vertical;
    analysis.platform = platform;

    const aiGoalAlignment = typeof analysis.goal_alignment === "object" && analysis.goal_alignment !== null
      ? analysis.goal_alignment as Record<string, unknown>
      : null;
    const aiVerticalAlignment = typeof analysis.vertical_alignment === "object" && analysis.vertical_alignment !== null
      ? analysis.vertical_alignment as Record<string, unknown>
      : null;

    const fallbackAlignment = buildServerSideAlignment(analysis, goal, vertical);
    analysis.goal_alignment = {
      ...fallbackAlignment.goal_alignment,
      ...(aiGoalAlignment || {}),
      selected_goal: goal,
    };
    analysis.vertical_alignment = {
      ...fallbackAlignment.vertical_alignment,
      ...(aiVerticalAlignment || {}),
      selected_vertical: vertical,
    };

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("[analyze-creative]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
