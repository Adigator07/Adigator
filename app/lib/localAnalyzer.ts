import Tesseract from "tesseract.js";
import { runLocalAgent } from "./agentAnalyzer";

// ── Types ───────────────────────────────────────────────────────────────────

export type Platform = "programmatic";
export type CampaignGoal = "awareness" | "consideration" | "conversion";
export type AudienceType = "broad" | "intent" | "remarketing";
export type Tier = "XS" | "S" | "M" | "L" | "XL" | "Unknown";

export interface PixelData {
  brightness: number;
  contrast: number;
  edgeDensity: number;
  cornerBrightDiff: number;
  clipHigh: number;
  clipLow: number;
}

export interface LocalAnalysisResult {
  brightness: number;
  contrast: number;
  text_clarity: number;
  text_density: "low" | "medium" | "high";
  layout_score: number;
  visual_quality: number;
  goal_fit: number;
  overall_score: number;
  cta_presence: boolean;
  cta_strength: string;
  cta_recommendations: string[];
  coreChecks: any;
  platformChecks: any;
  adVisibilityScore: number;
  goalAlignmentIndicator: number;
  suggestions: string[];
  goal: CampaignGoal;
  platform: Platform;
  audienceType: AudienceType;
  imageSize: string;
  analyzed_at: string;
  source: string;
  primary_stage: string;
  bestFor: string;
  goalMatchScore: number;
  funnelReasoning: string;
  funnelSignals: any[];
  recommendedTemplates: string[];
  messaging_intent: string;
  urgency_level: string;
  audience_type: string;
  ai_cta_strength: string;
  improvement_suggestions: string[];
  cta_detected: boolean;
  cta_text: string | null;
  cta_type: string;
  cta_goal_fit: string;
  cta_scores: any;
  analysis: string;
  impact: string;
  improved_ctas: string[];
  confidence: string;
  qualityMessage?: string;
  // Deterministic fields
  sizeTier: Tier;
  deterministicIssues: any[];
  // AI Agent fields
  agentSummary: string;
  agentFunnelAnalysis: string;
  agentBreakdown: {
    cta: string;
    text_clarity: string;
    brand_presence: string;
    brightness_contrast: string;
    ad_visibility: string;
    goal_alignment: string;
  };
  agentScores: {
    cta: number;
    clarity: number;
    brand: number;
    visual_quality: number;
    visibility: number;
    goal_alignment: number;
    overall: number;
  };
  agentSuggestions: string[];
}

export const PLATFORM_SIZES: Record<Platform, { desktop: string[]; mobile: string[] }> = {
  programmatic: {
    desktop: ["300x250", "336x280", "728x90", "970x90", "970x250", "160x600", "300x600", "300x1050", "468x60", "234x60", "120x600", "120x240", "250x250", "200x200", "180x150"],
    mobile:  ["320x50", "320x100", "300x250", "320x480", "480x320", "360x640", "375x667", "414x736"],
  },
};

export const GOAL_CTA: Record<CampaignGoal, string[]> = {
  awareness: ["Learn More", "Discover", "Explore", "Watch Now", "See Now", "See How"],
  consideration: ["View Details", "Compare Now", "Check Features", "See Pricing", "Try Demo"],
  conversion: ["Buy Now", "Sign Up", "Get Started", "Download", "Claim Offer", "Subscribe"],
};

export const STRONG_CTA_KEYWORDS = [
  "buy now", "shop now", "get started", "order now", "sign up", "download",
  "claim offer", "claim now", "get offer", "start free trial", "try free",
  "get yours", "add to cart", "subscribe now", "install now",
  "start now", "book now", "register now", "apply now", "get access",
];

export const MEDIUM_CTA_KEYWORDS = [
  "learn more", "explore", "discover", "see pricing", "compare", "book demo",
  "try it", "view details", "see features", "request demo", "get quote",
  "find out more", "watch now", "view offer", "see plans", "get demo",
];

export const WEAK_CTA_KEYWORDS = [
  "click here", "click", "see", "visit", "check", "read",
  "more info", "info", "know more",
];

const ALL_MOBILE_SIZES = new Set([
  "320x50", "320x100", "300x250", "320x480", "480x320", "360x640", "375x667", "414x736",
]);

// ── Size Tiering ─────────────────────────────────────────────────────────────
function getTier(width: number, height: number): Tier {
  const area = width * height;
  if (area < 20000) return "XS"; // 320x50
  if (area <= 32000) return "S"; // 320x100
  if (area <= 75000) return "M"; // 300x250, 728x90
  if (area <= 180000) return "L"; // 300x600
  if (area > 180000) return "XL"; // 970x250
  return "Unknown";
}

