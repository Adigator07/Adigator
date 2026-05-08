import { analyzeCreativeWithAI, type CreativeAnalysisResult } from "../../lib/ai";

interface CreativeInsightsPayload {
  extractedText?: string;
  ocrText?: string;
  vertical?: string;
}

interface LegacyAIInsightsResponse {
  contextSummary: string;
  emotion: string;
  insights: string[];
  improvements: string[];
}

function toLegacyShape(result: CreativeAnalysisResult): LegacyAIInsightsResponse {
  return {
    contextSummary: [
      result.vertical && `Vertical: ${result.vertical}`,
      result.hookType && `Hook: ${result.hookType}`,
      result.targetAudience && `Audience: ${result.targetAudience}`,
    ]
      .filter(Boolean)
      .join(" | "),
    emotion: result.emotionalTrigger || "Contextual AI Evaluation",
    insights: [
      `Conversion Score: ${result.conversionScore}/100`,
      `Vertical Fit: ${result.verticalFitScore}/100`,
      ...result.strengths.slice(0, 2),
      ...result.weaknesses.slice(0, 2).map(w => `Weakness: ${w}`),
      ...result.missingElements.map(e => `Missing: ${e}`),
    ]
      .filter(Boolean)
      .slice(0, 5) as string[],
    improvements: result.improvements.slice(0, 4),
  };
}

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json()) as CreativeInsightsPayload;
  const ocrText = String(payload?.ocrText || payload?.extractedText || "").trim();
  const vertical = payload?.vertical || "General";

  if (!ocrText) {
    return Response.json({ error: "Missing OCR text. Provide extractedText or ocrText." }, { status: 400 });
  }

  try {
    const result = await analyzeCreativeWithAI(ocrText, vertical);
    return Response.json({
      ...result,
      aiInsights: toLegacyShape(result),
      provider: "openai",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Creative analysis failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
