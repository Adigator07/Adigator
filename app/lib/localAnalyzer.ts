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
  cta_detected:   string;   // the actual CTA word found (if any)
  cta_recommendations: string[];  // CTAs recommended for this goal

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
  stageScores: { awareness: number; consideration: number; conversion: number };
  funnelReasoning: string;
  funnelSignals: string[];
  recommendedTemplates: string[];
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

// Mobile sizes across all platforms (used for mobile check logic)
const ALL_MOBILE_SIZES = new Set([
  "320x50", "320x100", "300x250", "200x100",
]);

// ── 1. IMAGE PIXEL ANALYSIS ────────────────────────────────────────────────────

interface PixelData {
  brightness:      number;
  contrast:        number;
  edgeDensity:     number;   // 0-1: proxy for visual complexity / crowding
  cornerBrightDiff:number;   // brightness difference in corners (brand logo proxy)
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

  // Contrast = std dev of luminance
  let sumSq = 0;
  for (const v of brightVals) sumSq += (v - avgBright) ** 2;
  const stdDev   = Math.sqrt(sumSq / total);
  const contrast = Math.min(100, Math.round((stdDev / 127) * 100));

  // Edge density via simple neighbour diff (proxy for element complexity)
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

  // Corner brightness diff — measure how distinct the top-left corner is
  // (proxy for logo/brand presence)
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
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: () => {},
    });
    const text = result.data.text.trim();
    return { text, textLength: text.length };
  } catch {
    return { text: "", textLength: 0 };
  }
}

// ── 3. CTA DETECTION ──────────────────────────────────────────────────────────

