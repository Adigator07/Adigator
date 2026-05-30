"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import AnalyzerOverview from "./AnalyzerOverview";
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
  onDownloadReport,
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

  const [analysisTab, setAnalysisTab] = useState("overview");
  const [selectedId, setSelectedId] = useState(() => sorted[0]?.creative?.id || null);

  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");
  const greetingName = String(viewerName || "").trim() || "Strategist";
  const activePlatform = platform || "programmatic";

  const overview = useMemo(() => {
    if (!sorted.length) return null;
    return computeCampaignOverview(sorted, activePlatform, campaignGoal, campaignVertical, labelVertical);
  }, [sorted, activePlatform, campaignGoal, campaignVertical]);

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
    <div className="analysis-panel-light space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => setAnalysisTab("overview")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            analysisTab === "overview"
              ? "bg-sky-500 text-white border border-sky-600 shadow-sm"
              : "text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-transparent"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setAnalysisTab("creative-analysis")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            analysisTab === "creative-analysis"
              ? "bg-sky-500 text-white border border-sky-600 shadow-sm"
              : "text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-transparent"
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
        />
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
          platform={activePlatform}
        />
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onDownloadReport}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500 bg-sky-100 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200"
      >
        <Download size={16} /> Download Strategic Report
      </motion.button>
    </div>
  );
}

export { labelVertical, labelGoal };
