/**
 * UNIFIED PRODUCTION-GRADE ANALYZER
 * Single entry point for creative analysis
 * 
 * Flow:
 * Google OCR → Normalize → CTA Detection → Layout Analysis
 * → Intelligence Profile Load → Scoring → Recommendations
 */

import { normalizeOcr } from "@/app/lib/ocr-normalization/pipeline";
import { analyzeLayout } from "@/app/lib/layout-intelligence/engine";
import { detectCta } from "@/app/lib/ocr-normalization/cta-engine";
import { getIntelligenceProfile } from "@/app/lib/intelligence-registry";
import { calculateFinalScores } from "./scoring-engine";
import { generateRecommendations } from "./recommendation-engine";
import { analyzeContextualAlignment } from "./strategic-analysis";
import { extractTextFromImage } from "@/app/lib/ocr";

import type { 
  CampaignGoal, 
  VerticalKey 
} from "@/app/lib/intelligence-registry";
import type { ContextualAnalysis } from "./strategic-analysis";

export interface AnalysisInput {
  imageBuffer: Buffer;
  goal: CampaignGoal;
  vertical: VerticalKey;
}

export interface UnifiedAnalysisResult {
  // Metadata
  creativeId: string;
  goal: CampaignGoal;
  vertical: VerticalKey;
  analyzedAt: string;
  
  // Primary Strategic Output
  strategicAnalysis: ContextualAnalysis;
  
  // Raw Data (for transparency)
  analysisDetails: {
    ocr: any;
    ctaDetection: any;
    layoutAnalysis: any;
    scores: any;
    recommendations: any[];
  };
  
  // API Metadata
  pipelineVersion: string;
  processingTimeMs: number;
}

export async function analyzeCreativePipeline(
  input: AnalysisInput
): Promise<UnifiedAnalysisResult> {
  const startTime = Date.now();
  const creativeId = `cr_${Date.now().toString(36)}`;

  try {
    console.log(`[Pipeline] Starting analysis: ${input.vertical}/${input.goal}`);

    // ── 1. Load Intelligence Profile ────────────────────────────────────
    console.log(`[Pipeline] 1/5 Loading intelligence profile...`);
    const profile = getIntelligenceProfile({
      campaignGoal: input.goal,
      vertical: input.vertical,
    });

    // ── 2. Normalize OCR (Google Vision API) ───────────────────────────
    console.log(`[Pipeline] 2/5 Normalizing OCR...`);
    // Call Google Vision API to extract text
    const base64Image = input.imageBuffer.toString("base64");
    let visionResult;
    try {
      visionResult = await extractTextFromImage(base64Image);
      console.log(`[Pipeline] OCR success: extracted ${visionResult.text.length} chars, confidence=${visionResult.confidence}`);
    } catch (ocrError) {
      console.error(`[Pipeline] OCR FAILED - stopping pipeline`, ocrError);
      throw new Error(`OCR extraction failed: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
    }
    
    // Normalize the OCR output with profile context
    const ocr = normalizeOcr(visionResult, {
      campaignGoal: input.goal,
      vertical: input.vertical,
    });

    // Stop if OCR produced no usable text
    if (!ocr || !ocr.rawText || ocr.rawText.length < 5) {
      console.error(`[Pipeline] OCR text too short or missing (${ocr?.rawText?.length || 0} chars)`);
      throw new Error("OCR returned insufficient text. Image may not contain readable text or may be unrelated to advertising content.");
    }

    // ── 3. Detect CTA (with profile context) ────────────────────────────
    console.log(`[Pipeline] 3/5 Detecting CTA...`);
    const ctaDetection = detectCta(ocr.blocks, profile);

    // ── 4. Analyze Layout (geometry + readability) ──────────────────────
    console.log(`[Pipeline] 4/5 Analyzing layout...`);
    const layoutAnalysis = analyzeLayout({
      ocr,
      options: { profile },
    });

    // ── 5. Calculate Scores (registry-aware, profile-weighted) ──────────
    console.log(`[Pipeline] 5/5 Calculating scores...`);
    const scores = calculateFinalScores(
      {
        ocr,
        ctaDetection,
        layoutAnalysis,
      },
      profile
    );

    // ── 6. Generate Recommendations (deterministic) ──────────────────────
    console.log(`[Pipeline] 6/6 Generating recommendations...`);
    const recommendations = generateRecommendations(
      {
        ocr,
        ctaDetection,
        layoutAnalysis,
        scores,
      },
      profile
    );

    // ── 7. Strategic Analysis (enterprise-grade contextual output) ─────
    console.log(`[Pipeline] 7/6 Performing strategic analysis...`);
    const strategicAnalysis = analyzeContextualAlignment(
      scores,
      ocr,
      profile,
      ctaDetection,
      layoutAnalysis
    );

    const processingTimeMs = Date.now() - startTime;
    console.log(`[Pipeline] ✅ Complete in ${processingTimeMs}ms`);

    return {
      // Metadata
      creativeId,
      goal: input.goal,
      vertical: input.vertical,
      analyzedAt: new Date().toISOString(),
      
      // Strategic Analysis (Primary Output)
      strategicAnalysis,
      
      // Raw Analysis Data (for debugging/transparency)
      analysisDetails: {
        ocr,
        ctaDetection,
        layoutAnalysis,
        scores,
        recommendations,
      },
      
      // API Metadata
      pipelineVersion: "1.0.0-phase2-strategic",
      processingTimeMs,
    };
  } catch (error) {
    console.error(`[Pipeline] Fatal error:`, error);
    throw error;
  }
}
