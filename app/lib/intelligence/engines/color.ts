import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";
import type { IntelligenceSignal } from "../graph/types";
import { makeSignal } from "../graph/signal";

export interface ColorIntelligence {
  palette: string[];
  dominantHue: number | null;
  warmthScore: number;
  contrastScore: number;
  colorHarmony: "analogous" | "complementary" | "mixed" | "unknown";
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
  else hue = 60 * ((rn - gn) / delta + 4);
  return Math.round((hue + 360) % 360);
}

function hex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function harmony(hues: number[]): ColorIntelligence["colorHarmony"] {
  if (hues.length < 2) return "unknown";
  const sorted = [...hues].sort((a, b) => a - b);
  const span = sorted[sorted.length - 1] - sorted[0];
  if (span <= 35) return "analogous";
  if (span >= 150 && span <= 210) return "complementary";
  return "mixed";
}

export async function analyzeColorFromBuffer(imageBuffer: Buffer): Promise<ColorIntelligence> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(imageBuffer)
    .resize(96, 96, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, number>();
  let warmth = 0;
  let contrastMin = 255;
  let contrastMax = 0;
  let samples = 0;
  const channels = info.channels;

  for (let i = 0; i + 2 < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${Math.min(qr, 255)},${Math.min(qg, 255)},${Math.min(qb, 255)}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
    warmth += ((r - b) / 255 + 1) * 50;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    contrastMin = Math.min(contrastMin, luminance);
    contrastMax = Math.max(contrastMax, luminance);
    samples += 1;
  }

  const dominant = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key.split(",").map(Number) as [number, number, number]);
  const hues = dominant.map(([r, g, b]) => rgbToHue(r, g, b));

  return {
    palette: dominant.map(([r, g, b]) => hex(r, g, b)),
    dominantHue: hues[0] ?? null,
    warmthScore: Math.round(samples ? warmth / samples : 0),
    contrastScore: Math.round(((contrastMax - contrastMin) / 255) * 100),
    colorHarmony: harmony(hues),
  };
}

export function emitColorSignals(
  color: ColorIntelligence,
  profile: IntelligenceProfile
): IntelligenceSignal[] {
  const expected = profile.visualPsychology?.colorPalette?.primary ?? [];
  const warmthExpectation =
    expected.some((item) => /red|orange|warm|gold|brown|sunset|appetite/i.test(item)) ? "warm" :
    expected.some((item) => /blue|navy|cyan|teal|green/i.test(item)) ? "cool" :
    "neutral";
  const actualWarmth = color.warmthScore >= 58 ? "warm" : color.warmthScore <= 42 ? "cool" : "neutral";
  const aligned = warmthExpectation === "neutral" || actualWarmth === "neutral" || warmthExpectation === actualWarmth;

  return [
    makeSignal({
      type: aligned ? "color.profile_fit" : "color.profile_mismatch",
      source: "vision",
      confidence: color.palette.length ? 0.68 : 0,
      reasoning: `Palette warmth ${actualWarmth} compared with ${profile.vertical}/${profile.goal} expectation ${warmthExpectation}.`,
      evidence: [
        { kind: "palette", value: color.palette.join(", ") },
        { kind: "warmth_score", value: color.warmthScore },
        { kind: "expected_palette", value: expected.join(", ") },
      ],
      scoreImpact: aligned ? 6 : -10,
      severity: aligned ? "low" : "medium",
    }),
    makeSignal({
      type: color.contrastScore >= 35 ? "color.contrast_ok" : "color.contrast_risk",
      source: "vision",
      confidence: 0.62,
      reasoning: "Contrast is estimated from sampled image luminance spread.",
      evidence: [{ kind: "contrast_score", value: color.contrastScore }],
      scoreImpact: color.contrastScore >= 35 ? 5 : -12,
      severity: color.contrastScore >= 35 ? "low" : "high",
    }),
  ];
}
