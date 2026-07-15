import {
  buildBriefIntentSummary,
  buildCampaignIntentFromBrief,
} from "@/app/lib/campaignBriefValidation";

export type TargetAudienceInsight = {
  /** One-sentence overview of who the campaign is for. */
  description: string;
  /** Short label e.g. "Students & first-time Mac buyers". */
  customerType: string;
  primaryAudience: string[];
  secondaryAudience: string[];
  interests: string[];
  /** Compact demographics line or structured cues. */
  demographics: string;
  ageRange: string;
  gender: string;
  income: string;
  education: string;
  location: string;
  purchaseIntent: string[];
  remarketing: string[];
};

export type CampaignBriefInsights = {
  campaignIntent: string;
  targetAudience: TargetAudienceInsight;
  source: "openai" | "local";
};

export type CampaignBriefInsightsInput = {
  campaignBrief: string;
  campaignGoal?: string;
  vertical?: string;
  platform?: string;
};

export function emptyAudience(): TargetAudienceInsight {
  return {
    description: "",
    customerType: "",
    primaryAudience: [],
    secondaryAudience: [],
    interests: [],
    demographics: "",
    ageRange: "",
    gender: "",
    income: "",
    education: "",
    location: "",
    purchaseIntent: [],
    remarketing: [],
  };
}

function stripAiDashes(value: string): string {
  return value
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ",")
    .trim();
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripAiDashes(String(item || "").trim()))
      .filter((item) => item.length > 1);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;\n]/)
      .map((part) => stripAiDashes(part.trim()))
      .filter((part) => part.length > 1);
  }
  return [];
}

const GENERIC_AUDIENCE_PHRASES = [
  /^everyone$/i,
  /^online (users|shoppers|consumers)$/i,
  /^people interested in (the )?product/i,
  /^prospective customers$/i,
  /^target audience$/i,
  /^millennials$/i,
  /^gen[- ]?z$/i,
  /^tech lovers$/i,
  /^digital consumers$/i,
  /^general public$/i,
];

function isGenericAudienceLabel(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3) return true;
  return GENERIC_AUDIENCE_PHRASES.some((pattern) => pattern.test(trimmed));
}

function uniqueList(values: string[], max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned || isGenericAudienceLabel(cleaned)) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= max) break;
  }
  return out;
}

