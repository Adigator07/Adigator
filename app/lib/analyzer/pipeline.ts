/**
 * ACIE v5.0 — Orchestrator Pipeline
 *
 * Runs the deterministic-first, AI-last pipeline.
 *
 * 1. Vision (Sharp)
 * 2. OCR (Google Vision - placeholder logic for now)
 * 3. Funnel Heuristics
 * 4. AI Strategic Reasoning
 * 5. Rule Corrections
 * 6. Scoring & Output
 */

import { analyzeVision } from "./vision-analyzer";
import { parseOCR } from "./ocr-parser";
import { classifyFunnel } from "./funnel-hints";
import { detectCTA } from "./cta-detector";
import { runAIAnalysis } from "./ai-analyzer";
import { applyRuleCorrections } from "./decision-engine";
import { calculateFinalScores } from "./scoring-engine";
import type { AnalysisPipelineResult, FunnelStage, OCRStructure } from "./types";

/**
 * Main orchestrator for ACIE v5.0
 *
 * @param creativeId External ID of the creative
 * @param imageBuffer Raw binary image data
 * @param mimeType Image mime type
 * @param rawOcrText Raw text from Google Vision (or other provider)
 * @param goal Optional campaign goal override
 */
export async function analyzeCreativeV5(
  creativeId: string,
  imageBuffer: Buffer,
  mimeType: string,
  rawOcrText: string,
  goal?: FunnelStage
): Promise<AnalysisPipelineResult> {
  const startTime = Date.now();

  try {
    // ── 1. Vision Analysis (Deterministic pixel math) ───────────────
    console.log(`[Pipeline] [1/7] Running vision analysis for ${creativeId}...`);
    const vision = await analyzeVision(imageBuffer, mimeType);

    // ── 2. OCR Parsing (Structured semantic fields) ─────────────────
    console.log(`[Pipeline] [2/7] Parsing OCR text for ${creativeId}...`);
    const ocr: OCRStructure = parseOCR(rawOcrText);

    // ── 3. Funnel Heuristics (Deterministic probability math) ───────
    console.log(`[Pipeline] [3/7] Classifying funnel stage...`);
    const funnelHints = classifyFunnel(ocr, vision);

    // ── 4. CTA Detector (Strict adherence to CTA policy) ────────────
    console.log(`[Pipeline] [4/7] Detecting Call-To-Action (Strict Mode)...`);
    const ctaDetector = await detectCTA(vision, ocr, funnelHints);

    // ── 5. AI Strategic Reasoning (OpenAI) ──────────────────────────
    console.log(`[Pipeline] [5/7] Requesting AI strategic reasoning...`);
    const aiRaw = await runAIAnalysis(vision, ocr, funnelHints, goal);

    // ── 6. Decision Engine (Rule-based corrections) ─────────────────
    console.log(`[Pipeline] [6/7] Applying deterministic rule corrections...`);
    const { corrected: aiCorrected, corrections } = applyRuleCorrections(
      aiRaw,
      vision,
      ocr,
      funnelHints
    );

    // ── 7. Final Scoring (Normalization & Grading) ──────────────────
    console.log(`[Pipeline] [7/7] Calculating final scores...`);
    const finalScores = calculateFinalScores(
      aiCorrected,
      vision,
      ocr,
      funnelHints,
      ctaDetector,
      corrections.corrections
    );

    const processingTimeMs = Date.now() - startTime;
    console.log(`[Pipeline] Analysis complete in ${processingTimeMs}ms. Grade: ${finalScores.grade}`);

    return {
      creativeId,
      analyzedAt: new Date().toISOString(),
      vision,
      ocr,
      funnel_hints: funnelHints,
      cta_detector: ctaDetector,
      ai_analysis: aiCorrected,
      final_scores: finalScores,
      rules_applied: corrections.corrections,
      warnings: corrections.warnings,
      recommendations: aiCorrected.optimizationSuggestions,
      processingTimeMs,
    };
  } catch (error) {
    console.error(`[Pipeline] Fatal error during analysis:`, error);
    throw error;
  }
}
