/**
 * Compact OpenAI prompt for programmatic preview-engine landing page content.
 */

const ENV_LABELS = {
  news: "news publisher website with article pages and display ad slots",
  blog: "editorial blog with long-form posts and in-article ad placements",
  native_display: "publisher site with native in-feed sponsored content and recommendation modules",
  health: "health and wellness publisher site with medical/wellness editorial content",
};

const VERTICAL_TOPIC_RULES = {
  healthcare: "Topics must cover patient care, wellness, treatment options, or health outcomes only.",
  technology: "Topics must cover software, hardware, digital products, or tech services only — never unrelated industries.",
  finance: "Topics must cover banking, investing, insurance, or business finance only.",
  ecommerce: "Topics must cover retail products, shopping, offers, and product discovery only.",
  food: "Topics must cover dining, recipes, food brands, or culinary experiences only.",
  travel: "Topics must cover destinations, trips, hospitality, or travel services only.",
  gaming: "Topics must cover games, esports, entertainment platforms, or gaming products only.",
  fashion: "Topics must cover apparel, style, luxury retail, or fashion brands only.",
  automotive: "Topics must cover vehicles, mobility, auto brands, or driving experiences only.",
  real_estate: "Topics must cover property, housing, mortgages, or real estate services only.",
  education: "Topics must cover learning, courses, edtech, or academic outcomes only.",
  fitness: "Topics must cover training, wellness programs, gyms, or fitness products only.",
  hotels: "Topics must cover hospitality, stays, bookings, or hotel brands only.",
  banking: "Topics must cover financial products, accounts, lending, or fintech services only.",
};

function verticalTopicRule(vertical) {
  const key = String(vertical || "").toLowerCase().replace(/[^a-z]/g, "");
  return VERTICAL_TOPIC_RULES[key]
    || `All editorial headlines, articles, testimonials, and publisher naming must stay strictly within the ${vertical || "selected"} vertical. Never mention unrelated apps, industries, or generic viral social topics.`;
}

export function buildProgrammaticPreviewPrompt(env, vertical, goal, hints) {
  const envLabel = ENV_LABELS[env] || "publisher website";
  const verticalKey = String(vertical || "").toLowerCase().replace(/[^a-z]/g, "");
  const nativeTheme = env === "native_display"
    ? "Style native recommendation modules and surrounding editorial stories like a premium publisher feed — not a generic social app."
    : "";

  const campaignBlock = [
    hints.brand ? `Brand=${hints.brand}` : "",
    hints.advertiserName ? `Advertiser=${hints.advertiserName}` : "",
    hints.campaignName ? `Campaign=${hints.campaignName}` : "",
    hints.campaignBrief ? `Brief=${hints.campaignBrief}` : "",
    hints.campaignIntent ? `Intent=${hints.campaignIntent}` : "",
    hints.productFocus ? `ProductFocus=${hints.productFocus}` : "",
    hints.offerType ? `Offer=${hints.offerType}` : "",
  ].filter(Boolean).join("|");

  return `Generate commercial landing page JSON for a ${envLabel} where display ads appear.

Campaign context: Vertical=${vertical}|Goal=${goal}|Audience=${hints.audience}|Message=${hints.creativeMessage}|Headline=${hints.headline}|CTA=${hints.ctaText}|Tone=${hints.tone}${campaignBlock ? `|${campaignBlock}` : ""}
Creative signals: Brand=${hints.brand}|Product=${hints.product}|Topic=${hints.topic}|Visual=${hints.visualSummary}
${nativeTheme}

Vertical rule: ${verticalTopicRule(verticalKey || vertical)}

Return ONLY JSON:
{"layoutType":"","pageTitle":"","publisherName":"","landingPage":{"hero":{"headline":"","subheadline":"","primaryCta":"","secondaryCta":"","supportingBullets":["","",""],"trustIndicators":["","",""]},"valueProposition":{"sectionTitle":"","features":[{"title":"","description":"","iconIdea":""},{"title":"","description":"","iconIdea":""},{"title":"","description":"","iconIdea":""}]},"socialProof":{"testimonials":[{"quote":"","name":"","role":""},{"quote":"","name":"","role":""},{"quote":"","name":"","role":""}],"ratingSummary":"","trustStatement":""},"offerPromotion":{"headline":"","explanation":"","urgency":"","ctaText":""},"howItWorks":[{"title":"","description":""},{"title":"","description":""},{"title":"","description":""}],"benefits":["","","",""],"finalConversion":{"headline":"","valueStatement":"","ctaText":""},"footer":{"companyDescription":"","navigationLinks":["","","",""],"legalMessaging":""}}}

Rules:
- Every headline, article angle, testimonial, and publisher name must reflect the campaign brief, intent, brand, and ${vertical} vertical.
- Do NOT invent unrelated apps, social networks, chip news, hiking stories, or generic viral content.
- Use the creative message and CTA from the uploaded creative wherever possible.
- publisherName should sound like a credible ${vertical} publisher — not "Flair" or random app names.
- short conversion copy, max 12 words per headline, modern commercial tone, valid JSON only.`;
}

export function mapProgrammaticTemplateToRenderer(templateId) {
  if (templateId === "native_display") return "native_display";
  if (templateId === "blog") return "news";
  if (templateId === "health") return "news";
  return "news";
}