// ── 1. Pixels ────────────────────────────────────────────────────────────────
function analyzePixels(image: HTMLImageElement): PixelData {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { brightness: 50, contrast: 50, edgeDensity: 0.1, cornerBrightDiff: 10, clipHigh: 0, clipLow: 0 };

  const W = Math.min(image.width, 300);
  const H = Math.min(image.height, 300);
  canvas.width = W; canvas.height = H;
  ctx.drawImage(image, 0, 0, W, H);

  const data = ctx.getImageData(0, 0, W, H).data;
  let sumL = 0;
  let minL = 255;
  let maxL = 0;
  let edges = 0;
  let clipHigh = 0;
  let clipLow = 0;
  const pixels = W * H;

  for (let i = 0; i < data.length; i += 4) {
    const l = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    sumL += l;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
    if (l > 245) clipHigh++;
    if (l < 10) clipLow++;

    if (i % (W * 4) !== 0 && i >= W * 4) {
      const leftL = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
      const topL = 0.299 * data[i - W * 4] + 0.587 * data[i - W * 4 + 1] + 0.114 * data[i - W * 4 + 2];
      if (Math.abs(l - leftL) > 20 || Math.abs(l - topL) > 20) edges++;
    }
  }

  const avgBright = sumL / pixels;
  const contrast = maxL - minL;
  const edgeDensity = edges / pixels;

  return {
    brightness: Math.round((avgBright / 255) * 100),
    contrast: Math.round((contrast / 255) * 100),
    edgeDensity,
    clipHigh: clipHigh / pixels,
    clipLow: clipLow / pixels,
    cornerBrightDiff: 15,
  };
}

// ── 2. OCR ───────────────────────────────────────────────────────────────────
async function detectText(imageUrl: string, w: number, h: number) {
  try {
    const result = await Tesseract.recognize(imageUrl, "eng", { logger: () => {} });
    const text = (result.data.text ?? "").replace(/\s+/g, " ").trim();
    
    let totalArea = 0;
    let minH = 9999;
    const words = (result.data as any).words || [];
    words.forEach((word: any) => {
      const bw = word.bbox.x1 - word.bbox.x0;
      const bh = word.bbox.y1 - word.bbox.y0;
      totalArea += (bw * bh);
      if (bh > 5 && bh < minH) minH = bh;
    });

    const textAreaPercent = (w * h > 0) ? (totalArea / (w * h)) * 100 : 0;
    
    return { 
      text, 
      textLength: text.length,
      textAreaPercent,
      minTextHeightPx: minH === 9999 ? 0 : minH,
      ocrConfidence: result.data.confidence ?? 0 
    };
  } catch {
    return { text: "", textLength: 0, textAreaPercent: 0, minTextHeightPx: 0, ocrConfidence: 0 };
  }
}

function detectCTA(text: string, goal: CampaignGoal) {
  const norm = text.toLowerCase();
  for (const w of GOAL_CTA[goal]) {
    if (norm.includes(w.toLowerCase())) return { found: true, word: w, strength: "strong", goalMatch: true };
  }
  for (const w of STRONG_CTA_KEYWORDS) {
    if (norm.includes(w)) return { found: true, word: w, strength: "strong", goalMatch: false };
  }
  for (const w of MEDIUM_CTA_KEYWORDS) {
    if (norm.includes(w)) return { found: true, word: w, strength: "medium", goalMatch: false };
  }
  return { found: false, word: "", strength: "none", goalMatch: false };
}

