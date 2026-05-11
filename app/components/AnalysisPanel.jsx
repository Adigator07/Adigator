"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Brain, Download, Eye, Heart, TrendingUp, Shield } from "lucide-react";
import {
  compareStrategicEntries,
  getBusinessImpact,
  getCampaignAlignment,
  getEntryPayload,
  getStrategicAlignmentScore,
  getStrategicFlow,
  getStrategicRankLabel,
  isValidStrategicPayload,
  getBehavioralResponse,
  getValidatedRecommendations,
} from "../lib/strategicPresentation";

function scoreTone(score) {
  if (!Number.isFinite(score)) return "text-slate-300";
  if (score >= 78) return "text-emerald-300";
  if (score >= 62) return "text-amber-300";
  return "text-red-300";
}

function alignmentStatus(data) {
  return getCampaignAlignment(data).alignment_status || "unknown";
}

function getMismatchState(data, campaignGoal) {
  const goalAligned = data?.goal_alignment?.is_aligned;
  const verticalAligned = data?.vertical_alignment?.is_aligned;
  const status = String(alignmentStatus(data)).toLowerCase();

  const goalMismatch = goalAligned === false;
  const verticalMismatch = verticalAligned === false;
  const statusMismatch = status === "misaligned";
  const campaignGoalMismatch =
    typeof campaignGoal === "string" &&
    campaignGoal.trim().length > 0 &&
    typeof data?.goal_alignment?.selected_goal === "string" &&
    data.goal_alignment.selected_goal.trim().length > 0 &&
    data.goal_alignment.selected_goal.toLowerCase() !== campaignGoal.toLowerCase();

  const hasMismatch = goalMismatch || verticalMismatch || statusMismatch || campaignGoalMismatch;

  return {
    hasMismatch,
    goalMismatch,
    verticalMismatch,
    statusMismatch,
    campaignGoalMismatch,
  };
}

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-start gap-2">
        <Icon size={16} className="mt-0.5 flex-shrink-0 text-cyan-300" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="text-sm leading-relaxed text-slate-200">{children}</div>
    </div>
  );
}

function BehavioralField({ label, value, icon: Icon }) {
  if (!value) return null;
  return (
    <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
      <div className="mb-1.5 flex items-center gap-2">
        {Icon && <Icon size={13} className="text-cyan-400" />}
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{label}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-100">{value}</p>
    </div>
  );
}

