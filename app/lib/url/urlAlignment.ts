import OpenAI from "openai";
import type { UrlAlignmentResult } from "@/app/types/urlValidation";
import type { UrlHealthResult } from "@/app/lib/url/healthCheck";
import { CATEGORY_KEYWORDS } from "@/app/constants/programmaticSpecs";

export interface UrlAlignmentInput {
  submittedUrl: string;
  urlHealth: UrlHealthResult | null;
  platform: string;
  objective?: string;
  vertical?: string;
  campaignName?: string;
  creatives?: Array<{ id: string; name: string; size?: string; imageBase64?: string }>;
}

function normalizeUrlForCompare(value: string): string {
  try {
    const parsed = new URL(value.trim().startsWith("http") ? value.trim() : `https://${value.trim()}`);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}${parsed.search}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function scoreCategory(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.reduce((acc, kw) => (lower.includes(kw) ? acc + 1 : acc), 0);
  }
  return scores;
}

function topCategory(scores: Record<string, number>): string | null {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[1] > 0 ? sorted[0][0] : null;
}

function buildHeuristicAlignment(input: UrlAlignmentInput): UrlAlignmentResult {
  const submitted = input.submittedUrl.trim();
  const health = input.urlHealth;
  const finalUrl = health?.finalUrl || submitted;
  const reasons: string[] = [];
  const suggestions: string[] = [];
  let misaligned = false;

  const urlErrors = (health?.flags || []).filter((f) => f.severity === "error");
  if (urlErrors.length > 0) {
    misaligned = true;
    for (const flag of urlErrors) {
      reasons.push(flag.message);
      if (flag.recommendation) suggestions.push(flag.recommendation);
    }
  }

  if (health?.statusCode === 404) {
    misaligned = true;
    reasons.push("The landing page returned 404 Not Found.");
    suggestions.push("Update the URL to a live page that matches your ad creative.");
  }

  const submittedNorm = normalizeUrlForCompare(submitted);
  const finalNorm = normalizeUrlForCompare(finalUrl);
  if (health?.redirectCount && submittedNorm !== finalNorm) {
    misaligned = true;
    reasons.push(`Submitted URL redirects to a different destination (${finalUrl}).`);
    suggestions.push("Confirm the final URL matches the offer shown in your creative, or use the final URL directly.");
  }

  const pageText = [
    input.campaignName || "",
    ...(input.creatives || []).map((c) => c.name),
    health?.pageTitle || "",
    health?.h1 || "",
    ...(health?.ctaTexts || []),
  ].join(" ");

  const pageCategory = topCategory(scoreCategory(pageText));
  const vertical = (input.vertical || "").toLowerCase();
  if (vertical && pageCategory && !vertical.includes(pageCategory.slice(0, 5)) && pageCategory !== "ecommerce") {
    misaligned = true;
    reasons.push(`Landing page content suggests "${pageCategory}" but campaign vertical is "${input.vertical}".`);
    suggestions.push("Use a landing page that matches your selected industry vertical and creative messaging.");
  }

  if (!misaligned && !health?.pageTitle && !health?.h1) {
    reasons.push("Landing page loaded but limited content signals were detected.");
    suggestions.push("Ensure the destination page has a clear headline and offer that mirrors your ad creative.");
  }

  return {
    status: misaligned ? "misaligned" : "aligned",
    submitted_url: submitted,
    final_url: finalUrl || null,
    summary: misaligned
      ? "Landing page URL does not fully match your creative or campaign context."
      : "Landing page URL appears consistent with your submitted destination and campaign context.",
    reasons: reasons.length ? reasons : [misaligned ? "URL-creative mismatch detected." : "URL and page signals look consistent."],
    suggestions: suggestions.length
      ? suggestions
      : misaligned
        ? ["Review the landing page offer, branding, and vertical fit against your uploaded creative."]
        : ["Keep the same URL in your ad platform final URL field to preserve tracking continuity."],
    confidence: misaligned ? 62 : 70,
    source: "heuristic",
    checked_at: new Date().toISOString(),
  };
}

