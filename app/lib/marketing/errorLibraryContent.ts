export type CampaignError = {
  id: string;
  title: string;
  tags: string[];
  scenario: string;
  businessImpact: string;
  detectionLogic: string;
  recommendedAction: string;
};

export const CAMPAIGN_ERRORS: CampaignError[] = [
  {
    id: "wrong-creative",
    title: "Wrong Creative",
    tags: ["Creative", "Alignment"],
    scenario: "An outdated or incorrect creative version is attached to the campaign flight.",
    businessImpact: "Brand inconsistency, wasted impressions, and rapid client dissatisfaction.",
    detectionLogic: "Compare creative identity and version metadata against the approved campaign package and brief intent.",
    recommendedAction: "Quarantine mismatched versions, restore the approved set, and re-run creative validation before trafficking.",
  },
  {
    id: "wrong-landing-page",
    title: "Wrong Landing Page",
    tags: ["Destination", "Conversion"],
    scenario: "Ads resolve to a page that does not match the creative promise or market.",
    businessImpact: "Conversion collapse and credibility damage across the paid journey.",
    detectionLogic: "Validate destination URL association and semantic continuity between creative claims and page content.",
    recommendedAction: "Correct destination mapping, confirm offer continuity, and block launch until alignment passes.",
  },
  {
    id: "broken-url",
    title: "Broken URL",
    tags: ["Destination", "Technical"],
    scenario: "A destination returns errors, dead redirects, or unreachable hosts.",
    businessImpact: "Immediate spend waste and visible operational failure.",
    detectionLogic: "Probe URL reachability, redirect chains, and terminal status before execution.",
    recommendedAction: "Replace or repair destinations and require a clean health check before any traffic is enabled.",
  },
  {
    id: "offer-mismatch",
    title: "Offer Mismatch",
    tags: ["Creative", "Landing"],
    scenario: "Creative promotes a price, promotion, or benefit that the landing page does not support.",
    businessImpact: "Trust erosion, compliance exposure, and poor conversion quality.",
    detectionLogic: "Extract offer entities from creative and landing content, then flag conflicts against campaign intelligence.",
    recommendedAction: "Synchronize offer language across assets or pause creatives until the destination reflects the claim.",
  },
  {
    id: "cta-mismatch",
    title: "CTA Mismatch",
    tags: ["Creative", "UX"],
    scenario: "CTA language in creative does not match page actions or user expectations.",
    businessImpact: "Friction in the conversion path and weaker post-click performance.",
    detectionLogic: "Compare creative CTA verbs/intents with primary on-page actions and funnel steps.",
    recommendedAction: "Align CTA wording and destination actions, then revalidate the creative to page path.",
  },
  {
    id: "wrong-platform-specs",
    title: "Wrong Platform Specs",
    tags: ["Specs", "Platform"],
    scenario: "Creatives violate channel requirements for format, duration, or delivery constraints.",
    businessImpact: "Rejected uploads, delayed launches, and emergency remakes.",
    detectionLogic: "Evaluate assets against platform rule packs for Meta, Google, and programmatic contexts.",
    recommendedAction: "Remaster assets to target specs and confirm placement eligibility before handoff.",
  },
  {
    id: "wrong-dimensions",
    title: "Wrong Dimensions",
    tags: ["Specs", "Creative"],
    scenario: "Creative size does not match the intended placement inventory.",
    businessImpact: "Cropping, letterboxing, or failed uploads across placements.",
    detectionLogic: "Measure asset dimensions and map them to placement-compatible size registries.",
    recommendedAction: "Produce correct size variants and re-check placement coverage for the campaign set.",
  },
  {
    id: "missing-utm",
    title: "Missing UTM",
    tags: ["Tracking", "Measurement"],
    scenario: "Destination links lack required UTM or tracking parameters.",
    businessImpact: "Broken attribution, weak reporting, and unreconciled performance narratives.",
    detectionLogic: "Inspect query parameters against required tracking conventions for the campaign.",
    recommendedAction: "Apply standardized UTMs, validate parameter integrity, and confirm reporting readiness.",
  },
  {
    id: "creative-swap-after-qa",
    title: "Creative Swap After QA",
    tags: ["Process", "Creative"],
    scenario: "Assets are swapped after validation without re-running checks.",
    businessImpact: "QA theater: approved status no longer reflects live assets.",
    detectionLogic: "Fingerprint approved packages and detect post-approval asset deltas before release.",
    recommendedAction: "Treat every swap as a new validation task; revoke stale approvals automatically.",
  },
  {
    id: "campaign-renewal-errors",
    title: "Campaign Renewal Errors",
    tags: ["Lifecycle", "Process"],
    scenario: "A renewal reuses last flight's package without checking freshness.",
    businessImpact: "Expired claims, stale destinations, and recurring defects return with the renewal.",
    detectionLogic: "Compare renewal package against campaign memory, freshness rules, and current destinations.",
    recommendedAction: "Run a renewal-specific validation pass and clear stale assets before reactivation.",
  },
  {
    id: "expired-promotions",
    title: "Expired Promotions",
    tags: ["Compliance", "Offer"],
    scenario: "Creatives still advertise promotions that have ended.",
    businessImpact: "Compliance risk and customer frustration when the offer cannot be fulfilled.",
    detectionLogic: "Cross-check promotional claims and dating cues against campaign schedule and offer registry.",
    recommendedAction: "Pull expired creatives, update offers, and re-validate before any extension.",
  },
  {
    id: "video-spec-errors",
    title: "Video Spec Errors",
    tags: ["Video", "Specs"],
    scenario: "Video assets miss duration, ratio, safe zone, or weight constraints.",
    businessImpact: "Placement rejection and last minute editor emergencies.",
    detectionLogic: "Inspect video metadata against platform video rules and safe zone guidance.",
    recommendedAction: "Re-encode or reframe videos to compliant specs and confirm Story/Reels/display fit.",
  },
  {
    id: "audience-mismatch",
    title: "Audience Mismatch",
    tags: ["Audience", "Messaging"],
    scenario: "Creative messaging targets motivations that conflict with the selected audience.",
    businessImpact: "Relevance waste and inflated CPA despite technically valid assets.",
    detectionLogic: "Compare audience definition signals with creative language and offer positioning.",
    recommendedAction: "Retarget creative or adjust audience definitions until intent and message cohere.",
  },
];
