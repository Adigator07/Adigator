// MASTER_SYSTEM_PROMPT for Ad Creative Analyzer
// Runtime: inject platform brain + goal + vertical via buildExtractionSystemPrompt in route.ts

import {
  ADIGATOR_ANALYZER_IDENTITY,
  buildActivePlatformBrainPrompt,
  buildFinalValidationChecklist,
  type AnalyzerPlatform,
} from "./platformBrain";

export function buildMasterSystemPrompt(
  platform: AnalyzerPlatform,
  goal: string,
  vertical: string,
  goalPromptSection: string,
): string {
  return [
    ADIGATOR_ANALYZER_IDENTITY,
    buildActivePlatformBrainPrompt(platform),
    goalPromptSection,
    buildFinalValidationChecklist(platform, goal, vertical),
    "Output a structured JSON object matching the provided schema. No markdown outside JSON.",
  ].join("\n\n");
}

/** @deprecated Use buildMasterSystemPrompt — placeholders kept for legacy references */
export const MASTER_SYSTEM_PROMPT = `
You are an advertising creative intelligence system inside Adigator.
Platform: {{PLATFORM}}
Campaign Goal: {{GOAL}}
Industry Vertical: {{VERTICAL}}

Analyze ONLY using the active platform brain injected at runtime.
Output JSON matching the schema. No generic cross-platform feedback.
`;
