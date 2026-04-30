import Tesseract from "tesseract.js";

// ── Types ──────────────────────────────────────────────────────────────────────

export type Platform = "google" | "programmatic";
export type CampaignGoal = "awareness" | "consideration" | "conversion";
export type AudienceType = "broad" | "intent" | "remarketing";

export interface CoreChecks {
  noticeability:    { score: number; label: string; pass: boolean };
  messageClarity:   { score: number; label: string; pass: boolean };
  ctaStrength:      { score: number; label: string; pass: boolean };
  brandPresence:    { score: number; label: string; pass: boolean };
  crowding:         { score: number; label: string; pass: boolean };
  formatFit:        { score: number; label: string; pass: boolean };
}

export interface PlatformChecks {
  desktop: {
    layoutBalance:    { score: number; pass: boolean };
    visualHierarchy:  { score: number; pass: boolean };
    contentStructure: { score: number; pass: boolean };
    placementBlend:   { score: number; pass: boolean };
  };
  mobile: {
    readability:    { score: number; pass: boolean };
    textDensity:    { score: number; pass: boolean };
    ctaSize:        { score: number; pass: boolean };
    attentionGrab:  { score: number; pass: boolean };
  };
}

export interface LocalAnalysisResult {
  // Raw metrics
  brightness:     number;   // 0-100
  contrast:       number;   // 0-100
  text_clarity:   number;   // 0-100
  text_density:   "low" | "medium" | "high";
  layout_score:   number;   // 0-100
  visual_quality: number;   // 0-100
  goal_fit:       number;   // 0-100
  overall_score:  number;   // 0-100

  // CTA
  cta_presence:   boolean;
  cta_strength:   "none" | "weak" | "medium" | "strong";
  cta_recommendations: string[];

  // 6 Core Checks
  coreChecks: CoreChecks;

  // Platform-specific
  platformChecks: PlatformChecks;

  // Composite scores
  adVisibilityScore:       number;  // 0-100
  goalAlignmentIndicator:  number;  // 0-100

  // Suggestions & meta
  suggestions:  string[];
  goal:         CampaignGoal;
  platform:     Platform;
  audienceType: AudienceType;
  imageSize:    string;
  analyzed_at:  string;
  source:       "local-ai";

  // AI Funnel Analysis
  primary_stage: "Awareness" | "Consideration" | "Conversion";
  bestFor: "Awareness" | "Consideration" | "Conversion";
  goalMatchScore: number;
  funnelReasoning: string;
  funnelSignals: string[];
  recommendedTemplates: string[];
  messaging_intent: "Educational" | "Emotional" | "Persuasive" | "Action-driven";
  urgency_level: "Low" | "Medium" | "High";
  audience_type: "Cold" | "Warm" | "Hot";
  ai_cta_strength: "Soft" | "Medium" | "Strong";
  improvement_suggestions: string[];
  cta_detected?: boolean;
  cta_text?: string | null;
  cta_type?: string;
  cta_goal_fit?: string;
  cta_scores?: {
    clarity: number;
    urgency: number;
    value: number;
    visibility: number;
    overall: number;
  };
  analysis?: string;
  impact?: string;
  improved_ctas?: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const PLATFORM_SIZES: Record<Platform, { desktop: string[]; mobile: string[] }> = {
  google: {
    desktop: ["300x250", "728x90", "300x600", "970x250", "160x600"],
    mobile:  ["320x50", "320x100", "300x250", "200x100"],
  },
  programmatic: {
    desktop: ["300x250", "728x90", "970x250", "300x600", "160x600"],
    mobile:  ["320x50", "300x250", "320x100"],
  },
};

export const GOAL_CTA: Record<CampaignGoal, string[]> = {
  awareness:     ["learn more", "discover", "explore", "watch now", "see now"],
  consideration: ["view details", "compare now", "check features", "see pricing", "try demo"],
  conversion:    ["buy now", "sign up", "get started", "download", "claim offer"],
};

const ALL_MOBILE_SIZES = new Set([
  "320x50", "320x100", "300x250", "200x100",
]);

// ── 1. IMAGE PIXEL ANALYSIS ────────────────────────────────────────────────────

interface PixelData {
  brightness:      number;
  contrast:        number;
  edgeDensity:     number;
  cornerBrightDiff:number;
}

function analyzePixels(image: HTMLImageElement): PixelData {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { brightness: 50, contrast: 50, edgeDensity: 0.3, cornerBrightDiff: 0 };

  const W = Math.min(image.width, 400);
  const H = Math.min(image.height, 300);
  canvas.width  = W;
  canvas.height = H;
  ctx.drawImage(image, 0, 0, W, H);

  const data = ctx.getImageData(0, 0, W, H).data;
  const total = W * H;

  let sumBright = 0;
  const brightVals: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sumBright += lum;
    brightVals.push(lum);
  }

