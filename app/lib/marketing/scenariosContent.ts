export type OperationalScenario = {
  id: string;
  title: string;
  category: string;
  scenario: string;
  problem: string;
  risk: string;
  howAdigatorHelps: string;
  outcome: string;
  timeline: string;
  workflow: string[];
};

export const OPERATIONAL_SCENARIOS: OperationalScenario[] = [
  {
    id: "campaign-setup",
    title: "Campaign Setup",
    category: "Launch",
    scenario: "A new campaign is assembled from brief, creatives, destinations, and platform targeting.",
    problem: "Assets look complete in isolation, but objective, creative promise, and landing experience diverge.",
    risk: "Launch slips, last-minute rework, and early-performance failure from preventable mismatches.",
    howAdigatorHelps:
      "Validates the full setup package (brief intent, creative fit, landing continuity, URLs, UTMs, and specs) before AdOps executes.",
    outcome: "Teams enter trafficking with a shared readiness signal instead of hope.",
    timeline: "Pre-launch · 1 validation cycle before trafficking",
    workflow: ["Ingest brief", "Validate creatives", "Check destinations", "Confirm specs", "Approve for execution"],
  },
  {
    id: "creative-swap",
    title: "Creative Swap",
    category: "Optimization",
    scenario: "Performance or brand needs require replacing live creatives mid-flight.",
    problem: "New creatives inherit old assumptions about offers, CTAs, and landing pages.",
    risk: "Messaging drift, outdated promotions, and broken continuity after the swap.",
    howAdigatorHelps:
      "Re-validates the swapped assets against current campaign intelligence, destinations, and platform requirements.",
    outcome: "Swaps ship faster with confidence that version changes did not break the story.",
    timeline: "In-flight · same-day validation gate",
    workflow: ["Identify change set", "Diff vs. approved state", "Re-check alignment", "Confirm destinations", "Release to AdOps"],
  },
  {
    id: "landing-page-update",
    title: "Landing Page Update",
    category: "Optimization",
    scenario: "Marketing updates a landing page while ads continue to run.",
    problem: "Creative still points to old offers, CTAs, or proof points that no longer exist on-page.",
    risk: "Trust erosion, lower conversion, and brand inconsistency across paid journeys.",
    howAdigatorHelps:
      "Detects creative-to-page and offer mismatches after the destination changes, before the update is considered complete.",
    outcome: "Landing changes stay synchronized with live creative and campaign intent.",
    timeline: "Pre-publish · validation before page cutover",
    workflow: ["Capture page delta", "Compare creative claims", "Validate CTAs & offers", "Confirm URL integrity", "Sign off cutover"],
  },
  {
    id: "wrong-url",
    title: "Wrong URL",
    category: "Incident",
    scenario: "A destination link is mistyped, outdated, or points to the wrong market page.",
    problem: "Traffic leaves the media environment and lands on errors, homepage shells, or unrelated offers.",
    risk: "Immediate wasted spend and visible failure to clients and internal stakeholders.",
    howAdigatorHelps:
      "Runs destination integrity checks (reachability, redirect sanity, and campaign alignment) before links are trafficked.",
    outcome: "Broken or wrong destinations are blocked from becoming live traffic leaks.",
    timeline: "Pre-traffic · hard gate",
    workflow: ["Collect destination set", "Probe URL health", "Validate alignment", "Flag failures", "Require correction"],
  },
  {
    id: "campaign-renewal",
    title: "Campaign Renewal",
    category: "Lifecycle",
    scenario: "An existing campaign is renewed for another flight with partial asset reuse.",
    problem: "Expired offers, stale creatives, and legacy tracking linger inside the renewal package.",
    risk: "Re-running known issues while assuming prior QA still holds.",
    howAdigatorHelps:
      "Treats renewal as a fresh operational task: re-validates freshness, links, compliance, and continuity against current context.",
    outcome: "Renewals inherit intelligence without inheriting stale defects.",
    timeline: "Pre-renewal · compressed re-validation",
    workflow: ["Load prior memory", "Identify stale assets", "Re-validate package", "Close open risks", "Approve renewal"],
  },
  {
    id: "creative-addition",
    title: "Creative Addition",
    category: "Scale",
    scenario: "New creatives are added to expand placements, formats, or testing volume.",
    problem: "Incremental assets skip the rigor applied to the original launch set.",
    risk: "Spec failures, weak message fit, and fragmented creative quality across the set.",
    howAdigatorHelps:
      "Runs addition-focused checks for dimensions, messaging alignment, placement compatibility, and destination continuity.",
    outcome: "Scale without diluting the launch bar.",
    timeline: "Anytime · per-batch validation",
    workflow: ["Upload additions", "Spec validation", "Message alignment", "Placement fit", "Merge into approved set"],
  },
  {
    id: "audience-update",
    title: "Audience Update",
    category: "Optimization",
    scenario: "Audience definitions change while creative and offers stay mostly constant.",
    problem: "Messaging still speaks to the previous audience's motivations and constraints.",
    risk: "Relevance drop and inefficient spend against the new segments.",
    howAdigatorHelps:
      "Surfaces message-to-audience tension using campaign intelligence so creative and offers can be reassessed with the update.",
    outcome: "Audience changes trigger purposeful creative and offer review, not silent drift.",
    timeline: "Pre-update · advisory + gates",
    workflow: ["Capture audience delta", "Review creative claims", "Check offer relevance", "Flag mismatches", "Approve update"],
  },
  {
    id: "outsourced-adops",
    title: "Outsourced AdOps",
    category: "Handoff",
    scenario: "Creative and planning stay in-house while trafficking is executed by a vendor.",
    problem: "Vendors inherit incomplete context and imperfect packages, then discover issues late.",
    risk: "Slow cycles, finger-pointing, and quality variance across outsourcing partners.",
    howAdigatorHelps:
      "Packages a validated readiness state so vendors execute against a clear gate instead of reconstructing intent.",
    outcome: "Outsourcing becomes execution, not re-discovery.",
    timeline: "Pre-handoff · package + sign-off",
    workflow: ["Finalize assets", "Run full validation", "Export readiness", "Hand off package", "Track exceptions"],
  },
  {
    id: "agency-workflow",
    title: "Agency Workflow",
    category: "Team",
    scenario: "Account, creative, and AdOps teams collaborate across client campaigns under tight SLAs.",
    problem: "Each team validates different slices; nobody owns end-to-end coherence.",
    risk: "Client escalations, rushed launches, and inconsistent QA standards by pod.",
    howAdigatorHelps:
      "Creates a shared operational validation layer that standardizes readiness across client teams and roles.",
    outcome: "Agency pods share one readiness language and fewer surprise defects.",
    timeline: "Continuous · embedded in delivery cadence",
    workflow: ["Brief intake", "Cross-team validation", "Issue ownership", "Client-ready report", "Traffic with confidence"],
  },
  {
    id: "enterprise-workflow",
    title: "Enterprise Workflow",
    category: "Team",
    scenario: "Large brands operate multi-market campaigns with decentralized contributors and central governance.",
    problem: "Local teams innovate quickly while global standards and compliance erode.",
    risk: "Brand risk, process fragmentation, and uneven launch quality across regions.",
    howAdigatorHelps:
      "Applies a consistent methodology with campaign memory so markets move fast without inventing local QA folklore.",
    outcome: "Enterprise scale with governed, auditable validation outcomes.",
    timeline: "Program-level · always-on gates",
    workflow: ["Define standards", "Validate locally", "Escalate criticals", "Record decisions", "Renew with memory"],
  },
];