function AttentionFlow({ attention, emotional_state }) {
  if (!attention) {
    return <p className="text-xs text-slate-400">Attention analysis is unavailable.</p>;
  }

  const frictionPoints = Array.isArray(attention.friction_points) ? attention.friction_points : [];

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Attention Path</p>
        <p className="text-sm leading-relaxed text-slate-100">{attention.attention_path || "Attention path unavailable"}</p>
      </div>

      {emotional_state && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Emotional Context</p>
          <p className="text-sm leading-relaxed text-slate-100">{emotional_state}</p>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">CTA Visibility</p>
        <p className="text-sm leading-relaxed text-slate-100">{attention.cta_visibility || "CTA visibility unavailable"}</p>
      </div>

      {frictionPoints.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Friction Points</p>
          <ul className="space-y-2">
            {frictionPoints.slice(0, 3).map((point, i) => (
              <li key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-100">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-400">Mobile Risk</p>
          <p className="mt-1 text-xs text-slate-200">{attention.mobile_attention_risk || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">Retention Risk</p>
          <p className="mt-1 text-xs text-slate-200">{attention.attention_retention_risk || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

function BehavioralInterventionCard({ rec, index }) {
  if (!rec) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{rec.issue || "Strategic issue"}</p>
          <p className="mt-0.5 text-xs text-slate-400">Priority: {rec.priority || "MEDIUM"}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Emotional Barrier</p>
        <p className="mt-1 text-sm text-slate-200">{rec.emotional_barrier || rec.why_it_hurts || "Barrier analysis unavailable"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Missing Belief</p>
        <p className="mt-1 text-sm text-slate-200">{rec.missing_belief || "Belief analysis unavailable"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Behavioral Intervention</p>
        <p className="mt-1 text-sm text-slate-200">{rec.recommended_change || "Intervention unavailable"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Expected Behavioral Shift</p>
        <p className="mt-1 text-sm text-slate-200">{rec.behavior_change_after_intervention || rec.expected_outcome || "Outcome analysis unavailable"}</p>
      </div>
    </motion.div>
  );
}

export default function AnalysisPanel({ analysisResult, campaignGoal, platform, onDownloadReport }) {
  const strategicEntries = useMemo(() => {
    const entries = Array.isArray(analysisResult) ? [...analysisResult] : [];

    return entries.map((entry) => {
      const payload = getEntryPayload(entry);
      console.log("[AnalysisPanel entry]", {
        creative: entry?.creative?.name || "unknown",
        payloadKeys: Object.keys(payload || {}),
        valid: isValidStrategicPayload(payload),
      });

      return entry;
    });
  }, [analysisResult]);

  const sorted = useMemo(() => {
    return [...strategicEntries].sort(compareStrategicEntries);
  }, [strategicEntries]);

  const [selectedId, setSelectedId] = useState(sorted[0]?.creative?.id || null);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-100">
        <p className="text-sm font-semibold">
          Strategic analysis partially unavailable
        </p>

        <p className="mt-2 text-xs text-amber-200">
          The orchestrator returned limited strategist reasoning.
          Available intelligence will still render where possible.
        </p>
      </div>
    );
  }

  const selected = sorted.find((entry) => entry.creative.id === selectedId) || sorted[0];
  const data = getEntryPayload(selected) || {};
  const flow = getStrategicFlow(data);
  const behavioral = getBehavioralResponse(data);
  const recommendations = getValidatedRecommendations(data);
  const strategicScore = getStrategicAlignmentScore(data);
  const campaignAlignment = getCampaignAlignment(data);
  const businessImpact = getBusinessImpact(data);
  const selectedMismatch = getMismatchState(data, campaignGoal);

  return (
    <div className="space-y-6">
      {/* Creative Selection */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Brain size={16} className="text-cyan-300" />
          <h3 className="text-sm font-semibold text-white">Strategic Advertising Decision Interface</h3>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sorted.map((entry, index) => {
            const isActive = selectedId === entry.creative.id;
            const payload = getEntryPayload(entry) || {};
            const category = getStrategicRankLabel(payload);
            const mismatch = getMismatchState(payload, campaignGoal);
            const entryScore = getStrategicAlignmentScore(payload);

            return (
              <button
                key={entry.creative.id}
                onClick={() => setSelectedId(entry.creative.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isActive ? "border-cyan-400/60 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-300">#{index + 1}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{entry.creative.name}</p>
                  </div>
                  <span className={`text-sm font-bold ${scoreTone(entryScore)}`}>
                    {entryScore ?? "--"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300">{category}</p>
                {mismatch.hasMismatch && (
                  <div className="mt-2 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                    Strategic mismatch detected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Psychology-First Interface */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-white">{selected.creative.name}</h4>
            <p className="mt-1 text-xs text-slate-400">Platform: {platform || "display_ads"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Strategic Alignment</p>
            <p className={`mt-1 text-3xl font-black ${scoreTone(strategicScore)}`}>{Number.isFinite(strategicScore) ? strategicScore : "--"}</p>
          </div>
        </div>

        {selectedMismatch.hasMismatch && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Strategic Warning</p>
            <p className="mt-1 text-sm text-amber-100">
              Creative-campaign mismatch detected. Analysis remains active so this misalignment can be diagnosed and corrected.
            </p>
            {campaignAlignment.reasoning && (
              <p className="mt-2 text-xs text-amber-100/90">Context: {campaignAlignment.reasoning}</p>
            )}
            {recommendations[0]?.recommended_change && (
              <p className="mt-1 text-xs text-amber-100/90">Intervention: {recommendations[0].recommended_change}</p>
            )}
          </div>
        )}

        {/* 1. MAIN STRATEGIC PROBLEM */}
        <Section icon={AlertTriangle} title="1. Main Strategic Problem">
          {flow.mainStrategicProblem}
        </Section>

        {/* 2. AUDIENCE PSYCHOLOGY (NEW PRIMARY SECTION) */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-pink-400" />
            <h4 className="text-sm font-semibold text-white">2. Audience Psychology & Mental State</h4>
          </div>

          {behavioral && (
            <div className="space-y-3">
              <BehavioralField label="Emotional State" value={behavioral.emotional_state} icon={Heart} />
              <BehavioralField label="Likely Objection" value={behavioral.likely_objection} icon={AlertTriangle} />
              <BehavioralField label="Trust Gap" value={behavioral.trust_gap} icon={Shield} />
              <BehavioralField label="Likely Behavior" value={behavioral.likely_behavior} icon={Eye} />
              <BehavioralField label="Commitment Pressure" value={behavioral.commitment_pressure} />
              <details className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Advanced Behavioral Intelligence
                </summary>
                <div className="mt-3 space-y-3">
                  <BehavioralField label="Perceived Message" value={behavioral.perceived_message} icon={Eye} />
                  <BehavioralField label="Identity Alignment" value={behavioral.identity_alignment} icon={TrendingUp} />
                  <BehavioralField label="Commitment Readiness" value={behavioral.commitment_readiness} icon={Brain} />
                  <BehavioralField label="Resistance Trigger" value={behavioral.resistance_trigger} icon={AlertTriangle} />
                  <BehavioralField label="Curiosity vs Intent Balance" value={behavioral.curiosity_vs_intent_balance} />
                  <BehavioralField label="Risk Aversion" value={behavioral.risk_aversion} />
                  <BehavioralField label="Confidence Building" value={behavioral.confidence_building} />
                </div>
              </details>
            </div>
          )}
        </div>

        {/* 3. ATTENTION FLOW WITH EMOTIONAL CONTEXT */}
        <Section icon={Eye} title="3. Attention Flow Analysis" subtitle="How users scan, where attention drops, emotional impact">
          <AttentionFlow attention={flow.attentionAnalysis} emotional_state={behavioral?.emotional_state} />
        </Section>

        {/* 4. BUSINESS CONSEQUENCE */}
        <Section icon={ArrowUpRight} title="4. Business Consequence">
          {flow.businessConsequence}
          {Array.isArray(businessImpact.affected_metrics) && businessImpact.affected_metrics.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">Affected metrics: {businessImpact.affected_metrics.slice(0, 4).join(", ")}</p>
          )}
        </Section>

        {/* 5. BEHAVIORAL INTERVENTIONS */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">5. Behavioral Interventions (Top {Math.min(3, recommendations.length)})</h4>
            </div>
            {recommendations.slice(0, 3).map((rec, i) => (
              <BehavioralInterventionCard key={`${rec.issue}-${i}`} rec={rec} index={i} />
            ))}
          </div>
        )}

        {/* 6. EXPECTED IMPROVEMENT */}
        <Section icon={TrendingUp} title="6. Expected Improvement After Intervention">
          {flow.expectedImprovement}
        </Section>

        {/* 7. STRATEGIC ALIGNMENT SUMMARY */}
        <Section icon={Brain} title="7. Strategic Alignment Summary">
          {flow.strategicAlignmentSummary}
          {campaignAlignment.reasoning && (
            <p className="mt-3 text-xs text-slate-400">Campaign context: {campaignAlignment.reasoning}</p>
          )}
        </Section>
      </div>

      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onDownloadReport}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
      >
        <Download size={16} /> Download Behavioral Intelligence Report
      </motion.button>
    </div>
  );
}