  const avgBright = sumBright / total;

  let sumSq = 0;
  for (const v of brightVals) sumSq += (v - avgBright) ** 2;
  const stdDev   = Math.sqrt(sumSq / total);
  const contrast = Math.min(100, Math.round((stdDev / 127) * 100));

  let edgeCount = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const idx   = (y * W + x) * 4;
      const right = ((y * W + (x + 1)) * 4);
      const down  = (((y + 1) * W + x) * 4);
      const diffR = Math.abs(data[idx] - data[right]);
      const diffD = Math.abs(data[idx] - data[down]);
      if (diffR + diffD > 30) edgeCount++;
    }
  }
  const edgeDensity = edgeCount / total;

  const cornerW = Math.floor(W * 0.2);
  const cornerH = Math.floor(H * 0.2);
  let cornerSum = 0;
  let cornerPx  = 0;
  for (let y = 0; y < cornerH; y++) {
    for (let x = 0; x < cornerW; x++) {
      const idx = (y * W + x) * 4;
      cornerSum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      cornerPx++;
    }
  }
  const cornerAvg = cornerPx > 0 ? cornerSum / cornerPx : avgBright;
  const cornerBrightDiff = Math.abs(cornerAvg - avgBright);

  return {
    brightness:       Math.round((avgBright / 255) * 100),
    contrast,
    edgeDensity,
    cornerBrightDiff: Math.min(100, Math.round((cornerBrightDiff / 128) * 100)),
  };
}

// ── 2. OCR ─────────────────────────────────────────────────────────────────────

async function detectText(imageUrl: string): Promise<{ text: string; textLength: number }> {
  try {
    const result = await Tesseract.recognize(imageUrl, "eng", { logger: () => {} });
    const raw  = result.data.text ?? "";
    const text = raw.replace(/\s+/g, " ").replace(/[^\w\s.,!?'"%-]/g, "").trim();
    return { text, textLength: text.length };
  } catch {
    return { text: "", textLength: 0 };
  }
}

// ── 2b. VISUAL CTA BUTTON HEURISTIC ───────────────────────────────────────────

function detectVisualCTAButton(image: HTMLImageElement): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const W = Math.min(image.width, 400);
    const H = Math.min(image.height, 300);
    canvas.width = W; canvas.height = H;
    ctx.drawImage(image, 0, 0, W, H);

    const startY = Math.floor(H * 0.75);
    const data   = ctx.getImageData(0, startY, W, H - startY).data;
    const pixels = data.length / 4;

    let sumLum = 0;
    const lums: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const l = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      sumLum += l; lums.push(l);
    }
    const avg = sumLum / pixels;
    const variance = lums.reduce((s, v) => s + (v - avg) ** 2, 0) / pixels;
    return variance > 900;
  } catch {
    return false;
  }
}

// ── 3. CTA DETECTION ──────────────────────────────────────────────────────────

function normalizeOCR(raw: string): string {
  return raw
    .replace(/\b([A-Z])\s(?=[A-Z]\b)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCTA(
  text: string,
  goal: CampaignGoal,
  visualButtonPresent = false
): { found: boolean; word: string; strength: "none" | "weak" | "medium" | "strong"; goalMatch: boolean } {
  const normalized = normalizeOCR(text);
  const lower      = normalized.toLowerCase();
  const goalWords  = GOAL_CTA[goal];

  for (const w of goalWords) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) return { found: true, word: w, strength: "strong", goalMatch: true };
  }

  const genericCTA = [
    "buy", "shop", "click", "order", "try", "sign up", "learn", "get",
    "start", "join", "subscribe", "register", "watch", "view", "see",
    "explore", "discover", "download", "claim", "book", "apply",
  ];
  for (const w of genericCTA) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(lower)) return { found: true, word: w, strength: "medium", goalMatch: false };
  }

  if (visualButtonPresent) {
    return { found: true, word: "Button detected", strength: "medium", goalMatch: false };
  }

  return { found: false, word: "", strength: "none", goalMatch: false };
}