// ── Deterministic Engine ───────────────────────────────────────────────────────
export async function analyzeCreativeLocal(
  imageUrl: string, goal: CampaignGoal, platform: Platform = "programmatic", 
  audienceType: AudienceType = "broad", imageSize: string = ""
): Promise<LocalAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = async () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const size = imageSize || `${width}x${height}`;
        const tier = getTier(width, height);

        const px = analyzePixels(img);
        const ocr = await detectText(imageUrl, width, height);
        const cta = detectCTA(ocr.text, goal);

        const issues: any[] = [];
        
        // Tier Rules
        if ((tier === "XS" || tier === "S") && ocr.textAreaPercent > 40) {
          issues.push({ id: "density_xs", severity: "high", evidence: `Tier ${tier} density is ${Math.round(ocr.textAreaPercent)}% (max 40%)` });
        }
        if (ocr.minTextHeightPx > 0 && ocr.minTextHeightPx < 12) {
          issues.push({ id: "text_size", severity: "high", evidence: `Text height ${ocr.minTextHeightPx}px is below 12px minimum for legibility on programmatic` });
        }
        if (px.clipHigh > 0.3) {
          issues.push({ id: "overexposed", severity: "medium", evidence: `Overexposed: ${Math.round(px.clipHigh*100)}% pure white clipping causes banner blindness on light websites` });
        }
        if (px.contrast < 30) {
          issues.push({ id: "contrast_low", severity: "high", evidence: `Low contrast (${px.contrast}/100) reduces clickability and accessibility` });
        }
        if (!cta.found && goal !== "awareness") {
          issues.push({ id: "no_cta", severity: "high", evidence: `No action verb CTA detected. Essential for ${goal} campaigns.` });
        }

        const metrics = {
          tier, density: ocr.textAreaPercent, minHeight: ocr.minTextHeightPx,
          contrast: px.contrast, brightness: px.brightness, blur: px.edgeDensity < 0.02
        };

        const aiResult = {
          overall_summary: "Local Deterministic Analysis Complete.",
          top_issues: issues,
          priority_fixes: issues.map(i => ({ how: i.evidence })),
          cta_recommendations: [],
          copy_variants: { headlines: [], subheads: [] },
          design_fixes: issues.map(i => i.evidence)
        };

        // ── Run Local AI Agent (no API, no fetch) ──────────────────────────
        let agentReport: ReturnType<typeof runLocalAgent> | null = null;
        try {
          agentReport = runLocalAgent({
            goal,
            ocrText: ocr.text,
            ctaDetected: cta.found,
            ctaWord: cta.word,
            ctaStrength: cta.strength,
            contrast: px.contrast,
            brightness: px.brightness,
            tier,
            issues
          });
        } catch (e) {
          console.warn("[Adigator] Local agent error:", e);
        }

        const overall_score = Math.max(0, 100 - (issues.length * 15));

        // Map AI response to legacy UI variables for AnalysisPanel
        resolve({
          brightness: px.brightness,
          contrast: px.contrast,
          text_clarity: ocr.textAreaPercent < 40 ? 90 : 50,
          text_density: ocr.textAreaPercent > 50 ? "high" : "medium",
          layout_score: 80,
          visual_quality: px.edgeDensity < 0.02 ? 30 : 85,
          goal_fit: cta.goalMatch ? 100 : 60,
          overall_score,
          cta_presence: cta.found,
          cta_strength: cta.strength,
          cta_recommendations: GOAL_CTA[goal],
          coreChecks: {
            noticeability: { score: px.contrast, label: px.contrast > 30 ? "Good Contrast" : "Low Contrast", pass: px.contrast > 30 },
            messageClarity: { score: ocr.textAreaPercent < 45 ? 100 : 40, label: `Text Area: ${Math.round(ocr.textAreaPercent)}%`, pass: ocr.textAreaPercent < 45 },
            ctaStrength: { score: cta.found ? 100 : 0, label: cta.found ? "CTA Detected" : "No CTA", pass: cta.found || goal === "awareness" },
            brandPresence: { score: 100, label: "Brand Assumption", pass: true },
            crowding: { score: px.clipHigh < 0.4 ? 100 : 40, label: "Visual Balance", pass: px.clipHigh < 0.4 },
            formatFit: { score: 100, label: tier, pass: true }
          },
          platformChecks: {},
          adVisibilityScore: px.contrast,
          goalAlignmentIndicator: cta.goalMatch ? 100 : 60,
          suggestions: (aiResult.design_fixes || []).concat(issues.map(i => i.evidence)),
          goal, platform, audienceType, imageSize: size,
          analyzed_at: new Date().toISOString(), source: "local-ai",
          primary_stage: goal.charAt(0).toUpperCase() + goal.slice(1), 
          bestFor: goal.charAt(0).toUpperCase() + goal.slice(1), 
          goalMatchScore: 90,
          funnelReasoning: aiResult.overall_summary || "",
          funnelSignals: [], recommendedTemplates: ["newspaper", "health"],
          messaging_intent: "Persuasive", urgency_level: "Medium", audience_type: "Warm",
          ai_cta_strength: cta.strength,
          improvement_suggestions: (aiResult.priority_fixes || []).map((f:any) => f.how),
          cta_detected: cta.found, cta_text: cta.word, cta_type: "Hard", cta_goal_fit: cta.goalMatch ? "Perfect Match" : "Acceptable", 
          cta_scores: {overall: cta.found ? 8 : 0, clarity: cta.found ? 8 : 0},
          analysis: aiResult.overall_summary || "", impact: "",
          improved_ctas: aiResult.copy_variants?.headlines || [],
          confidence: "high",
          sizeTier: tier,
          deterministicIssues: issues,
          // AI Agent results
          agentSummary: agentReport?.summary || "",
          agentFunnelAnalysis: agentReport?.funnel_analysis || "",
          agentBreakdown: agentReport?.breakdown || {
            cta: "", text_clarity: "", brand_presence: "",
            brightness_contrast: "", ad_visibility: "", goal_alignment: ""
          },
          agentScores: agentReport?.scores || {
            cta: 0, clarity: 0, brand: 0, visual_quality: 0,
            visibility: 0, goal_alignment: 0, overall: 0
          },
          agentSuggestions: agentReport?.suggestions || []
        });
      } catch (err) { reject(err); }
    };
    img.onerror = () => reject(new Error("Failed load"));
    img.src = imageUrl;
  });
}
