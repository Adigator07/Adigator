// AnalyzerResponse interface and parseAnalyzerResponse for OpenAI output validation
// Copy your JSON schema here and implement runtime validation

import { z } from "zod";

export type AnalyzerSignalLevel = "low" | "moderate" | "high";

export interface AnalyzerExtraction {
  headline: string;
  cta: string;
  brand_presence: AnalyzerSignalLevel;
  readability: AnalyzerSignalLevel;
  text_density: AnalyzerSignalLevel;
  hierarchy_observations: string;
  emotional_cues: string[];
}

export interface AnalyzerAttention {
  first_focus: string;
  friction_points: string[];
}

export interface AnalyzerContext {
  normalized: {
    width: number;
    height: number;
  };
  attention: AnalyzerAttention;
  goal: string;
  audienceStage: string;
  ctaPressure: string;
  urgencyLevel: AnalyzerSignalLevel;
}

export const AnalyzerResponseSchema = z.object({
  vertical_alignment: z.object({
    status: z.enum(["match", "mismatch"]),
    detected_vertical: z.string(),
    selected_vertical: z.string(),
    reason: z.string(),
  }),
  goal_alignment: z.object({
    status: z.enum(["aligned", "weak", "misaligned"]),
    better_suited_goal: z.string().optional(),
    reason: z.string(),
  }),
  performance_prediction: z.object({
    overall_effectiveness_score: z.number().min(0).max(10),
    predicted_ctr: z.string(),
    predicted_cvr: z.string(),
    rationale: z.string(),
  }),
  improvement_opportunities: z.array(z.string()),
  summary: z.string(),
});

export type AnalyzerResponse = z.infer<typeof AnalyzerResponseSchema>;

export function parseAnalyzerResponse(raw: string): AnalyzerResponse {
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error("Malformed JSON from OpenAI: " + message);
  }
  const result = AnalyzerResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "Missing required key or invalid structure: " +
        JSON.stringify(result.error.issues, null, 2)
    );
  }
  return result.data;
}
