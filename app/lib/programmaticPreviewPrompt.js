/**
 * Compact OpenAI prompt for programmatic preview-engine landing page content.
 * Preserves output schema while minimizing input tokens.
 */

const ENV_LABELS = {
  news: "news publisher site",
  commerce: "e-commerce shopping site",
  social: "social content feed",
  luxury: "premium lifestyle brand site",
  sports: "sports news site",
  gaming: "gaming platform",
  finance: "financial news site",
  travel: "travel booking site",
  booking: "local services booking site",
};

export function buildProgrammaticPreviewPrompt(env, vertical, goal, hints) {
  const envLabel = ENV_LABELS[env] || "publisher website";

  return `Generate commercial landing page JSON for a ${envLabel} where display ads appear. NOT a blog or news article.

Context: Vertical=${vertical}|Goal=${goal}|Audience=${hints.audience}|Message=${hints.creativeMessage}|Headline=${hints.headline}|CTA=${hints.ctaText}|Tone=${hints.tone}

Return ONLY JSON:
{"layoutType":"","pageTitle":"","publisherName":"","landingPage":{"hero":{"headline":"","subheadline":"","primaryCta":"","secondaryCta":"","supportingBullets":["","",""],"trustIndicators":["","",""]},"valueProposition":{"sectionTitle":"","features":[{"title":"","description":"","iconIdea":""},{"title":"","description":"","iconIdea":""},{"title":"","description":"","iconIdea":""}]},"socialProof":{"testimonials":[{"quote":"","name":"","role":""},{"quote":"","name":"","role":""},{"quote":"","name":"","role":""}],"ratingSummary":"","trustStatement":""},"offerPromotion":{"headline":"","explanation":"","urgency":"","ctaText":""},"howItWorks":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"benefits":["","","",""],"finalConversion":{"headline":"","valueStatement":"","ctaText":""},"footer":{"companyDescription":"","navigationLinks":["","","",""],"legalMessaging":""}}}

Rules: short conversion copy, max 12 words per headline, modern commercial tone, valid JSON only.`;
}
