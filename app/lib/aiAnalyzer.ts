/**
 * aiAnalyzer.ts — Modular AI provider wrapper
 *
 * To swap providers: change the `analyzeWithOpenAI` call in `analyzeCreative`
 * to any other provider function that returns `AnalysisResult`.
 */

export type CampaignGoal = "awareness" | "consideration" | "conversion";

export interface AnalysisResult {
  brightness: number;        // 0–100
  contrast: number;          // 0–100
  cta_presence: boolean;
  cta_strength: "none" | "weak" | "medium" | "strong";
  text_clarity: number;      // 0–100
  text_density: "low" | "medium" | "high";
  layout_score: number;      // 0–100
  visual_quality: number;    // 0–100 (composite visual metric)
  goal_fit: number;          // 0–100
  overall_score: number;     // 0–100 (weighted)
  suggestions: string[];
  goal: CampaignGoal;
  analyzed_at: string;
}

// ── Weighted Scoring ──────────────────────────────────────────────────────────
// Visual Quality → 25%  |  CTA Strength → 25%  |  Text Clarity → 20%
// Layout         → 15%  |  Goal Alignment → 15%
function applyWeightedScore(raw: Omit<AnalysisResult, "overall_score" | "analyzed_at">): number {
  const ctaMap: Record<string, number> = { none: 0, weak: 33, medium: 66, strong: 100 };
  const ctaScore = ctaMap[raw.cta_strength] ?? 0;
  return Math.round(
    raw.visual_quality * 0.25 +
    ctaScore           * 0.25 +
    raw.text_clarity   * 0.20 +
    raw.layout_score   * 0.15 +
    raw.goal_fit       * 0.15
  );
}

// ── OpenAI GPT-4o Vision Provider ────────────────────────────────────────────
async function analyzeWithOpenAI(imageUrl: string, goal: CampaignGoal): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in environment variables.");

  const goalContext: Record<CampaignGoal, string> = {
    awareness:     "Goal is AWARENESS: prioritize high visual clarity, vibrant colors, low text clutter, strong brand presence.",
    consideration: "Goal is CONSIDERATION: prioritize balanced information, clear value proposition, moderate CTA.",
    conversion:    "Goal is CONVERSION: prioritize strong CTA presence, high contrast, clear direct message, urgency cues.",
  };

  const systemPrompt = `You are an expert programmatic advertising analyst specializing in digital ad creative assessment.
Analyze the provided ad creative image and return ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:

{
  "brightness": <integer 0-100, overall image brightness>,
  "contrast": <integer 0-100, visual contrast quality>,
  "cta_presence": <true or false>,
  "cta_strength": <"none"|"weak"|"medium"|"strong">,
  "text_clarity": <integer 0-100, readability and text legibility>,
  "text_density": <"low"|"medium"|"high">,
  "layout_score": <integer 0-100, visual hierarchy and object placement>,
  "visual_quality": <integer 0-100, composite visual quality considering color, composition, professionalism>,
  "goal_fit": <integer 0-100, how well this creative aligns with the campaign goal>,
  "suggestions": [<array of 3-5 concise, actionable improvement strings>]
}

${goalContext[goal]}
Be precise and consistent. Score 0-100 where 100 is perfect.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 800,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `Analyze this ad creative for ${goal} campaign goal. Return only the JSON object.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  // Strip any accidental markdown code fences
  const cleaned = content.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content}`);
  }

  const raw = {
    brightness:    Math.min(100, Math.max(0, Number(parsed.brightness)    || 50)),
    contrast:      Math.min(100, Math.max(0, Number(parsed.contrast)      || 50)),
    cta_presence:  Boolean(parsed.cta_presence),
    cta_strength:  (["none","weak","medium","strong"].includes(parsed.cta_strength) ? parsed.cta_strength : "none") as AnalysisResult["cta_strength"],
    text_clarity:  Math.min(100, Math.max(0, Number(parsed.text_clarity)  || 50)),
    text_density:  (["low","medium","high"].includes(parsed.text_density)  ? parsed.text_density : "medium") as AnalysisResult["text_density"],
    layout_score:  Math.min(100, Math.max(0, Number(parsed.layout_score)  || 50)),
    visual_quality:Math.min(100, Math.max(0, Number(parsed.visual_quality)|| 50)),
    goal_fit:      Math.min(100, Math.max(0, Number(parsed.goal_fit)      || 50)),
    suggestions:   Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    goal,
  };

  return {
    ...raw,
    overall_score: applyWeightedScore(raw),
    analyzed_at: new Date().toISOString(),
  };
}

// ── Main Export ───────────────────────────────────────────────────────────────
// 👇 Swap provider here — just replace analyzeWithOpenAI with another function
export async function analyzeCreative(imageUrl: string, goal: CampaignGoal): Promise<AnalysisResult> {
  return analyzeWithOpenAI(imageUrl, goal);
}
