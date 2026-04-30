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
  ai_cta_strength: "Soft" | "Medium" | "Strong" | "None";
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
  // Confidence & quality
  confidence: "low" | "medium" | "high";
  qualityMessage?: string;
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

export const CTA_SCORE_MAP: Record<string, number> = {
  none:   0,
  weak:   25,
  medium: 60,
  strong: 100,
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

async function detectText(imageUrl: string): Promise<{ text: string; textLength: number; ocrConfidence: number }> {
  try {
    const result = await Tesseract.recognize(imageUrl, "eng", { logger: () => {} });
    const raw  = result.data.text ?? "";
    const text = raw.replace(/\s+/g, " ").replace(/[^\w\s.,!?'"%-]/g, "").trim();
    return { text, textLength: text.length, ocrConfidence: result.data.confidence ?? 0 };
  } catch {
    return { text: "", textLength: 0, ocrConfidence: 0 };
  }
}

// ── 2a. IMAGE QUALITY GATE ─────────────────────────────────────────────────────

interface QualityCheck {
  pass: boolean;
  reason: string;
  confidence: "low" | "medium" | "high";
}

function checkImageQuality(px: PixelData, textLength: number, ocrConfidence: number): QualityCheck {
  if (px.contrast < 8) {
    return {
      pass: false,
      reason: "Extremely low contrast detected — this creative may be blank or nearly uniform in colour, making reliable analysis impossible. Increase contrast before uploading.",
      confidence: "low",
    };
  }
  if (px.edgeDensity < 0.02) {
    return {
      pass: false,
      reason: "The image appears blurry or lacks visible structure. Sharpness is too low for meaningful scoring. Upload a higher-resolution version to get accurate results.",
      confidence: "low",
    };
  }
  const confidence: "low" | "medium" | "high" =
    px.contrast >= 45 && ocrConfidence >= 60 ? "high"
    : px.contrast >= 22 || ocrConfidence >= 30 ? "medium"
    : "low";
  return { pass: true, reason: "", confidence };
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

function detectCTA(
  text: string,
  goal: CampaignGoal,
  visualButtonPresent = false
): { found: boolean; word: string; strength: "none" | "weak" | "medium" | "strong"; goalMatch: boolean } {
  // Single-pass normalisation: expand CamelCase → strip punctuation → collapse whitespace → lowercase
  const lower = text
    .replace(/([a-z])([A-Z])/g, "$1 $2")   // CamelCase → Camel Case
    .replace(/\b([A-Z])\s(?=[A-Z]\b)/g, "$1") // "S H O P" → "SHOP"
    .replace(/[^a-zA-Z0-9\s]/g, " ")          // strip punctuation
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const goalWords = GOAL_CTA[goal];

  // 1. Check goal-specific strong CTAs
  for (const w of goalWords) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) return { found: true, word: w, strength: "strong", goalMatch: true };
  }

  // 2. Check all goal CTAs (cross-goal strong match)
  const allGoalCTAs = [
    ...GOAL_CTA.awareness,
    ...GOAL_CTA.consideration,
    ...GOAL_CTA.conversion,
  ];
  for (const w of allGoalCTAs) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) return { found: true, word: w, strength: "medium", goalMatch: false };
  }

  // 3. Expanded generic action words (medium strength)
  const genericCTA = [
    "buy", "shop", "click", "order", "try", "sign up", "signup", "learn", "get",
    "start", "join", "subscribe", "register", "watch", "view", "see",
    "explore", "discover", "download", "claim", "book", "apply", "access",
    "unlock", "request", "activate", "install", "open",
  ];
  for (const w of genericCTA) {
    const re = new RegExp(`\\b${w.replace(/\s+/g, "\\s*")}\\b`, "i");
    if (re.test(lower)) return { found: true, word: w, strength: "medium", goalMatch: false };
  }

  // 4. Weak informational words
  const weakCTA = [
    "more", "details", "info", "visit", "check", "read", "see more",
    "find out", "more info", "read more",
  ];
  for (const w of weakCTA) {
    const re = new RegExp(`\\b${w.replace(/\s+/g, "\\s*")}\\b`, "i");
    if (re.test(lower)) return { found: true, word: w, strength: "weak", goalMatch: false };
  }

  // 5. Visual button heuristic — treat as weak
  if (visualButtonPresent) {
    return { found: true, word: "Button detected", strength: "weak", goalMatch: false };
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

  // Continuous clarity: 100 at ≤10 chars, linear decay, floor 0 at ≥260 chars
  const claritySc = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, textLength - 10) * 0.4)));
  const clarityPass = claritySc >= 60;

  const ctaSc   = ctaGoalMatch ? 100 : (CTA_SCORE_MAP[ctaStrength.toLowerCase()] ?? 0);
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
  ctaStrength:  string;
  goal:         CampaignGoal;
  claritySc:    number;
  brightness:   number;
  contrast:     number;
  crowdSc:      number;
  fitPass:      boolean;
  platform:     Platform;
  imageSize:    string;
}): string[] {
  const { ctaFound, ctaGoalMatch, ctaStrength, goal, claritySc, brightness, contrast,
          crowdSc, fitPass, platform, imageSize } = params;
  const recs = GOAL_CTA[goal].map((w) => `"${w.charAt(0).toUpperCase() + w.slice(1)}"`).join(", ");
  const suggestions: string[] = [];

  // CTA suggestions
  if (!ctaFound) {
    if (goal === "conversion") {
      suggestions.push(`No CTA detected — conversion campaigns live and die by their call-to-action. Place a high-contrast button in the bottom-right area with a direct phrase like ${recs}.`);
    } else if (goal === "consideration") {
      suggestions.push(`No CTA found — mid-funnel audiences need a clear next step to deepen engagement. Try adding ${recs} to guide viewers without pressuring them.`);
    } else {
      suggestions.push(`No CTA is present, which is acceptable for awareness, but adding a soft directive like ${recs} can significantly increase brand recall and top-of-funnel traffic.`);
    }
  } else if (!ctaGoalMatch) {
    if (goal === "awareness" && (ctaStrength === "strong" || ctaStrength === "medium")) {
      suggestions.push(`The CTA feels too aggressive for an Awareness campaign — hard-sell language on cold audiences raises ad fatigue. Soften it to something like ${recs} to reduce friction.`);
    } else {
      suggestions.push(`The current CTA doesn't align with your ${goal} objective. Replace it with a goal-matched option like ${recs} to improve click-through relevance.`);
    }
  }

  // Message clarity
  if (claritySc < 60) {
    suggestions.push("The creative contains too much text — viewers scan banner ads in under 0.3 seconds and absorb only 7 words on average. Cut copy to a single punchy headline and let visuals do the rest.");
  }

  // Brightness
  if (brightness < 30) {
    suggestions.push(`The creative is very dark (brightness: ${brightness}/100), causing it to disappear in both light-mode and dark-mode feeds. Increase the overall exposure or switch to a lighter background palette to improve visibility.`);
  } else if (brightness > 85) {
    suggestions.push(`The creative is overly bright (brightness: ${brightness}/100), which can cause glare and visual fatigue. Tone down the background slightly and use contrast-rich foreground elements to keep the eye engaged.`);
  }

  // Contrast
  if (contrast < 30) {
    suggestions.push(`Low visual contrast (${contrast}/100) means key elements — especially the CTA button and headline — blend into the background. Increase the difference in brightness between text and background to improve legibility and ensure the ad stands out in busy feed environments.`);
  }

  // Layout crowding
  if (crowdSc < 50) {
    suggestions.push(`The layout appears overcrowded — too many elements compete for attention and reduce the viewer's ability to focus on the primary message. Remove at least one visual element and increase whitespace around the CTA.`);
  }

  // Format fit
  if (!fitPass) {
    const valid = [...PLATFORM_SIZES[platform].desktop, ...PLATFORM_SIZES[platform].mobile];
    suggestions.push(`The ad size (${imageSize}) is non-standard for ${platform}. Upload a correctly sized version — supported sizes are: ${valid.join(", ")}. Non-standard sizes risk being cropped, rejected, or penalised by the ad server.`);
  }

  // Awareness-specific contrast
  if (goal === "awareness" && contrast < 50) {
    suggestions.push("Awareness ads compete in crowded feeds against organic content. Boost colour saturation and contrast to create a visual pattern-interrupt — this is the single highest-impact change you can make at the top of the funnel.");
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
        const { text, textLength, ocrConfidence } = await detectText(imageUrl);

        // ── Quality Gate ──────────────────────────────────────────────────────
        const qg = checkImageQuality(px, textLength, ocrConfidence);
        if (!qg.pass) {
          // Return a minimal result flagged as low quality
          const emptyChecks: CoreChecks = {
            noticeability:  { score: 0, label: qg.reason, pass: false },
            messageClarity: { score: 0, label: "—",       pass: false },
            ctaStrength:    { score: 0, label: "—",       pass: false },
            brandPresence:  { score: 0, label: "—",       pass: false },
            crowding:       { score: 0, label: "—",       pass: false },
            formatFit:      { score: 0, label: "—",       pass: false },
          };
          const emptyPlatform: PlatformChecks = {
            desktop: {
              layoutBalance:    { score: 0, pass: false },
              visualHierarchy:  { score: 0, pass: false },
              contentStructure: { score: 0, pass: false },
              placementBlend:   { score: 0, pass: false },
            },
            mobile: {
              readability:   { score: 0, pass: false },
              textDensity:   { score: 0, pass: false },
              ctaSize:       { score: 0, pass: false },
              attentionGrab: { score: 0, pass: false },
            },
          };
          resolve({
            brightness:     px.brightness,
            contrast:       px.contrast,
            text_clarity:   0,
            text_density:   "low",
            layout_score:   0,
            visual_quality: 0,
            goal_fit:       0,
            overall_score:  5,
            cta_presence:   false,
            cta_strength:   "none",
            cta_recommendations: GOAL_CTA[goal],
            coreChecks:       emptyChecks,
            platformChecks:   emptyPlatform,
            adVisibilityScore:       0,
            goalAlignmentIndicator:  0,
            suggestions:  [qg.reason],
            goal,
            platform,
            audienceType,
            imageSize:   size,
            analyzed_at: new Date().toISOString(),
            source:      "local-ai",
            primary_stage:       "Awareness",
            bestFor:             "Awareness",
            goalMatchScore:      0,
            funnelReasoning:     "Analysis skipped due to low image quality.",
            funnelSignals:       [],
            recommendedTemplates:[],
            messaging_intent:    "Educational",
            urgency_level:       "Low",
            audience_type:       "Cold",
            ai_cta_strength:     "None",
            improvement_suggestions: [qg.reason],
            confidence:      "low",
            qualityMessage:  qg.reason,
          });
          return;
        }

        const visualButtonPresent = detectVisualCTAButton(img);
        const cta = detectCTA(text, goal, visualButtonPresent);

        // Continuous clarity: 100 at ≤10 chars, linear decay to 0 at ≥260 chars
        const clarity    = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, textLength - 10) * 0.4)));
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

        const ctaNumeric = CTA_SCORE_MAP[cta.strength] ?? 0;
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

        const ctaANum = CTA_SCORE_MAP[ctaAwareness.strength]     ?? 0;
        const ctaCNum = CTA_SCORE_MAP[ctaConsideration.strength] ?? 0;
        const ctaVNum = CTA_SCORE_MAP[ctaConversion.strength]    ?? 0;

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
          ctaStrength:  cta.strength,
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
          suggestions.push("This creative looks solid across all key quality checks — it is well positioned for launch on this goal and platform.");
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
            cta_strength: "None",
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
          confidence: qg.confidence,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image for local analysis"));
    img.src     = imageUrl;
  });
}