function detectCTA(
  text: string,
  goal: CampaignGoal
): { found: boolean; word: string; strength: "none" | "weak" | "medium" | "strong"; goalMatch: boolean } {
  const lower = text.toLowerCase();
  const goalWords = GOAL_CTA[goal];

  // Check goal-specific CTAs first (strong match)
  for (const w of goalWords) {
    if (lower.includes(w)) {
      return { found: true, word: w, strength: "strong", goalMatch: true };
    }
  }

  // Generic CTA words (medium match)
  const genericCTA = [
    "buy", "shop", "click", "order", "try", "sign up", "learn", "get",
    "start", "join", "subscribe", "register", "watch", "view", "see",
    "explore", "discover", "download", "claim", "book", "apply",
  ];
  for (const w of genericCTA) {
    if (lower.includes(w)) {
      return { found: true, word: w, strength: "medium", goalMatch: false };
    }
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

  // 1. Noticeability: contrast + brightness (not too dark, not washed)
  const noticeSc  = Math.round((contrast * 0.6 + Math.min(100, Math.abs(brightness - 50) * 2) * 0.4));
  const noticePass = noticeSc >= 50;

  // 2. Message clarity: short text = clear, long text = cluttered
  let claritySc = 100;
  if (textLength > 200) claritySc = 30;
  else if (textLength > 100) claritySc = 55;
  else if (textLength > 50)  claritySc = 75;
  const clarityPass = claritySc >= 60;

  // 3. CTA strength
  const ctaScMap: Record<string, number> = { none: 0, weak: 30, medium: 65, strong: 100 };
  const ctaSc   = ctaGoalMatch ? 100 : (ctaScMap[ctaStrength] ?? 0);
  const ctaPass = ctaSc >= 50;

  // 4. Brand presence: corner distinctness (top-left logo region)
  const brandSc   = Math.min(100, cornerBrightDiff * 1.5);
  const brandPass = brandSc >= 30;

  // 5. Crowding: edge density proxy (more edges = more elements = more crowded)
  const crowdSc   = Math.round(Math.max(0, 100 - edgeDensity * 400));
  const crowdPass = crowdSc >= 50; // pass if not too crowded

  // 6. Format fit: does the size match the platform?
  const platformSizes = [
    ...PLATFORM_SIZES[platform].desktop,
    ...PLATFORM_SIZES[platform].mobile,
  ];
  const fitPass = platformSizes.includes(imageSize);
  const fitSc   = fitPass ? 100 : 0;

  return {
    noticeability:  { score: noticeSc,  label: noticePass ? "Noticeable" : "Low contrast — may be ignored",                      pass: noticePass },
    messageClarity: { score: claritySc, label: clarityPass ? "Clear message" : "Too much text — reduce copy",                    pass: clarityPass },
    ctaStrength:    { score: ctaSc,     label: ctaPass ? (ctaGoalMatch ? "CTA matches goal ✓" : "CTA present") : "No clear CTA", pass: ctaPass },
    brandPresence:  { score: brandSc,   label: brandPass ? "Brand visible" : "Brand hard to identify",                           pass: brandPass },
    crowding:       { score: crowdSc,   label: crowdPass ? "Layout balanced" : "Too many elements — simplify",                   pass: crowdPass },
    formatFit:      { score: fitSc,     label: fitPass ? `Valid size for ${platform}` : `Size not standard for ${platform}`,     pass: fitPass },
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

  // Desktop checks
  const layoutBalance   = Math.round(Math.max(0, 100 - edgeDensity * 300));
  const visualHierarchy = Math.round((contrast * 0.7 + (100 - Math.min(100, textLength * 0.5)) * 0.3));
  const contentStructure = Math.round(Math.min(100, (textLength > 10 && textLength < 150) ? 85 : 45));
  const placementBlend  = Math.round((brightness > 20 && brightness < 90) ? 80 : 40);

  // Mobile checks — harsher on crowding, CTA size matters more
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
    // Visual clarity + low text burden
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

  if (!ctaFound) {
    suggestions.push(`Add a clear CTA for ${goal} goal. Recommended: ${recs}`);
  } else if (!ctaGoalMatch) {
    suggestions.push(`CTA doesn't match your ${goal} goal. Use: ${recs}`);
  }
  if (claritySc < 60) suggestions.push("Reduce text length — aim for under 10 words for maximum impact.");
  if (brightness < 35) suggestions.push("Image is too dark. Increase brightness for better visibility.");
  if (contrast < 35)   suggestions.push("Low contrast detected. Increase contrast to make elements pop.");
  if (crowdSc < 50)    suggestions.push("Too many elements detected. Simplify the layout for clarity.");
  if (!fitPass) {
    const valid = [...PLATFORM_SIZES[platform].desktop, ...PLATFORM_SIZES[platform].mobile];
    suggestions.push(`Size ${imageSize} is not standard for ${platform}. Accepted: ${valid.join(", ")}`);
  }
  if (goal === "awareness" && contrast < 50) {
    suggestions.push("Awareness ads need high visual impact — boost color saturation and contrast.");
  }
  if (goal === "conversion" && !ctaFound) {
    suggestions.push("Conversion campaigns critically need a CTA button. Add one immediately.");
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

        // Pixel analysis
        const px = analyzePixels(img);

        // OCR
        const { text, textLength } = await detectText(imageUrl);

        // CTA
        const cta = detectCTA(text, goal);

        // Scores
        const clarity    = textLength < 50 ? 90 : textLength < 120 ? 70 : 50;
        const goalFit    = goalFitScore(goal, audienceType, cta.goalMatch, textLength, px.brightness);
        const visualQual = Math.round((px.brightness * 0.4 + px.contrast * 0.6));

        const textDensityLabel: "low" | "medium" | "high" =
          textLength < 50 ? "low" : textLength > 150 ? "high" : "medium";

        const layoutSc = Math.round((px.brightness + clarity) / 2);

        // 6 core checks
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

        // Platform checks
        const platformChecks = computePlatformChecks({
          brightness:  px.brightness,
          contrast:    px.contrast,
          edgeDensity: px.edgeDensity,
          textLength,
          ctaFound:    cta.found,
          imageSize:   size,
        });

        // Composite scores
        const adVisibilityScore     = Math.round(px.contrast * 0.6 + px.brightness * 0.4);
        const goalAlignmentIndicator = Math.round(
          goalFit * 0.5 +
          (cta.goalMatch ? 100 : cta.found ? 60 : 20) * 0.3 +
          (coreChecks.messageClarity.score) * 0.2
        );

        // Overall weighted score
        const ctaNumeric = { none: 0, weak: 33, medium: 66, strong: 100 }[cta.strength] ?? 0;
        const overall = Math.round(
          visualQual       * 0.25 +
          ctaNumeric       * 0.25 +
          clarity          * 0.20 +
          layoutSc         * 0.15 +
          goalFit          * 0.15
        );

        // Suggestions
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

        // --- MOCK AI FUNNEL CLASSIFICATION LOGIC ---
        let primary_stage: "Awareness" | "Consideration" | "Conversion" = "Awareness";
        let stageScores = { awareness: 50, consideration: 50, conversion: 50 };
        let funnelReasoning = "";
        let funnelSignals: string[] = [];
        let recommendedTemplates: string[] = [];

        const ctaWord = cta.word.toLowerCase();
        if (["buy", "shop", "install", "download", "sign up", "get"].some(w => ctaWord.includes(w))) {
          primary_stage = "Conversion";
          stageScores = { awareness: 30, consideration: 50, conversion: 92 };
          funnelReasoning = "The CTA indicates a strong, immediate action intent typical for bottom-funnel audiences.";
          funnelSignals = ["Strong transactional CTA detected", "High urgency"];
          recommendedTemplates = ["ecommerce", "gaming"];
        } else if (["compare", "features", "pricing", "details", "try", "check"].some(w => ctaWord.includes(w))) {
          primary_stage = "Consideration";
          stageScores = { awareness: 40, consideration: 88, conversion: 40 };
          funnelReasoning = "The creative invites evaluation, comparison, or trial, which maps perfectly to the mid-funnel consideration stage.";
          funnelSignals = ["Exploratory/comparison CTA detected", "Moderate urgency"];
          recommendedTemplates = ["technology", "business", "education"];
        } else {
          primary_stage = "Awareness";
          stageScores = { awareness: 85, consideration: 45, conversion: 20 };
          funnelReasoning = "The creative has a soft or missing CTA, prioritizing broad brand introduction and discovery.";
          funnelSignals = ["Soft or no CTA", "Low urgency, informational focus"];
          recommendedTemplates = ["newspaper", "food", "health", "entertainment"];
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
          cta_detected:   cta.word,
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
          primary_stage,
          stageScores,
          funnelReasoning,
          funnelSignals,
          recommendedTemplates,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image for local analysis"));
    img.src     = imageUrl;
  });
}
