/**
 * Compact OpenAI prompt for programmatic preview-engine landing page content.
 */

const ENV_LABELS = {
  news: "news publisher website with article pages and display ad slots",
  blog: "content blog with editorial posts and in-article ad placements",
  native_display: "publisher site with native in-feed sponsored content modules",
  health: "health and wellness publisher site with medical/wellness editorial content",
};

const NATIVE_VERTICAL_HINTS = {
  healthcare: "Use calming greens, wellness typography, and health editorial tone.",
  technology: "Use clean tech blues, product-review tone, and modern sans-serif styling.",
  finance: "Use trustworthy navy/gold palette and business editorial tone.",
  ecommerce: "Use retail-focused product discovery tone and commerce accents.",
  food: "Use warm food/lifestyle colors and recipe or dining editorial tone.",
  travel: "Use aspirational travel imagery tone and destination editorial styling.",
  gaming: "Use energetic gaming palette and entertainment editorial tone.",
  fashion: "Use premium fashion/lifestyle styling and editorial photography tone.",
};

export function buildProgrammaticPreviewPrompt(env, vertical, goal, hints) {
  const envLabel = ENV_LABELS[env] || "publisher website";
  const verticalKey = String(vertical || "").toLowerCase().replace(/[^a-z]/g, "");
  const nativeTheme = env === "native_display"
    ? (NATIVE_VERTICAL_HINTS[verticalKey] || `Adapt colors, publisher name, and article topics to the ${vertical || "campaign"} vertical.`)
    : "";

  return `Generate commercial landing page JSON for a ${envLabel} where display ads appear.

Context: Vertical=${vertical}|Goal=${goal}|Audience=${hints.audience}|Message=${hints.creativeMessage}|Headline=${hints.headline}|CTA=${hints.ctaText}|Tone=${hints.tone}
${nativeTheme ? `Native display styling: ${nativeTheme}` : ""}

Return ONLY JSON:
{"layoutType":"","pageTitle":"","publisherName":"","landingPage":{"hero":{"headline":"","subheadline":"","primaryCta":"","secondaryCta":"","supportingBullets":["","",""],"trustIndicators":["","",""]},"valueProposition":{"sectionTitle":"","features":[{"title":"","description":"","iconIdea":""},{"title":"","description":"","iconIdea":""},{"title":"","description":"","iconIdea":""}]},"socialProof":{"testimonials":[{"quote":"","name":"","role":""},{"quote":"","name":"","role":""},{"quote":"","name":"","role":""}],"ratingSummary":"","trustStatement":""},"offerPromotion":{"headline":"","explanation":"","urgency":"","ctaText":""},"howItWorks":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"benefits":["","","",""],"finalConversion":{"headline":"","valueStatement":"","ctaText":""},"footer":{"companyDescription":"","navigationLinks":["","","",""],"legalMessaging":""}}}

Rules: short conversion copy, max 12 words per headline, modern commercial tone, valid JSON only.`;
}

export function mapProgrammaticTemplateToRenderer(templateId) {
  if (templateId === "blog" || templateId === "native_display") return "social";
  if (templateId === "health") return "news";
  return "news";
}
