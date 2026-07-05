import fs from "fs";

const path = "app/api/analyze-creative/route.ts";
const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);

const importBlock = `import {
  createOpenAIClient,
  extractSignalsWithRetry,
  normalizeExtraction,
  normalizeImageForVision,
  buildExtractionSystemPrompt,
  applyPlatformToneGuard,
  type ExtractionSignals,
  type ExtractionMeta,
  type PlatformContext,
  type CampaignGoal,
} from "@/app/lib/engines/creativeExtraction";`;

const idx = (prefix) => lines.findIndex((l) => l.startsWith(prefix));

// Find import insertion point (after campaignBriefValidation import block)
const insertAt = lines.findIndex((l) => l.includes('from "@/app/lib/campaignBriefValidation"')) + 1;

const removeRanges = [
  [idx("interface ExtractionSignals"), idx("interface AttentionAnalysis")],
  [idx("interface ExtractionMeta"), idx("interface AIAnalysisOutput")],
  [idx("function createOpenAIClient"), idx("function normalizeGoal")],
  [idx("function normalizeSignalLevel"), idx("function classifyCtaPressure")],
  [idx("async function normalizeImageForVision"), idx("function buildGoalPromptSection")],
  [idx("function buildGoalPromptSection"), idx("function mergeProgrammaticAdsDynamicEval")],
  [idx("const EXTRACTION_SYSTEM_PROMPT"), lines.length],
];

const removeSet = new Set();
for (const [start, end] of removeRanges) {
  if (start < 0 || end < 0) continue;
  for (let i = start; i < end; i += 1) removeSet.add(i);
}

// Remove duplicate type definitions that moved to creativeExtraction
const typeLines = [
  idx('type PlatformContext = "google_ads"'),
  idx('type CampaignGoal = "awareness"'),
];
for (const start of typeLines) {
  if (start >= 0) removeSet.add(start);
}

const next = [];
for (let i = 0; i < lines.length; i += 1) {
  if (removeSet.has(i)) continue;
  if (i === insertAt) {
    next.push(importBlock);
  }
  next.push(lines[i]);
}

fs.writeFileSync(path, next.join("\n"));
console.log("updated route.ts, removed", removeSet.size, "lines");
