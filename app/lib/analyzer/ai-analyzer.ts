/**
 * ACIE v5.0 — Module 4: AI Analyzer
 *
 * Calls OpenAI ONLY after vision, OCR, and funnel heuristics are complete.
 * The model receives structured signals — not raw pixels or raw text.
 *
 * Why structured input matters:
 * When GPT sees "urgencyWords: ['now', 'limited'], funnelStage: 'conversion (76%)',
 * ctaPhrase: 'Buy Now', price: '$29.99'" it reasons far more accurately than
 * if given raw "BUY NOW ONLY $29.99 LIMITED TIME".
 */

import OpenAI from "openai";
import type { VisionMetrics, OCRStructure, FunnelHints, AIAnalysis } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED INPUT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildStructuredInput(
  vision: VisionMetrics,
  ocr: OCRStructure,
  funnel: FunnelHints,
  goal?: string
): string {
  return JSON.stringify(
    {
      goal_context: goal || funnel.dominantStage,

      // Vision signals — what the image physically looks like
      vision_signals: {
        brightness: vision.brightness,
        contrast: vision.contrastLevel,
        visual_clutter_score: vision.visualClutterScore,
        layout_balance: vision.layoutBalance,
        whitespace_ratio: vision.whitespaceRatio,
        text_coverage_percent: vision.textAreaPercentage,
        edge_density: vision.edgeDensity,
        face_detected: vision.faceDetected,
        face_count: vision.faceCount,
        dominant_colors: vision.dominantColors.slice(0, 3).map((c) => c.hex),
        focal_point: vision.focalPointPosition,
        image_dimensions: `${vision.width}x${vision.height}`,
        aspect_ratio: vision.aspectRatio,
      },

      // OCR signals — structured semantic fields from the ad text
      ocr_signals: {
        headline: ocr.headline,
        subheadline: ocr.subheadline,
        cta_phrase: ocr.ctaPhrase,
        brand_name: ocr.brandName,
        price: ocr.price,
        discount: ocr.discount,
        word_count: ocr.wordCount,
        urgency_words: ocr.urgencyWords,
        emotional_words: ocr.emotionalWords,
        benefit_words: ocr.benefitWords,
        trust_words: ocr.trustWords,
        feature_words: ocr.featureWords,
        comparison_words: ocr.comparisonWords,
      },

      // Funnel classification — pre-computed from heuristics
      funnel_classification: {
        dominant_stage: funnel.dominantStage,
        probabilities: funnel.probabilities,
        confidence: funnel.confidence,
        signals_fired: funnel.signals.length,
        top_signals: funnel.signals.slice(0, 5),
      },
    },
    null,
    2
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior creative performance analyst specializing in paid advertising.

You receive structured signals extracted from an ad creative: vision metrics, OCR semantic fields, and heuristic funnel classification.

Your job is to produce strategic reasoning about the creative's performance potential.

IMPORTANT CONSTRAINTS:
- You are NOT analyzing raw pixels or images. You have pre-extracted structured data.
- Your scores must be consistent with the signals provided. Do not contradict the data.
- If visualClutterScore > 0.7, cognitiveLoad must be at least 60.
- If price is null and discount is null, conversionReadiness must reflect that lack.
- Be specific. Do not use vague terms like "could be improved."

OUTPUT: Return ONLY a valid JSON object in this exact schema:
{
  "likelyObjective": "string",
  "audienceIntent": "string",
  "messageClarity": 0-100,
  "ctaStrength": 0-100,
  "trustLevel": 0-100,
  "cognitiveLoad": 0-100,
  "emotionalAppeal": 0-100,
  "offerClarity": 0-100,
  "brandVisibility": 0-100,
  "creativeWeaknesses": ["string"],
  "optimizationSuggestions": ["string"],
  "explanation": "string",
  "confidence": 0.0-1.0
}`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function runAIAnalysis(
  vision: VisionMetrics,
  ocr: OCRStructure,
  funnel: FunnelHints,
  goal?: string
): Promise<AIAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("[AIAnalyzer] OPENAI_API_KEY not configured");

  const client = new OpenAI({ apiKey });
  const structuredInput = buildStructuredInput(vision, ocr, funnel, goal);

  console.log("[AIAnalyzer] Sending structured signals to OpenAI...");

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2, // Low temperature: we want consistent analytical output
    response_format: { type: "json_object" },
    max_tokens: 1200,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this ad creative based on the following structured signals:\n\n${structuredInput}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("[AIAnalyzer] Empty response from OpenAI");

  const parsed = JSON.parse(content);

  // Safe hydration with defaults to prevent downstream type errors
  const result: AIAnalysis = {
    likelyObjective:       parsed.likelyObjective || "Unknown",
    audienceIntent:        parsed.audienceIntent || "Unknown",
    messageClarity:        clamp(Number(parsed.messageClarity ?? 50)),
    ctaStrength:           clamp(Number(parsed.ctaStrength ?? 50)),
    trustLevel:            clamp(Number(parsed.trustLevel ?? 50)),
    cognitiveLoad:         clamp(Number(parsed.cognitiveLoad ?? 50)),
    emotionalAppeal:       clamp(Number(parsed.emotionalAppeal ?? 50)),
    offerClarity:          clamp(Number(parsed.offerClarity ?? 50)),
    brandVisibility:       clamp(Number(parsed.brandVisibility ?? 50)),
    creativeWeaknesses:    Array.isArray(parsed.creativeWeaknesses) ? parsed.creativeWeaknesses : [],
    optimizationSuggestions: Array.isArray(parsed.optimizationSuggestions) ? parsed.optimizationSuggestions : [],
    explanation:           parsed.explanation || "",
    confidence:            Math.min(1, Math.max(0, Number(parsed.confidence ?? 0.7))),
  };

  console.log(`[AIAnalyzer] Complete. clarity=${result.messageClarity} cta=${result.ctaStrength} trust=${result.trustLevel}`);

  return result;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, isNaN(v) ? 50 : v)));
}
