/**
 * Platform-specific campaign objectives (Step 1) and analyzer goal resolution.
 */

export const PROGRAMMATIC_OBJECTIVES = [
  { id: "awareness", title: "Awareness", subtitle: "Introduce Brand", emoji: "📣", desc: "Maximize reach and brand recognition.", color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50", analyzerGoal: "awareness" },
  { id: "consideration", title: "Consideration", subtitle: "Evaluate Product", emoji: "🤔", desc: "Balance information and moderate CTA.", color: "from-purple-600/30 to-purple-800/20", border: "border-purple-500/50", analyzerGoal: "consideration" },
  { id: "conversion", title: "Conversion", subtitle: "Drive Action", emoji: "⚡", desc: "Strong CTA and direct response.", color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50", analyzerGoal: "conversion" },
];

export const GOOGLE_OBJECTIVES = [
  { id: "google_sales", title: "Sales", subtitle: "Drive purchases", emoji: "🛒", desc: "Optimize for transactions and revenue.", color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50", analyzerGoal: "conversion" },
  { id: "google_leads", title: "Leads", subtitle: "Capture leads", emoji: "🧾", desc: "Form fills, sign-ups, and qualified inquiries.", color: "from-emerald-600/30 to-emerald-800/20", border: "border-emerald-500/50", analyzerGoal: "lead_generation" },
  { id: "google_traffic", title: "Website Traffic", subtitle: "Drive visits", emoji: "🧭", desc: "Send users to your site or landing page.", color: "from-sky-600/30 to-sky-800/20", border: "border-sky-500/50", analyzerGoal: "traffic" },
  { id: "google_consideration", title: "Product and Brand Consideration", subtitle: "Mid-funnel", emoji: "💡", desc: "Help users evaluate your product or brand.", color: "from-purple-600/30 to-purple-800/20", border: "border-purple-500/50", analyzerGoal: "consideration" },
  { id: "google_brand_awareness", title: "Brand Awareness and Reach", subtitle: "Top of funnel", emoji: "📣", desc: "Maximize reach and brand recall.", color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50", analyzerGoal: "awareness" },
  { id: "google_app_promotion", title: "App Promotion", subtitle: "App installs", emoji: "📲", desc: "Drive app downloads and engagement.", color: "from-indigo-600/30 to-indigo-800/20", border: "border-indigo-500/50", analyzerGoal: "app_installs" },
  { id: "google_local", title: "Local Store Visits and Promotions", subtitle: "Foot traffic", emoji: "📍", desc: "Drive visits to physical locations.", color: "from-amber-600/30 to-amber-800/20", border: "border-amber-500/50", analyzerGoal: "traffic" },
  { id: "google_no_goal", title: "Create a Campaign Without a Goal's Guidance", subtitle: "Flexible setup", emoji: "⚙️", desc: "Configure without a predefined objective template.", color: "from-slate-600/30 to-slate-800/20", border: "border-slate-500/50", analyzerGoal: "awareness" },
];

export const META_OBJECTIVES = [
  { id: "meta_awareness", title: "Awareness", subtitle: "Reach", emoji: "📣", desc: "Show ads to people likely to remember them.", color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50", analyzerGoal: "awareness" },
  { id: "meta_traffic", title: "Traffic", subtitle: "Link clicks", emoji: "🧭", desc: "Send people to a destination.", color: "from-sky-600/30 to-sky-800/20", border: "border-sky-500/50", analyzerGoal: "traffic" },
  { id: "meta_engagement", title: "Engagement", subtitle: "Interactions", emoji: "💬", desc: "Get more messages, video views, or post engagement.", color: "from-teal-600/30 to-teal-800/20", border: "border-teal-500/50", analyzerGoal: "engagement" },
  { id: "meta_leads", title: "Leads", subtitle: "Lead forms", emoji: "🧾", desc: "Collect leads for your business.", color: "from-emerald-600/30 to-emerald-800/20", border: "border-emerald-500/50", analyzerGoal: "lead_generation" },
  { id: "meta_app_promotion", title: "App Promotion", subtitle: "App installs", emoji: "📲", desc: "Find people likely to install your app.", color: "from-indigo-600/30 to-indigo-800/20", border: "border-indigo-500/50", analyzerGoal: "app_installs" },
  { id: "meta_sales", title: "Sales", subtitle: "Conversions", emoji: "🛒", desc: "Find people likely to purchase.", color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50", analyzerGoal: "conversion" },
];

const ALL_OBJECTIVES = [...PROGRAMMATIC_OBJECTIVES, ...GOOGLE_OBJECTIVES, ...META_OBJECTIVES];
const OBJECTIVE_MAP = Object.fromEntries(ALL_OBJECTIVES.map((o) => [o.id, o]));

export function getObjectivesForPlatform(platform) {
  if (platform === "google_ads") return GOOGLE_OBJECTIVES;
  if (platform === "meta_ads") return META_OBJECTIVES;
  return PROGRAMMATIC_OBJECTIVES;
}

export function getObjectiveTitle(objectiveId, platform) {
  const found = OBJECTIVE_MAP[objectiveId];
  if (found) return found.title;
  if (objectiveId === "conversion" && platform !== "programmatic") return "Conversions";
  return objectiveId?.replace(/_/g, " ") || "Not selected";
}

export function resolveAnalyzerGoal(objectiveId) {
  return OBJECTIVE_MAP[objectiveId]?.analyzerGoal || objectiveId || "awareness";
}

export function isObjectiveAllowedForPlatform(objectiveId, platform) {
  return getObjectivesForPlatform(platform).some((o) => o.id === objectiveId);
}
