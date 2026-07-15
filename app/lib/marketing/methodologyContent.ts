export const METHODOLOGY_LAYERS = [
  {
    id: "layer-1",
    number: "01",
    title: "Campaign Intelligence",
    subtitle: "Understand intent before assets are judged",
    description:
      "Capture the brief, objective, vertical, offer, and audience intent so every later check is grounded in what the campaign is actually trying to do.",
    workflow: [
      { label: "Ingest brief", detail: "Goal, vertical, offer, and platform context." },
      { label: "Normalize intent", detail: "Map objectives across ad groups and placements." },
      { label: "Establish truth", detail: "Create a single operational source of campaign context." },
    ],
    output: "A shared campaign intelligence profile teams can validate against.",
  },
  {
    id: "layer-2",
    number: "02",
    title: "Campaign Validation",
    subtitle: "Align messaging, creative, and destination",
    description:
      "Check that creative claims, CTAs, offers, and landing pages reinforce the same campaign story, before spend begins.",
    workflow: [
      { label: "Creative to brief", detail: "Messaging and promise vs. campaign objective." },
      { label: "Creative to page", detail: "Offer, CTA, and narrative continuity." },
      { label: "Cross-asset consistency", detail: "Catch mismatches across variants and versions." },
    ],
    output: "Clear alignment findings with actionable mismatch explanations.",
  },
  {
    id: "layer-3",
    number: "03",
    title: "Technical Validation",
    subtitle: "Specs, URLs, tracking, and placement fit",
    description:
      "Validate platform requirements, dimensions, file weight, safe zones, URL health, and UTM integrity that otherwise surface as launch blockers.",
    workflow: [
      { label: "Platform specs", detail: "Sizes, formats, weight, and placement rules." },
      { label: "Destination integrity", detail: "URL health, redirects, and broken paths." },
      { label: "Tracking readiness", detail: "UTM structure and measurement prerequisites." },
    ],
    output: "A technical readiness checklist with severity-ranked issues.",
  },
  {
    id: "layer-4",
    number: "04",
    title: "Operational Validation",
    subtitle: "Fit every task into a reproducible workflow",
    description:
      "Treat setup, creative swaps, landing-page updates, renewals, and handoffs as first-class validation events, not afterthoughts.",
    workflow: [
      { label: "Task intake", detail: "Identify the operational change being requested." },
      { label: "Pre-execution checks", detail: "Re-validate only what that task can break." },
      { label: "Handoff confidence", detail: "Give AdOps a clean gate before execution." },
    ],
    output: "Task-level validation gates that reduce rework and escalation loops.",
  },
  {
    id: "layer-5",
    number: "05",
    title: "Campaign Memory",
    subtitle: "Carry context forward across renewals and swaps",
    description:
      "Preserve what was validated, what changed, and what failed, so the next campaign task starts smarter, not from zero.",
    workflow: [
      { label: "Record decisions", detail: "Store validation outcomes and ownership." },
      { label: "Track deltas", detail: "Surface what changed since the last approved state." },
      { label: "Inform the next task", detail: "Reuse intelligence for renewals and swaps." },
    ],
    output: "Institutional memory that compounds operational quality over time.",
  },
] as const;

export const METHODOLOGY_WHY = [
  {
    title: "Campaigns fail in the seams",
    body: "Briefs, creatives, landing pages, and tracking usually live in different tools. Problems hide in the handoffs.",
  },
  {
    title: "Manual QA does not scale",
    body: "Checklists drift by team, market, and deadline pressure. Enterprise operations need a repeatable validation system.",
  },
  {
    title: "Validation must precede spend",
    body: "Once media is live, every mismatch becomes an escalation, a refund conversation, or wasted budget.",
  },
] as const;
