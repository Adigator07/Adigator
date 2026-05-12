"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Download,
  Eye,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  compareStrategicEntries,
  getEntryPayload,
  getGoalAlignment,
  getStrategicAlignmentScore,
  getCreativeStatusLabel,
  getProductCategory,
  getAdvertisingBehavior,
  getAudienceInterpretation,
  getPersuasionFriction,
  getStrategicFlow,
  getValidatedRecommendations,
  getRankingRationale,
} from "../lib/strategicPresentation";

const GOAL_LABELS = {
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
};

const VERTICAL_LABELS = {
  healthcare: "Healthcare",
  technology: "Technology",
  automotive: "Automotive",
  news_media: "News / Media",
  sports: "Sports",
  finance: "Business / Finance",
  luxury: "Luxury",
  travel: "Travel",
  hotels: "Hotels",
  food: "Restaurants / Food",
  banking: "Banking / FinTech",
  real_estate: "Real Estate",
  education: "Education / EdTech",
  gaming: "Gaming",
  entertainment: "Entertainment / OTT",
  ecommerce: "E-commerce / Retail",
  unknown: "Unknown",
};

function labelGoal(goal) {
  if (!goal) return "Unknown";
  return GOAL_LABELS[goal] || goal;
}

function labelVertical(vertical) {
  if (!vertical) return "Unknown";
  return VERTICAL_LABELS[vertical] || vertical;
}

function confidenceTone(confidence) {
  if (confidence === "strong") return "text-emerald-300";
  if (confidence === "moderate") return "text-amber-300";
  return "text-slate-300";
}

function scoreLabel(score) {
  if (!Number.isFinite(score)) return "Unknown";
  if (score >= 90) return "Exceptional Strategic Alignment";
  if (score >= 75) return "Strong Alignment";
  if (score >= 60) return "Moderate Optimization Required";
  if (score >= 40) return "High Strategic Friction";
  return "Severe Campaign Risk";
}

function scoreTone(score) {
  if (!Number.isFinite(score)) return "text-slate-300";
  if (score >= 90) return "text-emerald-300";
  if (score >= 75) return "text-cyan-300";
  if (score >= 60) return "text-amber-300";
  if (score >= 40) return "text-orange-300";
  return "text-red-300";
}

function isLaunchReady(payload) {
  const score = getStrategicAlignmentScore(payload) ?? -1;
  return score >= 75 && payload?.goal_alignment?.is_aligned === true;
}

function DistributionList({ title, items }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">No data</p>
        ) : items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-200 truncate">{item.label}</span>
            <span className="font-bold text-white">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-cyan-300" />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, confidence }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-100">{value || "Unavailable"}</p>
      {confidence && (
        <p className={`mt-2 text-[10px] uppercase tracking-wide font-semibold ${confidenceTone(confidence)}`}>
          {confidence} confidence
        </p>
      )}
    </div>
  );
}

