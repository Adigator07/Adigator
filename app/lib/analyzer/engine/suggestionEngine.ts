import { CTADetectionResult } from '../agents/ctaAgent';
import { VisualAgentResult } from '../agents/visualAgent';
import { BrandDetectionResult } from '../agents/brandAgent';
import { PlatformResult } from '../agents/platformAgent';

export interface Suggestion {
  type: "fix" | "ab_test" | "info";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dimension: string;
  score: number;
  problem: string;
  impact: { ctr: string; engagement: string } | string;
  fixNow: string;
  fixDeep: string;
  timeEstimate: string;
  abTestIdea?: string;
  datasetNote?: string;
  message: string; // for legacy
  
  // A/B test specific fields
  variant_a?: string;
  variant_b?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  expected_lift?: string;
}

export function generateSuggestions(
  cta: CTADetectionResult,
  visual: VisualAgentResult,
  brand: BrandDetectionResult,
  platform: PlatformResult,
  isOcrLowQuality: boolean = false,
  goal: string = "conversion",
  fallbackColorData?: { colorPalette: string[]; harmonyType: string; warmth: number; contrastScore: number } | null
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const colorData = visual.color ?? fallbackColorData;
  const colorContrast = colorData?.contrastScore ?? 50;

  // ── 1. Fix Blocks (Core Issues) ───────────────────────────────────────────

  // OCR/Readability
  if (isOcrLowQuality || visual.wcag_ratio < 3.0) {
    suggestions.push({
      type: "fix",
      severity: "CRITICAL",
      dimension: "Readability",
      score: Math.round(visual.wcag_ratio * 15),
      problem: "Low text contrast or unclear characters detected.",
      impact: { ctr: "-20% to -35%", engagement: "-15% to -25%" },
      fixNow: "Increase text contrast and use bold fonts.",
      fixDeep: "Restructure visual hierarchy to separate text from complex backgrounds.",
      timeEstimate: "5 mins",
      message: "Text is unclear. Improve font size or contrast for better readability."
    });
  }

  // CTA
  if (cta.score < 60) {
    suggestions.push({
      type: "fix",
      severity: cta.score < 40 ? "CRITICAL" : "HIGH",
      dimension: "CTA Strength",
      score: Math.round(cta.score),
      problem: cta.detected ? "Detected CTA lacks urgency or goal alignment." : "No clear Call to Action detected.",
      impact: { ctr: "-30% to -55%", engagement: "-20% to -40%" },
      fixNow: `Add a clear "${goal === "conversion" ? "Buy Now" : "Learn More"}" button.`,
      fixDeep: "A/B test different CTA positions and color-contrast ratios.",
      timeEstimate: "2 mins",
      message: "Improve CTA for better conversion alignment."
    });
  }

  // Brand
  if (brand.score < 50) {
    suggestions.push({
      type: "fix",
      severity: "HIGH",
      dimension: "Brand Presence",
      score: Math.round(brand.score),
      problem: "Brand elements are small or missing, reducing trust.",
      impact: { ctr: "-10% to -15%", engagement: "-25% to -35% (Recall)" },
      fixNow: "Increase logo size and move to a high-visibility corner.",
      fixDeep: "Integrate brand colors more deeply into the visual theme.",
      timeEstimate: "10 mins",
      message: "Add a visible logo or brand name."
    });
  }

  // Sharpness/Quality
  if (visual.sharpness < 60) {
    suggestions.push({
      type: "fix",
      severity: visual.sharpness < 40 ? "CRITICAL" : "HIGH",
      dimension: "Visual Quality",
      score: Math.round(visual.sharpness),
      problem: "Image is blurred or over-compressed.",
      impact: { ctr: "-15% to -25%", engagement: "-20% to -30%" },
      fixNow: "Upload a high-resolution lossless version.",
      fixDeep: "Ensure export settings match the target platform's specifications.",
      timeEstimate: "3 mins",
      message: "Image lacks sharpness. Avoid over-compression."
    });
  }

  // ── 2. A/B Test Hypotheses ────────────────────────────────────────────────

  if (cta.detected && colorContrast < 50) {
    suggestions.push({
      type: "ab_test",
      severity: "MEDIUM",
      dimension: "Button Contrast",
      score: colorContrast,
      problem: "CTA color blends with background.",
      impact: "Expected lift: +15-25% CTR",
      fixNow: "", fixDeep: "", timeEstimate: "",
      variant_a: "Current CTA Color",
      variant_b: "High-Contrast Complementary Color",
      priority: "HIGH",
      expected_lift: "+22% Estimated Lift",
      message: "Test high-contrast CTA color."
    });
  }

  if (goal === "conversion") {
    suggestions.push({
      type: "ab_test",
      severity: "LOW",
      dimension: "Urgency Testing",
      score: 70,
      problem: "Standard CTA intent.",
      impact: "Expected lift: +8-12% CR",
      fixNow: "", fixDeep: "", timeEstimate: "",
      variant_a: "Learn More",
      variant_b: "Get Started Now",
      priority: "MEDIUM",
      expected_lift: "+12% Estimated Lift",
      message: "Test urgency in CTA."
    });
  }

  return suggestions;
}