function sanitizeAlignmentResponse(raw: unknown, input: UrlAlignmentInput): UrlAlignmentResult {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const statusRaw = String(record.status || record.alignment || "").toLowerCase();
  const status = statusRaw === "aligned" ? "aligned" : "misaligned";
  const reasons = Array.isArray(record.reasons)
    ? record.reasons.map((r) => String(r)).filter(Boolean).slice(0, 6)
    : [];
  const suggestions = Array.isArray(record.suggestions)
    ? record.suggestions.map((s) => String(s)).filter(Boolean).slice(0, 5)
    : [];
  const summary = String(record.summary || record.message || "").trim()
    || (status === "aligned"
      ? "Landing page URL is aligned with your creative and campaign setup."
      : "Landing page URL is misaligned with your creative or submitted destination.");

  const confidence = Number(record.confidence);
  const finalUrl = input.urlHealth?.finalUrl || input.submittedUrl.trim();

  return {
    status,
    submitted_url: input.submittedUrl.trim(),
    final_url: finalUrl || null,
    summary,
    reasons: reasons.length ? reasons : [summary],
    suggestions: suggestions.length
      ? suggestions
      : status === "misaligned"
        ? ["Update the landing page or final URL so the offer, brand, and vertical match the uploaded creative."]
        : [],
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 85,
    source: "openai",
    checked_at: new Date().toISOString(),
  };
}

export async function evaluateUrlAlignment(input: UrlAlignmentInput): Promise<UrlAlignmentResult> {
  if (!input.submittedUrl?.trim()) {
    return {
      status: "skipped",
      submitted_url: "",
      final_url: null,
      summary: "No landing page URL was provided.",
      reasons: [],
      suggestions: ["Add a landing page URL in Step 2 to validate destination alignment."],
      confidence: 0,
      source: "unavailable",
      checked_at: new Date().toISOString(),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildHeuristicAlignment(input);
  }

  const health = input.urlHealth;
  const creativeSummaries = (input.creatives || [])
    .slice(0, 3)
    .map((c, i) => `#${i + 1} "${c.name}"${c.size ? ` (${c.size})` : ""}`)
    .join("; ");

  const imageCreatives = (input.creatives || [])
    .filter((c) => c.imageBase64)
    .slice(0, 2);

  const userText = [
    "Evaluate whether the user's landing page URL is ALIGNED or MISALIGNED with their ad campaign.",
    "",
    "Mark MISALIGNED if ANY of these apply:",
    "- Submitted URL is broken, invalid, or unreachable",
    "- Final URL after redirects differs materially from user intent or creative offer",
    "- Landing page topic/brand/offer does not match the uploaded creative(s)",
    "- Page vertical or goal mismatch (e.g. finance ad → unrelated blog page)",
    "",
    "Mark ALIGNED only when the URL is reachable AND the landing page clearly supports the creative message and campaign context.",
    "",
    `Platform: ${input.platform}`,
    `Campaign objective: ${input.objective || "awareness"}`,
    `Industry vertical: ${input.vertical || "general"}`,
    `Campaign name: ${input.campaignName || "Campaign"}`,
    `Submitted URL: ${input.submittedUrl.trim()}`,
    `Final URL (after redirects): ${health?.finalUrl || input.submittedUrl.trim()}`,
    `HTTP status: ${health?.statusCode ?? "unknown"}`,
    `Page title: ${health?.pageTitle || "n/a"}`,
    `H1: ${health?.h1 || "n/a"}`,
    `CTA texts on page: ${(health?.ctaTexts || []).slice(0, 8).join(" | ") || "n/a"}`,
    `Creatives: ${creativeSummaries || "none named"}`,
    "",
    "Return JSON only:",
    '{ "status": "aligned"|"misaligned", "confidence": 0-100, "summary": "one sentence", "reasons": ["..."], "suggestions": ["actionable fix 1", "..."] }',
    "Suggestions must be specific and helpful when misaligned.",
  ].join("\n");

  const imageParts = imageCreatives.map((creative) => ({
    type: "image_url" as const,
    image_url: {
      url: creative.imageBase64!.startsWith("data:")
        ? creative.imageBase64!
        : `data:image/jpeg;base64,${creative.imageBase64}`,
      detail: "low" as const,
    },
  }));

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are an expert performance marketing QA analyst.",
            "Judge landing page URL alignment against ad creatives and campaign setup.",
            "Be strict: unrelated destinations, wrong offers, or broken URLs are misaligned.",
            "Provide practical suggestions only when misaligned.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            ...imageParts,
            { type: "text", text: userText },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return buildHeuristicAlignment(input);
    }

    return sanitizeAlignmentResponse(JSON.parse(raw), input);
  } catch (err) {
    console.error("[urlAlignment] OpenAI evaluation failed:", err);
    return buildHeuristicAlignment(input);
  }
}
