import OpenAI from "openai";
import type { UrlAlignmentResult } from "@/app/types/urlValidation";
import type { UrlHealthResult } from "@/app/lib/url/healthCheck";
import { stripUtmFromUrl } from "@/app/lib/utmManagement";

export interface UrlAlignmentInput {
  submittedUrl: string;
  urlHealth: UrlHealthResult | null;
  platform: string;
  objective?: string;
  vertical?: string;
  campaignName?: string;
  campaignBrief?: string;
  adType?: "display" | "video";
  creatives?: Array<{
    id: string;
    name: string;
    size?: string;
    imageBase64?: string;
    adGroupName?: string | null;
    adGroupObjective?: string | null;
  }>;
}

function normalizeUrlForCompare(value: string): string {
  try {
    const cleaned = stripUtmFromUrl(value.trim());
    const parsed = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${host}${path}${parsed.search}`;
  } catch {
    return stripUtmFromUrl(value.trim()).toLowerCase();
  }
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

  // Do not use coarse keyword category matching for vertical alignment here.
  // Step 3 Analysis owns vertical/product fit; false Step 2 "vertical not aligned"
  // warnings must not contradict aligned analysis results for the same page.

  if (!misaligned && !health?.pageTitle && !health?.h1) {
    reasons.push("Landing page loaded but limited content signals were detected.");
    suggestions.push("Ensure the destination page has a clear headline and offer that mirrors your ad creative.");
  }

  const pageAbout = [
    health?.pageTitle,
    health?.h1,
  ].filter(Boolean).join(": ").trim();

  return {
    status: misaligned ? "misaligned" : "aligned",
    submitted_url: submitted,
    final_url: finalUrl || null,
    summary: misaligned
      ? "Landing page URL does not fully match your creative or campaign context."
      : "Landing page URL appears consistent with your submitted destination and campaign context.",
    page_about: pageAbout
      ? pageAbout.slice(0, 220)
      : "Limited page content was detected. Add a clearer headline and offer on the destination.",
    misalignment_reason: misaligned && reasons.length
      ? reasons[0].slice(0, 220)
      : undefined,
    reasons: reasons.length ? reasons : [misaligned ? "URL-creative mismatch detected." : "URL and page signals look consistent."],
    suggestions: suggestions.length
      ? suggestions
      : misaligned
        ? ["Review the landing page offer, branding, and vertical fit against your uploaded creative."]
        : ["Keep the same URL in your ad platform final URL field to preserve tracking continuity."],
    confidence: misaligned ? 62 : 78,
    source: "heuristic",
    checked_at: new Date().toISOString(),
  };
}

function sanitizeAlignmentResponse(raw: unknown, input: UrlAlignmentInput): UrlAlignmentResult {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const statusRaw = String(record.status || record.alignment || "").toLowerCase();
  let status: "aligned" | "misaligned" =
    statusRaw === "aligned" || statusRaw === "misaligned"
      ? statusRaw
      : "aligned";

  const reasons = Array.isArray(record.reasons)
    ? record.reasons.map((r) => String(r)).filter(Boolean).slice(0, 6)
    : [];
  const suggestions = Array.isArray(record.suggestions)
    ? record.suggestions.map((s) => String(s)).filter(Boolean).slice(0, 5)
    : [];

  // Soften taxonomy-only vertical false positives that conflict with healthy landing pages.
  const weakVerticalOnly =
    status === "misaligned"
    && reasons.length > 0
    && reasons.every((reason) => /vertical|industr|categor/i.test(reason))
    && !reasons.some((reason) => /404|unreachable|broken|wrong product|different brand|offer mismatch|redirect/i.test(reason))
    && Boolean(input.urlHealth?.pageTitle || input.urlHealth?.h1)
    && input.urlHealth?.statusCode !== 404;

  if (weakVerticalOnly) {
    status = "aligned";
  }

  const summary = String(record.summary || record.message || "").trim()
    || (status === "aligned"
      ? "Landing page URL is aligned with your creative and campaign setup."
      : "Landing page URL is misaligned with your creative or submitted destination.");

  const confidence = Number(record.confidence);
  const finalUrl = input.urlHealth?.finalUrl || input.submittedUrl.trim();

  const pageAbout = String(record.page_about || record.pageAbout || "").trim();
  const misalignmentReason = String(record.misalignment_reason || record.misalignmentReason || "").trim();
  const health = input.urlHealth;
  const fallbackAbout = [
    health?.pageTitle,
    health?.h1,
  ].filter(Boolean).join(": ").trim();

  return {
    status,
    submitted_url: input.submittedUrl.trim(),
    final_url: finalUrl || null,
    summary: weakVerticalOnly
      ? "Landing page URL is aligned with your campaign. Vertical labels may differ in wording, but the destination matches the campaign context."
      : summary,
    page_about: pageAbout || fallbackAbout?.slice(0, 220) || undefined,
    misalignment_reason: status === "misaligned"
      ? (misalignmentReason || (reasons.length ? reasons[0] : undefined))
      : undefined,
    reasons: status === "aligned"
      ? (reasons.length && !weakVerticalOnly ? reasons : ["URL and page signals look consistent with the campaign brief, goal, and vertical."])
      : (reasons.length ? reasons : [summary]),
    suggestions: suggestions.length
      ? suggestions
      : status === "misaligned"
        ? ["Update the landing page or final URL so the offer, brand, and vertical match the uploaded creative."]
        : [],
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : (status === "aligned" ? 88 : 85),
    source: "openai",
    checked_at: new Date().toISOString(),
  };
}

export async function evaluateUrlAlignment(input: UrlAlignmentInput): Promise<UrlAlignmentResult> {
  const cleanSubmittedUrl = stripUtmFromUrl(input.submittedUrl || "");
  const normalizedInput = { ...input, submittedUrl: cleanSubmittedUrl };

  if (!cleanSubmittedUrl) {
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
    return buildHeuristicAlignment(normalizedInput);
  }

  const health = normalizedInput.urlHealth;
  const creativeSummaries = (input.creatives || [])
    .slice(0, 3)
    .map((c, i) => {
      const groupContext = [c.adGroupName, c.adGroupObjective ? `objective: ${c.adGroupObjective}` : ""]
        .filter(Boolean)
        .join(", ");
      return `#${i + 1} "${c.name}"${c.size ? ` (${c.size})` : ""}${groupContext ? ` [${groupContext}]` : ""}`;
    })
    .join("; ");

  const imageCreatives = (input.creatives || [])
    .filter((c) => c.imageBase64)
    .slice(0, 2);

  const isVideoAd = input.adType === "video";

  const videoRules = [
    "This is a VIDEO ad campaign. Any attached images are POSTER/KEY FRAMES sampled from the video creative.",
    "",
    "Evaluate the landing page for a VIDEO ad across ALL of the following dimensions:",
    "- Product/service match: the page promotes the same product/service featured in the video",
    "- Campaign brief match: the page supports the stated campaign brief and objective/goal",
    "- Creative match: the page continues the story, offer, and message shown in the video frames",
    "- CTA consistency: the page's primary CTA matches the video's call-to-action",
    "- Branding consistency: logo, brand name, and visual identity match the video branding",
    "- Messaging & offer consistency: headline/offer/pricing on the page match what the video promises",
    "- Audience consistency: page tone and content fit the same target audience as the video",
    "- Technical quality: HTTPS enabled, no broken links, minimal/for-purpose redirects, fast page load, mobile-friendly (viewport), overall landing page quality",
    "",
    "Mark MISALIGNED if ANY apply:",
    "- Submitted URL is broken, invalid, or unreachable (4xx/5xx)",
    "- Final URL after redirects differs materially from the video ad's story, offer, or CTA",
    "- Landing page product/brand/offer/audience does not match the video creative",
    "- Not served over HTTPS, not mobile-friendly, or page load is poor",
    "",
    "Mark ALIGNED only when the URL is reachable, secure, mobile-friendly, AND the page clearly continues the video ad's product, message, branding, and CTA.",
    "If the page matches the campaign brief and product, mark ALIGNED even when vertical labels differ slightly in taxonomy wording.",
    "Do NOT evaluate image dimensions, file weight, banner ad sizing, or Responsive Display specs. Those are irrelevant for video ads.",
  ];

  const displayRules = [
    "Mark MISALIGNED if ANY of these apply:",
    "- Submitted URL is broken, invalid, or unreachable",
    "- Final URL after redirects differs materially from user intent or creative offer",
    "- Landing page topic/brand/offer does not match the uploaded creative(s)",
    "- Page clearly promotes a different product category than the campaign (not a naming taxonomy difference)",
    "",
    "Mark ALIGNED when the URL is reachable AND the landing page clearly supports the creative message, campaign brief, selected goal, and selected vertical.",
    "Do NOT mark misaligned only because vertical labels differ in wording (e.g. technology vs consumer electronics) when the page sells the same product.",
  ];

  const briefSnippet = String(input.campaignBrief || "").trim().slice(0, 1800);
  const adGroupObjectives = [...new Set((input.creatives || [])
    .map((creative) => String(creative.adGroupObjective || "").trim())
    .filter(Boolean))];
  const adGroupObjectiveInstruction = adGroupObjectives.length
    ? `Ad group objectives present: ${adGroupObjectives.join(", ")}. Validate creative and landing-page fit against each creative's ad-group objective first; use the campaign objective as broader context only.`
    : "";

  const userText = [
    `Evaluate whether the user's landing page URL is ALIGNED or MISALIGNED with their ${isVideoAd ? "video" : "display"} ad campaign.`,
    "",
    ...(isVideoAd ? videoRules : displayRules),
    "",
    `Platform: ${input.platform}`,
    `Ad type: ${isVideoAd ? "Video ads" : "Display ads"}`,
    `Campaign objective: ${input.objective || "awareness"}`,
    adGroupObjectiveInstruction || "Ad group objectives: none provided.",
    `Industry vertical: ${input.vertical || "general"}`,
    `Campaign name: ${input.campaignName || "Campaign"}`,
    briefSnippet ? `Campaign brief:\n${briefSnippet}` : "Campaign brief: (not provided)",
    `Submitted URL: ${cleanSubmittedUrl}`,
    `Final URL (after redirects): ${health?.finalUrl ? stripUtmFromUrl(health.finalUrl) : cleanSubmittedUrl}`,
    `HTTP status: ${health?.statusCode ?? "unknown"}`,
    `Page title: ${health?.pageTitle || "n/a"}`,
    `H1: ${health?.h1 || "n/a"}`,
    `CTA texts on page: ${(health?.ctaTexts || []).slice(0, 8).join(" | ") || "n/a"}`,
    ...(isVideoAd
      ? [
          `HTTPS/SSL: ${health?.hasSsl ? "yes" : "no"}`,
          `Mobile viewport meta: ${health?.hasViewport ? "yes" : "no"}`,
          `Page load time (ms): ${health?.loadTimeMs ?? "unknown"}`,
          `Redirect count: ${health?.redirectCount ?? 0}`,
        ]
      : []),
    `${isVideoAd ? "Video creatives" : "Creatives"}: ${creativeSummaries || "none named"}`,
    "",
    "Return JSON only:",
    '{ "status": "aligned"|"misaligned", "confidence": 0-100, "summary": "one sentence", "page_about": "brief what the landing page is about", "misalignment_reason": "short why misaligned if applicable", "reasons": ["..."], "suggestions": ["actionable fix 1", "..."] }',
    "Suggestions must be specific and helpful when misaligned.",
    "Consistency rule: if the page clearly matches the brief/product and is reachable, status must be aligned.",
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
            "Judge landing page URL alignment against ad creatives, campaign brief, selected goal, and selected vertical.",
            "Be strict on broken URLs, wrong products, and unrelated destinations.",
            "Do not invent vertical mismatches from taxonomy wording alone when the page clearly matches the product and brief.",
            "Provide practical suggestions only when misaligned.",
            "Never use em dashes in your writing.",
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
      return buildHeuristicAlignment(normalizedInput);
    }

    return sanitizeAlignmentResponse(JSON.parse(raw), normalizedInput);
  } catch (err) {
    console.error("[urlAlignment] OpenAI evaluation failed:", err);
    return buildHeuristicAlignment(normalizedInput);
  }
}