/** Deterministic fallback — safe for client bundles (no Node/OpenAI deps). */
export function buildLocalCampaignBriefInsights(
  input: CampaignBriefInsightsInput,
): CampaignBriefInsights | null {
  const brief = input.campaignBrief?.trim() || "";
  if (!brief) return null;

  const options = {
    campaignGoal: input.campaignGoal,
    vertical: input.vertical,
  };
  const summary = buildBriefIntentSummary(brief, options);
  const intent =
    buildCampaignIntentFromBrief(brief, options)
    || summary?.narrative
    || "";

  if (!intent && !summary) return null;

  const productRaw = summary?.productOrService || "";
  const product =
    productRaw && productRaw !== "The product or service described in the brief"
      ? productRaw
      : "";
  const productShort = product.replace(/\s+/g, " ").trim();
  const audienceHint =
    summary?.targetAudience
    && summary.targetAudience !== "The audience segment referenced in the brief"
      ? summary.targetAudience
      : "";

  const isLaptop = /macbook|laptop|notebook|computer/i.test(brief) || /macbook|laptop/i.test(productShort);
  const isApple = /apple|macbook|iphone|ipad|macos/i.test(brief) || /apple|macbook/i.test(productShort);
  const categoryNoun = isLaptop ? "laptop" : productShort ? productShort : "product";

  const primaryAudience = uniqueList([
    audienceHint,
    /student|college|university/i.test(brief)
      ? `Students (college and university) researching a ${categoryNoun}`
      : "",
    /first[- ]time|new to|never (owned|had)/i.test(brief)
      ? `First-time ${productShort || categoryNoun} buyers`
      : "",
    /young professional|early career|22[-–]35|graduate/i.test(brief)
      || (/professional/i.test(brief) && /student|macbook|laptop/i.test(brief))
      ? "Young professionals (22–35)"
      : /professional|career|office/i.test(brief)
        ? "Working professionals"
        : "",
    /freelance|creator|designer|writer|marketer|developer/i.test(brief)
      ? "Freelancers (designers, writers, marketers, developers)"
      : "",
    /remote|hybrid/i.test(brief) ? "Remote and hybrid workers" : "",
    /content creator|social media|influencer|creator/i.test(brief)
      ? "Content creators and social media creators"
      : "",
    isApple
      ? "Existing iPhone and Apple ecosystem users looking for their first Mac"
      : "",
  ].filter(Boolean), 8);

  const secondaryAudience = uniqueList([
    /parent|family|guardian/i.test(brief) || /student/i.test(brief)
      ? "Parents buying for students"
      : "",
    /business|smb|small business|entrepreneur/i.test(brief)
      ? "Small business owners"
      : "",
    /windows|switch|upgrade|older|replace/i.test(brief) || isApple
      ? "Professionals upgrading from older Windows laptops"
      : "",
    /budget|value|deal|afford|under \$|premium budget/i.test(brief) || isLaptop
      ? "Budget-conscious premium laptop shoppers"
      : "",
    /apple intelligence|ai|silicon|m[0-9]|tech enthusiast/i.test(brief) || isApple
      ? "Tech enthusiasts interested in Apple Intelligence and the latest Apple silicon"
      : /enthusiast|early adopter/i.test(brief)
        ? "Tech enthusiasts and early adopters"
        : "",
  ].filter(Boolean), 6);

  const interests = uniqueList([
    productShort,
    input.vertical ? input.vertical.replace(/_/g, " ") : "",
    isApple ? "Apple" : "",
    isLaptop || /macbook/i.test(brief) ? "MacBook" : "",
    isApple ? "iPhone" : "",
    isApple ? "iPad" : "",
    /apple intelligence|ai/i.test(brief) ? "Apple Intelligence" : "",
    isLaptop || /tech|electronics/i.test(brief) ? "Technology" : "",
    isLaptop ? "Consumer Electronics" : "",
    /productiv|office|work/i.test(brief) ? "Productivity Apps" : "",
    /design|figma|adobe|creative|canva/i.test(brief) ? "Graphic Design" : "",
    /video|edit|youtube/i.test(brief) ? "Video Editing" : "",
    /code|programming|developer|software/i.test(brief) ? "Programming" : "",
    /education|learn|student|college/i.test(brief) ? "Education" : "",
    /online learning|course|mooc/i.test(brief) || /student/i.test(brief)
      ? "Online Learning"
      : "",
    /remote|hybrid/i.test(brief) ? "Remote Work" : "",
    /adobe|figma|canva|creative software/i.test(brief)
      ? "Creative Software (Adobe, Figma, Canva)"
      : "",
    /game|gaming/i.test(brief) ? "Gaming (casual)" : "",
    /ai|intelligence|chatgpt|llm/i.test(brief) ? "AI Tools" : "",
    /office|productivity|docs|sheets/i.test(brief)
      ? "Productivity & Office Software"
      : "",
  ].filter(Boolean), 16);

  const purchaseIntent = uniqueList([
    /student|college/i.test(brief) ? "Best laptop for students" : "",
    isLaptop || /premium|budget/i.test(brief)
      ? "Best laptop under premium budget"
      : "",
    isApple || /macbook|deal/i.test(brief) ? "MacBook deals" : "",
    /code|programming|developer/i.test(brief) ? "Laptop for coding" : "",
    /college|university|student/i.test(brief) ? "Laptop for college" : "",
    /video|edit/i.test(brief) ? "Laptop for video editing" : "",
    /windows|switch/i.test(brief) || isApple ? "Windows to Mac switch" : "",
    isApple ? "Apple products" : productShort ? `${productShort} purchase intent` : "",
    /pre-?order/i.test(brief) ? `${productShort || categoryNoun} pre-order` : "",
  ].filter(Boolean), 10);

  const remarketing = uniqueList([
    isApple ? "Apple website visitors" : "Brand website visitors",
    productShort
      ? `Users who viewed ${productShort} product pages`
      : "Users who viewed product pages",
    /cart|checkout|pre-?order|purchase/i.test(brief)
      ? "Cart abandoners"
      : "Cart abandoners",
    isApple ? "Existing Apple device owners" : "Existing brand device / account owners",
    /email|subscriber|crm|newsletter/i.test(brief) ? "Email subscribers" : "Email subscribers",
    isApple || /upgrade|previous|existing/i.test(brief)
      ? "Previous MacBook customers due for an upgrade"
      : "Previous customers due for an upgrade",
  ].filter(Boolean), 8);

  const ageRange = /student|college/i.test(brief)
    ? "18–40 years"
    : /professional|business/i.test(brief)
      ? "22–45 years"
      : "18–40 years";

  const customerType = primaryAudience.slice(0, 2).join(" & ")
    || (productShort ? `${productShort} shoppers` : "Core buyers from the brief");

  const income = /premium|pro|high[- ]end|apple/i.test(brief) || isApple
    ? "Middle to High Income"
    : "Middle Income+";
  const education = /student|college|university/i.test(brief)
    ? "College students, graduates, professionals"
    : "Graduates and professionals";
  const location = "Urban and Tier 1/Tier 2 cities";

  const demographicsParts = [
    `Age: ${ageRange}`,
    "Gender: All",
    `Income: ${income}`,
    `Education: ${education}`,
    `Location: ${location}`,
  ];

  return {
    campaignIntent: intent,
    targetAudience: {
      description:
        primaryAudience.length > 0
          ? `People most likely to engage with ${productShort || "this offer"}: ${primaryAudience.slice(0, 3).join("; ")}.`
          : audienceHint || `Audience inferred for ${productShort || "this campaign"}.`,
      customerType,
      primaryAudience: primaryAudience.length ? primaryAudience : [customerType],
      secondaryAudience,
      interests,
      demographics: demographicsParts.join(" · "),
      ageRange,
      gender: "All",
      income,
      education,
      location,
      purchaseIntent,
      remarketing,
    },
    source: "local",
  };
}