// ── 4. SIX CORE CHECKS ────────────────────────────────────────────────────────

function computeCoreChecks(params: {
  brightness:       number;
  contrast:         number;
  edgeDensity:      number;
  textLength:       number;
  ctaFound:         boolean;
  ctaGoalMatch:     boolean;
  ctaStrength:      string;
  cornerBrightDiff: number;
  platform:         Platform;
  imageSize:        string;
}): CoreChecks {
  const { brightness, contrast, edgeDensity, textLength, ctaFound,
          ctaGoalMatch, ctaStrength, cornerBrightDiff, platform, imageSize } = params;

  const noticeSc  = Math.round((contrast * 0.6 + Math.min(100, Math.abs(brightness - 50) * 2) * 0.4));
  const noticePass = noticeSc >= 50;

  let claritySc = 100;
  if (textLength > 200) claritySc = 30;
  else if (textLength > 100) claritySc = 55;
  else if (textLength > 50)  claritySc = 75;
  const clarityPass = claritySc >= 60;

  const ctaScMap: Record<string, number> = { none: 0, weak: 30, medium: 65, strong: 100 };
  const ctaSc   = ctaGoalMatch ? 100 : (ctaScMap[ctaStrength] ?? 0);
  const ctaPass = ctaSc >= 50;

  const brandSc   = Math.min(100, cornerBrightDiff * 1.5);
  const brandPass = brandSc >= 30;

  const crowdSc   = Math.round(Math.max(0, 100 - edgeDensity * 400));
  const crowdPass = crowdSc >= 50;

  const platformSizes = [
    ...PLATFORM_SIZES[platform].desktop,
    ...PLATFORM_SIZES[platform].mobile,
  ];
  const fitPass = platformSizes.includes(imageSize);
  const fitSc   = fitPass ? 100 : 0;

  return {
    noticeability:  { score: noticeSc,  label: noticePass ? "Scroll-stopping contrast ✓" : "Low contrast — viewers will scroll past in 0.3s", pass: noticePass },
    messageClarity: { score: claritySc, label: clarityPass ? "Copy is concise and scannable ✓" : "Too much copy — attention drops after 7 words", pass: clarityPass },
    ctaStrength:    { score: ctaSc,     label: ctaPass ? (ctaGoalMatch ? "CTA aligned with campaign goal ✓" : "CTA present but not goal-specific") : "No CTA — viewers have no next step", pass: ctaPass },
    brandPresence:  { score: brandSc,   label: brandPass ? "Brand mark is visible ✓" : "Brand is hard to identify — hurts recall", pass: brandPass },
    crowding:       { score: crowdSc,   label: crowdPass ? "Layout is clean and focused ✓" : "Layout feels cluttered — viewer focus is lost", pass: crowdPass },
    formatFit:      { score: fitSc,     label: fitPass ? `Correct size for ${platform} ✓` : `Non-standard size — may be cropped or rejected by ${platform}`, pass: fitPass },
  };
}

// ── 5. PLATFORM-SPECIFIC CHECKS ───────────────────────────────────────────────

