/**
 * ACIE v5.0 — Module 4b: CTA Detector
 *
 * Dedicated STRICT engine for detecting Call-To-Action (CTA).
 * Forbids hallucination. Returns strict structured output.
 */

import OpenAI from "openai";
import type { VisionMetrics, OCRStructure, FunnelHints, CTADetectorResult } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED INPUT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildStructuredInput(
  vision: VisionMetrics,
  ocr: OCRStructure,
  funnel: FunnelHints
): string {
  return JSON.stringify(
    {
      vision_signals: {
        focal_point_position: vision.focalPointPosition,
        visual_clutter_score: vision.visualClutterScore,
        whitespace_ratio: vision.whitespaceRatio,
        detected_objects: [], // Reserved for future object detection
        button_like_shapes: false, // Inferred visually, typically from layout
        arrow_or_pointer_detected: false,
      },
      ocr_signals: {
        headline: ocr.headline,
        subheadline: ocr.subheadline,
        text_blocks: [ocr.rawText],
        brand: ocr.brandName,
        price: ocr.price,
        discount: ocr.discount,
        emotional_words: ocr.emotionalWords,
        urgency_words: ocr.urgencyWords,
      },
      audio_transcript: null,
      funnel_hints: {
        awareness_probability: funnel.probabilities.awareness,
        consideration_probability: funnel.probabilities.consideration,
        conversion_probability: funnel.probabilities.conversion,
      },
    },
    null,
    2
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a STRICT Call-To-Action (CTA) Detection Engine for advertising creatives.

You are NOT a copywriter.
You are NOT allowed to invent marketing text.
You ONLY detect CTA based on provided evidence.

---

## CORE MISSION

Determine whether the creative explicitly or implicitly asks the viewer to take an action.

Your job is DETECTION — not generation.

If evidence is missing, CTA MUST be null.

---

## INPUT YOU WILL RECEIVE

vision_signals:
* focal_point_position
* visual_clutter_score
* whitespace_ratio
* detected_objects
* button_like_shapes (true/false)
* arrow_or_pointer_detected (true/false)

ocr_signals:
* headline
* subheadline
* text_blocks[]
* brand
* price
* discount
* emotional_words[]
* urgency_words[]

audio_transcript (optional)

funnel_hints:
* awareness_probability
* consideration_probability
* conversion_probability

---

## CTA DEFINITION (STRICT)

A CTA exists ONLY if the creative instructs the user to perform an action.

Valid CTA indicators:

1. Imperative command
   Examples:
   * Buy Now
   * Shop Today
   * Download App
   * Sign Up
   * Learn More
   * Register Free
   * Book Appointment
   * Tap Here
   * Swipe Up

2. Instructional interaction
   Examples:
   * Link in bio
   * Click below
   * Visit website
   * Scan QR code

3. Visual CTA (even without text)
   * Button graphic
   * App store badge
   * Checkout screen
   * Tap/swipe indicator
   * Arrow pointing to action

4. Audio CTA
   Voiceover requesting action.

---

## NOT A CTA

These must NEVER be classified as CTA:
* slogans
* product descriptions
* emotional messaging
* feature lists
* brand taglines
* announcements
* offers without action request

Examples NOT CTA:
"We care about your health"
"New collection launched"
"Premium quality shoes"

---

## ANTI-HALLUCINATION RULES

You MUST NOT:
* create default CTAs
* assume ecommerce = CTA
* infer CTA from funnel stage
* generate "Buy Now" automatically
* fill missing fields

If no strong action instruction exists → CTA = null.

Uncertainty Rule:
If confidence < 80% → return CTA null.

---

## DETECTION METHOD

Step 1 — Scan OCR text_blocks for imperative verbs.
Step 2 — Check visual signals for button-like interaction.
Step 3 — Check audio transcript for spoken action request.
Step 4 — Combine evidence.
Step 5 — Decide ONLY from evidence.

---

## OUTPUT FORMAT (MANDATORY)

Return ONLY this JSON:

{
  "cta_detected": boolean,
  "cta_text": "string | null",
  "cta_type": "purchase | signup | install | learn_more | follow | contact | none",
  "cta_modality": "text | visual | audio | mixed | none",
  "confidence_score": 0.0,
  "cta_strength": 0,
  "evidence": ["string"],
  "reasoning": "string"
}

CTA Strength Scale:
0 = no CTA
1 = weak suggestion
2 = soft CTA
3 = clear CTA
4 = strong conversion CTA

---

## FINAL RULE

Absence of CTA is VALID intelligence.
Never fabricate marketing intent.`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function detectCTA(
  vision: VisionMetrics,
  ocr: OCRStructure,
  funnel: FunnelHints
): Promise<CTADetectorResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("[CTADetector] OPENAI_API_KEY not configured");

  const client = new OpenAI({ apiKey });
  const structuredInput = buildStructuredInput(vision, ocr, funnel);

  console.log("[CTADetector] Sending signals to OpenAI for strict CTA detection...");

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.1, // Extremely low temperature for strict factual extraction
    response_format: { type: "json_object" },
    max_tokens: 500,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Detect the Call-To-Action (CTA) based on the following structured signals ONLY:\n\n${structuredInput}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("[CTADetector] Empty response from OpenAI");

  const parsed = JSON.parse(content);

  // Safe hydration with defaults
  const result: CTADetectorResult = {
    cta_detected:     Boolean(parsed.cta_detected),
    cta_text:         parsed.cta_text || null,
    cta_type:         parsed.cta_type || "none",
    cta_modality:     parsed.cta_modality || "none",
    confidence_score: Math.min(1, Math.max(0, Number(parsed.confidence_score ?? 0))),
    cta_strength:     Math.min(4, Math.max(0, Number(parsed.cta_strength ?? 0))),
    evidence:         Array.isArray(parsed.evidence) ? parsed.evidence : [],
    reasoning:        parsed.reasoning || "",
  };

  console.log(`[CTADetector] Complete. detected=${result.cta_detected} text="${result.cta_text}" strength=${result.cta_strength}`);

  return result;
}