export default function AnalysisPanel({
  analysisResult,
  campaignGoal,
  campaignVertical,
  platform,
  onDownloadReport,
}) {
  const entries = useMemo(() => (Array.isArray(analysisResult) ? analysisResult : []), [analysisResult]);
  const sorted = useMemo(() => [...entries].sort(compareStrategicEntries), [entries]);
  const [analysisTab, setAnalysisTab] = useState("overview");
  const [selectedId, setSelectedId] = useState(() => sorted[0]?.creative?.id || null);

  const selected = sorted.find((entry) => entry.creative?.id === selectedId) || sorted[0];
  const payload = getEntryPayload(selected) || {};
  const score = getStrategicAlignmentScore(payload);

  const goalAlignment = getGoalAlignment(payload);
  const productCategory = getProductCategory(payload);
  const advertisingBehavior = getAdvertisingBehavior(payload);
  const audienceInterpretation = getAudienceInterpretation(payload);
  const persuasionFriction = getPersuasionFriction(payload);
  const flow = getStrategicFlow(payload);
  const recommendations = getValidatedRecommendations(payload);
  const rankingRationale = getRankingRationale(payload);

  const overview = useMemo(() => {
    const productDist = new Map();
    const behaviorDist = new Map();
    const goalDist = new Map();
    const readinessDist = new Map();

    const riskEntries = [];

    sorted.forEach((entry) => {
      const data = getEntryPayload(entry) || {};
      const localScore = getStrategicAlignmentScore(data);
      const category = getProductCategory(data).label;
      const behavior = getAdvertisingBehavior(data).label;
      const goalState = data?.goal_alignment?.is_aligned === true ? "Aligned" : "Misaligned";
      const launchState = isLaunchReady(data) ? "Ready" : "Not Ready";
      const friction = getPersuasionFriction(data).primary;

      productDist.set(category, (productDist.get(category) || 0) + 1);
      behaviorDist.set(behavior, (behaviorDist.get(behavior) || 0) + 1);
      goalDist.set(goalState, (goalDist.get(goalState) || 0) + 1);
      readinessDist.set(launchState, (readinessDist.get(launchState) || 0) + 1);

      riskEntries.push({
        name: entry?.creative?.name || "Untitled",
        score: localScore ?? 0,
        friction,
      });
    });

    const scoreValues = riskEntries.map((item) => item.score).filter((v) => Number.isFinite(v));
    const avgScore = scoreValues.length ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0;
    const alignedCount = sorted.filter((entry) => getEntryPayload(entry)?.goal_alignment?.is_aligned === true).length;
    const cohesionScore = sorted.length ? Math.round((avgScore * 0.65) + ((alignedCount / sorted.length) * 35)) : 0;

    const topRisk = riskEntries
      .filter((item) => item.score < 75)
      .sort((a, b) => a.score - b.score)[0];

    const highestRiskCreatives = riskEntries
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const recommendedNextAction = topRisk
      ? `Prioritize ${topRisk.name}: resolve ${topRisk.friction.toLowerCase()}`
      : "No high-risk creative detected; run incremental hierarchy optimization tests.";

    const toRows = (map) => [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

    return {
      total: sorted.length,
      productDistribution: toRows(productDist),
      behaviorDistribution: toRows(behaviorDist),
      goalDistribution: toRows(goalDist),
      readinessDistribution: toRows(readinessDist),
      cohesionScore,
      topRisk,
      highestRiskCreatives,
      recommendedNextAction,
    };
  }, [sorted]);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-100">
        <p className="text-sm font-semibold">Strategic analysis unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <button
          type="button"
          onClick={() => setAnalysisTab("overview")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${analysisTab === "overview" ? "bg-white/12 text-white border border-white/15" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
        >
          Campaign Overview
        </button>
        <button
          type="button"
          onClick={() => setAnalysisTab("creative")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${analysisTab === "creative" ? "bg-white/12 text-white border border-white/15" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
        >
          Creative Analysis
        </button>
      </div>

      {analysisTab === "overview" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Creatives Analyzed</p>
              <p className="mt-1 text-3xl font-black text-white">{overview.total}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Campaign Cohesion Score</p>
              <p className="mt-1 text-3xl font-black text-white">{overview.cohesionScore}/100</p>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-200/90">Top Campaign Risk</p>
              <p className="mt-1 text-sm font-semibold text-white leading-relaxed">{overview.topRisk ? `${overview.topRisk.name}: ${overview.topRisk.friction}` : "No major campaign risk detected."}</p>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">Recommended Next Action</p>
              <p className="mt-1 text-sm font-semibold text-white leading-relaxed">{overview.recommendedNextAction}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <DistributionList title="Product Category Distribution" items={overview.productDistribution} />
            <DistributionList title="Advertising Behavior Distribution" items={overview.behaviorDistribution} />
            <DistributionList title="Goal Alignment Distribution" items={overview.goalDistribution} />
            <DistributionList title="Launch Readiness Distribution" items={overview.readinessDistribution} />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-rose-300" />
              <h4 className="text-sm font-semibold text-white">Highest-Risk Creatives</h4>
            </div>
            <div className="space-y-2">
              {overview.highestRiskCreatives.map((risk) => (
                <div key={risk.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{risk.name}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{risk.friction}</p>
                  </div>
                  <span className={`text-sm font-bold ${scoreTone(risk.score)}`}>{risk.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-2">Creative Ranking</p>
              {sorted.map((entry, index) => {
                const entryPayload = getEntryPayload(entry) || {};
                const entryScore = getStrategicAlignmentScore(entryPayload);
                const isActive = selectedId === entry.creative?.id;
                return (
                  <button
                    key={entry.creative?.id || index}
                    onClick={() => setSelectedId(entry.creative?.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${isActive ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-[10px] font-semibold text-slate-500">#{index + 1}</p>
                      <span className={`text-xs font-bold ${scoreTone(entryScore)}`}>{entryScore ?? "--"}</span>
                    </div>
                    <p className="truncate text-xs font-semibold text-white mt-0.5">{entry.creative?.name || "Untitled"}</p>
                    <p className="text-[10px] mt-0.5 font-semibold text-slate-300">{getCreativeStatusLabel(entryPayload)}</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{getRankingRationale(entryPayload)}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                <h4 className="text-base font-bold text-white">{selected.creative?.name || "Creative"}</h4>
                <p className="mt-0.5 text-xs text-slate-400">{platform || "display_ads"} · {labelGoal(campaignGoal)} · {labelVertical(campaignVertical)}</p>
                <p className={`mt-2 text-sm font-bold ${scoreTone(score)}`}>{Number.isFinite(score) ? `${score}/100` : "N/A"} · {scoreLabel(score)}</p>
                <p className="mt-1 text-xs text-slate-300">Why this creative ranked here: {rankingRationale}</p>
              </div>

              <SectionCard icon={Target} title="1. Goal Alignment">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <Field label="Alignment Level" value={goalAlignment?.alignment_level || (goalAlignment?.is_aligned ? "aligned" : "misaligned")} confidence={goalAlignment?.confidence} />
                  <Field label="Business Impact" value={goalAlignment?.business_impact || "Business impact unavailable."} confidence={goalAlignment?.confidence} />
                  <Field label="Exact Reason" value={goalAlignment?.reason} confidence={goalAlignment?.confidence} />
                </div>
              </SectionCard>

              <SectionCard icon={Brain} title="2. Product Category">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <Field label="Detected Category" value={productCategory?.label} confidence={productCategory?.confidence} />
                  <Field label="Evidence" value={(productCategory?.evidence || []).join(", ") || "No direct category evidence extracted."} confidence={productCategory?.confidence} />
                </div>
              </SectionCard>

              <SectionCard icon={TrendingUp} title="3. Advertising Behavior">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <Field label="Behavior Type" value={advertisingBehavior?.label} confidence={advertisingBehavior?.confidence} />
                  <Field label="Behavior Reason" value={advertisingBehavior?.reason} confidence={advertisingBehavior?.confidence} />
                </div>
              </SectionCard>

              <SectionCard icon={Eye} title="4. Audience Interpretation">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <Field label="Likely Interpretation" value={audienceInterpretation?.likely_interpretation} confidence={audienceInterpretation?.confidence} />
                  <Field label="Readiness Stage" value={audienceInterpretation?.readiness_stage} confidence={audienceInterpretation?.confidence} />
                  <Field label="Trust Perception" value={audienceInterpretation?.trust_perception} confidence={audienceInterpretation?.confidence} />
                </div>
              </SectionCard>

              <SectionCard icon={Eye} title="5. Attention Flow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <Field label="Image Dominance" value={flow?.attentionAnalysis?.image_dominance} confidence={flow?.attentionAnalysis?.confidence} />
                  <Field label="Visual Contrast" value={flow?.attentionAnalysis?.visual_contrast} confidence={flow?.attentionAnalysis?.confidence} />
                  <Field label="Object Scale" value={flow?.attentionAnalysis?.object_scale} confidence={flow?.attentionAnalysis?.confidence} />
                  <Field label="CTA Placement" value={flow?.attentionAnalysis?.cta_placement} confidence={flow?.attentionAnalysis?.confidence} />
                  <Field label="Typography Weight" value={flow?.attentionAnalysis?.typography_weight} confidence={flow?.attentionAnalysis?.confidence} />
                  <Field label="Directional Hierarchy" value={flow?.attentionAnalysis?.directional_hierarchy} confidence={flow?.attentionAnalysis?.confidence} />
                </div>
              </SectionCard>

              <SectionCard icon={AlertTriangle} title="6. Persuasion Friction">
                <Field label="Primary Friction" value={persuasionFriction?.primary} confidence={persuasionFriction?.confidence} />
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(persuasionFriction?.items || []).slice(0, 4).map((item, i) => (
                    <div key={`${item}-${i}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-sm text-slate-100">{item}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard icon={Zap} title="7. Strategic Recommendation">
                {recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <Field label="Core Problem" value={recommendations[0]?.core_problem || recommendations[0]?.issue} confidence={recommendations[0]?.confidence} />
                    <Field label="Why It Happens" value={recommendations[0]?.why_it_happens || recommendations[0]?.why_it_hurts} confidence={recommendations[0]?.confidence} />
                    <Field label="Business Risk" value={recommendations[0]?.business_risk || recommendations[0]?.expected_outcome} confidence={recommendations[0]?.confidence} />
                    <Field label="Exact Fix" value={recommendations[0]?.exact_fix || recommendations[0]?.recommended_change} confidence={recommendations[0]?.confidence} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">Recommendation unavailable.</p>
                )}
              </SectionCard>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onDownloadReport}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
          >
            <Download size={16} /> Download Strategic Report
          </motion.button>
        </>
      )}
    </div>
  );
}
