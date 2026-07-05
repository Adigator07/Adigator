"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import AnalyzerOverview from "./AnalyzerOverview";
import AnalyzerQaTab from "./AnalyzerQaTab";
import AnalyzerCreativeSection from "./AnalyzerCreativeSection";
import {
  compareStrategicEntries,
} from "../lib/strategicPresentation";
import {
  computeCampaignOverview,
} from "../lib/analyzerInsights";

const VERTICAL_LABELS = {
  healthcare: "Healthcare",
  technology: "Technology",
  automotive: "Automotive",
  news_media: "News / Media",
  sports: "Sports",
  fitness: "Fitness",
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
  fashion: "Fashion",
  unknown: "Unknown",
};

const GOAL_LABELS = {
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
  traffic: "Traffic",
  lead_generation: "Lead Generation",
  engagement: "Engagement",
  app_installs: "App Installs",
  retargeting: "Retargeting",
};

function labelVertical(id) {
  if (!id) return "Unknown";
  return VERTICAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

function labelGoal(id) {
  if (!id) return "Unknown";
  return GOAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

export default function AnalysisPanel({
  analysisResult,
  campaignGoal,
  campaignVertical,
  platform,
  viewerName,
  creatives = [],
  urlValidation = null,
  campaignBrief = "",
  campaignProductFocus = "",
  campaignIntent = "",
  onDownloadReport,
  downloadLoading = false,
  programmaticTaskType = "",
  replacementComparisonReport = null,
  renewalComparisonReport = null,
  initialAnalysisTab = "overview",
  initialSelectedCreativeId = null,
}) {
  const strategicEntries = useMemo(() => {
    return Array.isArray(analysisResult) ? analysisResult : [];
  }, [analysisResult]);

  const sorted = useMemo(() => [...strategicEntries].sort(compareStrategicEntries), [strategicEntries]);

  const creativePreviewById = useMemo(() => {
    const map = new Map();
    (creatives || []).forEach((creative) => {
      if (!creative?.id) return;
      map.set(creative.id, creative.url || creative.fullUrl || null);
    });
    return map;
  }, [creatives]);

  const [analysisTab, setAnalysisTab] = useState(initialAnalysisTab || "overview");
  const [selectedId, setSelectedId] = useState(
    () => initialSelectedCreativeId || sorted[0]?.creative?.id || null,
  );

  useEffect(() => {
    if (initialAnalysisTab) setAnalysisTab(initialAnalysisTab);
  }, [initialAnalysisTab]);

  useEffect(() => {
    if (initialSelectedCreativeId) {
      setSelectedId(initialSelectedCreativeId);
      if (initialAnalysisTab === "creative-analysis" || !initialAnalysisTab) {
        setAnalysisTab("creative-analysis");
      }
    }
  }, [initialSelectedCreativeId, initialAnalysisTab]);

  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");
  const greetingName = String(viewerName || "").trim() || "Strategist";
  const activePlatform = platform || "programmatic";

  const overview = useMemo(() => {
    if (!sorted.length) return null;
    return computeCampaignOverview(
      sorted,
      activePlatform,
      campaignGoal,
      campaignVertical,
      labelVertical,
      labelGoal,
      { campaignBrief, campaignProductFocus, campaignIntent, urlValidation },
    );
  }, [sorted, activePlatform, campaignGoal, campaignVertical, campaignBrief, campaignProductFocus, campaignIntent, urlValidation]);

  const insights = overview?.insights || [];

  const selectedInsight = useMemo(() => {
    const match = insights.find((i) => i.creativeId === selectedId);
    return match || insights[0] || null;
  }, [insights, selectedId]);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-100">
        <p className="text-sm font-semibold">Strategic analysis partially unavailable</p>
        <p className="mt-2 text-xs text-amber-200">Available intelligence will render where possible.</p>
      </div>
    );
  }

  return (
    <div className="analysis-panel-dark space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-studio-border bg-studio-surface p-1.5">
        <button
          type="button"
          onClick={() => setAnalysisTab("overview")}
          className={`studio-focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            analysisTab === "overview"
              ? "bg-studio-accent text-white shadow-studio-glow"
              : "border border-transparent text-studio-muted hover:bg-white/[0.05] hover:text-studio-text"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setAnalysisTab("qa")}
          className={`studio-focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            analysisTab === "qa"
              ? "bg-studio-accent text-white shadow-studio-glow"
              : "border border-transparent text-studio-muted hover:bg-white/[0.05] hover:text-studio-text"
          }`}
        >
          Technical &amp; Placement QA
        </button>
        <button
          type="button"
          onClick={() => setAnalysisTab("creative-analysis")}
          className={`studio-focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
            analysisTab === "creative-analysis"
              ? "bg-studio-accent text-white shadow-studio-glow"
              : "border border-transparent text-studio-muted hover:bg-white/[0.05] hover:text-studio-text"
          }`}
        >
          Creative Analysis
        </button>
      </div>

      {analysisTab === "overview" ? (
        <AnalyzerOverview
          overview={overview}
          greetingName={greetingName}
          goalText={goalText}
          verticalText={verticalText}
          platform={activePlatform}
          urlValidation={urlValidation}
          campaignBrief={campaignBrief}
          programmaticTaskType={programmaticTaskType}
          replacementComparisonReport={replacementComparisonReport}
          renewalComparisonReport={renewalComparisonReport}
        />
      ) : analysisTab === "qa" ? (
        <AnalyzerQaTab overview={overview} platform={activePlatform} />
      ) : (
        <AnalyzerCreativeSection
          insights={insights}
          selectedInsight={selectedInsight}
          onSelectCreative={setSelectedId}
          creativePreviewById={creativePreviewById}
          labelGoal={labelGoal}
          labelVertical={labelVertical}
          campaignGoal={campaignGoal}
          campaignVertical={campaignVertical}
          campaignBrief={campaignBrief}
          campaignProductFocus={campaignProductFocus}
          platform={activePlatform}
        />
      )}

      <motion.button
        whileHover={{ scale: downloadLoading ? 1 : 1.01 }}
        whileTap={{ scale: downloadLoading ? 1 : 0.99 }}
        onClick={() => onDownloadReport?.({ tab: analysisTab, selectedCreativeId: selectedId })}
        disabled={downloadLoading}
        className="studio-btn-primary studio-focus-ring flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
      >
        <Download size={16} />{" "}
        {downloadLoading
          ? "Generating Report…"
          : analysisTab === "overview"
            ? "Download Overview Report"
            : analysisTab === "qa"
              ? "Download QA Report"
              : "Download Creative Analysis Report"}
      </motion.button>
    </div>
  );
}

export { labelVertical, labelGoal };