function computePlatformChecks(params: {
  brightness:   number;
  contrast:     number;
  edgeDensity:  number;
  textLength:   number;
  ctaFound:     boolean;
  imageSize:    string;
}): PlatformChecks {
  const { brightness, contrast, edgeDensity, textLength, ctaFound, imageSize } = params;
  const isMobileSize = ALL_MOBILE_SIZES.has(imageSize);

  const layoutBalance   = Math.round(Math.max(0, 100 - edgeDensity * 300));
  const visualHierarchy = Math.round((contrast * 0.7 + (100 - Math.min(100, textLength * 0.5)) * 0.3));
  const contentStructure = Math.round(Math.min(100, (textLength > 10 && textLength < 150) ? 85 : 45));
  const placementBlend  = Math.round((brightness > 20 && brightness < 90) ? 80 : 40);

  const readability     = Math.round(textLength < 60 ? 90 : textLength < 120 ? 65 : 35);
  const textDensityMob  = Math.round(Math.max(0, 100 - edgeDensity * 350));
  const ctaSize         = ctaFound ? (isMobileSize ? 85 : 70) : 20;
  const attentionGrab   = Math.round(Math.min(100, (contrast * 0.8 + brightness * 0.2)));

  const pass = (v: number) => v >= 55;

  return {
    desktop: {
      layoutBalance:    { score: layoutBalance,    pass: pass(layoutBalance) },
      visualHierarchy:  { score: visualHierarchy,  pass: pass(visualHierarchy) },
      contentStructure: { score: contentStructure, pass: pass(contentStructure) },
      placementBlend:   { score: placementBlend,   pass: pass(placementBlend) },
    },
    mobile: {
      readability:   { score: readability,    pass: pass(readability) },
      textDensity:   { score: textDensityMob, pass: pass(textDensityMob) },
      ctaSize:       { score: ctaSize,        pass: pass(ctaSize) },
      attentionGrab: { score: attentionGrab,  pass: pass(attentionGrab) },
    },
  };
}

// ── 6. GOAL-FIT SCORING ───────────────────────────────────────────────────────

function goalFitScore(
  goal: CampaignGoal,
  audience: AudienceType,
  ctaGoalMatch: boolean,
  textLength: number,
  brightness: number
): number {
  let base = 50;

  if (goal === "awareness") {
    base = textLength < 80 ? 85 : textLength < 150 ? 65 : 45;
    if (brightness > 55) base = Math.min(100, base + 10);
    if (audience === "broad") base = Math.min(100, base + 5);
  } else if (goal === "conversion") {
    base = ctaGoalMatch ? 92 : 50;
    if (audience === "remarketing") base = Math.min(100, base + 8);
  } else if (goal === "consideration") {
    base = (textLength > 30 && textLength < 150) ? 80 : 60;
    if (ctaGoalMatch) base = Math.min(100, base + 10);
    if (audience === "intent") base = Math.min(100, base + 5);
  }

  return Math.round(base);
}

// ── 7. SUGGESTIONS ────────────────────────────────────────────────────────────

function buildSuggestions(params: {
  ctaFound:     boolean;
  ctaGoalMatch: boolean;
  goal:         CampaignGoal;
  claritySc:    number;
  brightness:   number;
  contrast:     number;
  crowdSc:      number;
  fitPass:      boolean;
  platform:     Platform;
  imageSize:    string;
}): string[] {
  const { ctaFound, ctaGoalMatch, goal, claritySc, brightness, contrast,
          crowdSc, fitPass, platform, imageSize } = params;
  const recs = GOAL_CTA[goal].map((w) => `"${w.charAt(0).toUpperCase() + w.slice(1)}"`).join(", ");
  const suggestions: string[] = [];

  if (goal !== "awareness") {
    if (!ctaFound) {
      suggestions.push(`No CTA detected — without a clear next step, ${goal} audiences disengage. Try: ${recs}`);
    } else if (!ctaGoalMatch) {
      suggestions.push(`CTA doesn't match your ${goal} objective. Swap it for: ${recs}`);
    }
  } else if (ctaFound && !ctaGoalMatch) {
    suggestions.push(`This CTA feels transactional for an Awareness ad — it may intimidate cold audiences. Soften to: ${recs}`);
  }
  if (claritySc < 60) suggestions.push("Copy is too long — viewers scan in 0.3s and move on. Trim to under 10 words for maximum retention.");
  if (brightness < 35) suggestions.push("The creative is too dark — it blends into dark-mode feeds and loses visibility. Increase brightness.");
  if (contrast < 35)   suggestions.push("Low contrast means your key elements don't pop against the background — viewers won't notice the CTA.");
  if (crowdSc < 50)    suggestions.push("The layout feels cluttered — too many competing elements reduce the viewer's ability to focus on your message.");
  if (!fitPass) {
    const valid = [...PLATFORM_SIZES[platform].desktop, ...PLATFORM_SIZES[platform].mobile];
    suggestions.push(`Size ${imageSize} is non-standard for ${platform} and may be cropped or rejected. Use: ${valid.join(", ")}`);
  }
  if (goal === "awareness" && contrast < 50) {
    suggestions.push("Awareness ads compete for attention in crowded feeds — boost color saturation and contrast to create a visual interrupt.");
  }

  return suggestions.slice(0, 5);
}