export function normalizeAudience(raw: unknown): TargetAudienceInsight {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const demographicsObj =
    row.demographics && typeof row.demographics === "object"
      ? (row.demographics as Record<string, unknown>)
      : null;

  const ageRange = stripAiDashes(String(row.age_range || row.ageRange || demographicsObj?.age || demographicsObj?.age_range || "").trim());
  const gender = stripAiDashes(String(row.gender || demographicsObj?.gender || "").trim());
  const income = stripAiDashes(String(row.income || demographicsObj?.income || "").trim());
  const education = stripAiDashes(String(row.education || demographicsObj?.education || "").trim());
  const location = stripAiDashes(String(row.location || demographicsObj?.location || "").trim());

  const demographicsLine = typeof row.demographics === "string"
    ? stripAiDashes(row.demographics.trim())
    : [
        ageRange ? `Age: ${ageRange}` : "",
        gender ? `Gender: ${gender}` : "",
        income ? `Income: ${income}` : "",
        education ? `Education: ${education}` : "",
        location ? `Location: ${location}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

  const primaryAudience = uniqueList(
    asStringList(row.primary_audience || row.primaryAudience),
    10,
  );
  const secondaryAudience = uniqueList(
    asStringList(row.secondary_audience || row.secondaryAudience),
    10,
  );

  return {
    description: stripAiDashes(String(row.description || row.summary || "").trim()),
    customerType:
      stripAiDashes(String(row.customer_type || row.customerType || "").trim())
      || primaryAudience.slice(0, 2).join(" & "),
    primaryAudience,
    secondaryAudience,
    interests: uniqueList(asStringList(row.interests || row.interest_targeting || row.interestTargeting), 16),
    demographics: demographicsLine,
    ageRange,
    gender,
    income,
    education,
    location,
    purchaseIntent: uniqueList(
      asStringList(row.purchase_intent || row.purchaseIntent || row.purchase_intent_audience),
      12,
    ),
    remarketing: uniqueList(
      asStringList(row.remarketing || row.remarketing_audience || row.remarketingAudience),
      10,
    ),
  };
}

function mergeAudience(
  primary: TargetAudienceInsight,
  fallback: TargetAudienceInsight | undefined,
): TargetAudienceInsight {
  if (!fallback) return primary;
  return {
    description: primary.description || fallback.description,
    customerType: primary.customerType || fallback.customerType,
    primaryAudience: primary.primaryAudience.length ? primary.primaryAudience : fallback.primaryAudience,
    secondaryAudience: primary.secondaryAudience.length ? primary.secondaryAudience : fallback.secondaryAudience,
    interests: primary.interests.length ? primary.interests : fallback.interests,
    demographics: primary.demographics || fallback.demographics,
    ageRange: primary.ageRange || fallback.ageRange,
    gender: primary.gender || fallback.gender,
    income: primary.income || fallback.income,
    education: primary.education || fallback.education,
    location: primary.location || fallback.location,
    purchaseIntent: primary.purchaseIntent.length ? primary.purchaseIntent : fallback.purchaseIntent,
    remarketing: primary.remarketing.length ? primary.remarketing : fallback.remarketing,
  };
}

export function normalizeCampaignBriefInsights(
  raw: Record<string, unknown>,
  fallback: CampaignBriefInsights | null,
): CampaignBriefInsights | null {
  const campaignIntent = stripAiDashes(String(
    raw.campaign_intent || raw.campaignIntent || raw.intent || fallback?.campaignIntent || "",
  ).trim());

  const targetAudience = mergeAudience(
    normalizeAudience(raw.target_audience || raw.targetAudience || {}),
    fallback?.targetAudience,
  );

  const hasAudienceSignal = Boolean(
    targetAudience.description
    || targetAudience.primaryAudience.length
    || targetAudience.secondaryAudience.length
    || targetAudience.interests.length
    || targetAudience.purchaseIntent.length
    || targetAudience.demographics,
  );

  if (!campaignIntent && !hasAudienceSignal && !fallback) return null;

  return {
    campaignIntent: campaignIntent || fallback?.campaignIntent || "",
    targetAudience: hasAudienceSignal ? targetAudience : fallback?.targetAudience || emptyAudience(),
    source: "openai",
  };
}