// ── 8. MAIN EXPORT ────────────────────────────────────────────────────────────

export async function analyzeCreativeLocal(
  imageUrl:    string,
  goal:        CampaignGoal,
  platform:    Platform     = "google",
  audienceType: AudienceType = "broad",
  imageSize:   string       = ""
): Promise<LocalAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img     = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = async () => {
      try {
        const size = imageSize || `${img.naturalWidth}x${img.naturalHeight}`;

        const px = analyzePixels(img);
        const { text, textLength } = await detectText(imageUrl);
        const visualButtonPresent = detectVisualCTAButton(img);
        const cta = detectCTA(text, goal, visualButtonPresent);

        const clarity    = textLength < 50 ? 90 : textLength < 120 ? 70 : 50;
        const goalFit    = goalFitScore(goal, audienceType, cta.goalMatch, textLength, px.brightness);
        const visualQual = Math.round((px.brightness * 0.4 + px.contrast * 0.6));

        const textDensityLabel: "low" | "medium" | "high" =
          textLength < 50 ? "low" : textLength > 150 ? "high" : "medium";

        const layoutSc = Math.round((px.brightness + clarity) / 2);

        const coreChecks = computeCoreChecks({
          brightness:       px.brightness,
          contrast:         px.contrast,
          edgeDensity:      px.edgeDensity,
          textLength,
          ctaFound:         cta.found,
          ctaGoalMatch:     cta.goalMatch,
          ctaStrength:      cta.strength,
          cornerBrightDiff: px.cornerBrightDiff,
          platform,
          imageSize:        size,
        });

        const platformChecks = computePlatformChecks({
          brightness:  px.brightness,
          contrast:    px.contrast,
          edgeDensity: px.edgeDensity,
          textLength,
          ctaFound:    cta.found,
          imageSize:   size,
        });

        const adVisibilityScore     = Math.round(px.contrast * 0.6 + px.brightness * 0.4);
        const goalAlignmentIndicator = Math.round(
          goalFit * 0.5 +
          (cta.goalMatch ? 100 : cta.found ? 60 : 20) * 0.3 +
          (coreChecks.messageClarity.score) * 0.2
        );

        const ctaNumeric = { none: 0, weak: 33, medium: 66, strong: 100 }[cta.strength] ?? 0;
        const weights = goal === "awareness"
          ? { visual: 0.50, cta: 0.05, clarity: 0.30, layout: 0.10, goalFit: 0.05 }
          : goal === "consideration"
          ? { visual: 0.30, cta: 0.25, clarity: 0.25, layout: 0.10, goalFit: 0.10 }
          : { visual: 0.20, cta: 0.45, clarity: 0.15, layout: 0.05, goalFit: 0.15 };
        const overall = Math.round(
          visualQual   * weights.visual  +
          ctaNumeric   * weights.cta     +
          clarity      * weights.clarity +
          layoutSc     * weights.layout  +
          goalFit      * weights.goalFit
        );

        // bestFor: recalculate goal-match independently per funnel stage
        const ctaAwareness     = detectCTA(text, "awareness", visualButtonPresent);
        const ctaConsideration = detectCTA(text, "consideration", visualButtonPresent);
        const ctaConversion    = detectCTA(text, "conversion", visualButtonPresent);

        const ctaANum = { none: 0, weak: 33, medium: 66, strong: 100 }[ctaAwareness.strength] ?? 0;
        const ctaCNum = { none: 0, weak: 33, medium: 66, strong: 100 }[ctaConsideration.strength] ?? 0;
        const ctaVNum = { none: 0, weak: 33, medium: 66, strong: 100 }[ctaConversion.strength] ?? 0;

        const awarenessScore     = Math.round(visualQual * 0.50 + ctaANum * 0.05 + clarity * 0.30 + layoutSc * 0.10 + goalFitScore("awareness", audienceType, ctaAwareness.goalMatch, textLength, px.brightness) * 0.05);
        const considerationScore = Math.round(visualQual * 0.30 + ctaCNum * 0.25 + clarity * 0.25 + layoutSc * 0.10 + goalFitScore("consideration", audienceType, ctaConsideration.goalMatch, textLength, px.brightness) * 0.10);
        const conversionScore    = Math.round(visualQual * 0.20 + ctaVNum * 0.45 + clarity * 0.15 + layoutSc * 0.05 + goalFitScore("conversion", audienceType, ctaConversion.goalMatch, textLength, px.brightness) * 0.15);

        const maxScore = Math.max(awarenessScore, considerationScore, conversionScore);
        const bestFor: "Awareness" | "Consideration" | "Conversion" =
          maxScore === awarenessScore ? "Awareness"
          : maxScore === considerationScore ? "Consideration"
          : "Conversion";

        const suggestions = buildSuggestions({
          ctaFound:     cta.found,
          ctaGoalMatch: cta.goalMatch,
          goal,
          claritySc:    coreChecks.messageClarity.score,
          brightness:   px.brightness,
          contrast:     px.contrast,
          crowdSc:      coreChecks.crowding.score,
          fitPass:      coreChecks.formatFit.pass,
          platform,
          imageSize:    size,
        });

        if (suggestions.length === 0) {
          suggestions.push("Creative looks solid for this goal and platform!");
        }

        let aiResult: any;
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              cta: cta.word,
              goal,
              platform,
              audience: audienceType,
              visualContext: `Brightness: ${px.brightness}, Contrast: ${px.contrast}, EdgeDensity: ${px.edgeDensity}`
            })
          });
          if (!res.ok) throw new Error("API route failed");
          aiResult = await res.json();
        } catch (err) {
          console.error("AI API Error:", err);
          aiResult = {
            funnel_stage: goal.charAt(0).toUpperCase() + goal.slice(1),
            confidence_score: 50,
            reasoning: "AI analysis failed or API key missing. Check console.",
            messaging_intent: "Educational",
            urgency_level: "Low",
            audience_type: "Cold",
            cta_strength: "Soft",
            improvement_suggestions: ["API route failed to respond."]
          };
        }

        let recommendedTemplates = ["newspaper", "health", "entertainment"];
        if (aiResult.funnel_stage === "Conversion") {
          recommendedTemplates = ["ecommerce"];
        } else if (aiResult.funnel_stage === "Consideration") {
          recommendedTemplates = ["technology", "business"];
        }

        resolve({
          brightness:     px.brightness,
          contrast:       px.contrast,
          text_clarity:   clarity,
          text_density:   textDensityLabel,
          layout_score:   layoutSc,
          visual_quality: visualQual,
          goal_fit:       goalFit,
          overall_score:  overall,
          cta_presence:   cta.found,
          cta_strength:   cta.strength,

          cta_recommendations: GOAL_CTA[goal],
          coreChecks,
          platformChecks,
          adVisibilityScore,
          goalAlignmentIndicator,
          suggestions,
          goal,
          platform,
          audienceType,
          imageSize:   size,
          analyzed_at: new Date().toISOString(),
          source:      "local-ai",
          primary_stage: aiResult.funnel_stage,
          bestFor,
          goalMatchScore: aiResult.confidence_score,
          funnelReasoning: aiResult.reasoning,
          funnelSignals: [],
          recommendedTemplates,
          messaging_intent: aiResult.messaging_intent,
          urgency_level: aiResult.urgency_level,
          audience_type: aiResult.audience_type,
          ai_cta_strength: aiResult.cta_strength,
          improvement_suggestions: aiResult.improvement_suggestions,
          // NEW 7-STEP CTA FIELDS
          cta_detected: aiResult.cta_detected,
          cta_text: aiResult.cta_text,
          cta_type: aiResult.cta_type,
          cta_goal_fit: aiResult.cta_goal_fit,
          cta_scores: aiResult.cta_scores,
          analysis: aiResult.analysis,
          impact: aiResult.impact,
          improved_ctas: aiResult.improved_ctas,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image for local analysis"));
    img.src     = imageUrl;
  });
}
