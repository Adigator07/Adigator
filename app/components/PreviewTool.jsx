"use client";

import { useState, useRef, useEffect, useCallback, useMemo, startTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const PreviewStudio = dynamic(() => import("./PreviewStudio"), { ssr: false, loading: () => <div className="py-20 text-center text-[#c8c8d4] text-sm">Loading preview studio…</div> });
const ProgrammaticStep1Fields = dynamic(() => import("./preview-tool/ProgrammaticStep1Fields"), {
  ssr: false,
  loading: () => <div className="py-10 text-center text-sm text-[#c8c8d4]">Loading campaign details…</div>,
});
import EditCreativeModal from "./EditCreativeModal";
import CreativeCard from "./CreativeCard";
import AnalysisPanel from "./AnalysisPanel";
import { getFirebaseClientAuth } from "../lib/firebase/client";
import { PlatformBrandIcon } from "./brand/PlatformBrandIcons";
import {
  compareStrategicEntries,
  getEntryPayload,
  getStrategicAlignmentScore,
  getStrategicFlow,
  getValidatedRecommendations,
} from "../lib/strategicPresentation";
import {
  validateCreativeAsset,
  buildValidationSummary,
  finalizeValidationForPlatform,
  revalidateCreativesForPlatform,
  attachSourceDimensions,
  PLATFORM_SUPPORTED_SIZE_GROUPS,
  PLATFORM_SIZE_GROUP_LABELS,
  DSP_PARTNERS,
} from "../lib/creativeValidation";
import { readImageDimensionsFromBlob, isPlausibleCreativeDimension } from "../lib/imageDimensions";
import { resolvePersistedDimensions } from "../lib/creativeFitAnalysis";
import {
  compressDrawable,
  compressImageToTarget,
  getFileExtensionForMime,
  loadImageSource,
  mapWithConcurrency,
  padBlobToExactBytes,
  yieldToMain,
} from "../lib/imageCompression";
import {
  deleteCreativeAssets,
  getCreativeFullBlob,
  getCreativePreviewBlob,
  getCreativeSourceBlob,
  hydrateCreativesList,
  revokeCreativeObjectUrls,
  storeCompressedCreativeBlobs,
  storeUploadedCreativeFile,
  stripCreativeForPersistence,
  attachPersistedPreviewData,
  setCreativeStorageScope,
} from "../lib/creativeAssetStore";
import {
  analysisMatchesCreatives,
  analysisCoversCreatives,
  filterAnalysisForCreatives,
  getCreativesMissingAnalysis,
  persistCampaignProgress,
  readStoredAnalysisResult,
  readStoredWorkflow,
  writeStoredAnalysisResult,
  writeStoredWorkflow,
} from "../lib/workflowStorage";
import {
  addProgrammaticAdGroup,
  buildProgrammaticAdGroups,
  filterImageFiles,
  filterProgrammaticAdGroupsBySelection,
  getProgrammaticCampaignGoalFromAdGroups,
  getProgrammaticAdGroupDisplayName,
  isProgrammaticAdGroupConfigComplete,
  isProgrammaticAdGroupSelectionComplete,
  isProgrammaticCampaignSetup,
  isProgrammaticCreativeAddition,
  isProgrammaticCreativeReplacement,
  isProgrammaticCampaignRenewal,
  isProgrammaticUrlValidationUtmUpdate,
  isProgrammaticCampaignUpdateTask,
  PROGRAMMATIC_OBJECTIVE_CUSTOM,
  normalizeProgrammaticAdGroups,
  removeProgrammaticAdGroup,
} from "../lib/programmaticWorkflow";
import { buildCampaignRenewalReport } from "../lib/campaignRenewalComparison";
import {
  buildTrackingUrl,
  emptyUtmParameters,
  normalizeUtmParameters,
  parseUtmFromUrl,
  stripUtmFromUrl,
  SUPPORTED_UTM_KEYS,
} from "../lib/utmManagement";
import { buildUrlUtmValidationReport } from "../lib/urlUtmValidation";
import {
  CREATIVE_ROLE_BASELINE,
  CREATIVE_ROLE_REPLACEMENT,
  tagCreativeRole,
} from "../lib/creativeRoles";
import { buildReplacementComparisonReport } from "../lib/creativeReplacementComparison";
import { normalizeGoogleCampaignType } from "../lib/googleCampaignTypes";
import { getObjectiveTitle } from "../lib/campaignObjectives";
import { mapGoogleAdsImportedCreativesToTool } from "../lib/googleAds/importedCreatives";
import { mapMetaAdsImportedCreativesToTool } from "../lib/metaAds/importedCreatives";
import { warmDashboardCampaignCaches } from "../lib/dashboardCampaignCache";
import { resolveCreativePreviewContext } from "../lib/creativePreviewContext";
import {
  buildPreviewStudioSourceFingerprint,
} from "../lib/previewStudioPersistence";
import { prewarmPreviewStudioCache } from "../lib/previewStudioPrewarm";
import {
  loadPreviewStudioCacheFromStorage,
  mergePreviewStudioCaches,
  savePreviewStudioCacheToStorage,
  setPreviewStudioStorageScope,
} from "../lib/previewStudioStorage";
import { recordAndStoreDownloadReport } from "../lib/downloadHistoryStore";
import {
  buildAnalysisReportDownloadToast,
  buildPreviewReportDownloadToast,
} from "../lib/reportDownloadMessages";
import {
  buildPreviewStudioReportFingerprint,
  setReportExportStorageScope,
  saveCachedReportExport,
} from "../lib/reportExportCache";
import { downloadBlob } from "../lib/wysiwygCapture";
import WysiwygExportHost from "./export/WysiwygExportHost";
import {
  resolveCampaignIntentForBrief,
} from "../lib/campaignBriefValidation";
import {
  buildCampaignAlignmentFingerprint,
  computeCampaignAlignmentReport,
} from "../lib/campaignAlignmentValidation";
import {
  findProgrammaticCampaign,
  getProgrammaticCampaignById,
  resolveProgrammaticCampaignId,
  upsertProgrammaticCampaign,
} from "../lib/programmaticCampaignStore";
import {
  fetchProgrammaticCampaignFromApi,
  persistProgrammaticCampaignToApi,
  fetchCampaignFromApi,
  persistCampaignToApi,
  importGoogleAdsCampaignFromSession,
} from "../lib/campaignApi";
import { resolveCampaignOwnerId } from "../lib/campaignOwnerScope";
import { getPlatformAdapter } from "../lib/platforms/registry";
import { resolveCampaignId, generateCampaignId } from "../lib/campaignSnapshot";
import {
  getCampaignById,
  upsertCampaign,
} from "../lib/campaignStore";
import {
  isCampaignSetupTask,
  isCampaignUpdateTask,
  isCreativeAdditionTask,
  isCreativeReplacementTask,
  isCampaignRenewalTask,
  isUrlUtmUpdateTask,
} from "../lib/platforms/sharedTaskTypes";
import {
  createOrGetAdvertiser,
  listAdvertisers,
  persistAdvertiserCampaignSelection,
  syncAdvertiserFromGenericSession,
  syncAdvertiserFromProgrammaticSnapshot,
} from "../lib/advertiserStore";
import GoogleAdsConnectPanel from "./preview-tool/GoogleAdsConnectPanel";
import MetaAdsConnectPanel from "./preview-tool/MetaAdsConnectPanel";
import ProgrammaticFolderSections from "./preview-tool/ProgrammaticFolderSections";
import { getImageFilesFromDataTransfer, preventDropDefaults } from "../lib/folderUpload";
import {
  extractVideoKeyFrames,
  filterMediaFiles,
  isVideoFile,
  readVideoMetadataFromBlob,
} from "../lib/video/videoClient";
import { buildVideoUploadValidation } from "../lib/video/videoValidation";
import UrlUtmValidationReportPanel from "./preview-tool/UrlUtmValidationReportPanel";
import CampaignAssistantModal from "./preview-tool/CampaignAssistantModal";
import CampaignSupportChatWidget from "./preview-tool/CampaignSupportChatWidget";
import MissingSetupFieldsPanel from "./preview-tool/MissingSetupFieldsPanel";
import {
  getMissingCampaignDetailFields,
  getMissingSetupFields,
  getRecommendedCampaignDetailFields,
  isSetupComplete,
} from "@/app/lib/setupRequiredFields";
import { isAdigatorVerticalId } from "@/app/lib/googleAds/inferVertical";

function buildImportedGoogleAdsBrief(snapshot) {
  if (!snapshot || snapshot.importSource !== "google_ads") return snapshot?.campaignBrief || "";
  return String(snapshot.campaignBrief || "").trim();
}
import {
  buildCampaignAssistantFingerprint,
  isCampaignAssistantContextValid,
} from "../lib/campaignAssistant/fingerprint";
import { mergeAssistantAnswers } from "../lib/campaignAssistant/mergeContext";
import {
  trackUserActivity,
  trackValidationOutcome,
  saveCreative,
  saveAnalyzerResult,
  deleteCreativeRecord,
} from "../lib/supabaseDataService";
import { isAuthenticatedUser } from "../lib/demoAccess";
import { hashFileContent } from "../lib/image/duplicateDetector";
import { FIX_ACTION_IDS } from "../lib/creativeFixActions";
import { useCampaignValidation } from "../hooks/useCampaignValidation";
import ValidationReport from "./ValidationReport";
import ValidationIssueRow from "./ValidationIssueRow";
import {
  clearStoredUrlValidation,
  getCreativeValidationFingerprint,
  readStoredUrlValidation,
  resolveActiveUrlValidation,
  runUrlValidationRequest,
  writeStoredUrlValidation,
} from "../lib/urlValidationClient";
import {
  TOTAL_WORKFLOW_STEPS as TOTAL_STEPS,
  WORKFLOW_STEPS,
  resolveWorkflowStep,
  getWorkflowStepSlug,
  buildWorkflowStepHref,
} from "../lib/workflowSteps";
import { readinessMatchesSession } from "../lib/campaignReadinessStore";
import { recordPreviewStudioVideo } from "../lib/previewStudioVideoExport";
import { timeAsyncOperation } from "../lib/routeTelemetry";
import {
  WizardStepNav,
  ToolNavBtn,
  ToolSelectionCard,
  ToolStatCard,
  ToolSectionHeader,
  ToolSummaryChip,
  ToolInput,
  ToolTextarea,
  ToolSelect,
  ToolSurface,
  ToolFooterBar,
  ToolDropzone,
} from "./preview-tool/PreviewToolUi";

// Platform size matrix — sourced from creativeSizeRegistry via creativeValidation
const PLATFORM_SIZES = PLATFORM_SUPPORTED_SIZE_GROUPS;

const PLATFORM_INTELLIGENCE_LABEL = {
  google_ads: "Inventory Intelligence",
  meta_ads: "Placement Intelligence",
  programmatic: "Cross-Inventory Intelligence",
};

const GROUP_LABELS = PLATFORM_SIZE_GROUP_LABELS;

const ANALYSIS_SESSION_STORAGE_KEY = "adigator_analysis_session_id";
const ACTIVE_CAMPAIGN_STORAGE_KEY = "adigator_active_campaign_id";
const STEP_LABELS = WORKFLOW_STEPS.map((step) => step.label);
import {
  UploadCloud, CheckCircle2, AlertCircle, AlertTriangle, ExternalLink, ChevronDown,
  Download, LayoutGrid, Square, CheckSquare, RotateCcw,
  Newspaper, ShoppingCart, Coffee, Activity, Laptop, Briefcase, GraduationCap, Gamepad2, Film,
  Monitor, Smartphone,
} from "lucide-react";

function UrlAlignmentSummaryCard({ urlValidation }) {
  if (!urlValidation || urlValidation.status === "pending" || urlValidation.status === "skipped") {
    return null;
  }

  const isAligned = urlValidation.status === "aligned";
  const Icon = isAligned ? CheckCircle2 : AlertTriangle;
  const tone = isAligned
    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
    : "border-amber-400/35 bg-amber-500/10 text-amber-100";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Icon size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-studio-text">
              {isAligned ? "Landing page matches this campaign" : "Landing page needs attention"}
            </p>
            <p className="mt-1 text-sm text-studio-muted leading-relaxed">
              {urlValidation.summary
                || (isAligned
                  ? "URL health and content look consistent with your setup."
                  : "Review the destination against your creative and campaign details.")}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-studio-text">
          {isAligned ? "Aligned" : "Misaligned"}
        </span>
      </div>

      {urlValidation.page_about ? (
        <p className="mt-3 text-sm text-studio-muted leading-relaxed">
          <span className="font-semibold text-studio-text">About the page: </span>
          {urlValidation.page_about}
        </p>
      ) : null}

      {!isAligned && urlValidation.misalignment_reason ? (
        <p className="mt-2 text-sm text-studio-muted leading-relaxed">
          <span className="font-semibold text-studio-text">Why: </span>
          {urlValidation.misalignment_reason}
        </p>
      ) : null}

      {urlValidation.submitted_url ? (
        <p className="mt-3 flex items-center gap-1.5 break-all text-xs text-studio-tertiary">
          <ExternalLink size={12} className="shrink-0" />
          {urlValidation.submitted_url}
        </p>
      ) : null}

      {!isAligned && Array.isArray(urlValidation.suggestions) && urlValidation.suggestions.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-studio-muted">
          {urlValidation.suggestions.slice(0, 3).map((suggestion) => (
            <li key={suggestion}>• {suggestion}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ── Inline workflow status (replaces popup toasts) ─────────────────────────────
function WorkflowStatusBar({ status, analysisLoading, analysisProgress }) {
  const showProgress = analysisLoading && analysisProgress?.total > 0;
  if (!status?.message && !showProgress) return null;

  const tone = status?.type === "error"
    ? "border-rose-500/35 bg-rose-500/10 text-rose-100"
    : status?.type === "success"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
      : "border-studio-border bg-studio-surface/80 text-studio-text";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      {status?.message ? <p className="font-medium leading-relaxed">{status.message}</p> : null}
      {showProgress ? (
        <div className={status?.message ? "mt-2" : ""}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-studio-muted">
            <span>Analyzing creatives…</span>
            <span>{analysisProgress.completed}/{analysisProgress.total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-studio-accent transition-all duration-300"
              style={{ width: `${Math.round((analysisProgress.completed / analysisProgress.total) * 100)}%` }}
            />
          </div>
          {analysisProgress.label ? (
            <p className="mt-1 text-xs text-studio-tertiary">Latest: {analysisProgress.label}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const TEMPLATES = [
  { id: "newspaper", name: "News website layout", icon: Newspaper, desc: "Awareness top funnel", slots: 7 },
  { id: "ecommerce", name: "E-commerce product page", icon: ShoppingCart, desc: "Conversion bottom funnel", slots: 7 },
  { id: "health", name: "Native ad placement", icon: Activity, desc: "Awareness top funnel", slots: 5 },
  { id: "technology", name: "Product landing page", icon: Laptop, desc: "Consideration mid funnel", slots: 7 },
  { id: "business", name: "Feature comparison layout", icon: Briefcase, desc: "Consideration mid funnel", slots: 6 },
  { id: "entertainment", name: "Video platform preview", icon: Film, desc: "Awareness top funnel", slots: 6 },
];

const PLATFORMS = [
  {
    id: "google_ads", icon: "🟦", title: "Google Ads", desc: "Display inventory and responsive placements optimized for intent-rich contexts",
    color: "from-blue-600/30 to-cyan-800/20", border: "border-blue-500/50",
    groups: PLATFORM_SIZES.google_ads,
  },
  {
    id: "meta_ads", icon: "🟪", title: "Meta Ads", desc: "Feed, Story, and Reels ecosystems tuned for mobile attention and social engagement",
    color: "from-pink-600/30 to-fuchsia-800/20", border: "border-fuchsia-500/50",
    groups: PLATFORM_SIZES.meta_ads,
  },
  {
    id: "programmatic", icon: "📡", title: "Programmatic Ads", desc: "Real-time bidding across premium publisher inventory",
    color: "from-violet-600/30 to-violet-800/20", border: "border-violet-500/50",
    groups: PLATFORM_SIZES.programmatic,
  },
];

const GOOGLE_GOALS = [
  { id: "google_sales", title: "Sales", subtitle: "Drive purchases", emoji: "🛒", apiGoal: "conversion", color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50", desc: "Optimize for purchase intent, offer clarity, and conversion ready messaging." },
  { id: "google_leads", title: "Leads", subtitle: "Capture leads", emoji: "🧾", apiGoal: "lead_generation", color: "from-emerald-600/30 to-emerald-800/20", border: "border-emerald-500/50", desc: "Build trust with offer clarity, authority signals, and qualification framing." },
  { id: "google_website_traffic", title: "Website Traffic", subtitle: "Drive visits", emoji: "🧭", apiGoal: "traffic", color: "from-sky-600/30 to-sky-800/20", border: "border-sky-500/50", desc: "Prioritize click through clarity with low friction value communication." },
  { id: "google_product_brand_consideration", title: "Product and Brand Consideration", subtitle: "Evaluate offer", emoji: "🤔", apiGoal: "consideration", color: "from-purple-600/30 to-purple-800/20", border: "border-purple-500/50", desc: "Balance information, value proposition, and moderate call to action pressure." },
  { id: "google_brand_awareness", title: "Brand Awareness and Reach", subtitle: "Introduce brand", emoji: "📣", apiGoal: "awareness", color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50", desc: "Maximize reach, visual clarity, and brand recognition." },
  { id: "google_app_promotion", title: "App Promotion", subtitle: "Drive installs", emoji: "📲", apiGoal: "app_installs", color: "from-indigo-600/30 to-indigo-800/20", border: "border-indigo-500/50", desc: "Highlight app utility fast and reduce cognitive load for install intent." },
  { id: "google_local_store", title: "Local Store Visits and Promotions", subtitle: "Drive foot traffic", emoji: "📍", apiGoal: "traffic", color: "from-teal-600/30 to-teal-800/20", border: "border-teal-500/50", desc: "Connect local relevance, location cues, and store visit motivation." },
  { id: "google_video_views", title: "Video Views", subtitle: "Promote video ads", emoji: "🎬", apiGoal: "video_views", color: "from-rose-600/30 to-rose-800/20", border: "border-rose-500/50", desc: "Validate YouTube video ads for hook strength, pacing, safe zones, and platform specs." },
  { id: "google_no_goal", title: "Create a Campaign Without a Goal's Guidance", subtitle: "Flexible setup", emoji: "⚙️", apiGoal: "awareness", color: "from-slate-600/30 to-slate-800/20", border: "border-slate-500/50", desc: "Start with flexible validation when campaign direction is still being defined." },
];

const META_GOALS = [
  { id: "meta_awareness", title: "Awareness", subtitle: "Introduce brand", emoji: "📣", apiGoal: "awareness", color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50", desc: "Maximize reach, visual clarity, and brand recognition in feed environments." },
  { id: "meta_traffic", title: "Traffic", subtitle: "Drive visits", emoji: "🧭", apiGoal: "traffic", color: "from-sky-600/30 to-sky-800/20", border: "border-sky-500/50", desc: "Prioritize click through clarity with low friction value communication." },
  { id: "meta_engagement", title: "Engagement", subtitle: "Spark interaction", emoji: "💬", apiGoal: "engagement", color: "from-teal-600/30 to-teal-800/20", border: "border-teal-500/50", desc: "Create conversation worthy hooks to increase social interactions." },
  { id: "meta_leads", title: "Leads", subtitle: "Capture leads", emoji: "🧾", apiGoal: "lead_generation", color: "from-emerald-600/30 to-emerald-800/20", border: "border-emerald-500/50", desc: "Build trust with offer clarity, authority signals, and qualification framing." },
  { id: "meta_app_promotion", title: "App Promotion", subtitle: "Drive installs", emoji: "📲", apiGoal: "app_installs", color: "from-indigo-600/30 to-indigo-800/20", border: "border-indigo-500/50", desc: "Highlight app utility fast and reduce cognitive load for install intent." },
  { id: "meta_sales", title: "Sales", subtitle: "Drive purchases", emoji: "🛒", apiGoal: "conversion", color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50", desc: "Strong call to action, high contrast, urgent direct messaging for sales." },
  { id: "meta_video_views", title: "Video Views", subtitle: "Promote video ads", emoji: "🎬", apiGoal: "video_views", color: "from-rose-600/30 to-rose-800/20", border: "border-rose-500/50", desc: "Validate Reels and Feed video ads for hook strength, pacing, safe zones, and platform specs." },
];

const PROGRAMMATIC_GOALS = [
  { id: "awareness", title: "Awareness", subtitle: "Introduce Brand", emoji: "📣", apiGoal: "awareness", color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50", desc: "Maximize reach, visual clarity, and brand recognition." },
  { id: "consideration", title: "Consideration", subtitle: "Evaluate Product", emoji: "🤔", apiGoal: "consideration", color: "from-purple-600/30 to-purple-800/20", border: "border-purple-500/50", desc: "Balance information, value proposition, and moderate CTA." },
  { id: "conversion", title: "Conversion", subtitle: "Drive Action", emoji: "⚡", apiGoal: "conversion", color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50", desc: "Strong CTA, high contrast, urgent direct messaging." },
  { id: "programmatic_video_views", title: "Video Views", subtitle: "Promote video ads", emoji: "🎬", apiGoal: "video_views", color: "from-rose-600/30 to-rose-800/20", border: "border-rose-500/50", desc: "Validate VAST in-stream and out-stream video packs for duration, codecs, ratios, and exchange-friendly specs." },
];

const PLATFORM_GOAL_SETS = {
  google_ads: GOOGLE_GOALS,
  meta_ads: META_GOALS,
  programmatic: PROGRAMMATIC_GOALS,
};

const PLATFORM_GOAL_IDS = {
  google_ads: GOOGLE_GOALS.map((g) => g.id),
  meta_ads: META_GOALS.map((g) => g.id),
  programmatic: PROGRAMMATIC_GOALS.map((g) => g.id),
};

const GOALS = [...GOOGLE_GOALS, ...META_GOALS, ...PROGRAMMATIC_GOALS];

const AUDIENCE_STAGES = [
  {
    id: "cold",
    title: "Cold Audience",
    desc: "First-touch users who need clear category understanding and simple messaging.",
  },
  {
    id: "warm",
    title: "Warm Audience",
    desc: "Partially familiar users who need trust reinforcement and a faster path to action.",
  },
  {
    id: "hot",
    title: "Hot / Retargeting",
    desc: "High-intent users who respond best to urgency, reminders, and conversion clarity.",
  },
];

function normalizeMessagingFingerprint(parts = []) {
  const normalized = parts
    .map((part) => String(part || "").toLowerCase())
    .join(" ")
    .replace(/\.[a-z0-9]{2,5}\b/g, " ")
    .replace(/\b(300x250|728x90|160x600|320x50|1080x1080|1200x628|1920x1080)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.slice(0, 96) || "creative-message";
}

function buildCreativeMessagingFingerprint(creative, payload = {}) {
  const signals = payload?.signals || payload?.extraction_signals || {};
  return normalizeMessagingFingerprint([
    signals.headline,
    signals.primary_message,
    signals.cta,
    payload?.cta_text,
    creative?.name,
  ]);
}

function getGoalTitle(goalId, platformId) {
  const goals = PLATFORM_GOAL_SETS[platformId] || PROGRAMMATIC_GOALS;
  const found = goals.find((goal) => goal.id === goalId);
  if (found) return found.title;
  const legacy = GOALS.find((goal) => goal.id === goalId);
  return legacy?.title || goalId;
}

function resolveApiGoal(goalId, platformId) {
  const goals = PLATFORM_GOAL_SETS[platformId] || PROGRAMMATIC_GOALS;
  const found = goals.find((goal) => goal.id === goalId);
  return found?.apiGoal || goalId;
}

// Video Ads flow is gated strictly to the Video Views objective selected in Step 1.
function isVideoObjective(goalId, platformId) {
  if (!goalId) return false;
  return resolveApiGoal(goalId, platformId) === "video_views";
}

const VERTICALS = [
  { id: "healthcare", title: "Healthcare" },
  { id: "technology", title: "Technology" },
  { id: "automotive", title: "Automotive" },
  { id: "news_media", title: "News / Media" },
  { id: "sports", title: "Sports" },
  { id: "fitness", title: "Fitness" },
  { id: "finance", title: "Business / Finance" },
  { id: "luxury", title: "Luxury" },
  { id: "travel", title: "Travel" },
  { id: "hotels", title: "Hotels" },
  { id: "food", title: "Restaurants / Food" },
  { id: "banking", title: "Banking / FinTech" },
  { id: "real_estate", title: "Real Estate" },
  { id: "education", title: "Education / EdTech" },
  { id: "gaming", title: "Gaming" },
  { id: "entertainment", title: "Entertainment / OTT / Streaming" },
  { id: "ecommerce", title: "E-commerce / Retail" },
  { id: "fashion", title: "Fashion" },
];

const VERTICAL_TITLE_MAP = Object.fromEntries(VERTICALS.map((v) => [v.id, v.title]));


const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};
const stepPanelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.07 },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const VALID_VERTICALS = new Set([
  "automotive", "banking", "ecommerce", "education", "entertainment",
  "fashion", "finance", "fitness", "food", "gaming", "healthcare", "hotels", "luxury",
  "news_media", "real_estate", "sports", "technology", "travel",
]);

// ── Creative analysis ──────────────────────────────────────────────────────────

const ANALYSIS_CONCURRENCY = 4;

async function analyzeSingleCreative(
  creative,
  {
    goal,
    platform,
    verticalForApi,
    audienceStage,
    campaignBrief,
    campaignProductFocus,
    landingUrl,
    extractStrategicPayload,
    useOrchestrator = false,
    campaignId = "",
    accessToken = null,
    taskType = "creative_addition",
    googleCampaignType = "",
  },
) {
  // Video analysis is triggered only for creatives uploaded under the Video Views objective,
  // which are explicitly tagged with mediaType "video" at upload time.
  const isVideoCreative = creative.mediaType === "video";

  if (isVideoCreative) {
    const videoBlob = await getCreativeFullBlob(creative);
    if (!videoBlob) {
      throw new Error(`Could not load video bytes for ${creative.name || creative.id}. Re-upload the creative and try again.`);
    }

    const goalForCreative = creative.adGroupObjective || goal;
    const apiGoal = resolveApiGoal(goalForCreative, platform || "meta_ads");
    const frames = await extractVideoKeyFrames(videoBlob);
    const formData = new FormData();
    formData.append("goal", apiGoal);
    formData.append("vertical", verticalForApi);
    formData.append("platform", platform || "meta_ads");
    formData.append("audience_stage", audienceStage || "cold");
    formData.append("ad_group_objective", goalForCreative || "");
    formData.append("ad_group_name", creative.adGroupName || "");
    formData.append("ad_group_id", creative.adGroupId || "");
    formData.append("creative_name", creative.name || "Video creative");
    formData.append("mime_type", creative.mimeType || videoBlob.type || "video/mp4");
    formData.append("file_size_bytes", String(creative.fileSizeBytes || videoBlob.size || 0));
    formData.append("width", String(creative.sourceWidth || creative.validation?.dimensions?.width || 0));
    formData.append("height", String(creative.sourceHeight || creative.validation?.dimensions?.height || 0));
    formData.append("duration_seconds", String(creative.durationSeconds || creative.validation?.durationSeconds || 0));
    formData.append("file_name", creative.originalFile || creative.name || "video.mp4");
    formData.append("readable", String(creative.validation?.readable !== false));
    if (creative.validation?.frameRate != null || creative.frameRate != null) {
      formData.append("frame_rate", String(creative.frameRate ?? creative.validation?.frameRate));
    }
    if (creative.validation?.hasAudio != null || creative.hasAudio != null) {
      formData.append("has_audio", String(Boolean(creative.hasAudio ?? creative.validation?.hasAudio)));
    }
    if (creative.videoCodec || creative.validation?.videoCodec) {
      formData.append("video_codec", String(creative.videoCodec || creative.validation?.videoCodec));
    }
    if (creative.audioCodec || creative.validation?.audioCodec) {
      formData.append("audio_codec", String(creative.audioCodec || creative.validation?.audioCodec));
    }
    if (campaignBrief?.trim()) formData.append("campaign_brief", campaignBrief.trim());
    if (campaignProductFocus?.trim()) formData.append("campaign_product_focus", campaignProductFocus.trim());
    if (campaignProductFocus?.trim()) formData.append("offer", campaignProductFocus.trim());
    if (platform === "google_ads" && googleCampaignType) {
      formData.append("google_campaign_type", googleCampaignType);
    }
    if (landingUrl?.trim()) formData.append("landing_url", stripUtmFromUrl(landingUrl.trim()));

    frames.forEach((frame, index) => {
      formData.append("frames", frame.blob, `frame-${index}.jpg`);
      formData.append(`frame_time_${index}`, frame.timeLabel);
    });

    const analysisRes = await timeAsyncOperation(
      "preview-tool",
      "POST /api/analyze-video-creative",
      () => fetch("/api/analyze-video-creative", {
        method: "POST",
        body: formData,
      }),
    );

    if (!analysisRes.ok) {
      let apiError = analysisRes.statusText;
      try {
        const body = await analysisRes.json();
        apiError = body?.error || apiError;
      } catch { /* noop */ }
      return {
        creative,
        data: {
          error: apiError,
          media_type: "video",
          main_strategic_problem: undefined,
          attention_analysis: undefined,
          strategic_recommendations: undefined,
          strategic_alignment_score: undefined,
          adigator_analysis: undefined,
        },
      };
    }

    const aiJson = await analysisRes.json();
    const payload = aiJson?.data && typeof aiJson.data === "object"
      ? aiJson.data
      : extractStrategicPayload(aiJson);
    return { creative, data: payload };
  }

  const imageBlob = await getCreativeFullBlob(creative);
  if (!imageBlob) {
    throw new Error(`Could not load image bytes for ${creative.name || creative.id}. Re-upload the creative and try again.`);
  }

  const goalForCreative = creative.adGroupObjective || goal;
  const apiGoal = resolveApiGoal(goalForCreative, platform || "programmatic");
  const formData = new FormData();
  formData.append("image", imageBlob, `${creative.name || "creative"}.jpg`);
  formData.append("goal", apiGoal);
  formData.append("vertical", verticalForApi);
  formData.append("platform", platform || "programmatic");
  formData.append("audience_stage", audienceStage || "cold");
  formData.append("ad_group_objective", goalForCreative || "");
  formData.append("ad_group_name", creative.adGroupName || "");
  formData.append("ad_group_id", creative.adGroupId || "");
  if (campaignBrief?.trim()) {
    formData.append("campaign_brief", campaignBrief.trim());
  }
  if (campaignProductFocus?.trim()) {
    formData.append("campaign_product_focus", campaignProductFocus.trim());
    formData.append("offer", campaignProductFocus.trim());
  }
  if (platform === "google_ads" && googleCampaignType) {
    formData.append("google_campaign_type", googleCampaignType);
  }
  if (landingUrl?.trim()) {
    formData.append("landing_url", stripUtmFromUrl(landingUrl.trim()));
  }

  if (useOrchestrator && campaignId && accessToken) {
    formData.append("creative_id", creative.id);
    formData.append("campaign_id", campaignId);
    formData.append("task_type", taskType);

    const orchestratorRes = await timeAsyncOperation(
      "preview-tool",
      "POST /api/validate-campaign",
      () => fetch("/api/validate-campaign", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      }),
    );

    if (orchestratorRes.ok) {
      const body = await orchestratorRes.json();
      if (body?.success && body?.data?.analysis) {
        const payload = extractStrategicPayload(body.data.analysis);
        return {
          creative,
          data: payload,
          brainReused: Boolean(body.data.reused),
        };
      }
    } else if (orchestratorRes.status !== 401) {
      let apiError = orchestratorRes.statusText;
      try {
        const body = await orchestratorRes.json();
        apiError = body?.error || apiError;
      } catch { /* noop */ }
      console.warn("[validate-campaign] falling back to analyze-creative:", apiError);
    }
  }

  const analysisRes = await timeAsyncOperation(
    "preview-tool",
    "POST /api/analyze-creative",
    () => fetch("/api/analyze-creative", {
      method: "POST",
      body: formData,
    }),
  );

  if (!analysisRes.ok) {
    let apiError = analysisRes.statusText;
    try {
      const body = await analysisRes.json();
      apiError = body?.error || apiError;
    } catch { /* noop */ }
    return {
      creative,
      data: {
        error: apiError,
        main_strategic_problem: undefined,
        attention_analysis: undefined,
        strategic_recommendations: undefined,
        strategic_alignment_score: undefined,
        adigator_analysis: undefined,
      },
    };
  }

  const aiJson = await analysisRes.json();
  const payload = extractStrategicPayload(aiJson);
  return { creative, data: payload };
}

async function analyzeAllCreatives(
  creatives,
  goal,
  platform,
  vertical,
  audienceStage,
  campaignBrief = "",
  campaignProductFocus = "",
  landingUrl = "",
  onProgress,
  orchestratorOptions = {},
) {
  const verticalForApi = VALID_VERTICALS.has(vertical) ? vertical : "technology";
  const googleCampaignType = orchestratorOptions.googleCampaignType || "";

  const extractStrategicPayload = (raw) => {
    const candidate =
      raw?.data?.analysis ||
      raw?.data?.result ||
      raw?.analysis ||
      raw?.result ||
      raw;

    if (!candidate || typeof candidate !== "object") {
      return {
        main_strategic_problem: undefined,
        business_consequence: undefined,
        attention_analysis: undefined,
        strategic_recommendations: undefined,
        expected_improvement: undefined,
        strategic_alignment_score: undefined,
        adigator_analysis: undefined,
      };
    }

    return candidate;
  };

  const analysisConfig = {
    goal,
    platform,
    verticalForApi,
    audienceStage,
    campaignBrief,
    campaignProductFocus,
    landingUrl,
    extractStrategicPayload,
    useOrchestrator: Boolean(orchestratorOptions.useOrchestrator),
    campaignId: orchestratorOptions.campaignId || "",
    accessToken: orchestratorOptions.accessToken || null,
    taskType: orchestratorOptions.taskType || "creative_addition",
    googleCampaignType,
  };

  let completed = 0;

  return mapWithConcurrency(creatives, ANALYSIS_CONCURRENCY, async (creative) => {
    try {
      const result = await analyzeSingleCreative(creative, analysisConfig);
      completed += 1;
      const progressLabel = result.brainReused
        ? `${creative.name || creative.id} (reused stored brain)`
        : (creative.name || creative.id);
      onProgress?.(completed, creatives.length, progressLabel);
      return result;
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Analysis failed";
      console.error(`Analysis failed for ${creative.url}:`, err);
      completed += 1;
      onProgress?.(completed, creatives.length, creative.name || creative.id);
      return {
        creative,
        data: {
          error: errMessage,
          main_strategic_problem: undefined,
          attention_analysis: undefined,
          strategic_recommendations: undefined,
          strategic_alignment_score: undefined,
          adigator_analysis: undefined,
        },
      };
    }
  });
}

function deriveStatusFromIssues(issues) {
  if (issues.some((issue) => issue.severity === "high")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "medium")) return "WARNING";
  return "PASS";
}

const FILE_SIZE_ISSUE_TYPES = new Set([
  "weight",
  "google_weight",
  "meta_weight",
  "mobile_delivery",
  "delivery",
]);

function isFileSizeIssueType(issueType) {
  return FILE_SIZE_ISSUE_TYPES.has(String(issueType || "").toLowerCase());
}

function hideFileSizeIssues(validation) {
  const issues = Array.isArray(validation?.issues) ? validation.issues : [];
  const filteredIssues = issues.filter((issue) => !isFileSizeIssueType(issue?.type));
  const status = deriveStatusFromIssues(filteredIssues);
  return {
    ...validation,
    issues: filteredIssues,
    status,
    valid: status !== "CRITICAL",
  };
}

function hasFileSizeIssue(validation) {
  const issues = Array.isArray(validation?.issues) ? validation.issues : [];
  return issues.some((issue) => isFileSizeIssueType(issue?.type));
}

function getPersistableCreativeUrl(creative) {
  const value = creative?.url;
  if (typeof value !== "string") return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

export default function PreviewTool() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlStepParam = searchParams.get("step");
  const step = resolveWorkflowStep(urlStepParam || "campaign-setup");
  const stepHref = useCallback(
    (targetStep, extraParams = {}) => buildWorkflowStepHref(pathname, targetStep, {
      ...(searchParams.get("demo") ? { demo: searchParams.get("demo") } : {}),
      ...extraParams,
    }),
    [pathname, searchParams],
  );

  const reportDeepLink = useMemo(() => {
    const analysisTab = searchParams.get("analysis_tab");
    const creativeId = searchParams.get("creative_id");
    const templateId = searchParams.get("template_id");
    const previewDevice = searchParams.get("preview_device");
    const previewCreativeId = searchParams.get("preview_creative_id");
    if (!analysisTab && !templateId && !previewCreativeId) return null;

    const validTabs = new Set(["overview", "qa", "creative-analysis"]);
    return {
      analysisTab: analysisTab && validTabs.has(analysisTab) ? analysisTab : undefined,
      selectedCreativeId: creativeId || undefined,
      templateId: templateId || undefined,
      device: previewDevice === "mobile" ? "mobile" : previewDevice === "desktop" ? "desktop" : undefined,
      previewCreativeId: previewCreativeId || undefined,
    };
  }, [searchParams]);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const addToast = useCallback((message, type = "info") => {
    setWorkflowStatus({ message, type, at: Date.now() });
  }, []);

  const [platform, setPlatform] = useState(null);
  const [campaignGoal, setCampaignGoal] = useState(null);
  const [campaignVertical, setCampaignVertical] = useState(null);
  const [campaignAudienceStage, setCampaignAudienceStage] = useState(null);
  const [campaignName, setCampaignName] = useState("");
  // Ad Type controls whether the campaign is validated as Display (image) or Video ads.
  const [adType, setAdType] = useState("display");
  const [advertiserName, setAdvertiserName] = useState("");
  const [advertiserId, setAdvertiserId] = useState("");
  const [campaignBrief, setCampaignBrief] = useState("");
  const [liveBriefInsights, setLiveBriefInsights] = useState(null);
  const [campaignProductFocus, setCampaignProductFocus] = useState("");
  const [googleCampaignType, setGoogleCampaignType] = useState("display");
  const [landingUrl, setLandingUrl] = useState("");
  const [programmaticTaskType, setProgrammaticTaskType] = useState("");
  const [programmaticAdGroupCount, setProgrammaticAdGroupCount] = useState("");
  const [programmaticAdGroups, setProgrammaticAdGroups] = useState([]);
  const [selectedProgrammaticAdGroupIds, setSelectedProgrammaticAdGroupIds] = useState([]);
  const [applyProgrammaticAdGroupsToAll, setApplyProgrammaticAdGroupsToAll] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ACTIVE_CAMPAIGN_STORAGE_KEY) || "";
  });
  const [lookupCampaignId, setLookupCampaignId] = useState("");
  const [campaignOwnerId, setCampaignOwnerId] = useState("");
  const [campaignAccessToken, setCampaignAccessToken] = useState(null);
  const [loadedCampaignSnapshot, setLoadedCampaignSnapshot] = useState(null);
  const [previewStudioCache, setPreviewStudioCache] = useState(null);
  const [campaignAssistantContext, setCampaignAssistantContext] = useState(null);
  const [setupPromptHighlighted, setSetupPromptHighlighted] = useState(false);
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);
  const [assistantQuestions, setAssistantQuestions] = useState([]);
  const [assistantReasoning, setAssistantReasoning] = useState("");
  const [assistantChecking, setAssistantChecking] = useState(false);
  const [assistantSubmitting, setAssistantSubmitting] = useState(false);
  const [assistantProvider, setAssistantProvider] = useState("");
  const [creativeAdditionMode, setCreativeAdditionMode] = useState("");
  const [creativeAdditionFindError, setCreativeAdditionFindError] = useState("");
  const [sizeReviewAcknowledged, setSizeReviewAcknowledged] = useState(false);
  const [urlValidation, setUrlValidation] = useState(null);
  const [urlValidationRunning, setUrlValidationRunning] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY);
  });
  const mountRef = useRef(false);
  const configHydratedRef = useRef(false);
  const skipLocalConfigHydrateRef = useRef(false);

  const [creatives, setCreatives] = useState([]);
  const [isHydratingCreatives, setIsHydratingCreatives] = useState(true);
  const [drag, setDrag] = useState(false);
  const [inventoryIntelligenceOpen, setInventoryIntelligenceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const uploadQueueRef = useRef(Promise.resolve());
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editModalCreative, setEditModalCreative] = useState(null);
  const [originalBackups, setOriginalBackups] = useState({});
  const [compressingCreativeIds, setCompressingCreativeIds] = useState([]);
  const [fixingCreativeIds, setFixingCreativeIds] = useState([]);
  const [targetSizeByCreative, setTargetSizeByCreative] = useState({});
  const [bulkTargetSizeKB, setBulkTargetSizeKB] = useState("150");
  const [isBulkCompressing, setIsBulkCompressing] = useState(false);
  const [bulkCompressProgress, setBulkCompressProgress] = useState({ current: 0, total: 0 });
  const creativesRef = useRef(creatives);
  const compressingIdsRef = useRef(new Set());
  const workflowPersistTimerRef = useRef(null);
  const campaignConfigPersistTimerRef = useRef(null);
  const persistCreativeTimersRef = useRef(new Map());
  const sessionSyncInitializedRef = useRef(false);
  const lastCreativeFingerprintRef = useRef(null);
  const wysiwygExportRef = useRef(null);
  const previewExportContextRef = useRef({
    platform: "",
    templateId: "",
    placement: "",
    device: "desktop",
    creativeId: null,
    studioMode: "previews",
    getPreviewElement: null,
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [baselineAnalysisResult, setBaselineAnalysisResult] = useState(null);
  const [additionBaselineCreativeIds, setAdditionBaselineCreativeIds] = useState([]);
  const [replacementComparisonReport, setReplacementComparisonReport] = useState(null);
  const [renewalReferenceSnapshot, setRenewalReferenceSnapshot] = useState(null);
  const [renewalComparisonReport, setRenewalComparisonReport] = useState(null);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [utmParameters, setUtmParameters] = useState(() => emptyUtmParameters());
  const [urlUtmReferenceSnapshot, setUrlUtmReferenceSnapshot] = useState(null);
  const [urlUtmValidationReport, setUrlUtmValidationReport] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ completed: 0, total: 0, label: "" });
  const [viewerName, setViewerName] = useState("");
  const {
    report: readinessReport,
    loading: readinessLoading,
    error: readinessError,
    progressLabel: readinessProgress,
    runValidation: runReadinessValidation,
    restoreIfMatching: restoreReadinessIfMatching,
    reset: resetReadinessValidation,
  } = useCampaignValidation();

  const [selectedTemplate] = useState("newspaper");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "multiple";
    const storedWorkflow = readStoredWorkflow();
    return storedWorkflow?.viewMode === "single" || storedWorkflow?.viewMode === "multiple" ? storedWorkflow.viewMode : "multiple";
  });
  const [showSlotLabels, setShowSlotLabels] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedWorkflow = readStoredWorkflow();
    return typeof storedWorkflow?.showSlotLabels === "boolean" ? storedWorkflow.showSlotLabels : false;
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  useEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step <= 1) return;
    const storedAdvertiserName = localStorage.getItem("adigator_advertiser_name");
    const storedAdvertiserId = localStorage.getItem("adigator_advertiser_id");
    if (storedAdvertiserName) setAdvertiserName(storedAdvertiserName);
    if (storedAdvertiserId) setAdvertiserId(storedAdvertiserId);
  }, [step]);

  useEffect(() => {
    if (!advertiserName.trim() || advertiserName.trim().length < 2 || !campaignOwnerId) {
      if (!advertiserName.trim()) setAdvertiserId("");
      return undefined;
    }
    const timer = window.setTimeout(() => {
      try {
        const advertiser = createOrGetAdvertiser(advertiserName, campaignOwnerId);
        setAdvertiserId(advertiser.id);
      } catch {
        // Ignore invalid advertiser sync attempts.
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [advertiserName, campaignOwnerId]);

  const existingAdvertisers = useMemo(
    () => (campaignOwnerId ? listAdvertisers(campaignOwnerId) : []),
    [campaignOwnerId, advertiserId],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      const ownerId = await resolveCampaignOwnerId();
      if (!active || !ownerId) return;
      setCampaignOwnerId(ownerId);
      setCreativeStorageScope(ownerId);
      const auth = getFirebaseClientAuth();
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      if (active) setCampaignAccessToken(token || null);
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Restore campaign config from localStorage only when resuming past Step 1. */
  useEffect(() => {
    if (step <= 1 || configHydratedRef.current || typeof window === "undefined") return;
    configHydratedRef.current = true;
    if (skipLocalConfigHydrateRef.current) return;

    const storedPlatform = localStorage.getItem("adigator_platform");
    if (
      !platform &&
      (storedPlatform === "google_ads" || storedPlatform === "meta_ads" || storedPlatform === "programmatic")
    ) {
      setPlatform(storedPlatform);
    }

    const storedGoal = localStorage.getItem("adigator_goal");
    const goalPlatform = storedPlatform || platform;
    const allowedGoalIds = PLATFORM_GOAL_IDS[goalPlatform] || PLATFORM_GOAL_IDS.programmatic;
    if (!campaignGoal && storedGoal && allowedGoalIds.includes(storedGoal)) {
      setCampaignGoal(storedGoal);
    }

    const storedVertical = localStorage.getItem("adigator_vertical");
    if (!campaignVertical && storedVertical) {
      setCampaignVertical(storedVertical === "saas" ? "technology" : storedVertical);
    }

    const storedAudience = localStorage.getItem("adigator_audience_stage");
    if (!campaignAudienceStage && storedAudience) {
      setCampaignAudienceStage(storedAudience);
    }

    const storedCampaignName = localStorage.getItem("adigator_campaign_name");
    if (!campaignName && storedCampaignName) {
      setCampaignName(storedCampaignName);
    }

    const storedAdType = localStorage.getItem("adigator_ad_type");
    if (storedAdType === "video" || storedAdType === "display") {
      setAdType(storedAdType);
    }

    const storedCampaignBrief = localStorage.getItem("adigator_campaign_brief");
    if (!campaignBrief && storedCampaignBrief) {
      setCampaignBrief(storedCampaignBrief);
    }

    const storedProductFocus = localStorage.getItem("adigator_product_focus");
    if (!campaignProductFocus && storedProductFocus) {
      setCampaignProductFocus(storedProductFocus);
    }

    const storedGoogleCampaignType = localStorage.getItem("adigator_google_campaign_type");
    if (storedPlatform === "google_ads" && storedGoogleCampaignType) {
      setGoogleCampaignType(normalizeGoogleCampaignType(storedGoogleCampaignType));
    }

    const storedLandingUrl = localStorage.getItem("adigator_landing_url");
    if (!landingUrl && storedLandingUrl) {
      setLandingUrl(stripUtmFromUrl(storedLandingUrl));
    }

    const storedAdvertiserName = localStorage.getItem("adigator_advertiser_name");
    if (!advertiserName && storedAdvertiserName) {
      setAdvertiserName(storedAdvertiserName);
    }

    const storedAdvertiserId = localStorage.getItem("adigator_advertiser_id");
    if (!advertiserId && storedAdvertiserId) {
      setAdvertiserId(storedAdvertiserId);
    }

    const storedTaskType = localStorage.getItem("adigator_programmatic_task_type");
    if (!programmaticTaskType && storedTaskType) {
      setProgrammaticTaskType(storedTaskType);
    }

    const storedAdGroupCount = localStorage.getItem("adigator_programmatic_ad_group_count");
    if (programmaticAdGroupCount === "" && storedAdGroupCount) {
      const parsedCount = Number(storedAdGroupCount);
      if (!Number.isNaN(parsedCount)) {
        setProgrammaticAdGroupCount(parsedCount);
      }
    }

    const storedAdGroups = localStorage.getItem("adigator_programmatic_ad_groups");
    if (!programmaticAdGroups.length && storedAdGroups) {
      try {
        const parsedGroups = JSON.parse(storedAdGroups);
        if (Array.isArray(parsedGroups)) {
          const forSetupAdGroups = (storedTaskType || programmaticTaskType) === "campaign_setup";
          setProgrammaticAdGroups(normalizeProgrammaticAdGroups(parsedGroups, { forSetup: forSetupAdGroups }));
        }
      } catch {
        // Ignore invalid persisted ad group config.
      }
    }
  }, [
    step,
    platform,
    campaignGoal,
    campaignVertical,
    campaignAudienceStage,
    campaignName,
    campaignBrief,
    campaignProductFocus,
    landingUrl,
    programmaticTaskType,
    programmaticAdGroupCount,
    programmaticAdGroups.length,
  ]);

  useEffect(() => {
    creativesRef.current = creatives;
  }, [creatives]);

  const runUrlValidation = useCallback(async (urlOverride = null) => {
    const trimmedUrl = stripUtmFromUrl(String(urlOverride ?? landingUrl).trim());
    if (!trimmedUrl) {
      setUrlValidation(null);
      clearStoredUrlValidation();
      resetReadinessValidation();
      return null;
    }

    const goalForValidation = platform === "programmatic" && isProgrammaticCampaignSetup(programmaticTaskType)
      ? getProgrammaticCampaignGoalFromAdGroups(programmaticAdGroups) || campaignGoal
      : campaignGoal;

    // Video ads use the explicit Ad Type toggle (non-programmatic) or the Video Views objective.
    const isVideoAd = adType === "video" || isVideoObjective(goalForValidation, platform);

    if (!platform || !goalForValidation) {
      addToast("Complete campaign setup before validating.", "error");
      return null;
    }

    const creativeFingerprintForValidation = getCreativeValidationFingerprint(creatives);
    setUrlValidationRunning(true);
    try {
      const validForUrlCheck = creatives.filter((c) => c?.valid && (c.url || c.image || c.title));
      const [result] = await Promise.all([
        runUrlValidationRequest({
          url: trimmedUrl,
          platform,
          objective: goalForValidation,
          vertical: campaignVertical,
          campaignName: campaignName.trim() || "Campaign",
          campaignBrief: campaignBrief || "",
          adType: isVideoAd ? "video" : "display",
          creatives: validForUrlCheck.length ? validForUrlCheck : creatives,
          getCreativeBlob: getCreativePreviewBlob,
        }),
        runReadinessValidation({
          platform,
          url: trimmedUrl,
          objective: goalForValidation,
          campaignName: campaignName.trim() || "Campaign",
          vertical: campaignVertical || undefined,
          creativeFingerprint: creativeFingerprintForValidation,
          creatives: creatives.map((c) => ({
            id: c.id,
            name: c.name,
            size: c.size,
            fileSize: c.fileSizeBytes,
            mimeType: c.mimeType,
            mediaType: c.mediaType,
            contentHash: c.contentHash,
            validation: c.validation,
          })),
        }),
      ]);
      const enrichedResult = {
        ...result,
        creative_fingerprint: creativeFingerprintForValidation,
      };
      setUrlValidation(enrichedResult);
      writeStoredUrlValidation(enrichedResult);
      return enrichedResult;
    } catch (error) {
      console.error("URL validation failed", error);
      addToast(error?.message || "Validation failed.", "error");
      return null;
    } finally {
      setUrlValidationRunning(false);
    }
  }, [
    landingUrl,
    platform,
    campaignGoal,
    campaignVertical,
    campaignName,
    campaignBrief,
    adType,
    creatives,
    programmaticTaskType,
    programmaticAdGroups,
    addToast,
    runReadinessValidation,
    resetReadinessValidation,
  ]);

  useEffect(() => {
    let active = true;

    (async () => {
      const storedWorkflow = readStoredWorkflow();
      const metas = Array.isArray(storedWorkflow?.creatives) ? storedWorkflow.creatives : [];
      if (!metas.length) {
        if (active) setIsHydratingCreatives(false);
        return;
      }

      const hydrated = await hydrateCreativesList(metas, 4);
      if (active) {
        startTransition(() => {
          setCreatives(hydrated);
          setIsHydratingCreatives(false);
        });
        try {
          writeStoredWorkflow({
            step: storedWorkflow?.step ?? 1,
            creatives: hydrated.map(stripCreativeForPersistence),
            viewMode: storedWorkflow?.viewMode ?? "multiple",
            showSlotLabels: storedWorkflow?.showSlotLabels ?? false,
          });
        } catch {
          // Best-effort: drop legacy inline image payloads from localStorage.
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isHydratingCreatives || !platform) return;

    let active = true;
    (async () => {
      const current = creativesRef.current;
      if (!current.length) return;
      const needsRevalidation = current.some((creative) =>
        creative.validation?.platform !== platform
        || !isPlausibleCreativeDimension(creative.sourceWidth, creative.sourceHeight),
      );
      if (!needsRevalidation) return;

      const updated = await revalidateCreativesForPlatform(current, platform);
      if (active) {
        startTransition(() => {
          setCreatives(updated);
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [isHydratingCreatives, platform]);

  useEffect(() => () => {
    creativesRef.current.forEach((creative) => revokeCreativeObjectUrls(creative));
    persistCreativeTimersRef.current.forEach((timer) => clearTimeout(timer));
    persistCreativeTimersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    if (!urlStepParam) {
      router.replace(stepHref(1), { scroll: false });
      return;
    }
    const resolved = resolveWorkflowStep(urlStepParam);
    const expectedSlug = getWorkflowStepSlug(resolved);
    if (urlStepParam !== expectedSlug) {
      router.replace(stepHref(resolved), { scroll: false });
    }
  }, [urlStepParam, router, stepHref]);

  useEffect(() => {
    if (campaignConfigPersistTimerRef.current) {
      clearTimeout(campaignConfigPersistTimerRef.current);
    }

    campaignConfigPersistTimerRef.current = setTimeout(() => {
      if (platform) localStorage.setItem("adigator_platform", platform);
      else localStorage.removeItem("adigator_platform");

      if (campaignGoal) localStorage.setItem("adigator_goal", campaignGoal);
      else localStorage.removeItem("adigator_goal");

      if (campaignVertical) localStorage.setItem("adigator_vertical", campaignVertical);
      else localStorage.removeItem("adigator_vertical");

      if (campaignAudienceStage) localStorage.setItem("adigator_audience_stage", campaignAudienceStage);
      else localStorage.removeItem("adigator_audience_stage");

      if (campaignName) localStorage.setItem("adigator_campaign_name", campaignName);
      else localStorage.removeItem("adigator_campaign_name");

      localStorage.setItem("adigator_ad_type", adType);

      if (advertiserName) localStorage.setItem("adigator_advertiser_name", advertiserName);
      else localStorage.removeItem("adigator_advertiser_name");

      if (advertiserId) localStorage.setItem("adigator_advertiser_id", advertiserId);
      else localStorage.removeItem("adigator_advertiser_id");

      if (campaignBrief) localStorage.setItem("adigator_campaign_brief", campaignBrief);
      else localStorage.removeItem("adigator_campaign_brief");

      if (campaignProductFocus) localStorage.setItem("adigator_product_focus", campaignProductFocus);
      else localStorage.removeItem("adigator_product_focus");
      if (platform === "google_ads") {
        localStorage.setItem("adigator_google_campaign_type", googleCampaignType);
      } else {
        localStorage.removeItem("adigator_google_campaign_type");
      }

      if (landingUrl) localStorage.setItem("adigator_landing_url", landingUrl);
      else localStorage.removeItem("adigator_landing_url");

      if (programmaticTaskType) localStorage.setItem("adigator_programmatic_task_type", programmaticTaskType);
      else localStorage.removeItem("adigator_programmatic_task_type");

      if (programmaticAdGroupCount !== "") {
        localStorage.setItem("adigator_programmatic_ad_group_count", String(programmaticAdGroupCount));
      } else {
        localStorage.removeItem("adigator_programmatic_ad_group_count");
      }

      if (programmaticAdGroups.length > 0) {
        localStorage.setItem("adigator_programmatic_ad_groups", JSON.stringify(programmaticAdGroups));
      } else {
        localStorage.removeItem("adigator_programmatic_ad_groups");
      }
    }, 500);

    return () => {
      if (campaignConfigPersistTimerRef.current) {
        clearTimeout(campaignConfigPersistTimerRef.current);
      }
    };
  }, [platform, campaignGoal, campaignVertical, campaignAudienceStage, campaignName, adType, advertiserName, advertiserId, campaignBrief, campaignProductFocus, googleCampaignType, landingUrl, programmaticTaskType, programmaticAdGroupCount, programmaticAdGroups]);

  useEffect(() => {
    if (workflowPersistTimerRef.current) {
      clearTimeout(workflowPersistTimerRef.current);
    }

    const delayMs = isLoading || isBulkCompressing || compressingCreativeIds.length > 0 ? 2000 : 350;

    workflowPersistTimerRef.current = setTimeout(() => {
      try {
        writeStoredWorkflow({
          step,
          creatives: creatives.map(stripCreativeForPersistence),
          viewMode,
          showSlotLabels,
        });
      } catch {
        // Ignore quota/serialization issues and keep runtime state alive.
      }
    }, delayMs);

    return () => {
      if (workflowPersistTimerRef.current) {
        clearTimeout(workflowPersistTimerRef.current);
      }
    };
  }, [
    step,
    creatives,
    viewMode,
    showSlotLabels,
    isBulkCompressing,
    compressingCreativeIds.length,
    isLoading,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeCampaignId =
      localStorage.getItem(ACTIVE_CAMPAIGN_STORAGE_KEY)
      || loadedCampaignSnapshot?.id
      || lookupCampaignId
      || "";

    if (!activeCampaignId || step < 1) return;

    persistCampaignProgress(activeCampaignId, {
      lastStep: step,
      stepSlug: getWorkflowStepSlug(step),
      campaignName,
      advertiserName,
      advertiserId,
      platform,
    });
  }, [step, loadedCampaignSnapshot, lookupCampaignId, campaignName, advertiserName, advertiserId, platform]);

  useEffect(() => {
    if (!mountRef.current) return;
    const delayMs = isBulkCompressing || compressingCreativeIds.length > 0 ? 1200 : 350;
    const timer = setTimeout(() => {
      try {
        writeStoredAnalysisResult(analysisResult);
      } catch {
        // Ignore quota issues.
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [analysisResult, isBulkCompressing, compressingCreativeIds.length]);

  useEffect(() => {
    if (analysisSessionId) {
      localStorage.setItem(ANALYSIS_SESSION_STORAGE_KEY, analysisSessionId);
      return;
    }
    localStorage.removeItem(ANALYSIS_SESSION_STORAGE_KEY);
  }, [analysisSessionId]);

  const fileRef = useRef(null);
  const userRef = useRef(null);
  const goalSectionRef = useRef(null);
  const sessionInitRef = useRef(false);
  const lastSessionPayloadRef = useRef(null);
  const sessionNetworkWarningShownRef = useRef(false);
  const [analysisSessionReady, setAnalysisSessionReady] = useState(false);
  const lastUrlUtmAutoValidationKeyRef = useRef("");

  const isProgrammatic = platform === "programmatic";
  const isGoogleAds = platform === "google_ads";
  const isMetaAds = platform === "meta_ads";
  const platformAdapter = useMemo(() => getPlatformAdapter(platform), [platform]);
  const isPlatformSetup = platformAdapter.isSetupTask(programmaticTaskType);
  const isPlatformUpdateTask = platformAdapter.isUpdateTask(programmaticTaskType);
  // Google/Meta setup now mirror the programmatic ad-group workflow (multiple ad groups,
  // each with its own objective + creative folder).
  const platformSetupUsesAdGroups = !isProgrammatic && isPlatformSetup;
  const isProgrammaticSetup = isProgrammatic && isProgrammaticCampaignSetup(programmaticTaskType);
  const isProgrammaticCreativeAdditionFlow = isProgrammatic && isProgrammaticCreativeAddition(programmaticTaskType);
  const isCreativeAdditionAdditionFlow = isProgrammaticCreativeAdditionFlow && creativeAdditionMode === "addition";
  const isProgrammaticCreativeReplacementFlow = isProgrammatic && isProgrammaticCreativeReplacement(programmaticTaskType);
  const isProgrammaticRenewalFlow = isProgrammatic && isProgrammaticCampaignRenewal(programmaticTaskType);
  const isProgrammaticUrlUtmFlow = isProgrammatic && isProgrammaticUrlValidationUtmUpdate(programmaticTaskType);
  const renewalUsesAdGroups = isProgrammaticRenewalFlow && programmaticAdGroups.length > 0;
  const activeProgrammaticAdGroups = useMemo(() => {
    if (!programmaticAdGroups.length) return [];
    if (isProgrammaticSetup || platformSetupUsesAdGroups) return programmaticAdGroups;
    return filterProgrammaticAdGroupsBySelection(
      programmaticAdGroups,
      selectedProgrammaticAdGroupIds,
      applyProgrammaticAdGroupsToAll,
    );
  }, [
    programmaticAdGroups,
    selectedProgrammaticAdGroupIds,
    applyProgrammaticAdGroupsToAll,
    isProgrammaticSetup,
    platformSetupUsesAdGroups,
  ]);
  const creativeAdditionUsesAdGroups = isProgrammaticCreativeAdditionFlow
    && Boolean(creativeAdditionMode)
    && activeProgrammaticAdGroups.length > 0;
  const creativeSwapUsesAdGroups = isProgrammaticCreativeReplacementFlow
    && Boolean(loadedCampaignSnapshot)
    && activeProgrammaticAdGroups.length > 0;
  const usesProgrammaticFolderSections = (isProgrammatic && !isProgrammaticUrlUtmFlow)
    || platformSetupUsesAdGroups
    || (isGoogleAds && creatives.some((creative) => creative?.importedFromGoogleAds));
  const programmaticUsesMultiFolder = isProgrammaticSetup
    || platformSetupUsesAdGroups
    || renewalUsesAdGroups
    || creativeAdditionUsesAdGroups
    || creativeSwapUsesAdGroups;
  const effectiveCampaignGoal = (isProgrammaticSetup || platformSetupUsesAdGroups || renewalUsesAdGroups)
    ? getProgrammaticCampaignGoalFromAdGroups(programmaticAdGroups) || campaignGoal
    : campaignGoal;
  // Video mode is driven by the explicit Ad Type toggle (non-programmatic flows)
  // or the Video Views objective (programmatic ad-group flows).
  const isVideoAdTypeSelected = adType === "video";
  const isVideoObjectiveSelected = isVideoAdTypeSelected || isVideoObjective(effectiveCampaignGoal || campaignGoal, platform);
  // Preview Studio supports display and video templates (platform-specific video placements).
  const showPreviewStudio = true;
  const effectiveTotalSteps = TOTAL_STEPS;
  const resolvedCampaignIntent = useMemo(() => {
    const briefText = campaignBrief?.trim() || "";
    if (!briefText) return "";
    if (liveBriefInsights?.campaignIntent?.trim()) {
      return liveBriefInsights.campaignIntent.trim();
    }
    const goal = effectiveCampaignGoal || campaignGoal || "";
    const resolved = resolveCampaignIntentForBrief(briefText, {
      campaignGoal: goal,
      vertical: campaignVertical,
      storedIntent: loadedCampaignSnapshot?.campaignIntent,
      storedFingerprint: loadedCampaignSnapshot?.campaignIntentFingerprint,
    });
    return resolved.intent;
  }, [
    campaignBrief,
    campaignGoal,
    campaignVertical,
    effectiveCampaignGoal,
    liveBriefInsights,
    loadedCampaignSnapshot?.campaignIntent,
    loadedCampaignSnapshot?.campaignIntentFingerprint,
  ]);
  const resolvedCampaignIntentFingerprint = useMemo(() => {
    const briefText = campaignBrief?.trim() || "";
    if (!briefText) return loadedCampaignSnapshot?.campaignIntentFingerprint || "";
    const goal = effectiveCampaignGoal || campaignGoal || "";
    const resolved = resolveCampaignIntentForBrief(briefText, {
      campaignGoal: goal,
      vertical: campaignVertical,
      storedIntent: loadedCampaignSnapshot?.campaignIntent,
      storedFingerprint: loadedCampaignSnapshot?.campaignIntentFingerprint,
    });
    return resolved.fingerprint;
  }, [
    campaignBrief,
    campaignGoal,
    campaignVertical,
    effectiveCampaignGoal,
    loadedCampaignSnapshot?.campaignIntent,
    loadedCampaignSnapshot?.campaignIntentFingerprint,
  ]);
  const setupFieldContext = useMemo(() => ({
    platform,
    advertiserName,
    campaignVertical,
    campaignGoal,
    campaignProductFocus,
    googleCampaignType: platform === "google_ads" ? googleCampaignType : undefined,
    campaignBrief,
    campaignName,
    adType,
    landingUrl,
    programmaticTaskType,
    programmaticAdGroupCount,
    programmaticAdGroups,
    selectedProgrammaticAdGroupIds,
    applyProgrammaticAdGroupsToAll,
    loadedCampaignSnapshot,
    creativeAdditionMode,
    renewalReferenceSnapshot,
    urlUtmReferenceSnapshot,
    lookupCampaignId,
    renewalUsesAdGroups,
  }), [
    platform,
    advertiserName,
    campaignVertical,
    campaignGoal,
    campaignProductFocus,
    googleCampaignType,
    campaignBrief,
    campaignName,
    adType,
    landingUrl,
    programmaticTaskType,
    programmaticAdGroupCount,
    programmaticAdGroups,
    selectedProgrammaticAdGroupIds,
    applyProgrammaticAdGroupsToAll,
    loadedCampaignSnapshot,
    creativeAdditionMode,
    renewalReferenceSnapshot,
    urlUtmReferenceSnapshot,
    lookupCampaignId,
    renewalUsesAdGroups,
  ]);

  const missingSetupFields = useMemo(
    () => getMissingSetupFields(setupFieldContext),
    [setupFieldContext],
  );

  const recommendedDetailFields = useMemo(
    () => getRecommendedCampaignDetailFields(setupFieldContext),
    [setupFieldContext],
  );

  const missingCampaignDetailFields = useMemo(
    () => getMissingCampaignDetailFields(setupFieldContext),
    [setupFieldContext],
  );

  const hasRequiredCampaignDetails = missingCampaignDetailFields.length === 0;

  const isConfigComplete = isSetupComplete(setupFieldContext);
  const isStepOneReady = Boolean(platform);

  const clearCreativeSessionState = useCallback(() => {
    creativesRef.current.forEach((creative) => revokeCreativeObjectUrls(creative));
    setCreatives([]);
    setAnalysisResult(null);
    writeStoredAnalysisResult(null);
    setUrlValidation(null);
    clearStoredUrlValidation();
    resetReadinessValidation();
    sessionSyncInitializedRef.current = false;
    lastCreativeFingerprintRef.current = null;
  }, [resetReadinessValidation]);

  const clearCreativeSessionAssets = useCallback(async () => {
    const previousCreatives = [...creativesRef.current];
    previousCreatives.forEach((creative) => revokeCreativeObjectUrls(creative));
    await Promise.all(previousCreatives.map((creative) => deleteCreativeAssets(creative.id)));
    clearCreativeSessionState();
  }, [clearCreativeSessionState]);

  const applyCampaignConfigFromSnapshot = useCallback((snapshot) => {
    setActiveCampaignId(snapshot.id);
    if (snapshot.id) {
      setLookupCampaignId(String(snapshot.id));
      localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, snapshot.id);
    }
    setCampaignName(snapshot.campaignName);
    setCampaignBrief(buildImportedGoogleAdsBrief(snapshot));
    setCampaignVertical(isAdigatorVerticalId(snapshot.vertical) ? snapshot.vertical : null);
    setLandingUrl(snapshot.landingUrl);
    setCampaignGoal(snapshot.campaignGoal || null);
    setCampaignAudienceStage(snapshot.campaignAudienceStage || null);
    setCampaignProductFocus(snapshot.campaignProductFocus || "");
    setGoogleCampaignType(normalizeGoogleCampaignType(snapshot.googleCampaignType));
    if (snapshot.campaignTaskType || snapshot.programmaticTaskType) {
      setProgrammaticTaskType(snapshot.campaignTaskType || snapshot.programmaticTaskType);
    }
    setProgrammaticAdGroupCount(
      snapshot.programmaticAdGroupCount
      ?? snapshot.googleAdGroupCount
      ?? "",
    );
    const normalizedGroups = normalizeProgrammaticAdGroups(snapshot.programmaticAdGroups || []);
    setProgrammaticAdGroups(normalizedGroups);
    setSelectedProgrammaticAdGroupIds(
      Array.isArray(snapshot.selectedProgrammaticAdGroupIds) && snapshot.selectedProgrammaticAdGroupIds.length
        ? snapshot.selectedProgrammaticAdGroupIds
        : normalizedGroups.map((group) => group.id),
    );
    setApplyProgrammaticAdGroupsToAll(
      typeof snapshot.applyProgrammaticAdGroupsToAll === "boolean"
        ? snapshot.applyProgrammaticAdGroupsToAll
        : isProgrammaticCampaignRenewal(snapshot.programmaticTaskType),
    );
    if (snapshot.viewMode) setViewMode(snapshot.viewMode);
    if (typeof snapshot.showSlotLabels === "boolean") setShowSlotLabels(snapshot.showSlotLabels);
    if (snapshot.advertiserName) setAdvertiserName(snapshot.advertiserName);
    if (snapshot.advertiserId) setAdvertiserId(snapshot.advertiserId);
    const importedChannel = String(snapshot.googleAdsChannelType || "").toUpperCase();
    if (isVideoObjective(snapshot.campaignGoal, snapshot.platform || "google_ads") || importedChannel === "VIDEO") {
      setAdType("video");
    } else {
      setAdType("display");
    }
    localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, snapshot.id);
  }, []);

  const applyImportedGoogleAdsCreatives = useCallback((snapshot) => {
    if (!snapshot || snapshot.importSource !== "google_ads") return [];
    const groups = Array.isArray(snapshot.programmaticAdGroups) ? snapshot.programmaticAdGroups : [];
    if (groups.length) {
      setProgrammaticAdGroups(normalizeProgrammaticAdGroups(groups));
      setProgrammaticAdGroupCount(groups.length);
      setSelectedProgrammaticAdGroupIds(groups.map((group) => String(group.id)));
    }
    const mappedCreatives = mapGoogleAdsImportedCreativesToTool(snapshot.creatives || [], groups);
    if (!mappedCreatives.length) return [];
    setCreatives(mappedCreatives);
    if (mappedCreatives.some((creative) => creative.mediaType === "video" || creative.type === "video")) {
      setAdType("video");
    }
    return mappedCreatives;
  }, []);

  const applyImportedMetaAdsCreatives = useCallback((snapshot) => {
    if (!snapshot || snapshot.importSource !== "meta_ads") return [];
    const groups = Array.isArray(snapshot.programmaticAdGroups) ? snapshot.programmaticAdGroups : [];
    if (groups.length) {
      setProgrammaticAdGroups(normalizeProgrammaticAdGroups(groups));
      setProgrammaticAdGroupCount(groups.length);
      setSelectedProgrammaticAdGroupIds(groups.map((group) => String(group.id)));
    }
    const mappedCreatives = mapMetaAdsImportedCreativesToTool(snapshot.creatives || [], groups);
    if (!mappedCreatives.length) return [];
    setCreatives(mappedCreatives);
    if (mappedCreatives.some((creative) => creative.mediaType === "video" || creative.type === "video")) {
      setAdType("video");
    }
    return mappedCreatives;
  }, []);

  const applyCreativeReplacementLoad = useCallback(async (snapshot) => {
    applyCampaignConfigFromSnapshot(snapshot);
    setLookupCampaignId(snapshot.id);
    setLoadedCampaignSnapshot(snapshot);
    setIsHydratingCreatives(true);

    try {
      const metas = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
      const hydrated = metas.length ? await hydrateCreativesList(metas, 4) : [];
      const baselines = hydrated.map((creative) => tagCreativeRole(creative, CREATIVE_ROLE_BASELINE));
      setCreatives(baselines);
      writeStoredWorkflow({
        step,
        creatives: baselines.map(stripCreativeForPersistence),
        viewMode: snapshot.viewMode || viewMode,
        showSlotLabels: snapshot.showSlotLabels ?? showSlotLabels,
      });

      if (snapshot.analysisResult && analysisMatchesCreatives(snapshot.analysisResult, hydrated)) {
        setBaselineAnalysisResult(snapshot.analysisResult);
        setAnalysisResult(null);
        writeStoredAnalysisResult(null);
      } else {
        setBaselineAnalysisResult(null);
        setAnalysisResult(null);
        writeStoredAnalysisResult(null);
      }

      if (snapshot.urlValidation) {
        setUrlValidation(snapshot.urlValidation);
        writeStoredUrlValidation(snapshot.urlValidation);
      } else {
        setUrlValidation(null);
        clearStoredUrlValidation();
      }

      setReplacementComparisonReport(null);
      sessionSyncInitializedRef.current = true;
      lastCreativeFingerprintRef.current = getCreativeValidationFingerprint(baselines);
      addToast("Loaded previous creatives and validation history for replacement comparison.", "success");
    } finally {
      setIsHydratingCreatives(false);
    }
  }, [
    addToast,
    applyCampaignConfigFromSnapshot,
    showSlotLabels,
    step,
    viewMode,
  ]);

  const applyCampaignRenewalLoad = useCallback(async (snapshot) => {
    applyCampaignConfigFromSnapshot(snapshot);
    setLookupCampaignId(snapshot.id);
    setLoadedCampaignSnapshot(snapshot);
    setRenewalReferenceSnapshot({
      ...snapshot,
      creatives: Array.isArray(snapshot.creatives) ? [...snapshot.creatives] : [],
      analysisResult: Array.isArray(snapshot.analysisResult) ? [...snapshot.analysisResult] : null,
      programmaticAdGroups: Array.isArray(snapshot.programmaticAdGroups) ? [...snapshot.programmaticAdGroups] : [],
    });
    setIsHydratingCreatives(true);

    try {
      const metas = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
      const hydrated = metas.length ? await hydrateCreativesList(metas, 4) : [];
      setCreatives(hydrated);
      writeStoredWorkflow({
        step,
        creatives: hydrated.map(stripCreativeForPersistence),
        viewMode: snapshot.viewMode || viewMode,
        showSlotLabels: snapshot.showSlotLabels ?? showSlotLabels,
      });

      if (snapshot.analysisResult && analysisMatchesCreatives(snapshot.analysisResult, hydrated)) {
        setBaselineAnalysisResult(snapshot.analysisResult);
        setAnalysisResult(null);
        writeStoredAnalysisResult(null);
      } else {
        setBaselineAnalysisResult(null);
        setAnalysisResult(null);
        writeStoredAnalysisResult(null);
      }

      if (snapshot.urlValidation) {
        setUrlValidation(snapshot.urlValidation);
        writeStoredUrlValidation(snapshot.urlValidation);
      } else {
        setUrlValidation(null);
        clearStoredUrlValidation();
      }

      setRenewalComparisonReport(null);
      sessionSyncInitializedRef.current = true;
      lastCreativeFingerprintRef.current = getCreativeValidationFingerprint(hydrated);
      addToast("Campaign loaded for renewal. Update settings and creatives, then run a fresh validation.", "success");
    } finally {
      setIsHydratingCreatives(false);
    }
  }, [
    addToast,
    applyCampaignConfigFromSnapshot,
    showSlotLabels,
    step,
    viewMode,
  ]);

  const applyUrlUtmCampaignLoad = useCallback(async (snapshot) => {
    applyCampaignConfigFromSnapshot(snapshot);
    setLookupCampaignId(snapshot.id);
    setLoadedCampaignSnapshot(snapshot);
    setUrlUtmReferenceSnapshot({
      ...snapshot,
      creatives: Array.isArray(snapshot.creatives) ? [...snapshot.creatives] : [],
      analysisResult: Array.isArray(snapshot.analysisResult) ? [...snapshot.analysisResult] : null,
      utmParameters: snapshot.utmParameters ? { ...snapshot.utmParameters } : undefined,
    });

    const parsed = parseUtmFromUrl(snapshot.landingUrl || "");
    const resolvedUtms = normalizeUtmParameters(snapshot.utmParameters || parsed.utmParameters);
    const resolvedDestination = snapshot.destinationUrl || parsed.destinationUrl || snapshot.landingUrl || "";

    setDestinationUrl(resolvedDestination);
    setUtmParameters(resolvedUtms);
    setLandingUrl(buildTrackingUrl(resolvedDestination, resolvedUtms) || snapshot.landingUrl || "");
    setIsHydratingCreatives(true);

    try {
      const metas = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
      const hydrated = metas.length ? await hydrateCreativesList(metas, 4) : [];
      setCreatives(hydrated);
      writeStoredWorkflow({
        step,
        creatives: hydrated.map(stripCreativeForPersistence),
        viewMode: snapshot.viewMode || viewMode,
        showSlotLabels: snapshot.showSlotLabels ?? showSlotLabels,
      });

      if (snapshot.analysisResult && analysisMatchesCreatives(snapshot.analysisResult, hydrated)) {
        setBaselineAnalysisResult(snapshot.analysisResult);
        setAnalysisResult(snapshot.analysisResult);
        writeStoredAnalysisResult(snapshot.analysisResult);
      } else {
        setBaselineAnalysisResult(null);
        setAnalysisResult(null);
        writeStoredAnalysisResult(null);
      }

      if (snapshot.urlValidation) {
        setUrlValidation(snapshot.urlValidation);
        writeStoredUrlValidation(snapshot.urlValidation);
      } else {
        setUrlValidation(null);
        clearStoredUrlValidation();
      }

      setUrlUtmValidationReport(null);
      sessionSyncInitializedRef.current = true;
      lastCreativeFingerprintRef.current = getCreativeValidationFingerprint(hydrated);
      addToast("Campaign loaded. Update destination URLs and UTM parameters, then validate.", "success");
    } finally {
      setIsHydratingCreatives(false);
    }
  }, [
    addToast,
    applyCampaignConfigFromSnapshot,
    showSlotLabels,
    step,
    viewMode,
  ]);

  const applyCreativeAdditionMode = useCallback(async (mode, snapshot) => {
    applyCampaignConfigFromSnapshot(snapshot);
    setCreativeAdditionMode(mode);
    setLookupCampaignId(snapshot.id);
    setLoadedCampaignSnapshot(snapshot);

    if (mode === "addition") {
      setIsHydratingCreatives(true);
      try {
        const metas = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
        let hydrated = metas.length ? await hydrateCreativesList(metas, 4) : [];
        if (hydrated.length && platform) {
          hydrated = await revalidateCreativesForPlatform(hydrated, platform);
        }
        setCreatives(hydrated);
        writeStoredWorkflow({
          step,
          creatives: hydrated.map(stripCreativeForPersistence),
          viewMode: snapshot.viewMode || viewMode,
          showSlotLabels: snapshot.showSlotLabels ?? showSlotLabels,
        });
        const baselineIds = hydrated.map((creative) => creative.id);
        setAdditionBaselineCreativeIds(baselineIds);
        const restoredAnalysis = Array.isArray(snapshot.analysisResult)
          ? filterAnalysisForCreatives(snapshot.analysisResult, hydrated)
          : [];
        if (restoredAnalysis.length > 0) {
          setBaselineAnalysisResult(restoredAnalysis);
          setAnalysisResult(restoredAnalysis);
          writeStoredAnalysisResult(restoredAnalysis);
        } else {
          setBaselineAnalysisResult(null);
          setAnalysisResult(null);
          writeStoredAnalysisResult(null);
        }
        if (snapshot.urlValidation) {
          setUrlValidation(snapshot.urlValidation);
          writeStoredUrlValidation(snapshot.urlValidation);
        } else {
          setUrlValidation(null);
          clearStoredUrlValidation();
        }
        sessionSyncInitializedRef.current = true;
        lastCreativeFingerprintRef.current = getCreativeValidationFingerprint(hydrated);
        addToast("Loaded existing campaign creatives and validation history.", "success");
      } finally {
        setIsHydratingCreatives(false);
      }
      return;
    }

    setAdditionBaselineCreativeIds([]);
    await clearCreativeSessionAssets();
    writeStoredWorkflow({
      step,
      creatives: [],
      viewMode: snapshot.viewMode || viewMode,
      showSlotLabels: snapshot.showSlotLabels ?? showSlotLabels,
    });
    addToast("Campaign settings loaded. Upload new creatives to start a fresh validation session.", "info");
  }, [
    addToast,
    applyCampaignConfigFromSnapshot,
    clearCreativeSessionAssets,
    platform,
    showSlotLabels,
    step,
    viewMode,
  ]);

  const getAccessToken = useCallback(async () => {
    const auth = getFirebaseClientAuth();
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const handleFindProgrammaticCampaign = useCallback(async (overrides = null) => {
    setCreativeAdditionFindError("");
    if (!campaignOwnerId) {
      setCreativeAdditionFindError("Unable to resolve your campaign session. Refresh the page and try again.");
      return;
    }

    const resolvedName = (overrides?.campaignName ?? campaignName).trim();
    const resolvedId = (overrides?.campaignId ?? lookupCampaignId).trim();
    const isGoogleLookup = platform === "google_ads";
    const hasLookupInput = Boolean(resolvedName || resolvedId);

    if (overrides?.campaignName) setCampaignName(overrides.campaignName);
    if (overrides?.campaignId) setLookupCampaignId(overrides.campaignId);

    if ((isGoogleLookup && !hasLookupInput) || (!isGoogleLookup && (!resolvedName || !resolvedId))) {
      setCreativeAdditionFindError(
        isGoogleLookup
          ? "Enter Google campaign name or campaign ID to import from your connected Google Ads account."
          : "Enter the saved Adigator IQ campaign name and ID, or select a campaign from your advertiser list.",
      );
      return;
    }

    let match = platform === "programmatic"
      ? findProgrammaticCampaign({
        campaignId: resolvedId,
        campaignName: resolvedName,
        ownerId: campaignOwnerId,
      })
      : getCampaignById(resolvedId, campaignOwnerId);

    if (!match && isGoogleLookup) {
      try {
        const imported = await importGoogleAdsCampaignFromSession({
          campaignName: resolvedName,
          campaignId: resolvedId,
        });
        if (imported) {
          match = {
            ...imported,
            ownerId: campaignOwnerId || imported.ownerId,
            platform: "google_ads",
          };
          upsertCampaign(match);
        }
      } catch (fetchError) {
        const errorText = fetchError instanceof Error ? fetchError.message : "Google Ads import failed.";
        if (!/unauthorized/i.test(errorText)) {
          setCreativeAdditionFindError(errorText);
          return;
        }
      }
    }

    if (!match) {
      const token = await getAccessToken();
      if (token) {
        try {
          const fetched = platform === "programmatic"
            ? await fetchProgrammaticCampaignFromApi({
              campaignName: resolvedName,
              campaignId: resolvedId,
              accessToken: token,
            })
            : await fetchCampaignFromApi({
              campaignName: resolvedName,
              campaignId: resolvedId,
              accessToken: token,
              platform,
            });
          match = fetched;
        } catch (fetchError) {
          const errorText = fetchError instanceof Error ? fetchError.message : "Campaign lookup failed.";
          if (!isGoogleLookup || !/unauthorized/i.test(errorText)) {
            setCreativeAdditionFindError(errorText);
            return;
          }
        }
        if (match && match.ownerId && match.ownerId !== campaignOwnerId && match.importSource !== "google_ads") {
          match = null;
        }
        if (match) {
          match = { ...match, ownerId: campaignOwnerId || match.ownerId };
          if (platform === "programmatic") {
            upsertProgrammaticCampaign({ ...match, ownerId: campaignOwnerId });
          } else {
            upsertCampaign({ ...match, ownerId: campaignOwnerId, platform });
          }
        }
      }
    }

    if (!match) {
      setLoadedCampaignSnapshot(null);
      setCreativeAdditionMode("");
      setCreativeAdditionFindError(
        isGoogleLookup
          ? "No Google Ads campaign matched that name/ID on your connected account. Check the value and try again."
          : "No saved Adigator IQ campaign matched that name and ID on your account. Save the campaign in Adigator IQ first, or continue with a new setup.",
      );
      return;
    }
    setLoadedCampaignSnapshot(match);
    setCreativeAdditionMode("");
    if (isGoogleLookup && match.importSource === "google_ads") {
      const sourceLabel = match.googleAdsCampaignSource === "draft" ? "Draft" : "Published";
      addToast(`Imported Google Ads ${sourceLabel} campaign into Adigator IQ.`, "success");
    }
    if (isCreativeReplacementTask(programmaticTaskType)) {
      void applyCreativeReplacementLoad(match);
      return;
    }
    if (isCampaignRenewalTask(programmaticTaskType)) {
      void applyCampaignRenewalLoad(match);
      return;
    }
    if (isUrlUtmUpdateTask(programmaticTaskType)) {
      void applyUrlUtmCampaignLoad(match);
      return;
    }
    if (isCreativeAdditionTask(programmaticTaskType)) {
      sessionSyncInitializedRef.current = false;
      applyCampaignConfigFromSnapshot(match);
      applyImportedGoogleAdsCreatives(match);
      addToast("Campaign found. Choose how to proceed.", "success");
      return;
    }
    applyCampaignConfigFromSnapshot(match);
    applyImportedGoogleAdsCreatives(match);
  }, [lookupCampaignId, campaignName, campaignOwnerId, programmaticTaskType, platform, getAccessToken, applyCampaignConfigFromSnapshot, applyImportedGoogleAdsCreatives, applyCreativeReplacementLoad, applyCampaignRenewalLoad, applyUrlUtmCampaignLoad, addToast]);

  const reportDeepLinkHandledRef = useRef("");

  const loadCampaignFromDownloadLink = useCallback(async ({ campaignId, campaignName: linkCampaignName, advertiserId: linkAdvertiserId }) => {
    if (!campaignOwnerId || !campaignId?.trim() || !linkCampaignName?.trim()) return false;

    let match = findProgrammaticCampaign({
      campaignId: campaignId.trim(),
      campaignName: linkCampaignName.trim(),
      ownerId: campaignOwnerId,
    });

    if (!match) {
      const token = await getAccessToken();
      if (token) {
        match = await fetchProgrammaticCampaignFromApi({
          campaignName: linkCampaignName.trim(),
          campaignId: campaignId.trim(),
          accessToken: token,
        });
        if (match && match.ownerId && match.ownerId !== campaignOwnerId) {
          match = null;
        }
        if (match) {
          upsertProgrammaticCampaign({ ...match, ownerId: campaignOwnerId });
        }
      }
    }

    if (!match) {
      addToast("Campaign not found on this device. Open it from Step 1 to view this report.", "error");
      return false;
    }

    setLookupCampaignId(match.id);
    setLoadedCampaignSnapshot(match);
    if (linkAdvertiserId) setAdvertiserId(linkAdvertiserId);
    if (match.programmaticTaskType) setProgrammaticTaskType(match.programmaticTaskType);
    applyCampaignConfigFromSnapshot(match);

    setIsHydratingCreatives(true);
    try {
      const metas = Array.isArray(match.creatives) ? match.creatives : [];
      let hydrated = metas.length ? await hydrateCreativesList(metas, 4) : [];
      if (hydrated.length && platform) {
        hydrated = await revalidateCreativesForPlatform(hydrated, platform);
      }
      setCreatives(hydrated);
      writeStoredWorkflow({
        step,
        creatives: hydrated.map(stripCreativeForPersistence),
        viewMode: match.viewMode || viewMode,
        showSlotLabels: match.showSlotLabels ?? showSlotLabels,
      });

      const restoredAnalysis = Array.isArray(match.analysisResult)
        ? filterAnalysisForCreatives(match.analysisResult, hydrated)
        : [];
      if (restoredAnalysis.length > 0) {
        setAnalysisResult(restoredAnalysis);
        writeStoredAnalysisResult(restoredAnalysis);
      }

      if (match.urlValidation) {
        setUrlValidation(match.urlValidation);
        writeStoredUrlValidation(match.urlValidation);
      }

      if (match.previewStudioCache) {
        setPreviewStudioCache(match.previewStudioCache);
        setPreviewStudioStorageScope(campaignOwnerId);
        void savePreviewStudioCacheToStorage(match.id, match.previewStudioCache);
      } else {
        setPreviewStudioStorageScope(campaignOwnerId);
        const storedCache = await loadPreviewStudioCacheFromStorage(match.id);
        if (storedCache) setPreviewStudioCache(storedCache);
      }

      sessionSyncInitializedRef.current = true;
      lastCreativeFingerprintRef.current = getCreativeValidationFingerprint(hydrated);
      addToast(`Loaded "${linkCampaignName}". Ready to view.`, "success");
      return true;
    } finally {
      setIsHydratingCreatives(false);
    }
  }, [
    campaignOwnerId,
    getAccessToken,
    applyCampaignConfigFromSnapshot,
    addToast,
    platform,
    step,
    viewMode,
    showSlotLabels,
  ]);

  useEffect(() => {
    const campaignIdParam = searchParams.get("campaign_id");
    const campaignNameParam = searchParams.get("campaign_name");
    if (!campaignIdParam || !campaignNameParam || !campaignOwnerId) return;

    const linkKey = `${campaignIdParam}|${campaignNameParam}|${searchParams.get("advertiser_id") || ""}`;
    if (reportDeepLinkHandledRef.current === linkKey) return;
    reportDeepLinkHandledRef.current = linkKey;

    void loadCampaignFromDownloadLink({
      campaignId: campaignIdParam,
      campaignName: campaignNameParam,
      advertiserId: searchParams.get("advertiser_id") || "",
    });
  }, [searchParams, campaignOwnerId, loadCampaignFromDownloadLink]);

  const handleAdvertiserCampaignSelect = useCallback((campaign) => {
    if (!campaignOwnerId || !campaign?.id || !campaign?.name) return;

    persistAdvertiserCampaignSelection({
      ownerId: campaignOwnerId,
      advertiserName: advertiserName.trim() || "Selected advertiser",
      advertiserId: advertiserId || undefined,
      campaign: {
        ...campaign,
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform || "programmatic",
        validated: Boolean(campaign.validated ?? false),
        updatedAt: campaign.updatedAt || new Date().toISOString(),
        adGroups: Array.isArray(campaign.adGroups) ? campaign.adGroups : [],
      },
    });

    void handleFindProgrammaticCampaign({
      campaignName: campaign.name,
      campaignId: campaign.id,
    });
  }, [advertiserId, advertiserName, campaignOwnerId, handleFindProgrammaticCampaign]);

  const handleCreativeAdditionModeChange = useCallback((mode) => {
    if (!loadedCampaignSnapshot) return;
    void applyCreativeAdditionMode(mode, loadedCampaignSnapshot);
  }, [applyCreativeAdditionMode, loadedCampaignSnapshot]);

  const buildProgrammaticCampaignSnapshot = useCallback((analysisOverride = null) => {
    const id = platform === "programmatic"
      ? resolveProgrammaticCampaignId({
        taskType: programmaticTaskType,
        activeCampaignId,
        lookupCampaignId,
        loadedCampaignId: loadedCampaignSnapshot?.id,
        referenceCampaignId: renewalReferenceSnapshot?.id || urlUtmReferenceSnapshot?.id,
      })
      : resolveCampaignId({
        platform: platform || "programmatic",
        taskType: programmaticTaskType,
        activeCampaignId,
        lookupCampaignId,
        loadedCampaignId: loadedCampaignSnapshot?.id,
        referenceCampaignId: renewalReferenceSnapshot?.id || urlUtmReferenceSnapshot?.id,
      });
    const resolvedAnalysis = analysisOverride ?? analysisResult;
    const briefText = campaignBrief?.trim() || "";
    const goal = effectiveCampaignGoal || campaignGoal || "";
    const vertical = campaignVertical || loadedCampaignSnapshot?.vertical || "";
    const resolvedIntent = resolveCampaignIntentForBrief(briefText, {
      campaignGoal: goal,
      vertical,
      storedIntent: loadedCampaignSnapshot?.campaignIntent,
      storedFingerprint: loadedCampaignSnapshot?.campaignIntentFingerprint,
    });
    const campaignIntent = resolvedIntent.intent;
    const intentFingerprint = resolvedIntent.fingerprint;

    const analysisEntries = Array.isArray(resolvedAnalysis) ? resolvedAnalysis : [];
    const urlVal = urlValidation || readStoredUrlValidation();
    let campaignAlignmentReport;
    if (briefText && analysisEntries.length) {
      const alignmentFingerprint = buildCampaignAlignmentFingerprint({
        campaignBrief: briefText,
        campaignIntent,
        campaignGoal: goal,
        campaignVertical: vertical,
        landingUrl: landingUrl || destinationUrl || "",
        analysisCount: analysisEntries.length,
        urlCheckedAt: String(urlVal?.checked_at || ""),
      });
      const storedAlignment = loadedCampaignSnapshot?.campaignAlignmentReport;
      if (storedAlignment?.sourceFingerprint === alignmentFingerprint) {
        campaignAlignmentReport = storedAlignment;
      } else {
        campaignAlignmentReport = computeCampaignAlignmentReport({
          campaignBrief: briefText,
          campaignIntent,
          campaignGoal: goal || "awareness",
          campaignVertical: vertical || "technology",
          platform: platform || "programmatic",
          analysisEntries,
          urlValidation: urlVal,
        }) || undefined;
      }
    }

    return {
      id,
      platform: platform || "programmatic",
      campaignTaskType: programmaticTaskType || "campaign_setup",
      ownerId: campaignOwnerId || loadedCampaignSnapshot?.ownerId || "",
      campaignName: campaignName.trim() || "Untitled Campaign",
      campaignBrief,
      campaignIntent: campaignIntent || undefined,
      campaignIntentFingerprint: campaignIntent ? intentFingerprint : undefined,
      campaignAlignmentReport,
      vertical: campaignVertical || "",
      landingUrl,
      campaignGoal: effectiveCampaignGoal || campaignGoal || "",
      campaignAudienceStage: campaignAudienceStage || "",
      campaignProductFocus,
      googleCampaignType: platform === "google_ads" ? googleCampaignType : undefined,
      programmaticTaskType,
      programmaticAdGroupCount,
      programmaticAdGroups,
      selectedProgrammaticAdGroupIds,
      applyProgrammaticAdGroupsToAll,
      importSource: loadedCampaignSnapshot?.importSource,
      googleAdsCustomerId: loadedCampaignSnapshot?.googleAdsCustomerId,
      googleAdsCampaignStatus: loadedCampaignSnapshot?.googleAdsCampaignStatus,
      googleAdsChannelType: loadedCampaignSnapshot?.googleAdsChannelType,
      googleAdsChannelSummary: loadedCampaignSnapshot?.googleAdsChannelSummary,
      googleAdsCampaignSource: loadedCampaignSnapshot?.googleAdsCampaignSource,
      googleAdsDraftId: loadedCampaignSnapshot?.googleAdsDraftId,
      googleAdsBudgetAmountMicros: loadedCampaignSnapshot?.googleAdsBudgetAmountMicros,
      googleAdsStartDate: loadedCampaignSnapshot?.googleAdsStartDate,
      googleAdsEndDate: loadedCampaignSnapshot?.googleAdsEndDate,
      creatives: creatives.map(stripCreativeForPersistence),
      analysisResult: Array.isArray(resolvedAnalysis) ? resolvedAnalysis : null,
      urlValidation: urlValidation || readStoredUrlValidation(),
      destinationUrl,
      utmParameters,
      viewMode,
      showSlotLabels,
      advertiserId: advertiserId || undefined,
      advertiserName: advertiserName.trim() || undefined,
      previewStudioCache: previewStudioCache || loadedCampaignSnapshot?.previewStudioCache || undefined,
      campaignAssistantContext: campaignAssistantContext || loadedCampaignSnapshot?.campaignAssistantContext || undefined,
      createdAt: loadedCampaignSnapshot?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...platformAdapter.buildSnapshotExtensions({
        googleCampaignType,
        googleAdGroupCount: programmaticAdGroupCount,
        programmaticAdGroupCount,
        programmaticAdGroups,
        selectedProgrammaticAdGroupIds,
        applyProgrammaticAdGroupsToAll,
      }),
    };
  }, [
    activeCampaignId,
    analysisResult,
    campaignOwnerId,
    campaignAudienceStage,
    campaignBrief,
    campaignGoal,
    campaignName,
    campaignProductFocus,
    googleCampaignType,
    campaignVertical,
    creativeAdditionMode,
    creatives,
    effectiveCampaignGoal,
    landingUrl,
    destinationUrl,
    utmParameters,
    loadedCampaignSnapshot,
    lookupCampaignId,
    programmaticAdGroupCount,
    programmaticAdGroups,
    selectedProgrammaticAdGroupIds,
    applyProgrammaticAdGroupsToAll,
    programmaticTaskType,
    renewalReferenceSnapshot,
    showSlotLabels,
    urlUtmReferenceSnapshot,
    urlValidation,
    viewMode,
    advertiserId,
    advertiserName,
    previewStudioCache,
    campaignAssistantContext,
    platform,
    platformAdapter,
    googleCampaignType,
  ]);

  const handlePreviewStudioCacheUpdate = useCallback((cache) => {
    setPreviewStudioCache(cache);
    const campaignId = activeCampaignId || loadedCampaignSnapshot?.id;
    if (!cache || !campaignId || !campaignOwnerId) return;
    setPreviewStudioStorageScope(campaignOwnerId);
    void savePreviewStudioCacheToStorage(campaignId, cache);
  }, [activeCampaignId, loadedCampaignSnapshot?.id, campaignOwnerId]);

  useEffect(() => {
    let active = true;
    const campaignId = activeCampaignId || loadedCampaignSnapshot?.id;
    const snapshotCache = loadedCampaignSnapshot?.previewStudioCache || null;

    if (!campaignId) {
      setPreviewStudioCache(snapshotCache);
      return undefined;
    }

    setPreviewStudioStorageScope(campaignOwnerId || "default");
    void loadPreviewStudioCacheFromStorage(campaignId).then((storedCache) => {
      if (!active) return;
      setPreviewStudioCache(mergePreviewStudioCaches(snapshotCache, storedCache) || snapshotCache);
    });

    return () => {
      active = false;
    };
  }, [
    activeCampaignId,
    loadedCampaignSnapshot?.id,
    loadedCampaignSnapshot?.previewStudioCache,
    campaignOwnerId,
  ]);

  useEffect(() => {
    setCampaignAssistantContext(loadedCampaignSnapshot?.campaignAssistantContext || null);
  }, [loadedCampaignSnapshot?.id, loadedCampaignSnapshot?.campaignAssistantContext]);

  const persistProgrammaticCampaignSnapshot = useCallback(async (analysisOverride = null, options = {}) => {
    const { syncRemote = true } = options;
    if (!platform || !campaignOwnerId) return null;
    const adapter = getPlatformAdapter(platform);
    const snapshotBase = buildProgrammaticCampaignSnapshot(analysisOverride);
    if (!snapshotBase.id && adapter.isUpdateTask(programmaticTaskType)) {
      return null;
    }
    const creativesWithPreviews = await Promise.all(
      creatives.map((creative) => attachPersistedPreviewData(creative)),
    );

    const preserveStoredAssets = adapter.isUpdateTask(programmaticTaskType) && (
      !sessionSyncInitializedRef.current
      || (isProgrammaticCreativeAdditionFlow && !creativeAdditionMode)
      || (isProgrammaticCreativeAdditionFlow && creativeAdditionMode === "new_setup" && creatives.length === 0)
    );
    const storedCampaign = snapshotBase.id
      ? (platform === "programmatic"
        ? getProgrammaticCampaignById(snapshotBase.id, campaignOwnerId)
        : getCampaignById(snapshotBase.id, campaignOwnerId))
      : null;

    const snapshot = {
      ...snapshotBase,
      ownerId: campaignOwnerId,
      creatives: preserveStoredAssets && storedCampaign?.creatives?.length
        ? storedCampaign.creatives
        : creativesWithPreviews,
      analysisResult: preserveStoredAssets && storedCampaign?.analysisResult?.length
        ? storedCampaign.analysisResult
        : snapshotBase.analysisResult,
    };
    const saved = platform === "programmatic"
      ? upsertProgrammaticCampaign(snapshot)
      : upsertCampaign(snapshot);
    setLoadedCampaignSnapshot((prev) => (prev?.id === saved.id ? saved : prev));
    warmDashboardCampaignCaches(saved);
    setActiveCampaignId(saved.id);
    localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, saved.id);

    if (snapshot.advertiserId && snapshot.advertiserName) {
      if (platform === "programmatic") {
        syncAdvertiserFromProgrammaticSnapshot(snapshot);
      } else {
        syncAdvertiserFromGenericSession({
          ownerId: campaignOwnerId,
          advertiserId: snapshot.advertiserId,
          advertiserName: snapshot.advertiserName,
          campaignName: snapshot.campaignName,
          platform,
          campaignId: saved.id,
          campaignGoal: snapshot.campaignGoal,
          validated: Array.isArray(snapshot.analysisResult) && snapshot.analysisResult.length > 0,
          creatives: snapshot.creatives || [],
        });
      }
    }

    const token = await getAccessToken();
    if (token && syncRemote) {
      if (platform === "programmatic") {
        await persistProgrammaticCampaignToApi(saved, token);
      } else {
        await persistCampaignToApi(saved, token);
      }
    }

    return saved;
  }, [
    buildProgrammaticCampaignSnapshot,
    campaignVertical,
    campaignOwnerId,
    platform,
    creatives,
    getAccessToken,
    programmaticTaskType,
    advertiserId,
    advertiserName,
    creativeAdditionMode,
    isProgrammaticCreativeAdditionFlow,
  ]);

  useEffect(() => {
    if (!previewStudioCache || !campaignOwnerId) return;
    if (platform !== "programmatic") return;
    const timer = window.setTimeout(() => {
      void persistProgrammaticCampaignSnapshot(null, { syncRemote: false });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [previewStudioCache, platform, campaignOwnerId, persistProgrammaticCampaignSnapshot]);

  useEffect(() => {
    if (!campaignVertical || !campaignOwnerId || isHydratingCreatives) return;

    const isSetup = isPlatformSetup;
    const isUpdate = isPlatformUpdateTask;
    if (!isSetup && !isUpdate) return;

    if (isSetup && (!activeCampaignId || !campaignName.trim())) return;
    if (isUpdate && !loadedCampaignSnapshot?.id && !lookupCampaignId?.trim() && !activeCampaignId) return;

    const timer = window.setTimeout(() => {
      void persistProgrammaticCampaignSnapshot(null, { syncRemote: false });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    platform,
    programmaticTaskType,
    isPlatformSetup,
    isPlatformUpdateTask,
    activeCampaignId,
    lookupCampaignId,
    loadedCampaignSnapshot?.id,
    campaignVertical,
    campaignOwnerId,
    campaignName,
    campaignBrief,
    landingUrl,
    destinationUrl,
    programmaticAdGroupCount,
    programmaticAdGroups,
    selectedProgrammaticAdGroupIds,
    applyProgrammaticAdGroupsToAll,
    creatives,
    urlValidation,
    analysisResult,
    utmParameters,
    isHydratingCreatives,
    persistProgrammaticCampaignSnapshot,
  ]);

  const scrollToSection = useCallback((ref) => {
    if (!ref?.current) return;
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, []);

  const createAnalysisSession = useCallback(async (initialValues = {}) => {
    const token = await getAccessToken();
    if (!token) return null;

    let response;
    try {
      response = await timeAsyncOperation(
        "preview-tool",
        "POST /api/session/create",
        () => fetch("/api/session/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(initialValues),
        }),
      );
    } catch (error) {
      if (!sessionNetworkWarningShownRef.current) {
        sessionNetworkWarningShownRef.current = true;
        console.warn("Session create skipped due to temporary network/API unavailability.", error);
      }
      return null;
    }

    if (!response.ok) {
      let message = "Unable to create analysis session.";
      try {
        const payload = await response.json();
        if (payload?.skipped || payload?.schemaUnavailable || payload?.serviceUnavailable) {
          if (!sessionNetworkWarningShownRef.current) {
            sessionNetworkWarningShownRef.current = true;
            console.warn(
              "Analysis sessions are temporarily unavailable. Preview tool will continue without server session persistence.",
              payload.error || message,
            );
          }
          return null;
        }
        if (payload?.error) message = payload.error;
      } catch {
        // Ignore parse errors and keep fallback message.
      }

      const isMissingTable = /analysis_sessions|schema cache|does not exist/i.test(message);
      if (isMissingTable) {
        if (!sessionNetworkWarningShownRef.current) {
          sessionNetworkWarningShownRef.current = true;
          console.warn(
            "Analysis sessions table not found in Supabase. Preview tool will continue without server session persistence. Run supabase/RUN_PREVIEW_TOOL_TABLES.sql in the SQL editor.",
            message,
          );
        }
        return null;
      }

      if (!sessionNetworkWarningShownRef.current) {
        sessionNetworkWarningShownRef.current = true;
        console.warn("Session create failed:", message);
      }
      return null;
    }

    const payload = await response.json();
    if (payload?.skipped || payload?.serviceUnavailable || payload?.schemaUnavailable) {
      if (!sessionNetworkWarningShownRef.current) {
        sessionNetworkWarningShownRef.current = true;
        console.warn(
          "Analysis sessions are temporarily unavailable. Preview tool will continue without server session persistence.",
          payload.error || "Unable to create analysis session.",
        );
      }
      return null;
    }

    const sessionId = payload?.sessionId;
    if (!sessionId) {
      console.warn("Session creation succeeded but no sessionId was returned.");
      return null;
    }

    setAnalysisSessionId(sessionId);
    return sessionId;
  }, [getAccessToken]);

  const clearStaleAnalysisSession = useCallback(() => {
    setAnalysisSessionId(null);
    lastSessionPayloadRef.current = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(ANALYSIS_SESSION_STORAGE_KEY);
    }
  }, []);

  const verifyAnalysisSessionId = useCallback(async (sessionId) => {
    if (!sessionId) return false;
    try {
      const token = await getAccessToken();
      if (!token) return false;

      const response = await fetch(`/api/session/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) return true;
      if (response.status === 404) return false;

      let message = "";
      try {
        const payload = await response.json();
        message = String(payload?.error || "");
      } catch {
        // Ignore parse errors.
      }
      if (/analysis_sessions|schema cache|does not exist/i.test(message)) return false;
      return false;
    } catch {
      return false;
    }
  }, [getAccessToken]);

  const updateAnalysisSession = useCallback(async (updates) => {
    let sessionId = analysisSessionId;
    if (!sessionId) return false;

    const readUpdateFailure = async (response, fallback) => {
      try {
        const payload = await response.json();
        if (payload?.skipped || payload?.schemaUnavailable) {
          return { kind: "schema", message: payload?.error || fallback };
        }
        if (payload?.notFound) {
          return { kind: "stale", message: payload?.error || fallback };
        }
        if (payload?.error) {
          return { kind: "error", message: String(payload.error) };
        }
      } catch {
        // Fall through to text body.
      }
      try {
        const text = (await response.text()).trim();
        if (text) return { kind: "error", message: text.slice(0, 240) };
      } catch {
        // Ignore.
      }
      return { kind: "error", message: fallback };
    };

    const isStaleSessionFailure = (failure, status) => {
      if (status === 404 || failure?.kind === "stale") return true;
      const message = String(failure?.message || "").toLowerCase();
      return /pgrst116|not found|0 rows|no rows|multiple \(or no\) rows/.test(message);
    };

    const attemptUpdate = async (targetSessionId) => {
      const token = await getAccessToken();
      if (!token) return { ok: false, failure: { kind: "error", message: "Unauthorized." }, status: 401 };

      const response = await timeAsyncOperation(
        "preview-tool",
        "POST /api/session/update",
        () => fetch("/api/session/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId: targetSessionId, ...updates }),
        }),
      );

      const payload = await response.json().catch(() => ({}));
      if (payload?.skipped || payload?.serviceUnavailable || payload?.schemaUnavailable) {
        return {
          ok: false,
          failure: {
            kind: payload?.schemaUnavailable ? "schema" : "error",
            message: payload?.error || "Service unavailable.",
          },
          status: response.status,
        };
      }

      if (response.ok) return { ok: true };

      const failure = await readUpdateFailure(response, "Unable to update analysis session.");
      return { ok: false, failure, status: response.status };
    };

    try {
      let result = await attemptUpdate(sessionId);

      if (!result.ok && isStaleSessionFailure(result.failure, result.status)) {
        clearStaleAnalysisSession();
        const newSessionId = await createAnalysisSession({
          campaign_goal: campaignGoal || null,
          vertical: campaignVertical || null,
          platform: platform || null,
          status: "draft",
        });
        if (newSessionId) {
          sessionId = newSessionId;
          result = await attemptUpdate(newSessionId);
        }
      }

      if (!result.ok) {
        const message = result.failure?.message || "Unable to update analysis session.";
        const isMissingTable = result.failure?.kind === "schema"
          || /analysis_sessions|schema cache|does not exist/i.test(message);
        if (result.failure?.kind === "error" && /serviceUnavailable|unauthorized|missing bearer token/i.test(message)) {
          return false;
        }
        if (isMissingTable) {
          if (!sessionNetworkWarningShownRef.current) {
            sessionNetworkWarningShownRef.current = true;
            console.warn(
              "Analysis sessions table not found in Supabase. Preview tool will continue without server session persistence. Run supabase/RUN_PREVIEW_TOOL_TABLES.sql in the SQL editor.",
              message,
            );
          }
          return false;
        }

        if (!sessionNetworkWarningShownRef.current) {
          sessionNetworkWarningShownRef.current = true;
          console.warn("Session update failed:", message);
        }
        return false;
      }

      return true;
    } catch (error) {
      if (!sessionNetworkWarningShownRef.current) {
        sessionNetworkWarningShownRef.current = true;
        console.warn("Session update skipped due to temporary network/API unavailability.", error);
      }
      return false;
    }
  }, [
    analysisSessionId,
    getAccessToken,
    clearStaleAnalysisSession,
    createAnalysisSession,
    campaignGoal,
    campaignVertical,
    platform,
  ]);

  const getUser = useCallback(async () => {
    if (userRef.current) return userRef.current;
    const auth = getFirebaseClientAuth();
    const current = auth.currentUser;
    userRef.current = current
      ? {
        id: current.uid,
        email: current.email,
        user_metadata: {
          full_name: current.displayName || "",
        },
      }
      : null;
    return userRef.current;
  }, []);

  const ensureAnalysisSession = useCallback(async () => {
    const user = await getUser();
    if (!user) return null;

    if (analysisSessionId) {
      const valid = await verifyAnalysisSessionId(analysisSessionId);
      if (valid) return analysisSessionId;
      clearStaleAnalysisSession();
    }

    return createAnalysisSession({
      campaign_goal: campaignGoal || null,
      vertical: campaignVertical || null,
      platform: platform || null,
      status: "draft",
    });
  }, [
    analysisSessionId,
    getUser,
    verifyAnalysisSessionId,
    clearStaleAnalysisSession,
    createAnalysisSession,
    campaignGoal,
    campaignVertical,
    platform,
  ]);

  const handlePlatformSelect = useCallback((id) => {
    const allowedGoalIds = PLATFORM_GOAL_IDS[id] || PLATFORM_GOAL_IDS.programmatic;
    const nextGoal = allowedGoalIds.includes(campaignGoal) ? campaignGoal : null;
    const platformChanged = id !== platform;

    setPlatform(id);
    setCampaignGoal(nextGoal);
    if (platformChanged) {
      setGoogleCampaignType("display");
      setProgrammaticTaskType(id === "google_ads" ? "campaign_setup" : "");
      setProgrammaticAdGroupCount("");
      setProgrammaticAdGroups([]);
      setSelectedProgrammaticAdGroupIds([]);
      setApplyProgrammaticAdGroupsToAll(false);
      setActiveCampaignId("");
      setLookupCampaignId("");
      setLoadedCampaignSnapshot(null);
      setCreativeAdditionMode("");
      setCreativeAdditionFindError("");
      localStorage.removeItem(ACTIVE_CAMPAIGN_STORAGE_KEY);
      creativesRef.current.forEach((creative) => revokeCreativeObjectUrls(creative));
      void Promise.all(creativesRef.current.map((creative) => deleteCreativeAssets(creative.id)));
      setCreatives([]);
      setAnalysisResult(null);
      setAnalysisLoading(false);
      setOriginalBackups({});
      setEditModalCreative(null);
    }
    scrollToSection(goalSectionRef);

    void trackUserActivity("platform_selection", {
      action_label: `Platform selected: ${id}`,
      platform: id,
      campaign_goal: nextGoal,
      vertical: campaignVertical,
      metadata: {
        previous_platform: platform,
        audience_stage: campaignAudienceStage,
        campaign_types: PLATFORM_GOAL_IDS[id] || [],
        ad_sizes: [...new Set(Object.values(PLATFORM_SIZES[id] || {}).flat())],
        placements: Object.keys(PLATFORM_SIZES[id] || {}),
      },
    }, { dedupeKey: `platform-${id}` });

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession(
          platformChanged
            ? { platform: id, campaign_goal: nextGoal, creative_url: null, status: "draft" }
            : { platform: id, campaign_goal: nextGoal }
        );
      })
      .catch((error) => {
        console.error("Failed to persist platform selection", error);
      });
  }, [campaignGoal, platform, scrollToSection, ensureAnalysisSession, updateAnalysisSession, campaignVertical, campaignAudienceStage]);

  const handleProgrammaticTaskTypeChange = useCallback((taskType) => {
    setProgrammaticTaskType(taskType);
    setLoadedCampaignSnapshot(null);
    setCreativeAdditionMode("");
    setCreativeAdditionFindError("");
    setLookupCampaignId("");
    setBaselineAnalysisResult(null);
    setAdditionBaselineCreativeIds([]);
    setRenewalReferenceSnapshot(null);
    setRenewalComparisonReport(null);
    setUrlUtmReferenceSnapshot(null);
    setUrlUtmValidationReport(null);
    setDestinationUrl("");
    setUtmParameters(emptyUtmParameters());
    setSelectedProgrammaticAdGroupIds([]);
    setApplyProgrammaticAdGroupsToAll(isProgrammaticCampaignRenewal(taskType));
    if (isProgrammaticCampaignSetup(taskType)) {
      void clearCreativeSessionAssets();
    } else if (
      isProgrammaticCreativeAddition(taskType)
      || isProgrammaticCreativeReplacement(taskType)
      || isProgrammaticCampaignRenewal(taskType)
      || isProgrammaticUrlValidationUtmUpdate(taskType)
    ) {
      clearCreativeSessionState();
    }
    if (!isProgrammaticCampaignSetup(taskType)) {
      setProgrammaticAdGroupCount("");
      setProgrammaticAdGroups([]);
      setSelectedProgrammaticAdGroupIds([]);
      setApplyProgrammaticAdGroupsToAll(false);
    }
    if (!isProgrammaticCreativeAddition(taskType) && !isProgrammaticCreativeReplacement(taskType) && !isProgrammaticCampaignRenewal(taskType) && !isProgrammaticUrlValidationUtmUpdate(taskType)) {
      setLoadedCampaignSnapshot(null);
      setCreativeAdditionMode("");
    }
    if (!isProgrammaticCampaignSetup(taskType) && !isProgrammaticCreativeAddition(taskType) && !isProgrammaticCreativeReplacement(taskType) && !isProgrammaticCampaignRenewal(taskType) && !isProgrammaticUrlValidationUtmUpdate(taskType)) {
      setCampaignGoal(null);
    } else if (isProgrammaticCampaignSetup(taskType)) {
      setCampaignGoal(null);
      setProgrammaticAdGroupCount("");
      setProgrammaticAdGroups([]);
      localStorage.removeItem("adigator_programmatic_ad_groups");
      localStorage.removeItem("adigator_programmatic_ad_group_count");
      const newCampaignId = generateCampaignId(platform || "programmatic");
      setActiveCampaignId(newCampaignId);
      localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, newCampaignId);
    } else {
      setActiveCampaignId("");
      localStorage.removeItem(ACTIVE_CAMPAIGN_STORAGE_KEY);
    }
  }, [clearCreativeSessionAssets, clearCreativeSessionState, platform]);

  const handleProgrammaticAdGroupCountChange = useCallback((count) => {
    setProgrammaticAdGroupCount(count);
    setProgrammaticAdGroups((previous) => buildProgrammaticAdGroups(count, previous));
  }, []);

  const handleProgrammaticAdGroupNameChange = useCallback((groupId, name) => {
    setProgrammaticAdGroups((previous) => previous.map((group) => (
      group.id === groupId ? { ...group, name } : group
    )));
  }, []);

  const handleProgrammaticAdGroupObjectiveChange = useCallback((groupId, objective) => {
    setProgrammaticAdGroups((previous) => {
      const next = previous.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          objective,
          customObjective: objective === PROGRAMMATIC_OBJECTIVE_CUSTOM ? group.customObjective : undefined,
        };
      });
      const goalFromAdGroups = getProgrammaticCampaignGoalFromAdGroups(next);
      if (goalFromAdGroups) {
        setCampaignGoal(goalFromAdGroups);
      }
      return next;
    });
  }, []);

  const handleProgrammaticAdGroupCustomObjectiveChange = useCallback((groupId, customObjective) => {
    setProgrammaticAdGroups((previous) => {
      const next = previous.map((group) => (
        group.id === groupId ? { ...group, customObjective } : group
      ));
      const goalFromAdGroups = getProgrammaticCampaignGoalFromAdGroups(next);
      if (goalFromAdGroups) {
        setCampaignGoal(goalFromAdGroups);
      }
      return next;
    });
  }, []);

  const handleAddProgrammaticAdGroup = useCallback(() => {
    setProgrammaticAdGroups((previous) => {
      const next = addProgrammaticAdGroup(previous);
      const newGroup = next[next.length - 1];
      setProgrammaticAdGroupCount(next.length);
      if (newGroup?.id) {
        setSelectedProgrammaticAdGroupIds((selected) => (
          selected.includes(newGroup.id) ? selected : [...selected, newGroup.id]
        ));
        setApplyProgrammaticAdGroupsToAll(false);
      }
      return next;
    });
  }, []);

  const handleRemoveProgrammaticAdGroup = useCallback((groupId) => {
    setProgrammaticAdGroups((previous) => {
      const next = removeProgrammaticAdGroup(previous, groupId);
      setProgrammaticAdGroupCount(next.length);
      setSelectedProgrammaticAdGroupIds((selected) => selected.filter((id) => id !== groupId));
      return next;
    });
  }, []);

  const handleSelectedProgrammaticAdGroupIdsChange = useCallback((groupIds) => {
    setSelectedProgrammaticAdGroupIds(groupIds);
  }, []);

  const handleApplyProgrammaticAdGroupsToAllChange = useCallback((applyToAll) => {
    setApplyProgrammaticAdGroupsToAll(applyToAll);
    if (applyToAll) {
      setSelectedProgrammaticAdGroupIds(programmaticAdGroups.map((group) => group.id));
    }
  }, [programmaticAdGroups]);

  const handleLandingUrlChange = useCallback((value) => {
    const parsed = parseUtmFromUrl(value);
    setLandingUrl(parsed.destinationUrl);
    if (isProgrammatic) {
      setDestinationUrl(parsed.destinationUrl);
      setUtmParameters((previous) => {
        const next = { ...previous };
        SUPPORTED_UTM_KEYS.forEach((key) => {
          const detected = parsed.utmParameters[key]?.trim();
          if (detected) next[key] = detected;
        });
        return next;
      });
    }
    setUrlUtmValidationReport(null);
  }, [isProgrammatic]);

  const parsedLandingUtmState = useMemo(
    () => parseUtmFromUrl(landingUrl || ""),
    [landingUrl],
  );
  const hasManualUtmValues = useMemo(
    () => Object.values(utmParameters).some((value) => String(value || "").trim().length > 0),
    [utmParameters],
  );
  const effectiveDestinationUrl = useMemo(
    () => (destinationUrl || parsedLandingUtmState.destinationUrl || "").trim(),
    [destinationUrl, parsedLandingUtmState.destinationUrl],
  );
  const effectiveUtmParameters = useMemo(
    () => (hasManualUtmValues ? utmParameters : normalizeUtmParameters(parsedLandingUtmState.utmParameters)),
    [hasManualUtmValues, utmParameters, parsedLandingUtmState.utmParameters],
  );
  const displayValidationUrl = useMemo(
    () => stripUtmFromUrl(isProgrammatic ? (effectiveDestinationUrl || landingUrl) : landingUrl),
    [isProgrammatic, effectiveDestinationUrl, landingUrl],
  );

  const runUrlUtmValidation = useCallback(async () => {
    const cleanDestinationUrl = stripUtmFromUrl(effectiveDestinationUrl || landingUrl);
    if (!cleanDestinationUrl.trim()) {
      addToast("Enter a landing page URL.", "error");
      return null;
    }

    setLandingUrl(cleanDestinationUrl);
    setDestinationUrl(cleanDestinationUrl);
    const urlResult = await runUrlValidation(cleanDestinationUrl);
    const report = buildUrlUtmValidationReport({
      referenceSnapshot: urlUtmReferenceSnapshot,
      destinationUrl: cleanDestinationUrl,
      utmParameters: emptyUtmParameters(),
      landingUrl: cleanDestinationUrl,
      campaignName: campaignName.trim() || "Campaign",
      platform: platform || "programmatic",
      campaignGoal: effectiveCampaignGoal || campaignGoal || "",
      urlValidationResult: urlResult || urlValidation,
    });
    setUrlUtmValidationReport(report);

    const savedCampaign = await persistProgrammaticCampaignSnapshot();
    if (savedCampaign) {
      addToast(`Campaign saved as ${savedCampaign.id}.`, "info");
    }

    if (report.flags.some((flag) => flag.severity === "error")) {
      addToast("URL validation found blocking issues.", "error");
    } else if (report.flags.some((flag) => flag.severity === "warning")) {
      addToast("URL validation completed with warnings.", "info");
    } else {
      addToast("URL validation passed.", "success");
    }

    return report;
  }, [
    effectiveDestinationUrl,
    landingUrl,
    addToast,
    runUrlValidation,
    urlUtmReferenceSnapshot,
    campaignName,
    platform,
    effectiveCampaignGoal,
    campaignGoal,
    urlValidation,
    persistProgrammaticCampaignSnapshot,
  ]);

  const handleGoalSelect = useCallback((id) => {
    if (!platform) return;
    const goalIds = PLATFORM_GOAL_IDS[platform] || PLATFORM_GOAL_IDS.programmatic;
    if (!goalIds.includes(id)) return;
    setCampaignGoal(id);
    if (isVideoObjective(id, platform)) {
      setAdType("video");
    }

    void trackUserActivity("button_click", {
      action_label: "Campaign goal selected",
      platform,
      campaign_goal: id,
      vertical: campaignVertical,
      metadata: {
        action: "goal_select",
        objective: id,
        audience_stage: campaignAudienceStage,
      },
    }, { dedupeKey: `goal-${platform}-${id}` });

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession({ campaign_goal: id });
      })
      .catch((error) => {
        console.error("Failed to persist campaign goal", error);
      });
  }, [platform, ensureAnalysisSession, updateAnalysisSession, campaignVertical, campaignAudienceStage]);

  const handleVerticalSelect = useCallback((id) => {
    setCampaignVertical(id);

    void trackUserActivity("button_click", {
      action_label: "Vertical selected",
      platform,
      campaign_goal: campaignGoal,
      vertical: id,
      metadata: {
        action: "vertical_select",
        audience_stage: campaignAudienceStage,
      },
    }, { dedupeKey: `vertical-${id}` });

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession({ vertical: id });
      })
      .catch((error) => {
        console.error("Failed to persist campaign vertical", error);
      });
  }, [ensureAnalysisSession, updateAnalysisSession, platform, campaignGoal, campaignAudienceStage]);

  const handleAudienceStageSelect = useCallback((id) => {
    setCampaignAudienceStage(id);

    void trackUserActivity("button_click", {
      action_label: "Audience stage selected",
      platform,
      campaign_goal: campaignGoal,
      vertical: campaignVertical,
      metadata: {
        action: "audience_stage_select",
        audience_stage: id,
      },
    }, { dedupeKey: `audience-${id}` });

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession({
          platform: platform || null,
          campaign_goal: campaignGoal || null,
          vertical: campaignVertical || null,
        });
      })
      .catch((error) => {
        console.error("Failed to persist audience stage", error);
      });
  }, [campaignGoal, campaignVertical, ensureAnalysisSession, platform, updateAnalysisSession]);

  const handleGoogleAdsCampaignImport = useCallback((campaign) => {
    if (!campaign) return;

    skipLocalConfigHydrateRef.current = true;
    configHydratedRef.current = true;
    setPlatform("google_ads");
    setProgrammaticTaskType("campaign_setup");

    const importedSnapshot = campaign.importSource === "google_ads" ? campaign : null;
    const resolvedName = (typeof campaign.campaignName === "string" ? campaign.campaignName : campaign.name || "").trim();
    const resolvedId = String(campaign.id || "").trim();

    if (resolvedName) {
      setCampaignName(resolvedName);
    }

    if (resolvedId) {
      setLookupCampaignId(resolvedId);
      setActiveCampaignId(resolvedId);
      localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, resolvedId);
    }

    const suggestedGoal = typeof campaign.suggestedGoal === "string"
      ? campaign.suggestedGoal.trim()
      : (typeof campaign.campaignGoal === "string" ? campaign.campaignGoal.trim() : "");
    if (suggestedGoal) {
      setCampaignGoal(suggestedGoal);
    }

    const channel = String(campaign.channelType || campaign.googleAdsChannelType || "").toUpperCase();
    if (channel === "DEMAND_GEN" || channel === "VIDEO") {
      setGoogleCampaignType("demand_gen");
    } else if (channel === "PERFORMANCE_MAX") {
      setGoogleCampaignType("responsive_display");
    } else if (channel === "DISPLAY" || channel === "SEARCH") {
      setGoogleCampaignType("display");
    }

    const persistImportedSelection = (groups = [], goal = suggestedGoal) => {
      if (!campaignOwnerId || !resolvedName) return;
      persistAdvertiserCampaignSelection({
        ownerId: campaignOwnerId,
        advertiserName: advertiserName.trim() || "Google Ads",
        advertiserId: advertiserId || undefined,
        campaign: {
          id: String(campaign.id || resolvedName),
          name: resolvedName,
          platform: "google_ads",
          validated: Boolean(campaign.validated ?? false),
          updatedAt: new Date().toISOString(),
          adGroups: groups.map((group) => ({
            id: String(group.id),
            name: String(group.name || ""),
            objective: String(group.objective || goal || ""),
            objectiveLabel: getObjectiveTitle(group.objective || goal, "google_ads"),
            creatives: [],
          })),
          campaignGoal: goal || undefined,
          vertical: campaign.vertical || undefined,
        },
      });
    };

    if (importedSnapshot) {
      const normalizedImported = {
        ...importedSnapshot,
        id: resolvedId || importedSnapshot.id,
        campaignName: resolvedName || importedSnapshot.campaignName,
        ownerId: campaignOwnerId || importedSnapshot.ownerId,
        platform: "google_ads",
        campaignTaskType: importedSnapshot.campaignTaskType || "campaign_setup",
      };
      setProgrammaticTaskType(normalizedImported.campaignTaskType);
      applyCampaignConfigFromSnapshot(normalizedImported);
      setLoadedCampaignSnapshot(normalizedImported);
      const groups = Array.isArray(normalizedImported.programmaticAdGroups)
        ? normalizedImported.programmaticAdGroups
        : [];
      persistImportedSelection(groups, normalizedImported.campaignGoal || suggestedGoal);
      applyImportedGoogleAdsCreatives(normalizedImported);
      if (normalizedImported.ownerId) {
        upsertCampaign(normalizedImported);
      }
      const sourceLabel = normalizedImported.googleAdsCampaignSource === "draft" ? "Draft" : "Published";
      addToast(`Google Ads ${sourceLabel.toLowerCase()} campaign loaded. Details, ad groups, and creatives are filled in for you.`, "success");
      setSetupPromptHighlighted(false);
      if (step !== 2) {
        router.push(stepHref(2), { scroll: true });
      }
      return;
    }

    persistImportedSelection();
    setSetupPromptHighlighted(false);
    addToast(`Imported Google Ads campaign: ${resolvedName || resolvedId}`, "success");
    if (step !== 2) {
      router.push(stepHref(2), { scroll: true });
    }
  }, [advertiserId, advertiserName, campaignOwnerId, addToast, applyCampaignConfigFromSnapshot, applyImportedGoogleAdsCreatives, router, step, stepHref]);

  const handleMetaAdsCampaignImport = useCallback((campaign) => {
    if (!campaign) return;

    skipLocalConfigHydrateRef.current = true;
    configHydratedRef.current = true;
    setPlatform("meta_ads");
    setProgrammaticTaskType("campaign_setup");

    const importedSnapshot = campaign.importSource === "meta_ads" ? campaign : null;
    const resolvedName = (typeof campaign.campaignName === "string" ? campaign.campaignName : campaign.name || "").trim();
    const resolvedId = String(campaign.id || "").trim();

    if (resolvedName) setCampaignName(resolvedName);
    if (resolvedId) {
      setLookupCampaignId(resolvedId);
      setActiveCampaignId(resolvedId);
      localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, resolvedId);
    }

    const suggestedGoal = typeof campaign.campaignGoal === "string"
      ? campaign.campaignGoal.trim()
      : (typeof campaign.suggestedGoal === "string" ? campaign.suggestedGoal.trim() : "");
    if (suggestedGoal) setCampaignGoal(suggestedGoal);

    const persistImportedSelection = (groups = [], goal = suggestedGoal) => {
      if (!campaignOwnerId || !resolvedName) return;
      persistAdvertiserCampaignSelection({
        ownerId: campaignOwnerId,
        advertiserName: advertiserName.trim() || "Meta Ads",
        advertiserId: advertiserId || undefined,
        campaign: {
          id: String(campaign.id || resolvedName),
          name: resolvedName,
          platform: "meta_ads",
          validated: Boolean(campaign.validated ?? false),
          updatedAt: new Date().toISOString(),
          adGroups: groups.map((group) => ({
            id: String(group.id),
            name: String(group.name || ""),
            objective: String(group.objective || goal || ""),
            objectiveLabel: getObjectiveTitle(group.objective || goal, "meta_ads"),
            creatives: [],
          })),
          campaignGoal: goal || undefined,
          vertical: campaign.vertical || undefined,
        },
      });
    };

    if (importedSnapshot) {
      const normalizedImported = {
        ...importedSnapshot,
        id: resolvedId || importedSnapshot.id,
        campaignName: resolvedName || importedSnapshot.campaignName,
        ownerId: campaignOwnerId || importedSnapshot.ownerId,
        platform: "meta_ads",
        campaignTaskType: importedSnapshot.campaignTaskType || "campaign_setup",
      };
      setProgrammaticTaskType(normalizedImported.campaignTaskType);
      applyCampaignConfigFromSnapshot(normalizedImported);
      setLoadedCampaignSnapshot(normalizedImported);
      const groups = Array.isArray(normalizedImported.programmaticAdGroups)
        ? normalizedImported.programmaticAdGroups
        : [];
      persistImportedSelection(groups, normalizedImported.campaignGoal || suggestedGoal);
      applyImportedMetaAdsCreatives(normalizedImported);
      if (normalizedImported.ownerId) {
        upsertCampaign(normalizedImported);
      }
      addToast("Meta Ads campaign loaded. Details, ad sets, and creatives are filled in for you.", "success");
      setSetupPromptHighlighted(false);
      if (step !== 2) {
        router.push(stepHref(2), { scroll: true });
      }
      return;
    }

    persistImportedSelection();
    setSetupPromptHighlighted(false);
    addToast(`Imported Meta Ads campaign: ${resolvedName || resolvedId}`, "success");
    if (step !== 2) {
      router.push(stepHref(2), { scroll: true });
    }
  }, [advertiserId, advertiserName, campaignOwnerId, addToast, applyCampaignConfigFromSnapshot, applyImportedMetaAdsCreatives, router, step, stepHref]);

  const selectedPlatformConfig = PLATFORMS.find((p) => p.id === platform);
  const availableGoals = platform ? (PLATFORM_GOAL_SETS[platform] || PROGRAMMATIC_GOALS) : [];
  const allowedSizes = useMemo(() => (
    platform ? [...new Set(Object.values(PLATFORM_SIZES[platform] || {}).flat())] : []
  ), [platform]);

  const validCreatives = useMemo(() => creatives.filter((c) => c && c.valid && (c.url || c.text || c.image || c.title)), [creatives]);
  const invalidCreatives = useMemo(() => creatives.filter((c) => c && (!c.valid || !(c.url || c.text || c.image || c.title))), [creatives]);
  const baselineCreatives = useMemo(
    () => (isProgrammaticCreativeReplacementFlow
      ? creatives.filter((creative) => creative?.creativeRole === CREATIVE_ROLE_BASELINE)
      : []),
    [creatives, isProgrammaticCreativeReplacementFlow],
  );
  const replacementCreatives = useMemo(
    () => (isProgrammaticCreativeReplacementFlow
      ? creatives.filter((creative) => creative?.creativeRole === CREATIVE_ROLE_REPLACEMENT)
      : []),
    [creatives, isProgrammaticCreativeReplacementFlow],
  );
  const validReplacementCreatives = useMemo(
    () => replacementCreatives.filter((creative) => creative && creative.valid && (creative.url || creative.text || creative.image || creative.title)),
    [replacementCreatives],
  );
  const uploadedCreatives = isProgrammaticCreativeReplacementFlow ? validReplacementCreatives : validCreatives;
  const creativesForAnalysis = isProgrammaticCreativeReplacementFlow ? validReplacementCreatives : validCreatives;
  const creativeFingerprint = useMemo(
    () => getCreativeValidationFingerprint(creatives),
    [creatives],
  );

  const activeUrlValidation = useMemo(
    () => resolveActiveUrlValidation(landingUrl, urlValidation, creatives),
    [landingUrl, urlValidation, creatives],
  );

  useEffect(() => {
    if (isHydratingCreatives) return;

    const fingerprint = creativeFingerprint;
    const creativesChanged = lastCreativeFingerprintRef.current !== null
      && lastCreativeFingerprintRef.current !== fingerprint;

    if (creativesChanged) {
      if (isCreativeAdditionAdditionFlow) {
        const preserved = filterAnalysisForCreatives(
          baselineAnalysisResult || analysisResult,
          creatives,
        );
        setAnalysisResult(preserved.length > 0 ? preserved : null);
        writeStoredAnalysisResult(preserved.length > 0 ? preserved : null);
      } else {
        setAnalysisResult(null);
        writeStoredAnalysisResult(null);
      }
      setUrlValidation((current) => {
        const stored = current ?? readStoredUrlValidation();
        const resolved = resolveActiveUrlValidation(landingUrl, stored, creatives);
        if (stored && !resolved) clearStoredUrlValidation();
        return resolved;
      });
    } else if (!sessionSyncInitializedRef.current) {
      setAnalysisResult((current) => {
        const candidate = current ?? readStoredAnalysisResult();
        if (candidate && analysisMatchesCreatives(candidate, creatives)) return candidate;
        if (candidate) writeStoredAnalysisResult(null);
        return null;
      });

      setUrlValidation((current) => {
        const stored = current ?? readStoredUrlValidation();
        const resolved = resolveActiveUrlValidation(landingUrl, stored, creatives);
        if (stored && !resolved) clearStoredUrlValidation();
        return resolved;
      });
    }

    sessionSyncInitializedRef.current = true;
    lastCreativeFingerprintRef.current = fingerprint;
  }, [isHydratingCreatives, creativeFingerprint, landingUrl, creatives, isCreativeAdditionAdditionFlow, baselineAnalysisResult, analysisResult]);

  useEffect(() => {
    if (isHydratingCreatives) return;

    setUrlValidation((current) => {
      const resolved = resolveActiveUrlValidation(landingUrl, current, creatives);
      if (current && !resolved) clearStoredUrlValidation();
      return resolved;
    });
  }, [landingUrl, isHydratingCreatives, creativeFingerprint, creatives]);
  const primaryCreativeUrl = getPersistableCreativeUrl(uploadedCreatives[0]);
  const needsReviewCreatives = useMemo(
    () => {
      const source = isProgrammaticCreativeReplacementFlow ? replacementCreatives : creatives;
      return source.filter((c) =>
        c?.validation?.issues?.some((issue) => issue.needsReview || issue.type === "size_near_match" || issue.type === "dimension_normalization"),
      );
    },
    [creatives, replacementCreatives, isProgrammaticCreativeReplacementFlow],
  );
  useEffect(() => {
    setSizeReviewAcknowledged(false);
  }, [needsReviewCreatives.map((c) => c.id).join(",")]);
  const hasGoogleAdsImportedDetails = Boolean(
    isGoogleAds
    && loadedCampaignSnapshot?.importSource === "google_ads"
    && String(campaignName || "").trim()
    && String(activeCampaignId || lookupCampaignId || loadedCampaignSnapshot?.id || "").trim(),
  );
  const canAdvanceToAnalysis = hasRequiredCampaignDetails
    && (uploadedCreatives.length > 0 || hasGoogleAdsImportedDetails)
    && (needsReviewCreatives.length === 0 || sizeReviewAcknowledged)
    && (
      !programmaticUsesMultiFolder
      || hasGoogleAdsImportedDetails
      || activeProgrammaticAdGroups.every((group) => creatives.some((creative) => creative.adGroupId === group.id && creative.valid))
    )
    && (
      !isProgrammaticCreativeReplacementFlow
      || baselineCreatives.some((creative) => creative.valid)
      || hasGoogleAdsImportedDetails
    )
    && (
      !isProgrammaticUrlUtmFlow
      || (urlUtmReferenceSnapshot && destinationUrl.trim() && creatives.length > 0)
    );

  const creativesByAdGroup = useMemo(() => (
    creatives.reduce((accumulator, creative) => {
      if (!creative?.adGroupId) return accumulator;
      accumulator[creative.adGroupId] = (accumulator[creative.adGroupId] || 0) + 1;
      return accumulator;
    }, {})
  ), [creatives]);

  const replacementCreativesByAdGroup = useMemo(() => (
    replacementCreatives.reduce((accumulator, creative) => {
      const key = creative?.adGroupId || "programmatic-folder";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {})
  ), [replacementCreatives]);

  const step2FolderCreatives = useMemo(() => {
    if (isProgrammaticCreativeReplacementFlow) return replacementCreatives;
    return creatives;
  }, [creatives, replacementCreatives, isProgrammaticCreativeReplacementFlow]);

  const groupedCreatives = useMemo(() => {
    const sourceCreatives = isProgrammaticCreativeReplacementFlow
      ? replacementCreatives
      : creatives;
    if (!programmaticUsesMultiFolder) {
      return [{ id: "all", label: "Creatives", creatives: sourceCreatives }];
    }
    return activeProgrammaticAdGroups
      .map((group) => ({
        id: group.id,
        label: getProgrammaticAdGroupDisplayName(group),
        creatives: sourceCreatives.filter((creative) => creative.adGroupId === group.id),
      }))
      .filter((group) => group.creatives.length > 0);
  }, [programmaticUsesMultiFolder, isProgrammaticCreativeReplacementFlow, activeProgrammaticAdGroups, creatives, replacementCreatives]);

  useEffect(() => {
    lastSessionPayloadRef.current = null;
  }, [analysisSessionId]);

  useEffect(() => {
    if (!mountRef.current || !analysisSessionId || !analysisSessionReady) return;

    const status = step >= 4
      ? "preview_ready"
      : step === 3
        ? (analysisLoading ? "analysis_running" : "analysis_ready")
        : step === 2
          ? "upload_in_progress"
          : "draft";

    const payload = {
      status,
      campaign_goal: campaignGoal || null,
      vertical: campaignVertical || null,
      platform: platform || null,
      creative_url: primaryCreativeUrl,
    };

    const payloadKey = JSON.stringify(payload);
    if (lastSessionPayloadRef.current === payloadKey) return;
    lastSessionPayloadRef.current = payloadKey;

    const saveTimer = window.setTimeout(() => {
      void updateAnalysisSession(payload);
    }, 350);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [
    analysisSessionId,
    analysisSessionReady,
    step,
    analysisLoading,
    campaignGoal,
    campaignVertical,
    platform,
    primaryCreativeUrl,
    updateAnalysisSession,
  ]);

  const validationResults = useMemo(
    () => creatives.map((c) => c?.validation).filter(Boolean),
    [creatives],
  );
  const validationSummary = useMemo(
    () => (validationResults.length
      ? buildValidationSummary(validationResults)
      : { totalIssues: 0, criticalCount: 0, warningCount: 0, inventoryImpactScore: 100 }),
    [validationResults],
  );

  const goNext = useCallback(async () => {
    if (step === 1 && !isStepOneReady) {
      setSetupPromptHighlighted(true);
      addToast("Select a platform to continue.", "error");
      return;
    }
    if (step === 2 && missingCampaignDetailFields.length > 0) {
      addToast(
        `Complete required fields: ${missingCampaignDetailFields.map((field) => field.label).join(", ")}.`,
        "error",
      );
      return;
    }
    if (step === 2 && !canAdvanceToAnalysis) {
      addToast(
        hasGoogleAdsImportedDetails
          ? "Review the imported Google Ads campaign details, then continue."
          : "Upload and validate at least one creative before continuing.",
        "error",
      );
      return;
    }

    if ((step === 1 || step === 2) && isPlatformSetup) {
      if (!activeCampaignId) {
        const importedId = String(lookupCampaignId || loadedCampaignSnapshot?.id || "").trim();
        const newCampaignId = importedId || generateCampaignId(platform || "programmatic");
        setActiveCampaignId(newCampaignId);
        if (!lookupCampaignId) setLookupCampaignId(newCampaignId);
        localStorage.setItem(ACTIVE_CAMPAIGN_STORAGE_KEY, newCampaignId);
      }
      await persistProgrammaticCampaignSnapshot();
    }

    if (step === 2 && landingUrl.trim()) {
      const cleanLandingUrl = stripUtmFromUrl(landingUrl.trim());
      const needsRefresh = !activeUrlValidation
        || stripUtmFromUrl(activeUrlValidation.submitted_url || "") !== cleanLandingUrl
        || activeUrlValidation.status === "pending";
      if (needsRefresh && !urlValidationRunning) {
        await runUrlValidation();
      }
    } else if (step === 2 && !landingUrl.trim()) {
      setUrlValidation(null);
      clearStoredUrlValidation();
      resetReadinessValidation();
    }

    const nextStep = Math.min(step + 1, effectiveTotalSteps);
    void trackUserActivity("navigation", {
      action_label: `Navigate to step ${nextStep}`,
      platform,
      campaign_goal: campaignGoal,
      vertical: campaignVertical,
      step: nextStep,
      metadata: {
        direction: "forward",
        from_step: step,
        to_step: nextStep,
        audience_stage: campaignAudienceStage,
      },
    }, { dedupeKey: `nav-forward-${step}-${nextStep}` });
    router.push(stepHref(nextStep), { scroll: true });
  }, [
    step,
    isStepOneReady,
    canAdvanceToAnalysis,
    missingCampaignDetailFields,
    effectiveTotalSteps,
    stepHref,
    router,
    platform,
    campaignGoal,
    campaignVertical,
    campaignAudienceStage,
    landingUrl,
    activeUrlValidation,
    urlValidationRunning,
    runUrlValidation,
    resetReadinessValidation,
    activeCampaignId,
    isPlatformSetup,
    isProgrammaticCreativeAdditionFlow,
    isProgrammaticCreativeReplacementFlow,
    isProgrammaticRenewalFlow,
    isProgrammaticUrlUtmFlow,
    programmaticTaskType,
    persistProgrammaticCampaignSnapshot,
    addToast,
    hasGoogleAdsImportedDetails,
    lookupCampaignId,
    loadedCampaignSnapshot,
  ]);

  const goBack = useCallback(() => {
    if (step === 1) {
      void trackUserActivity("navigation", {
        action_label: "Exit preview tool",
        platform,
        campaign_goal: campaignGoal,
        metadata: { direction: "exit", from_step: step },
      }, { dedupeKey: "nav-exit-step-1" });
      void isAuthenticatedUser().then((authed) => {
        router.push(authed ? "/dashboard" : "/");
      });
      return;
    }
    const prevStep = Math.max(step - 1, 1);
    void trackUserActivity("navigation", {
      action_label: `Navigate to step ${prevStep}`,
      platform,
      campaign_goal: campaignGoal,
      vertical: campaignVertical,
      step: prevStep,
      metadata: {
        direction: "back",
        from_step: step,
        to_step: prevStep,
        audience_stage: campaignAudienceStage,
      },
    }, { dedupeKey: `nav-back-${step}-${prevStep}` });
    router.push(stepHref(prevStep), { scroll: true });
  }, [step, router, stepHref, platform, campaignGoal, campaignVertical, campaignAudienceStage]);

  const handleStartNewAnalysis = useCallback(() => {
    const currentCreatives = creativesRef.current;
    currentCreatives.forEach((creative) => revokeCreativeObjectUrls(creative));
    void Promise.all(currentCreatives.map((creative) => deleteCreativeAssets(creative.id)));

    setCreatives([]);
    setPlatform(null);
    setCampaignGoal(null);
    setCampaignVertical(null);
    setCampaignAudienceStage(null);
    setCampaignName("");
    setAdvertiserName("");
    setAdvertiserId("");
    setAdType("display");
    setCampaignBrief("");
    setCampaignProductFocus("");
    setGoogleCampaignType("display");
    setLandingUrl("");
    setSizeReviewAcknowledged(false);
    setUrlValidation(null);
    setUrlValidationRunning(false);
    clearStoredUrlValidation();
    resetReadinessValidation();
    setAnalysisResult(null);
    setAnalysisLoading(false);
    setAnalysisSessionId(null);
    setEditModalCreative(null);
    setEditingId(null);
    setEditingName("");
    setOriginalBackups({});
    setCompressingCreativeIds([]);
    setTargetSizeByCreative({});
    setIsBulkCompressing(false);
    setBulkCompressProgress({ current: 0, total: 0 });
    setViewMode("multiple");
    setShowSlotLabels(false);
    setIsHydratingCreatives(false);
    setIsExporting(false);
    setActiveCampaignId("");
    setLookupCampaignId("");
    setLoadedCampaignSnapshot(null);
    setCampaignAssistantContext(null);

    sessionInitRef.current = false;
    lastSessionPayloadRef.current = null;

    localStorage.removeItem("adigator_platform");
    localStorage.removeItem("adigator_goal");
    localStorage.removeItem("adigator_vertical");
    localStorage.removeItem("adigator_audience_stage");
    localStorage.removeItem("adigator_campaign_name");
    localStorage.removeItem("adigator_advertiser_name");
    localStorage.removeItem("adigator_advertiser_id");
    localStorage.removeItem("adigator_ad_type");
    localStorage.removeItem("adigator_campaign_brief");
    localStorage.removeItem("adigator_product_focus");
    localStorage.removeItem("adigator_google_campaign_type");
    localStorage.removeItem("adigator_landing_url");
    clearStoredUrlValidation();
    localStorage.removeItem(ANALYSIS_SESSION_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_CAMPAIGN_STORAGE_KEY);

    configHydratedRef.current = false;
    skipLocalConfigHydrateRef.current = false;

    try {
      writeStoredWorkflow({
        step: 1,
        creatives: [],
        viewMode: "multiple",
        showSlotLabels: false,
      });
      writeStoredAnalysisResult(null);
    } catch {
      // Keep going — runtime state is already cleared.
    }

    void trackUserActivity("button_click", {
      action_label: "Start new analysis",
      platform,
      campaign_goal: campaignGoal,
      vertical: campaignVertical,
      metadata: { action: "start_new_analysis", from_step: step },
    }, { dedupeKey: "start-new-analysis" });

    addToast("Session cleared. Starting a new analysis.", "success");
    router.push(stepHref(1), { scroll: true });
  }, [addToast, router, step, platform, campaignGoal, campaignVertical, resetReadinessValidation, stepHref]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (step > 1 && !isStepOneReady) {
      router.replace(stepHref(1), { scroll: false });
    }
  }, [step, isStepOneReady, router, stepHref]);

  useEffect(() => {
    if (isStepOneReady) setSetupPromptHighlighted(false);
  }, [isStepOneReady]);

  useEffect(() => {
    if (!mountRef.current) return;
    trackUserActivity("page_visit", {
      action_label: `Preview tool step ${step}`,
      step,
      platform,
      campaign_goal: campaignGoal,
      vertical: campaignVertical,
      metadata: {
        page: "preview_tool",
        audience_stage: campaignAudienceStage,
        placements: platform ? Object.keys(PLATFORM_SIZES[platform] || {}) : [],
        ad_sizes: platform ? [...new Set(Object.values(PLATFORM_SIZES[platform] || {}).flat())] : [],
      },
    }, { dedupeKey: `page-visit-step-${step}` });
  }, [step, platform, campaignGoal, campaignVertical, campaignAudienceStage]);

  useEffect(() => {
    if (step === 4) {
      isAuthenticatedUser().then(() => {});
    }
  }, [step]);

  // Bounce back from Preview Studio if unavailable.
  useEffect(() => {
    if (!mountRef.current) return;
    if (step === 4 && !showPreviewStudio) {
      router.replace(stepHref(3), { scroll: true });
    }
  }, [step, showPreviewStudio, router, stepHref]);

  // Warn user before they leave with unsaved progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (creatives.length > 0 || step > 1) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [creatives.length, step]);

  // Guard against entering Campaign Intelligence without creatives
  useEffect(() => {
    if (!mountRef.current) return;
    if (step === 3 && uploadedCreatives.length === 0 && !hasGoogleAdsImportedDetails) {
      router.push(stepHref(2), { scroll: true });
    }
  }, [step, uploadedCreatives.length, hasGoogleAdsImportedDetails, router, stepHref]);

  useEffect(() => {
    if (!mountRef.current || sessionInitRef.current) return;

    sessionInitRef.current = true;

    let cancelled = false;

    const initSession = async () => {
      try {
        const id = await ensureAnalysisSession();
        if (!cancelled) {
          if (id) setAnalysisSessionId(id);
          setAnalysisSessionReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAnalysisSessionReady(true);
          console.error("Failed to initialize analysis session", error);
          addToast("Could not start a persistent analysis session.", "error");
        }
      }
    };

    initSession();

    return () => {
      cancelled = true;
    };
  }, [ensureAnalysisSession, addToast]);

  useEffect(() => {
    let isMounted = true;

    const hydrateViewerName = async () => {
      try {
        const user = await getUser();
        if (!isMounted || !user) return;
        const meta = user.user_metadata || {};
        const fullName = String(meta.full_name || meta.name || "").trim();
        const emailPrefix = String(user.email || "").split("@")[0] || "";
        setViewerName(fullName || emailPrefix || "");
      } catch {
        if (isMounted) setViewerName("");
      }
    };

    hydrateViewerName();

    return () => {
      isMounted = false;
    };
  }, [getUser]);

  const persistCreative = useCallback(async (creative) => {
    try {
      const result = await saveCreative({
        creative,
        platform,
        supabaseCreativeId: creative.supabaseCreativeId || null,
      });

      if (result.error) {
        if (!result.skipped && !result.schemaUnavailable && !result.authExpired) {
          console.error("saveCreative error:", result.error.message || result.error);
        }
        return null;
      }

      const supabaseId = result.supabaseCreativeId || creative.supabaseCreativeId || null;
      const trackingId = supabaseId || creative.id;

      void trackValidationOutcome({
        creativeId: trackingId,
        creativeName: creative.name,
        isValid: Boolean(creative.valid),
        platform,
        metadata: {
          ad_size: creative.size || null,
          validation_status: creative.validation?.status || null,
        },
      });

      if (result.skipped) return creative.supabaseCreativeId || null;

      if (result.supabaseCreativeId && result.supabaseCreativeId !== creative.supabaseCreativeId) {
        setCreatives((prev) => prev.map((entry) => (
          entry.id === creative.id
            ? { ...entry, supabaseCreativeId: result.supabaseCreativeId }
            : entry
        )));
      }

      return result.supabaseCreativeId || creative.supabaseCreativeId || null;
    } catch (error) {
      console.error("persistCreative error:", error);
      return null;
    }
  }, [platform]);

  const schedulePersistCreative = useCallback((creative) => {
    if (!creative?.id) return;
    const timers = persistCreativeTimersRef.current;
    const existing = timers.get(creative.id);
    if (existing) clearTimeout(existing);
    timers.set(creative.id, setTimeout(() => {
      timers.delete(creative.id);
      void persistCreative(creative);
    }, 1200));
  }, [persistCreative]);

  const handleFiles = useCallback(async (files, options = {}) => {
    if (!platform) { addToast("Please select a platform first.", "error"); return; }
    const adGroupGoal = options.adGroupObjective || null;
    const allowVideo = adType === "video" || isVideoObjective(adGroupGoal || campaignGoal, platform);
    const fileList = allowVideo ? filterMediaFiles(files, { allowVideo: true }) : filterImageFiles(files);
    if (fileList.length === 0) {
      addToast(allowVideo ? "No supported image or video files found." : "No image files found in the selected folder.", "error");
      return;
    }

    const runUpload = async () => {
      const {
        adGroupId = null,
        adGroupName = null,
        adGroupObjective = null,
        replaceAdGroup = false,
        creativeRole = null,
        replaceCreativeRole = null,
      } = options;

      if (replaceAdGroup && adGroupId) {
        startTransition(() => {
          setCreatives((prev) => prev.filter((creative) => creative.adGroupId !== adGroupId));
        });
      } else if (replaceCreativeRole) {
        startTransition(() => {
          setCreatives((prev) => prev.filter((creative) => creative.creativeRole !== replaceCreativeRole));
        });
      }

      setIsLoading(true);
      setUploadProgress({ completed: 0, total: fileList.length });

      const preparedCreatives = [];
      const uploadBatchId = Date.now();

      try {
        // Videos are far heavier to decode (video element + seek + canvas capture),
        // so process them one at a time to keep the UI responsive.
        const uploadConcurrency = allowVideo ? 1 : 3;
        await mapWithConcurrency(fileList, uploadConcurrency, async (file, fileIndex) => {
          const isVideo = isVideoFile(file);
          let sourceWidth = 0;
          let sourceHeight = 0;
          let normalizedValidation;
          let durationSeconds = 0;

          if (isVideo) {
            const metadata = await readVideoMetadataFromBlob(file);
            sourceWidth = metadata.width;
            sourceHeight = metadata.height;
            durationSeconds = metadata.duration;
            normalizedValidation = buildVideoUploadValidation({
              metadata: {
                mimeType: metadata.mimeType,
                fileSizeBytes: metadata.fileSizeBytes,
                width: metadata.width,
                height: metadata.height,
                durationSeconds: metadata.duration,
                fileName: file.name,
                readable: metadata.readable,
                frameRate: metadata.frameRate,
                hasAudio: metadata.hasAudio,
              },
              platform,
            });
          } else {
            const dimensions = await readImageDimensionsFromBlob(file, { fileName: file.name });
            const validation = await validateCreativeAsset({
              file,
              image: { width: dimensions.width, height: dimensions.height },
              platform,
              campaignType: platform === "google_ads" ? googleCampaignType : "",
            });
            normalizedValidation = finalizeValidationForPlatform(
              validation,
              platform,
              validation.size,
            );
            sourceWidth = validation.dimensions?.detectedWidth || dimensions.width;
            sourceHeight = validation.dimensions?.detectedHeight || dimensions.height;
          }

          const creativeId = `${uploadBatchId}-${fileIndex}-${file.name}-${sourceWidth}x${sourceHeight}`;
          const { displayUrl, fullUrl } = await storeUploadedCreativeFile(creativeId, file);
          const contentHash = await hashFileContent(file);

          const creative = attachSourceDimensions({
            id: creativeId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: displayUrl,
            fullUrl,
            hasStoredAssets: true,
            contentHash,
            valid: normalizedValidation.valid && normalizedValidation.status !== "CRITICAL",
            originalFile: file.name,
            mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
            mediaType: isVideo ? "video" : "image",
            durationSeconds,
            fileSizeBytes: file.size,
            fileSizeKB: Math.round(file.size / 1024),
            validation: normalizedValidation,
            placementType: normalizedValidation.intelligence?.placementType,
            deviceClassification: normalizedValidation.intelligence?.deviceClassification,
            iabCompatibility: normalizedValidation.intelligence?.iabCompatibility,
            dspCompatibility: normalizedValidation.intelligence?.dspCompatibility,
            inventoryAvailability: normalizedValidation.intelligence?.inventory,
            auctionReadiness: normalizedValidation.intelligence?.auctionReadiness,
            premiumPlacementPotential: normalizedValidation.intelligence?.premiumPlacement,
            adGroupId,
            adGroupName,
            adGroupObjective,
            creativeRole,
          }, sourceWidth, sourceHeight);

          preparedCreatives.push(creative);
          const completedCount = preparedCreatives.length;
          startTransition(() => {
            setCreatives((prev) => [...prev, creative]);
            setUploadProgress({ completed: completedCount, total: fileList.length });
          });
          window.setTimeout(() => {
            schedulePersistCreative(creative);
          }, 0);

          return creative;
        });

        if (creativeRole === CREATIVE_ROLE_REPLACEMENT) {
          setAnalysisResult(null);
          setReplacementComparisonReport(null);
          writeStoredAnalysisResult(null);
        } else if (programmaticTaskType === "campaign_renewal") {
          setAnalysisResult(null);
          setRenewalComparisonReport(null);
          writeStoredAnalysisResult(null);
        }

        const uploadSummary = buildValidationSummary(preparedCreatives.map((c) => c.validation));
        void trackUserActivity("upload", {
          action_label: "Creative uploaded",
          platform,
          campaign_goal: campaignGoal,
          vertical: campaignVertical,
          metadata: {
            count: preparedCreatives.length,
            creative_ids: preparedCreatives.map((c) => c.id),
            creative_outcomes: preparedCreatives.map((c) => ({
              id: c.id,
              name: c.name,
              is_valid: Boolean(c.valid),
            })),
            creative_names: preparedCreatives.map((c) => c.name),
            sizes: preparedCreatives.map((c) => c.size),
            ad_sizes: preparedCreatives.map((c) => c.size),
            valid_count: preparedCreatives.filter((c) => c.valid).length,
            invalid_count: preparedCreatives.filter((c) => !c.valid).length,
            audience_stage: campaignAudienceStage,
          },
        }, { dedupeKey: `upload-${platform}-${preparedCreatives.length}-${preparedCreatives[0]?.name || "batch"}` });

        preparedCreatives.forEach((creative) => {
          void trackValidationOutcome({
            creativeId: creative.id,
            creativeName: creative.name,
            isValid: Boolean(creative.valid),
            platform,
            metadata: {
              ad_size: creative.size || null,
              validation_status: creative.validation?.status || null,
              source: "upload",
            },
          });
        });
        if (uploadSummary.criticalCount > 0) {
          addToast(`Uploaded ${preparedCreatives.length} creatives${adGroupName ? ` for ${adGroupName}` : ""}: ${uploadSummary.warningCount} warning(s), ${uploadSummary.criticalCount} critical.`, "error");
        } else if (uploadSummary.warningCount > 0) {
          addToast(`Uploaded ${preparedCreatives.length} creatives${adGroupName ? ` for ${adGroupName}` : ""} with ${uploadSummary.warningCount} warning(s).`, "info");
        } else {
          addToast(`Uploaded ${preparedCreatives.length} creatives${adGroupName ? ` for ${adGroupName}` : ""}. All checks passed.`, "success");
        }
      } catch (err) {
        addToast(err?.message || "Failed to validate uploaded files.", "error");
      } finally {
        setIsLoading(false);
        setUploadProgress(null);
      }
    };

    uploadQueueRef.current = uploadQueueRef.current.then(runUpload, runUpload);
    await uploadQueueRef.current;
  }, [
    platform,
    addToast,
    programmaticTaskType,
    campaignGoal,
    campaignVertical,
    campaignAudienceStage,
    adType,
    isProgrammatic,
    schedulePersistCreative,
    googleCampaignType,
  ]);

  const handleProgrammaticFolderSelect = useCallback((files, adGroup) => {
    if (!adGroup) return;
    const displayName = getProgrammaticAdGroupDisplayName(adGroup);
    void handleFiles(files, {
      adGroupId: adGroup.id,
      adGroupName: displayName,
      adGroupObjective: adGroup.objective || campaignGoal || null,
      replaceAdGroup: isProgrammaticSetup || platformSetupUsesAdGroups || creativeAdditionMode === "new_setup" || renewalUsesAdGroups || creativeSwapUsesAdGroups,
      creativeRole: isProgrammaticCreativeReplacementFlow ? CREATIVE_ROLE_REPLACEMENT : null,
      replaceCreativeRole: isProgrammaticCreativeReplacementFlow ? CREATIVE_ROLE_REPLACEMENT : null,
    });
  }, [handleFiles, campaignGoal, creativeAdditionMode, isProgrammaticSetup, platformSetupUsesAdGroups, isProgrammaticCreativeReplacementFlow, renewalUsesAdGroups, creativeSwapUsesAdGroups]);

  const compressCreative = useCallback(async (creativeId, options = {}) => {
    const {
      enforceSizeCompliance = false,
      targetSizeKB,
      silent = false,
      reencodeOnly = false,
      forceOutputType = null,
      preserveDimensions = true,
    } = options;

    const notify = (message, type = "info") => {
      if (!silent) addToast(message, type);
    };

    if (!platform) {
      notify("Select a platform before compressing creatives.", "error");
      return { status: "failed", reason: "missing_platform" };
    }

    const creative = creativesRef.current.find((entry) => entry.id === creativeId);
    if (!creative?.url) {
      notify("Creative asset is missing an image source.", "error");
      return { status: "failed", reason: "missing_source" };
    }

    // Compression is an image-only operation — never re-encode video creatives as images.
    if (creative.mediaType === "video") {
      notify("Compression is not applicable to video creatives.", "info");
      return { status: "skipped", reason: "video_creative" };
    }

    const currentMimeType = String(creative.mimeType || "").toLowerCase();
    if (!reencodeOnly && currentMimeType === "image/gif") {
      notify("GIF compression is not supported in this manual flow yet.", "error");
      return { status: "skipped", reason: "gif_unsupported" };
    }

    if (compressingIdsRef.current.has(creativeId)) {
      return { status: "skipped", reason: "already_compressing" };
    }

    compressingIdsRef.current.add(creativeId);
    setCompressingCreativeIds((prev) => [...prev, creativeId]);
    await yieldToMain();

    try {
      const originalBytes = Number(creative.fileSizeBytes || Math.round((creative.fileSizeKB || 0) * 1024));
      const parsedTargetKB = targetSizeKB === undefined || targetSizeKB === null || String(targetSizeKB).trim() === ""
        ? null
        : Number.parseInt(String(targetSizeKB), 10);

      if (parsedTargetKB !== null && (!Number.isFinite(parsedTargetKB) || parsedTargetKB <= 0)) {
        notify("Enter a valid target size in KB.", "error");
        return { status: "failed", reason: "invalid_target" };
      }

      const targetBytes = parsedTargetKB ? parsedTargetKB * 1024 : null;
      if (targetBytes && originalBytes <= targetBytes) {
        notify(`${creative.name} is already at or below ${parsedTargetKB}KB.`, "info");
        return {
          status: "skipped",
          reason: "already_below_target",
          finalKB: Math.round(originalBytes / 1024),
        };
      }

      const complianceBytes = 150 * 1024;
      const sizeThresholdBytes = reencodeOnly ? null : (targetBytes || (enforceSizeCompliance ? complianceBytes : null));
      const outputType = forceOutputType
        || ((enforceSizeCompliance || targetBytes)
          ? "image/jpeg"
          : (currentMimeType === "image/png" ? "image/png" : "image/jpeg"));

      const sourceBlob = await getCreativeFullBlob(creative);
      if (!sourceBlob) {
        throw new Error("Could not load creative bytes for compression.");
      }

      const imageSource = await loadImageSource(sourceBlob);
      let reachedTarget = false;

      const originalDims = {
        width: Number(creative.sourceWidth) > 0
          ? Math.round(Number(creative.sourceWidth))
          : imageSource.width,
        height: Number(creative.sourceHeight) > 0
          ? Math.round(Number(creative.sourceHeight))
          : imageSource.height,
      };

      let bestCandidate;
      try {
        if (reencodeOnly) {
          bestCandidate = await compressDrawable(imageSource.drawable, {
            outputType,
            quality: outputType === "image/png" ? 1 : 0.92,
            scale: 1,
            sourceWidth: originalDims.width,
            sourceHeight: originalDims.height,
            includeDataUrl: false,
          });
        } else {
          bestCandidate = await compressImageToTarget(imageSource.drawable, {
            outputType,
            targetBytes: sizeThresholdBytes,
            sourceWidth: originalDims.width,
            sourceHeight: originalDims.height,
            preserveDimensions,
          });
        }
      } finally {
        imageSource.release();
      }

      let finalBlob = bestCandidate.blob;
      let finalCompressedBytes = finalBlob.size;

      if (targetBytes && finalCompressedBytes <= targetBytes && finalCompressedBytes < targetBytes) {
        finalBlob = padBlobToExactBytes(bestCandidate.blob, targetBytes);
        finalCompressedBytes = finalBlob.size;
      }

      const extension = getFileExtensionForMime(outputType);
      const compressedFileName = `${creative.name || "creative"}.${extension}`;
      const finalFile = new File([finalBlob], compressedFileName, {
        type: outputType,
        lastModified: Date.now(),
      });

      revokeCreativeObjectUrls(creative);
      const { displayUrl, fullUrl } = await storeCompressedCreativeBlobs(creative.id, finalBlob);

      const outputWidth = preserveDimensions
        ? originalDims.width
        : ((bestCandidate.scale ?? 1) < 0.999 ? bestCandidate.width : originalDims.width);
      const outputHeight = preserveDimensions
        ? originalDims.height
        : ((bestCandidate.scale ?? 1) < 0.999 ? bestCandidate.height : originalDims.height);

      const validation = await validateCreativeAsset({
        file: finalFile,
        image: { width: outputWidth, height: outputHeight },
        platform,
        campaignType: platform === "google_ads" ? googleCampaignType : "",
      });
      const finalSize = validation.size || `${outputWidth}x${outputHeight}`;
      const storedWidth = validation.dimensions?.width || outputWidth;
      const storedHeight = validation.dimensions?.height || outputHeight;

      let finalValidation = finalizeValidationForPlatform(validation, platform, finalSize);

      if (targetBytes && finalCompressedBytes <= targetBytes) {
        reachedTarget = true;
        finalValidation = hideFileSizeIssues(finalValidation);
      }

      const contentHash = await hashFileContent(finalBlob);

      const updatedCreative = attachSourceDimensions({
        ...creative,
        url: displayUrl,
        fullUrl,
        hasStoredAssets: true,
        mimeType: outputType,
        fileSizeBytes: finalCompressedBytes,
        fileSizeKB: Math.round(finalCompressedBytes / 1024),
        contentHash,
        validation: finalValidation,
        valid: finalValidation.valid && finalValidation.status !== "CRITICAL",
        placementType: finalValidation.intelligence?.placementType,
        deviceClassification: finalValidation.intelligence?.deviceClassification,
        iabCompatibility: finalValidation.intelligence?.iabCompatibility,
        dspCompatibility: finalValidation.intelligence?.dspCompatibility,
        inventoryAvailability: finalValidation.intelligence?.inventory,
        auctionReadiness: finalValidation.intelligence?.auctionReadiness,
        premiumPlacementPotential: finalValidation.intelligence?.premiumPlacement,
      }, storedWidth, storedHeight);

      startTransition(() => {
        setCreatives((prev) => prev.map((entry) => (entry.id === creativeId ? updatedCreative : entry)));
      });
      schedulePersistCreative(updatedCreative);

      const reduction = originalBytes > 0
        ? Math.round(((originalBytes - finalCompressedBytes) / originalBytes) * 100)
        : null;

      const stillNonCompliant = hasFileSizeIssue(finalValidation);

      if (reencodeOnly) {
        const formatLabel = outputType === "image/png" ? "PNG" : "JPG";
        if (finalValidation.valid && finalValidation.status !== "CRITICAL") {
          notify(`Converted ${creative.name} to ${formatLabel}.`, "success");
          return { status: "success", reencoded: true, finalKB: Math.round(finalCompressedBytes / 1024) };
        }
        notify(
          `${creative.name} was converted to ${formatLabel} but still has validation warnings.`,
          "info",
        );
        return { status: "success", reencoded: true, finalKB: Math.round(finalCompressedBytes / 1024) };
      }

      if (targetBytes && reachedTarget) {
        notify(
          `Compressed ${creative.name} to ${Math.round(finalCompressedBytes / 1024)}KB (target ${parsedTargetKB}KB).`,
          "success"
        );
        return {
          status: "success",
          reachedTarget: true,
          finalKB: Math.round(finalCompressedBytes / 1024),
        };
      } else if (targetBytes && !reachedTarget) {
        notify(
          `Could not reach ${parsedTargetKB}KB for ${creative.name}. Closest size: ${Math.round(finalCompressedBytes / 1024)}KB.`,
          "error"
        );
        return {
          status: "failed",
          reachedTarget: false,
          finalKB: Math.round(finalCompressedBytes / 1024),
        };
      } else if (reduction !== null && reduction > 0 && !stillNonCompliant) {
        notify(
          `Compressed ${creative.name}: ${Math.round(originalBytes / 1024)}KB → ${Math.round(finalCompressedBytes / 1024)}KB (${reduction}% smaller).`,
          "success"
        );
        return {
          status: "success",
          reachedTarget: true,
          finalKB: Math.round(finalCompressedBytes / 1024),
        };
      } else if (stillNonCompliant) {
        notify(
          `${creative.name} was compressed but still has file-size warnings. Try a lower target size or re-export the source asset.`,
          "error"
        );
        return {
          status: "failed",
          reachedTarget: false,
          finalKB: Math.round(finalCompressedBytes / 1024),
        };
      } else {
        notify(
          `Revalidated ${creative.name} after compression attempt. Size stayed similar at ${Math.round(finalCompressedBytes / 1024)}KB.`,
          "info"
        );
        return {
          status: "success",
          reachedTarget: true,
          finalKB: Math.round(finalCompressedBytes / 1024),
        };
      }
    } catch (error) {
      notify(error?.message || "Compression failed for this creative.", "error");
      return { status: "failed", reason: "exception" };
    } finally {
      compressingIdsRef.current.delete(creativeId);
      setCompressingCreativeIds((prev) => prev.filter((id) => id !== creativeId));
    }
  }, [platform, googleCampaignType, addToast, schedulePersistCreative]);

  const applyCreativeFix = useCallback(async (creativeId, fixAction) => {
    if (!fixAction?.id) return;
    if (fixingCreativeIds.includes(creativeId) || compressingCreativeIds.includes(creativeId)) return;

    setFixingCreativeIds((prev) => [...prev, creativeId]);
    try {
      let result;
      if (fixAction.id === FIX_ACTION_IDS.CONVERT_TO_JPEG) {
        result = await compressCreative(creativeId, {
          reencodeOnly: true,
          forceOutputType: "image/jpeg",
          silent: true,
        });
      } else if (fixAction.id === FIX_ACTION_IDS.CONVERT_TO_PNG) {
        result = await compressCreative(creativeId, {
          reencodeOnly: true,
          forceOutputType: "image/png",
          silent: true,
        });
      } else if (
        fixAction.id === FIX_ACTION_IDS.COMPRESS_150KB
        || fixAction.id === FIX_ACTION_IDS.COMPRESS_TARGET
      ) {
        result = await compressCreative(creativeId, {
          targetSizeKB: fixAction.params?.targetKB,
          enforceSizeCompliance: fixAction.params?.enforceSizeCompliance
            ?? fixAction.params?.targetKB === 150,
          silent: true,
        });
      }

      if (result?.status === "success") {
        addToast(`Applied fix: ${fixAction.label}`, "success");
      } else if (result?.status === "failed") {
        addToast(`Could not apply fix: ${fixAction.label}`, "error");
      } else if (result?.status === "skipped") {
        addToast("Fix skipped. Creative may already meet the requirement.", "info");
      }
    } catch (error) {
      addToast(error?.message || "Failed to apply fix.", "error");
    } finally {
      setFixingCreativeIds((prev) => prev.filter((id) => id !== creativeId));
    }
  }, [compressCreative, fixingCreativeIds, compressingCreativeIds, addToast]);

  const handleBulkTargetSizeChange = useCallback((value) => {
    const sanitized = String(value || "").replace(/[^\d]/g, "");
    setBulkTargetSizeKB(sanitized);
  }, []);

  const handleBulkCompressAll = useCallback(async () => {
    if (isBulkCompressing || compressingCreativeIds.length > 0) return;
    if (creatives.length === 0) {
      addToast("Upload creatives before using bulk compression.", "error");
      return;
    }

    const target = Number.parseInt(String(bulkTargetSizeKB || "").trim(), 10);
    if (!Number.isFinite(target) || target <= 0) {
      addToast("Enter a valid bulk target size in KB.", "error");
      return;
    }

    const eligibleCreatives = creatives.filter((creative) => String(creative?.mimeType || "").toLowerCase() !== "image/gif");
    if (eligibleCreatives.length === 0) {
      addToast("Bulk compression skipped: only GIF creatives are available.", "error");
      return;
    }

    setIsBulkCompressing(true);
    setBulkCompressProgress({ current: 0, total: eligibleCreatives.length });
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
      for (let index = 0; index < eligibleCreatives.length; index += 1) {
        const creative = eligibleCreatives[index];
        setBulkCompressProgress({ current: index + 1, total: eligibleCreatives.length });

        const result = await compressCreative(creative.id, {
          enforceSizeCompliance: true,
          targetSizeKB: target,
          preserveDimensions: true,
          silent: true,
        });

        if (result?.status === "success") successCount += 1;
        else if (result?.status === "skipped") skippedCount += 1;
        else failedCount += 1;

        await yieldToMain();
      }

      if (failedCount === 0) {
        addToast(
          `Bulk compression complete: ${successCount} compressed to ${target}KB${skippedCount ? `, ${skippedCount} skipped` : ""}.`,
          "success"
        );
      } else {
        addToast(
          `Bulk compression complete: ${successCount} reached ${target}KB, ${failedCount} could not reach target${skippedCount ? `, ${skippedCount} skipped` : ""}.`,
          "error"
        );
      }
    } finally {
      setIsBulkCompressing(false);
      setBulkCompressProgress({ current: 0, total: 0 });
    }
  }, [isBulkCompressing, compressingCreativeIds.length, creatives, bulkTargetSizeKB, compressCreative, addToast]);

  const downloadCreative = useCallback(async (creative) => {
    const blob = await getCreativeFullBlob(creative);
    if (!blob) return;

    const extension = getFileExtensionForMime(creative.mimeType || blob.type || "image/jpeg");
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${creative.name || "creative"}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
    void trackUserActivity("download", {
      action_label: "Creative downloaded",
      platform,
      campaign_goal: campaignGoal,
      creative_name: creative.name,
      creative_size: creative.size,
      metadata: {
        format: extension,
        mime_type: creative.mimeType || blob.type,
      },
    }, { dedupeKey: `download-creative-${creative.id}` });
    addToast(`Downloaded: ${creative.name}`, "success");
  }, [addToast, platform, campaignGoal]);

  const removeCreative = async (id) => {
    const existing = creativesRef.current.find((c) => c.id === id);
    if (existing) revokeCreativeObjectUrls(existing);

    const nextCreatives = creativesRef.current.filter((c) => c.id !== id);
    setCreatives(nextCreatives);
    const filterAnalysisEntries = (entries) => (
      Array.isArray(entries)
        ? entries.filter((entry) => entry?.creative?.id !== id)
        : []
    );
    const nextAnalysisResult = filterAnalysisEntries(analysisResult);
    const nextBaselineAnalysisResult = filterAnalysisEntries(baselineAnalysisResult);

    if (nextCreatives.length === 0 || nextAnalysisResult.length === 0) {
      setAnalysisResult(null);
      writeStoredAnalysisResult(null);
      setUrlValidation(null);
      clearStoredUrlValidation();
    } else {
      setAnalysisResult(nextAnalysisResult);
      writeStoredAnalysisResult(nextAnalysisResult);
    }

    if (isProgrammaticCreativeReplacementFlow) {
      setBaselineAnalysisResult(nextBaselineAnalysisResult.length > 0 ? nextBaselineAnalysisResult : null);
      setReplacementComparisonReport(null);
    } else if (programmaticTaskType === "campaign_renewal") {
      setRenewalComparisonReport(null);
    }
    setTargetSizeByCreative((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    void deleteCreativeAssets(id);

    try {
      const existing = creativesRef.current.find((c) => c.id === id);
      if (existing?.supabaseCreativeId) {
        await deleteCreativeRecord(existing.supabaseCreativeId);
      }
    } catch (e) { console.error("removeCreative error:", e); }

    if (platform === "programmatic" && campaignVertical) {
      void persistProgrammaticCampaignSnapshot(
        nextAnalysisResult.length > 0 ? nextAnalysisResult : null,
      );
    }
  };

  const handleTargetSizeChange = useCallback((creativeId, nextValue) => {
    const sanitized = String(nextValue || "").replace(/[^\d]/g, "");
    setTargetSizeByCreative((prev) => ({
      ...prev,
      [creativeId]: sanitized,
    }));
  }, []);

  const handleCreativeUpdate = useCallback((id, updates) => {
    setCreatives((prev) => {
      return prev.map((c) => {
        if (c.id !== id) return c;
        if (!originalBackups[id]) setOriginalBackups((b) => ({ ...b, [id]: { ...c } }));
        const newValidation = updates.validation ?? c.validation;
        const newValid = newValidation
          ? newValidation.valid && newValidation.status !== "CRITICAL"
          : allowedSizes.includes(updates.size || c.size);
        const merged = { ...c, ...updates, validation: newValidation, valid: newValid };
        const nextSize = updates.size || c.size;
        const [nextW, nextH] = String(nextSize || "").split("x").map(Number);
        const updated = nextW > 0 && nextH > 0
          ? attachSourceDimensions(merged, nextW, nextH)
          : merged;
        schedulePersistCreative(updated);
        return updated;
      });
    });
  }, [originalBackups, allowedSizes, schedulePersistCreative]);

  const startEdit = (id, currentName) => { setEditingId(id); setEditingName(currentName); };
  const saveEdit = (id) => {
    setCreatives(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(c => c.id === id);
      if (idx !== -1) arr[idx].name = editingName;
      return arr;
    });
    setEditingId(null);
  };

  const runAnalysisInternal = useCallback(async (analysisContextOverride = null) => {
    if (creativesForAnalysis.length === 0) { addToast("No valid creatives to analyze.", "error"); return; }

    const resolvedGoal = analysisContextOverride?.campaignGoal || effectiveCampaignGoal || campaignGoal;
    const resolvedVertical = analysisContextOverride?.campaignVertical || campaignVertical;
    const resolvedBrief = analysisContextOverride?.campaignBrief ?? campaignBrief;
    const resolvedProductFocus = analysisContextOverride?.campaignProductFocus ?? campaignProductFocus;
    const resolvedAudienceStage = analysisContextOverride?.campaignAudienceStage ?? campaignAudienceStage;
    const resolvedLandingUrl = stripUtmFromUrl(
      analysisContextOverride?.landingUrl ?? effectiveDestinationUrl ?? landingUrl,
    );

    if (!resolvedGoal || !platform || !resolvedVertical) { addToast("Missing configuration.", "error"); return; }

    const storedAnalysis = Array.isArray(analysisResult) && analysisResult.length
      ? analysisResult
      : Array.isArray(baselineAnalysisResult) && baselineAnalysisResult.length
        ? baselineAnalysisResult
        : [];

    const existingAnalysis = storedAnalysis.length
      ? filterAnalysisForCreatives(storedAnalysis, creativesForAnalysis)
      : [];

    const shouldMergeAnalysis = isCreativeAdditionAdditionFlow
      || (platform === "programmatic"
        && isProgrammaticCampaignUpdateTask(programmaticTaskType)
        && existingAnalysis.length > 0);

    const creativesToAnalyze = shouldMergeAnalysis
      ? getCreativesMissingAnalysis(creativesForAnalysis, existingAnalysis)
      : creativesForAnalysis;

    if (creativesToAnalyze.length === 0) {
      if (existingAnalysis.length > 0) {
        setAnalysisResult(existingAnalysis);
        writeStoredAnalysisResult(existingAnalysis);
        addToast("All creatives already analyzed. Review results in Overview.", "success");
      }
      return;
    }

    setAnalysisLoading(true);
    if (shouldMergeAnalysis) {
      setAnalysisResult(existingAnalysis.length > 0 ? existingAnalysis : null);
    } else if (!isCreativeAdditionAdditionFlow) {
      setAnalysisResult(null);
    } else {
      setAnalysisResult(existingAnalysis.length > 0 ? existingAnalysis : null);
    }
    setAnalysisProgress({ completed: 0, total: creativesToAnalyze.length, label: "" });
    if (isProgrammaticCreativeReplacementFlow) {
      setReplacementComparisonReport(null);
    }
    if (isProgrammaticRenewalFlow) {
      setRenewalComparisonReport(null);
    }
    try {
      void trackUserActivity("analyzer_usage", {
        action_label: "Analysis started",
        platform,
        campaign_goal: resolvedGoal,
        vertical: resolvedVertical,
        metadata: {
          creative_count: creativesToAnalyze.length,
          total_creatives: creativesForAnalysis.length,
          addition_flow: isCreativeAdditionAdditionFlow,
          audience_stage: resolvedAudienceStage,
          ad_sizes: creativesForAnalysis.map((c) => c.size),
          placements: platform ? Object.keys(PLATFORM_SIZES[platform] || {}) : [],
          replacement_flow: isProgrammaticCreativeReplacementFlow,
          renewal_flow: isProgrammaticRenewalFlow,
        },
      }, { dedupeKey: `analyzer-start-${platform}-${effectiveCampaignGoal}-${creativesForAnalysis.length}` });

      const results = await analyzeAllCreatives(
        creativesToAnalyze,
        resolvedGoal,
        platform,
        resolvedVertical,
        resolvedAudienceStage,
        resolvedBrief,
        resolvedProductFocus,
        resolvedLandingUrl,
        (completed, total, label) => {
          setAnalysisProgress({ completed, total, label });
        },
        {
          useOrchestrator: isCreativeAdditionAdditionFlow && Boolean(campaignAccessToken) && Boolean(activeCampaignId || lookupCampaignId),
          campaignId: activeCampaignId || lookupCampaignId,
          accessToken: campaignAccessToken,
          taskType: programmaticTaskType,
          googleCampaignType: platform === "google_ads" ? googleCampaignType : "",
        },
      );
      const resultsWithAdGroupContext = results.map((entry, index) => {
        const creative = creativesToAnalyze[index];
        const payload = getEntryPayload(entry) || {};
        const messagingGroupId = buildCreativeMessagingFingerprint(creative, payload);
        return {
          ...entry,
          creative: entry.creative ? {
            ...entry.creative,
            adGroupId: creative?.adGroupId || entry.creative.adGroupId || null,
            adGroupName: creative?.adGroupName || entry.creative.adGroupName || null,
            adGroupObjective: creative?.adGroupObjective || entry.creative.adGroupObjective || resolvedGoal,
            messagingGroupId,
          } : entry.creative,
          data: payload ? {
            ...payload,
            messaging_group: {
              id: messagingGroupId,
              basis: "headline_primary_message_cta",
              note: "Creatives with the same messaging are grouped for summary review; validation issues remain creative-specific.",
            },
            ad_group_context: {
              id: creative?.adGroupId || null,
              name: creative?.adGroupName || null,
              objective: creative?.adGroupObjective || resolvedGoal,
              objective_priority: "ad_group_objective_over_campaign_brief",
              audience_stage: resolvedAudienceStage,
            },
          } : payload,
        };
      });
      const reusedCount = resultsWithAdGroupContext.filter((entry) => entry.brainReused).length;
      const analyzedCount = resultsWithAdGroupContext.length - reusedCount;
      const mergedResults = shouldMergeAnalysis && existingAnalysis.length
        ? [...existingAnalysis, ...resultsWithAdGroupContext]
        : isCreativeAdditionAdditionFlow
          ? [...existingAnalysis, ...resultsWithAdGroupContext]
          : resultsWithAdGroupContext;
      setAnalysisResult(mergedResults);
      writeStoredAnalysisResult(mergedResults);

      const linkedCreatives = await Promise.all(
        creativesToAnalyze.map(async (creative) => {
          const supabaseCreativeId = creative.supabaseCreativeId || await persistCreative(creative);
          return { creative, supabaseCreativeId };
        }),
      );

      await Promise.all(
        resultsWithAdGroupContext.map(async (entry, index) => {
          const supabaseCreativeId = linkedCreatives[index]?.supabaseCreativeId;
          if (!supabaseCreativeId) return;
          await saveAnalyzerResult({
            creativeId: supabaseCreativeId,
            platform,
            goal: linkedCreatives[index]?.creative?.adGroupObjective || effectiveCampaignGoal,
            resultJson: getEntryPayload(entry) || {},
          });
        }),
      );

      await trackUserActivity("analyzer_usage", {
        action_label: "Analysis completed",
        platform,
        campaign_goal: resolvedGoal,
        vertical: resolvedVertical,
        metadata: {
          creative_count: resultsWithAdGroupContext.length,
          audience_stage: resolvedAudienceStage,
          creative_names: creativesForAnalysis.map((c) => c.name).filter(Boolean),
          ad_sizes: creativesForAnalysis.map((c) => c.size),
          replacement_flow: isProgrammaticCreativeReplacementFlow,
          renewal_flow: isProgrammaticRenewalFlow,
        },
      }, { dedupeKey: `analyzer-complete-${platform}-${effectiveCampaignGoal}-${resultsWithAdGroupContext.length}` });

      const authed = await isAuthenticatedUser();
      if (!authed) { /* guest demo already consumed on entry */ }

      const goalMisaligned = mergedResults.filter((entry) => getEntryPayload(entry)?.goal_alignment?.is_aligned === false);
      const verticalMisaligned = mergedResults.filter((entry) => getEntryPayload(entry)?.vertical_alignment?.is_aligned === false);

      if (goalMisaligned.length === 0 && verticalMisaligned.length === 0) {
        const reuseNote = reusedCount > 0
          ? ` ${reusedCount} reused from stored brains, ${analyzedCount} newly analyzed.`
          : "";
        addToast(`Analyzed ${creativesToAnalyze.length} creative${creativesToAnalyze.length !== 1 ? "s" : ""}.${reuseNote} All creatives align with selected goal and vertical.`, "success");
      } else {
        addToast(
          `Analyzed ${creativesToAnalyze.length} creative${creativesToAnalyze.length !== 1 ? "s" : ""}. Goal mismatches: ${goalMisaligned.length}, Vertical mismatches: ${verticalMisaligned.length}.`,
          "error"
        );
      }

      if (isProgrammaticCreativeReplacementFlow) {
        const report = buildReplacementComparisonReport({
          baselineCreatives,
          replacementCreatives: creativesForAnalysis,
          baselineAnalysis: baselineAnalysisResult,
          replacementAnalysis: resultsWithAdGroupContext,
        });
        setReplacementComparisonReport(report);
      }

      if (isProgrammaticRenewalFlow && renewalReferenceSnapshot) {
        const report = buildCampaignRenewalReport({
          referenceSnapshot: renewalReferenceSnapshot,
          currentConfig: {
            campaignName,
            campaignBrief,
            vertical: campaignVertical || "",
            landingUrl,
            campaignGoal: effectiveCampaignGoal || campaignGoal || "",
            programmaticAdGroupCount,
          },
          currentCreatives: creativesForAnalysis,
          currentAnalysis: resultsWithAdGroupContext,
        });
        setRenewalComparisonReport(report);
      }

      const analysisToPersist = isProgrammaticCreativeReplacementFlow && Array.isArray(baselineAnalysisResult)
        ? [...baselineAnalysisResult, ...resultsWithAdGroupContext]
        : isCreativeAdditionAdditionFlow
          ? mergedResults
          : resultsWithAdGroupContext;
      const savedCampaign = await persistProgrammaticCampaignSnapshot(analysisToPersist);
      if (savedCampaign) {
        addToast(`Campaign saved as ${savedCampaign.id}.`, "info");
      } else if (platform !== "programmatic" && advertiserId && advertiserName.trim() && campaignOwnerId) {
        syncAdvertiserFromGenericSession({
          ownerId: campaignOwnerId,
          advertiserId,
          advertiserName: advertiserName.trim(),
          campaignId: activeCampaignId || analysisSessionId || `CMP-${Date.now()}`,
          campaignName: campaignName.trim() || "Untitled Campaign",
          platform,
          campaignGoal: effectiveCampaignGoal || campaignGoal || "",
          validated: true,
          creatives: creativesForAnalysis.map((creative) => ({
            id: creative.id,
            name: creative.name,
            size: creative.size,
            valid: creative.valid,
            url: getPersistableCreativeUrl(creative) || creative.url,
            fullUrl: creative.fullUrl,
            mediaType: creative.mediaType,
            adGroupId: creative.adGroupId,
            adGroupName: creative.adGroupName,
            adGroupObjective: creative.adGroupObjective,
          })),
        });
      }
    } catch (err) {
      addToast(err.message || "Analysis failed.", "error");
    } finally {
      setAnalysisLoading(false);
      setAnalysisProgress({ completed: 0, total: 0, label: "" });
    }
  }, [
    creativesForAnalysis,
    effectiveCampaignGoal,
    platform,
    campaignVertical,
    campaignAudienceStage,
    campaignBrief,
    campaignProductFocus,
    landingUrl,
    addToast,
    persistCreative,
    persistProgrammaticCampaignSnapshot,
    isProgrammaticCreativeReplacementFlow,
    isProgrammaticRenewalFlow,
    isCreativeAdditionAdditionFlow,
    baselineCreatives,
    baselineAnalysisResult,
    analysisResult,
    renewalReferenceSnapshot,
    campaignName,
    programmaticAdGroupCount,
    activeCampaignId,
    campaignAccessToken,
    programmaticTaskType,
    advertiserId,
    advertiserName,
    campaignOwnerId,
    analysisSessionId,
  ]);

  const buildAssistantFingerprint = useCallback(() => (
    buildCampaignAssistantFingerprint({
      advertiserId,
      advertiserName,
      campaignId: activeCampaignId || loadedCampaignSnapshot?.id || "",
      campaignName,
      campaignBrief,
      campaignGoal: effectiveCampaignGoal || campaignGoal,
      campaignVertical,
      campaignProductFocus,
      landingUrl,
      programmaticTaskType,
      creativeFingerprint,
    })
  ), [
    advertiserId,
    advertiserName,
    activeCampaignId,
    loadedCampaignSnapshot?.id,
    campaignName,
    campaignBrief,
    effectiveCampaignGoal,
    campaignGoal,
    campaignVertical,
    campaignProductFocus,
    landingUrl,
    programmaticTaskType,
    creativeFingerprint,
  ]);

  const assessAndRunAnalysis = useCallback(async () => {
    if (creativesForAnalysis.length === 0) { addToast("No valid creatives to analyze.", "error"); return; }
    if (!effectiveCampaignGoal || !platform || !campaignVertical) { addToast("Missing configuration.", "error"); return; }

    const fingerprint = buildAssistantFingerprint();
    if (isCampaignAssistantContextValid(campaignAssistantContext, fingerprint)) {
      await runAnalysisInternal();
      return;
    }

    setAssistantChecking(true);
    try {
      const response = await timeAsyncOperation(
        "preview-tool",
        "POST /api/campaign-context-assessment",
        () => fetch("/api/campaign-context-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            campaignName,
            advertiserName,
            campaignBrief,
            campaignGoal: effectiveCampaignGoal || campaignGoal,
            campaignVertical,
            campaignAudienceStage,
            campaignProductFocus,
            landingUrl,
            programmaticTaskType,
            creativeCount: creativesForAnalysis.length,
            creativeNames: creativesForAnalysis.map((creative) => creative.name).filter(Boolean),
            hasPriorClarifications: isCampaignAssistantContextValid(campaignAssistantContext, fingerprint),
          }),
        }),
      );

      if (!response.ok) {
        await runAnalysisInternal();
        return;
      }

      const assessment = await response.json();
      if (!assessment?.shouldAsk || !Array.isArray(assessment.questions) || assessment.questions.length === 0) {
        await runAnalysisInternal();
        return;
      }

      setAssistantQuestions(assessment.questions);
      setAssistantReasoning(assessment.reasoning || "");
      setAssistantProvider(assessment.provider || "");
      setAssistantModalOpen(true);
    } catch {
      await runAnalysisInternal();
    } finally {
      setAssistantChecking(false);
    }
  }, [
    creativesForAnalysis,
    effectiveCampaignGoal,
    platform,
    campaignVertical,
    buildAssistantFingerprint,
    campaignAssistantContext,
    addToast,
    runAnalysisInternal,
    campaignName,
    advertiserName,
    campaignBrief,
    campaignGoal,
    campaignAudienceStage,
    campaignProductFocus,
    landingUrl,
    programmaticTaskType,
  ]);

  const handleAssistantSubmit = useCallback(async (answers) => {
    setAssistantSubmitting(true);
    try {
      const fingerprint = buildAssistantFingerprint();
      const merged = mergeAssistantAnswers({
        campaignBrief,
        campaignProductFocus,
        campaignAudienceStage,
        campaignGoal: effectiveCampaignGoal || campaignGoal,
        campaignVertical,
        landingUrl,
        advertiserName,
        questions: assistantQuestions,
        answers,
      });

      setCampaignBrief(merged.campaignBrief);
      if (merged.campaignProductFocus) setCampaignProductFocus(merged.campaignProductFocus);
      if (merged.campaignAudienceStage) setCampaignAudienceStage(merged.campaignAudienceStage);
      if (merged.landingUrl && !landingUrl.trim()) setLandingUrl(merged.landingUrl);
      if (merged.advertiserName && !advertiserName.trim()) setAdvertiserName(merged.advertiserName);
      if (merged.campaignGoal && merged.campaignGoal !== campaignGoal) setCampaignGoal(merged.campaignGoal);
      if (merged.campaignVertical && merged.campaignVertical !== campaignVertical) setCampaignVertical(merged.campaignVertical);

      setCampaignAssistantContext({
        sourceFingerprint: fingerprint,
        answers,
        mergedBriefSupplement: merged.supplement,
        resolvedAt: new Date().toISOString(),
        provider: assistantProvider || undefined,
      });
      setAssistantModalOpen(false);
      await runAnalysisInternal({
        campaignBrief: merged.campaignBrief,
        campaignProductFocus: merged.campaignProductFocus,
        campaignAudienceStage: merged.campaignAudienceStage,
        campaignGoal: merged.campaignGoal || effectiveCampaignGoal || campaignGoal,
        campaignVertical: merged.campaignVertical || campaignVertical,
        landingUrl: merged.landingUrl || landingUrl,
      });
    } finally {
      setAssistantSubmitting(false);
    }
  }, [
    buildAssistantFingerprint,
    campaignBrief,
    campaignProductFocus,
    campaignAudienceStage,
    effectiveCampaignGoal,
    campaignGoal,
    campaignVertical,
    landingUrl,
    advertiserName,
    assistantQuestions,
    assistantProvider,
    runAnalysisInternal,
  ]);

  useEffect(() => {
    if (step !== 2) return;
    if (urlValidationRunning || readinessLoading) return;
    if (creatives.length === 0 || !platform || !effectiveCampaignGoal) return;

    const trimmed = stripUtmFromUrl(displayValidationUrl);
    const urlRequired = platform !== "meta_ads";
    if (urlRequired && !trimmed) return;

    const fingerprint = getCreativeValidationFingerprint(creatives);
    if (trimmed && urlValidation) {
      const validatedUrl = stripUtmFromUrl(urlValidation.submitted_url || "");
      if (validatedUrl === trimmed && urlValidation.creative_fingerprint === fingerprint) {
        const session = {
          url: trimmed,
          fingerprint,
          platform,
          objective: effectiveCampaignGoal,
        };
        // Already restored for this session — do not call setState again.
        if (readinessReport && readinessMatchesSession(readinessReport, session)) {
          return;
        }
        const restored = restoreReadinessIfMatching(session);
        if (!restored) {
          void runReadinessValidation({
            platform,
            url: trimmed,
            objective: effectiveCampaignGoal,
            campaignName: campaignName.trim() || "Campaign",
            vertical: campaignVertical || undefined,
            creativeFingerprint: fingerprint,
            creatives: creatives.map((c) => ({
              id: c.id,
              name: c.name,
              size: c.size,
              fileSize: c.fileSizeBytes,
              mimeType: c.mimeType,
              mediaType: c.mediaType,
              contentHash: c.contentHash,
              validation: c.validation,
            })),
          });
        }
        return;
      }
    }

    const timer = window.setTimeout(() => {
      void runUrlValidation(trimmed || null);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    step,
    displayValidationUrl,
    creatives,
    platform,
    effectiveCampaignGoal,
    urlValidationRunning,
    readinessLoading,
    urlValidation,
    readinessReport,
    runUrlValidation,
    runReadinessValidation,
    restoreReadinessIfMatching,
    campaignName,
    campaignVertical,
  ]);

  useEffect(() => {
    if (step !== 3) return;
    if (!isProgrammaticUrlUtmFlow) return;
    if (urlValidationRunning || readinessLoading) return;
    if (!effectiveDestinationUrl.trim()) return;

    const cleanUrl = stripUtmFromUrl(effectiveDestinationUrl);
    const validationKey = `${cleanUrl}|${getCreativeValidationFingerprint(creatives)}`;
    if (urlUtmValidationReport && lastUrlUtmAutoValidationKeyRef.current === validationKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastUrlUtmAutoValidationKeyRef.current = validationKey;
      void runUrlUtmValidation();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    step,
    isProgrammaticUrlUtmFlow,
    effectiveDestinationUrl,
    urlValidationRunning,
    readinessLoading,
    urlUtmValidationReport,
    creatives,
    runUrlUtmValidation,
  ]);

  useEffect(() => {
    if (step !== 3) return;
    if (isProgrammaticUrlUtmFlow) return;
    if (isHydratingCreatives) return;
    if (analysisLoading) return;
    if (uploadedCreatives.length === 0) return;

    if (assistantModalOpen || assistantChecking) return;

    const missingCreatives = getCreativesMissingAnalysis(uploadedCreatives, analysisResult);
    if (missingCreatives.length === 0) return;

    const timer = window.setTimeout(() => {
      void assessAndRunAnalysis();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    step,
    isProgrammaticUrlUtmFlow,
    isHydratingCreatives,
    analysisLoading,
    analysisResult,
    uploadedCreatives,
    assessAndRunAnalysis,
    assistantModalOpen,
    assistantChecking,
  ]);

  useEffect(() => {
    if (!analysisSessionId) return;
    if (!Array.isArray(analysisResult) || analysisResult.length === 0) return;

    void updateAnalysisSession({ status: "analysis_completed" }).catch((error) => {
      console.error("Failed to mark analysis as completed", error);
    });
  }, [analysisSessionId, analysisResult, updateAnalysisSession]);

  const handlePreviewExportContextChange = useCallback((context) => {
    previewExportContextRef.current = {
      ...previewExportContextRef.current,
      ...context,
    };
  }, []);

  const handleDownloadReport = useCallback(async (context = {}) => {
    if (!analysisResult?.length) return;
    if (!wysiwygExportRef.current) {
      addToast("Report exporter is still loading. Please try again in a moment.", "error");
      return;
    }
    if (isDownloadingReport) return;

    const exportScope = context?.tab || "overview";
    const selectedCreativeId = context?.selectedCreativeId ?? null;
    const reportTypeLabel = exportScope === "overview"
      ? "Overview Report (PDF)"
      : exportScope === "qa"
        ? "QA Report (PDF)"
        : "Creative Analysis Report (PDF)";

    setIsDownloadingReport(true);
    try {
      if (campaignOwnerId) setReportExportStorageScope(campaignOwnerId);
      addToast("Preparing analysis report…", "info");
      const result = await wysiwygExportRef.current.generateAnalysisReport({
        analysisResult,
        creatives: uploadedCreatives.map((c) => ({
          id: c.id,
          url: c.url,
          fullUrl: c.fullUrl,
        })),
        platform,
        campaignGoal,
        campaignVertical,
        campaignId: activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "",
        creativeFingerprint,
        viewerName,
        urlValidation,
        campaignBrief,
        campaignProductFocus,
        campaignIntent: resolvedCampaignIntent,
        programmaticTaskType,
        replacementComparisonReport,
        renewalComparisonReport,
        exportScope,
        selectedCreativeId,
      }, { useCache: false });
      downloadBlob(result.blob, result.filename);
      let persistedCampaignId = activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "";
      let persistedOnDownload = false;
      try {
        const persisted = await persistProgrammaticCampaignSnapshot(null, { syncRemote: true });
        if (persisted?.id) {
          persistedCampaignId = persisted.id;
          persistedOnDownload = true;
        }
      } catch (persistError) {
        console.warn("[Adigator IQ] Report downloaded but campaign persistence failed:", persistError);
      }
      void trackUserActivity("download", {
        action_label: "PDF report downloaded",
        platform,
        campaign_goal: campaignGoal,
        metadata: {
          format: "pdf",
          wysiwyg: true,
          from_cache: result.fromCache,
          export_scope: exportScope,
          creative_count: Array.isArray(analysisResult) ? analysisResult.length : 0,
        },
      }, { dedupeKey: `download-pdf-${platform}-${campaignGoal}-${exportScope}` });
      void recordAndStoreDownloadReport({
        ownerId: campaignOwnerId || "",
        reportType: reportTypeLabel,
        campaignName: campaignName.trim() || "Untitled Campaign",
        campaignId: persistedCampaignId,
        advertiserName: advertiserName.trim() || "—",
        advertiserId: advertiserId || "",
        targetStep: 3,
        downloadedBy: viewerName || "User",
        status: "Completed",
        filename: result.filename,
        exportFingerprint: result.fingerprint,
        exportKind: "analysis",
        analysisTab: exportScope,
        selectedCreativeId: selectedCreativeId || undefined,
        platform: platform || undefined,
        blob: result.blob,
      });
      const toastInfo = buildAnalysisReportDownloadToast(Boolean(result.fromCache), persistedOnDownload);
      addToast(toastInfo.message, toastInfo.type);
    } catch (err) {
      console.error(err);
      void recordAndStoreDownloadReport({
        ownerId: campaignOwnerId || "",
        reportType: reportTypeLabel,
        campaignName: campaignName.trim() || "Untitled Campaign",
        campaignId: activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "",
        advertiserName: advertiserName.trim() || "—",
        advertiserId: advertiserId || "",
        targetStep: 3,
        downloadedBy: viewerName || "User",
        status: "Failed",
      });
      addToast("Failed to generate analysis report.", "error");
    } finally {
      setIsDownloadingReport(false);
    }
  }, [
    analysisResult,
    isDownloadingReport,
    campaignGoal,
    platform,
    addToast,
    campaignOwnerId,
    campaignName,
    advertiserName,
    advertiserId,
    viewerName,
    campaignVertical,
    campaignBrief,
    campaignProductFocus,
    activeCampaignId,
    loadedCampaignSnapshot?.id,
    lookupCampaignId,
    uploadedCreatives,
    creativeFingerprint,
    urlValidation,
    resolvedCampaignIntent,
    programmaticTaskType,
    replacementComparisonReport,
    renewalComparisonReport,
    persistProgrammaticCampaignSnapshot,
  ]);

  const isVideoPreviewStudio = platform === "google_ads"
    ? (isVideoAdTypeSelected || isVideoObjectiveSelected)
    : (
      isVideoAdTypeSelected
      || isVideoObjectiveSelected
      || validCreatives.some((c) => c.mediaType === "video")
    );

  const previewEngineCreatives = useMemo(
    () => validCreatives.map((creative, index) => {
      const payload = getEntryPayload(analysisResult?.[index]) || {};
      const previewContext = resolveCreativePreviewContext(payload, campaignVertical || "general");
      const signalHeadline = payload?.signals?.headline || payload?.extraction_signals?.headline || "";
      const importedHeadline = creative.headline || creative.title || "";
      const safeHeadline = isVideoPreviewStudio
        ? (creative.name || "Sponsored video")
        : (importedHeadline || signalHeadline || payload?.main_strategic_problem || creative.name || "");
      return {
        id: creative.id,
        name: creative.name,
        url: creative.url || creative.imageDataUrl || creative.image || "",
        size: creative.size || creative.validation?.size || "1200x628",
        analyzerOutput: isVideoPreviewStudio ? undefined : payload,
        ctaText: isVideoPreviewStudio
          ? "Learn More"
          : (payload?.signals?.cta || payload?.extraction_signals?.cta || creative.text || ""),
        headline: safeHeadline,
        previewVertical: previewContext.creativeVertical,
        previewTemplate: previewContext.templateId,
      };
    }),
    [validCreatives, analysisResult, campaignVertical, isVideoPreviewStudio],
  );

  const previewTemplateContext = useMemo(() => {
    const primaryPayload = getEntryPayload(analysisResult?.[0]) || {};
    const signals = primaryPayload.signals || {};
    const brandName = signals.brand || validCreatives[0]?.name || "Brand";
    if (isVideoPreviewStudio) {
      return {
        brandName,
        targetAudience: campaignAudienceStage || "Prospective customers",
        tone: "Clear and brand-forward",
        keyMessage: "",
        imageUrls: validCreatives
          .map((creative) => creative.url || creative.imageDataUrl || creative.image || "")
          .filter(Boolean),
      };
    }
    const rawKeyMessage = signals.primary_message || signals.headline || primaryPayload.main_strategic_problem || "";
    const looksLikeAnalysis = /cta appears|misaligned|risk|compress|review before|timestamp|too late|too small|hard to read/i.test(rawKeyMessage);
    return {
      brandName,
      targetAudience: campaignAudienceStage || "Prospective customers",
      tone: campaignGoal === "awareness"
        ? "Brand-forward and scroll-stopping"
        : campaignGoal === "consideration"
          ? "Credible and persuasive"
          : "Direct and conversion-focused",
      keyMessage: looksLikeAnalysis ? "" : rawKeyMessage,
      imageUrls: validCreatives
        .map((creative) => creative.url || creative.imageDataUrl || creative.image || "")
        .filter(Boolean),
    };
  }, [analysisResult, validCreatives, campaignAudienceStage, campaignGoal, isVideoPreviewStudio]);

  const handleExportPptx = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    if (isVideoPreviewStudio) {
      addToast("Preparing preview video…", "info");
      try {
        const exportContext = previewExportContextRef.current || {};
        const previewElement = exportContext.getPreviewElement?.();
        if (!previewElement) {
          addToast("No preview template is ready to export. Select a placement preview first.", "error");
          return;
        }
        const placementLabel = exportContext.placement || exportContext.templateId || "placement";
        const safeName = String(placementLabel).replace(/[^a-zA-Z0-9._-]+/g, "_");
        const result = await recordPreviewStudioVideo({
          previewElement,
          filename: `Preview_${safeName}.webm`,
          maxDurationSeconds: 6,
          fps: 30,
        });
        downloadBlob(result.blob, result.filename);
        void trackUserActivity("download", {
          action_label: "Preview studio video downloaded",
          platform,
          campaign_goal: campaignGoal,
          metadata: { format: result.mimeType || "video/webm", filename: result.filename },
        }, { dedupeKey: `download-preview-video-${result.filename}` });
        void recordAndStoreDownloadReport({
          ownerId: campaignOwnerId || "",
          reportType: "Preview Studio (Video)",
          campaignName: campaignName.trim() || "Untitled Campaign",
          campaignId: activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "",
          advertiserName: advertiserName.trim() || "—",
          advertiserId: advertiserId || "",
          targetStep: 4,
          downloadedBy: viewerName || "User",
          status: "Completed",
          filename: result.filename,
          templateId: exportContext.templateId || undefined,
          device: exportContext.device || "desktop",
          previewCreativeId: exportContext.creativeId ? String(exportContext.creativeId) : undefined,
          platform: platform || undefined,
          blob: result.blob,
        });
        addToast(`Preview video downloaded: ${result.filename}`, "success");
      } catch (err) {
        console.error(err);
        addToast(err?.message || "Preview video export failed.", "error");
      } finally {
        setIsExporting(false);
      }
      return;
    }

    if (!wysiwygExportRef.current) {
      setIsExporting(false);
      return;
    }
    addToast("Preparing preview studio report…", "info");
    try {
      if (campaignOwnerId) setReportExportStorageScope(campaignOwnerId);
      const exportContext = previewExportContextRef.current || {};
      const isProgrammatic = platform === "programmatic";
      let result;

      if (isProgrammatic) {
        result = await wysiwygExportRef.current.generatePreviewStudioReport({
          previewEngineCreatives,
          previewStudioCache,
          vertical: campaignVertical || "general",
          goal: campaignGoal || "awareness",
          campaignId: activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "",
          creativeFingerprint,
          campaignBrief,
          campaignIntent: resolvedCampaignIntent,
          campaignIntentFingerprint: resolvedCampaignIntentFingerprint,
          advertiserName,
          brandName: previewTemplateContext.brandName,
          campaignName,
          campaignProductFocus,
          advertiserId,
          templateId: exportContext.templateId,
          device: exportContext.device || "desktop",
          creativeId: exportContext.creativeId,
        }, { useCache: false });
      } else {
        const previewElement = exportContext.getPreviewElement?.();
        if (!previewElement) {
          addToast("No preview template is ready to export. Select a placement preview first.", "error");
          return;
        }
        const placementLabel = exportContext.placement || exportContext.templateId || "placement";
        const templateId = exportContext.templateId || exportContext.placement || "placement";
        const exportDevice = exportContext.device || "desktop";
        const exportCreativeId = exportContext.creativeId || null;
        const previewFingerprint = buildPreviewStudioReportFingerprint({
          campaignId: activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "",
          previewStudioUpdatedAt: previewStudioCache?.updatedAt,
          creativeFingerprint,
          templateId,
          device: exportDevice,
          creativeId: exportCreativeId || "",
        });

        result = await wysiwygExportRef.current.captureLivePreviewElement(previewElement, {
          title: `Preview ${placementLabel}`,
          filename: `Preview_${String(placementLabel).replace(/[^a-zA-Z0-9._-]+/g, "_")}.pdf`,
        });
        result = { ...result, fromCache: false, fingerprint: previewFingerprint };

        if (campaignOwnerId && result.blob) {
          setReportExportStorageScope(campaignOwnerId);
          await saveCachedReportExport({
            fingerprint: previewFingerprint,
            kind: "preview_studio",
            filename: result.filename,
            generatedAt: new Date().toISOString(),
            blob: result.blob,
          });
        }

        exportContext.templateId = templateId;
        exportContext.device = exportDevice;
        exportContext.creativeId = exportCreativeId;
      }

      downloadBlob(result.blob, result.filename);
      let persistedCampaignId = activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "";
      let persistedOnDownload = false;
      try {
        const persisted = await persistProgrammaticCampaignSnapshot(null, { syncRemote: true });
        if (persisted?.id) {
          persistedCampaignId = persisted.id;
          persistedOnDownload = true;
        }
      } catch (persistError) {
        console.warn("[Adigator IQ] Preview report downloaded but campaign persistence failed:", persistError);
      }
      void trackUserActivity("generate_action", {
        action_label: "Preview studio report generated",
        platform,
        campaign_goal: campaignGoal,
        metadata: {
          format: "pdf",
          wysiwyg: true,
          from_cache: result.fromCache,
        },
      }, { dedupeKey: `generate-preview-pdf-${platform}` });
      void trackUserActivity("download", {
        action_label: "Preview studio report downloaded",
        platform,
        campaign_goal: campaignGoal,
        metadata: { format: "pdf", filename: result.filename },
      }, { dedupeKey: `download-preview-pdf-${result.filename}` });
      void recordAndStoreDownloadReport({
        ownerId: campaignOwnerId || "",
        reportType: "Preview Studio (PDF)",
        campaignName: campaignName.trim() || "Untitled Campaign",
        campaignId: persistedCampaignId,
        advertiserName: advertiserName.trim() || "—",
        advertiserId: advertiserId || "",
        targetStep: 4,
        downloadedBy: viewerName || "User",
        status: "Completed",
        filename: result.filename,
        exportFingerprint: result.fingerprint,
        exportKind: "preview_studio",
        templateId: exportContext.templateId || undefined,
        device: exportContext.device || "desktop",
        previewCreativeId: exportContext.creativeId ? String(exportContext.creativeId) : undefined,
        platform: platform || undefined,
        blob: result.blob,
      });
      const toastInfo = buildPreviewReportDownloadToast(result.filename, Boolean(result.fromCache), persistedOnDownload);
      addToast(toastInfo.message, toastInfo.type);
    } catch (err) {
      console.error(err);
      void recordAndStoreDownloadReport({
        ownerId: campaignOwnerId || "",
        reportType: "Preview Studio (PDF)",
        campaignName: campaignName.trim() || "Untitled Campaign",
        campaignId: activeCampaignId || loadedCampaignSnapshot?.id || lookupCampaignId || "",
        advertiserName: advertiserName.trim() || "—",
        advertiserId: advertiserId || "",
        targetStep: 4,
        downloadedBy: viewerName || "User",
        status: "Failed",
      });
      addToast("Preview studio export failed.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [
    isExporting,
    isVideoPreviewStudio,
    previewEngineCreatives,
    previewStudioCache,
    addToast,
    campaignGoal,
    platform,
    campaignVertical,
    campaignOwnerId,
    campaignName,
    advertiserName,
    advertiserId,
    viewerName,
    activeCampaignId,
    loadedCampaignSnapshot?.id,
    lookupCampaignId,
    creativeFingerprint,
    campaignBrief,
    resolvedCampaignIntent,
    resolvedCampaignIntentFingerprint,
    previewTemplateContext.brandName,
    campaignProductFocus,
    persistProgrammaticCampaignSnapshot,
  ]);

  const previewPrewarmFingerprintRef = useRef("");
  const previewStudioCacheRef = useRef(null);

  useEffect(() => {
    previewStudioCacheRef.current = previewStudioCache;
  }, [previewStudioCache]);

  useEffect(() => {
    if (platform !== "programmatic" || !analysisResult?.length || !previewEngineCreatives.length) return;
    if (analysisLoading || step < 3) return;
    const campaignId = activeCampaignId || loadedCampaignSnapshot?.id;
    if (!campaignId || !campaignOwnerId || !campaignVertical) return;

    const sourceFingerprint = buildPreviewStudioSourceFingerprint({
      advertiserId,
      advertiserName,
      campaignId,
      campaignName,
      campaignBrief,
      campaignIntentFingerprint: resolvedCampaignIntentFingerprint,
      campaignIntent: resolvedCampaignIntent,
      vertical: campaignVertical,
      creativeFingerprint,
    });

    const prewarmKey = `${sourceFingerprint}|${previewEngineCreatives.length}`;
    if (previewPrewarmFingerprintRef.current === prewarmKey) return;
    previewPrewarmFingerprintRef.current = prewarmKey;

    let cancelled = false;

    const runPrewarm = () => {
      if (cancelled || document.hidden) return;

      setPreviewStudioStorageScope(campaignOwnerId);
      void prewarmPreviewStudioCache({
        advertiserId,
        advertiserName,
        campaignId,
        campaignName,
        campaignBrief,
        campaignIntentFingerprint: resolvedCampaignIntentFingerprint,
        campaignIntent: resolvedCampaignIntent,
        vertical: campaignVertical,
        creativeFingerprint,
        goal: campaignGoal || "awareness",
        campaignVertical: campaignVertical || "general",
        creatives: previewEngineCreatives,
        devices: ["desktop"],
        previewStudioCache: previewStudioCacheRef.current,
        campaignProductFocus,
        brandName: previewTemplateContext.brandName,
      }).then((cache) => {
        if (!cache || cancelled) return;
        setPreviewStudioCache((previous) => {
          const merged = mergePreviewStudioCaches(previous, cache) || cache;
          void savePreviewStudioCacheToStorage(campaignId, merged);
          return merged;
        });
        window.setTimeout(() => {
          if (!cancelled) {
            void persistProgrammaticCampaignSnapshot(null, { syncRemote: false });
          }
        }, 0);
      });
    };

    const idleId = typeof requestIdleCallback === "function"
      ? requestIdleCallback(runPrewarm, { timeout: 8000 })
      : null;
    const timerId = idleId == null ? window.setTimeout(runPrewarm, 1500) : null;

    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback === "function") {
        cancelIdleCallback(idleId);
      }
      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [
    platform,
    analysisResult,
    previewEngineCreatives,
    activeCampaignId,
    loadedCampaignSnapshot?.id,
    campaignOwnerId,
    campaignVertical,
    campaignGoal,
    advertiserId,
    advertiserName,
    campaignName,
    campaignBrief,
    resolvedCampaignIntent,
    resolvedCampaignIntentFingerprint,
    creativeFingerprint,
    campaignProductFocus,
    previewTemplateContext.brandName,
    analysisLoading,
    step,
  ]);

  const handleCopyPreviewCreative = useCallback(async (creative) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(creative, null, 2));
      addToast("Creative template copied to clipboard.", "success");
    } catch {
      addToast("Could not copy creative template.", "error");
    }
  }, [addToast]);

  const wizardSteps = useMemo(
    () => STEP_LABELS
      .slice(0, effectiveTotalSteps)
      .map((label, index) => ({
        id: String(index + 1),
        label,
        lockReason:
          index === 1
            ? "Select a platform first."
            : index >= 2
              ? "Upload and validate at least one creative first."
              : undefined,
      })),
    [effectiveTotalSteps],
  );

  const lockedWizardSteps = useMemo(() => {
    const locked = [];
    if (!isStepOneReady) locked.push("2", "3", "4");
    else if (!canAdvanceToAnalysis) locked.push("3", "4");
    return locked;
  }, [isStepOneReady, canAdvanceToAnalysis]);

  const goToStep = useCallback(
    (targetId) => {
      const targetStep = Number(targetId);
      if (!Number.isFinite(targetStep) || targetStep < 1 || targetStep > TOTAL_STEPS) return;
      if (targetStep === step) return;
      if (targetStep > 1 && !isStepOneReady) {
        setSetupPromptHighlighted(true);
        addToast("Select a platform on Step 1 before continuing.", "error");
        router.push(stepHref(1), { scroll: true });
        return;
      }
      if (targetStep > 2 && !canAdvanceToAnalysis) {
        addToast(
          missingCampaignDetailFields.length
            ? `Complete required fields: ${missingCampaignDetailFields.map((field) => field.label).join(", ")}.`
            : "Finish Campaign Details before continuing.",
          "error",
        );
        return;
      }
      if (targetStep >= 3 && uploadedCreatives.length === 0 && !hasGoogleAdsImportedDetails) return;
      router.push(stepHref(targetStep), { scroll: true });
    },
    [step, isStepOneReady, canAdvanceToAnalysis, missingCampaignDetailFields, uploadedCreatives.length, hasGoogleAdsImportedDetails, router, stepHref, addToast],
  );


  return (
    <div className="preview-tool relative min-h-screen overflow-x-hidden text-[#f4f4f8]">
      <div className="neon-orb -left-24 top-32 h-64 w-64 bg-indigo-500/20" aria-hidden />
      <div className="neon-orb right-0 top-1/3 h-48 w-48 bg-cyan-400/15" aria-hidden style={{ animationDelay: "2s" }} />
      <div className="neon-orb bottom-20 left-1/3 h-56 w-56 bg-violet-500/15" aria-hidden style={{ animationDelay: "4s" }} />

      <header className="tool-glass-header sticky top-0 z-50 px-6 py-4">
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="tool-neon-accent text-[10px] font-bold uppercase tracking-[0.22em]">
                Adigator IQ
              </p>
              <h1 className="studio-heading text-xl font-bold tracking-tight text-[#f4f4f8] md:text-2xl">
                Campaign Intelligence Studio
              </h1>
            </div>
            <p className="hidden text-xs text-[#c8c8d4] sm:block">
              Step {Math.min(step, effectiveTotalSteps)} of {effectiveTotalSteps}
            </p>
          </div>
          <WizardStepNav
            steps={wizardSteps}
            currentStep={step}
            onStepChange={goToStep}
            lockedStepIds={lockedWizardSteps}
            layoutIdPrefix="preview-wizard"
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <div className="mb-6">
          <WorkflowStatusBar
            status={workflowStatus}
            analysisLoading={analysisLoading}
            analysisProgress={analysisProgress}
          />
        </div>
        <AnimatePresence mode="wait">

          {/* STEP 1: SETUP CAMPAIGN */}
          {step === 1 && (
            <motion.div key="step-1" variants={stepPanelVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 pb-28">
              <motion.section variants={itemVariants} id="setup-platform-section" className="space-y-5">
                <div>
                  <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Choose Advertising Platform</h3>
                  <p className="mt-1 text-studio-muted">Select where this campaign will run.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {PLATFORMS.map((p) => {
                    return (
                      <ToolSelectionCard key={p.id} selected={platform === p.id} onClick={() => handlePlatformSelect(p.id)}>
                        <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/35 p-5 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.65)]">
                          <div className={`absolute inset-0 bg-linear-to-br ${p.color}`} />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_55%)]" />
                          <div
                            className={`relative z-10 flex items-start justify-between gap-3 ${platform === p.id ? "agi-platform-idle" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white shadow-[0_0_22px_rgba(255,255,255,0.18)]">
                                <PlatformBrandIcon platform={p.id} className="h-7 w-7" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-studio-muted">Ad network</p>
                                <h3 className={`studio-heading text-xl font-extrabold ${platform === p.id ? "text-studio-accent" : "text-studio-text"}`}>{p.title}</h3>
                              </div>
                            </div>
                            <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${platform === p.id ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200" : "border-white/15 bg-white/10 text-studio-muted"}`}>
                              {platform === p.id ? "Selected" : "Choose"}
                            </div>
                          </div>

                          <p className="relative z-10 mt-4 text-sm leading-relaxed text-studio-muted">{p.desc}</p>
                          {p.id === "google_ads" ? (
                            <p className="relative z-10 mt-3 text-xs font-semibold text-cyan-200">
                              Connect Google Ads shows up here after you choose this platform.
                            </p>
                          ) : null}
                        </div>
                      </ToolSelectionCard>
                    );
                  })}
                </div>
              </motion.section>

              {platform === "google_ads" || platform === "meta_ads" || platform === "programmatic" ? (
                <motion.section ref={goalSectionRef} id="setup-goal-section" variants={itemVariants} className="space-y-5">
                  <div>
                    <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">
                      {platform === "meta_ads" ? "Meta Ads Account" : platform === "programmatic" ? "Programmatic Account" : "Google Ads Account"}
                    </h3>
                    <p className="mt-1 text-studio-muted">
                      {platform === "meta_ads"
                        ? "Sign in with Meta Ads to load campaigns automatically, or create a new paused campaign."
                        : platform === "programmatic"
                          ? "Open your programmatic workspace to continue the workflow."
                          : "Sign in with Google Ads to load campaigns automatically."}
                    </p>
                  </div>
                  {platform === "meta_ads" ? (
                    <MetaAdsConnectPanel
                      enabled={true}
                      onImportCampaign={handleMetaAdsCampaignImport}
                    />
                  ) : (
                    <GoogleAdsConnectPanel
                      enabled={true}
                      activePlatform={platform}
                      onImportCampaign={handleGoogleAdsCampaignImport}
                    />
                  )}
                </motion.section>
              ) : null}

              <div className="flex gap-4 pt-4">
                <ToolNavBtn variant="back" onClick={goBack}>← Back</ToolNavBtn>
                <ToolNavBtn onClick={goNext} disabled={!isStepOneReady}>Next: Campaign Details →</ToolNavBtn>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" variants={stepPanelVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 pb-28">
              <ToolSectionHeader
                step={2}
                title="Campaign Details"
                description={platform === "google_ads"
                  ? "Imported Google Ads fields are filled in automatically. Review them, then upload creatives."
                  : platform === "meta_ads"
                    ? "Imported Meta Ads fields are filled in automatically. Review them, then upload creatives."
                    : "Confirm campaign details, then upload creatives to continue."}
              />

              {platform ? (
                <ProgrammaticStep1Fields
                  platform={platform}
                  taskType={programmaticTaskType}
                  adGroupCount={programmaticAdGroupCount}
                  adGroups={programmaticAdGroups}
                  selectedAdGroupIds={selectedProgrammaticAdGroupIds}
                  applyAdGroupsToAll={applyProgrammaticAdGroupsToAll}
                  campaignName={campaignName}
                  campaignBrief={campaignBrief}
                  campaignProductFocus={campaignProductFocus}
                  googleCampaignType={googleCampaignType}
                  campaignVertical={campaignVertical}
                  landingUrl={landingUrl}
                  lookupCampaignId={lookupCampaignId}
                  campaignId={activeCampaignId}
                  campaignOwnerId={campaignOwnerId}
                  campaignAccessToken={campaignAccessToken}
                  advertiserId={advertiserId}
                  advertiserName={advertiserName}
                  loadedCampaign={loadedCampaignSnapshot}
                  creativeAdditionMode={creativeAdditionMode}
                  creativeAdditionFindError={creativeAdditionFindError}
                  verticals={VERTICALS}
                  adType={adType}
                  onAdTypeChange={setAdType}
                  objectiveOptions={(platformAdapter.getObjectives?.() || []).map((item) => ({
                    id: item.id,
                    label: item.title || item.label,
                  }))}
                  supportsCustomObjective={isProgrammatic}
                  onTaskTypeChange={handleProgrammaticTaskTypeChange}
                  onAdGroupCountChange={handleProgrammaticAdGroupCountChange}
                  onAdGroupNameChange={handleProgrammaticAdGroupNameChange}
                  onAdGroupObjectiveChange={handleProgrammaticAdGroupObjectiveChange}
                  onAdGroupCustomObjectiveChange={handleProgrammaticAdGroupCustomObjectiveChange}
                  onAddAdGroup={handleAddProgrammaticAdGroup}
                  onRemoveAdGroup={handleRemoveProgrammaticAdGroup}
                  onSelectedAdGroupIdsChange={handleSelectedProgrammaticAdGroupIdsChange}
                  onApplyAdGroupsToAllChange={handleApplyProgrammaticAdGroupsToAllChange}
                  onCampaignNameChange={setCampaignName}
                  onCampaignBriefChange={setCampaignBrief}
                  onCampaignProductFocusChange={setCampaignProductFocus}
                  onGoogleCampaignTypeChange={setGoogleCampaignType}
                  onLandingUrlChange={handleLandingUrlChange}
                  onVerticalChange={setCampaignVertical}
                  onLookupCampaignIdChange={setLookupCampaignId}
                  onFindCampaign={() => { void handleFindProgrammaticCampaign(); }}
                  onAdvertiserCampaignSelect={handleAdvertiserCampaignSelect}
                  onCreativeAdditionModeChange={handleCreativeAdditionModeChange}
                  campaignIntent={resolvedCampaignIntent}
                  effectiveCampaignGoal={effectiveCampaignGoal}
                />
              ) : (
                <ToolSurface>
                  <p className="text-sm text-studio-muted">Select a platform on Platform Setup first, then return here to fill campaign details.</p>
                </ToolSurface>
              )}

              {usesProgrammaticFolderSections && (programmaticAdGroups.length > 0 || creatives.length > 0) ? (
                <ProgrammaticFolderSections
                  folders={activeProgrammaticAdGroups}
                  creatives={step2FolderCreatives}
                  isLoading={isLoading || isHydratingCreatives}
                  editingId={editingId}
                  editingName={editingName}
                  targetSizeByCreative={targetSizeByCreative}
                  compressingCreativeIds={compressingCreativeIds}
                  fixingCreativeIds={fixingCreativeIds}
                  isBulkCompressing={isBulkCompressing}
                  onFolderSelect={handleProgrammaticFolderSelect}
                  onRemoveCreative={removeCreative}
                  onStartEdit={startEdit}
                  onEditingNameChange={setEditingName}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onDownloadCreative={downloadCreative}
                  onTargetSizeChange={handleTargetSizeChange}
                  onCompressCreative={(id, options) => { void compressCreative(id, options); }}
                  onEditCreative={setEditModalCreative}
                  onApplyFix={applyCreativeFix}
                  resolveObjectiveLabel={(objective) => getObjectiveTitle(objective, platform)}
                  allowVideo={(group) => adType === "video" || isVideoObjective(group.objective || campaignGoal, platform)}
                />
              ) : null}

              {!usesProgrammaticFolderSections && creatives.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <ToolStatCard value={creatives.length} label="Total" tone="accent" />
                    <ToolStatCard value={validCreatives.length} label="Ready" tone="success" />
                    <ToolStatCard value={validationSummary.warningCount} label="Warnings" tone="warning" />
                    <ToolStatCard value={validationSummary.criticalCount} label="Critical" tone="error" />
                  </div>
                  {validationResults.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <ToolStatCard value={validationSummary.totalIssues} label="Total Issues" />
                      <div className="studio-card rounded-xl p-4 text-center md:col-span-3">
                        <p className="studio-tabular text-2xl font-bold text-studio-accent">{validationSummary.inventoryImpactScore}/100</p>
                        <p className="mt-1 text-sm text-studio-muted">Inventory Impact Score</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isProgrammaticUrlUtmFlow && creatives.length > 0 ? (
                <ToolSurface className="space-y-4">
                  <div>
                    <h3 className="studio-heading text-xl font-bold text-studio-text">Loaded Creatives</h3>
                    <p className="mt-1 text-sm text-studio-muted">
                      Existing creatives remain available for alignment checks while you update URLs and UTM parameters.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {creatives.slice(0, 8).map((creative) => (
                      <div key={creative.id} className="space-y-2">
                        <CreativeCard creative={creative} disableLayoutAnimation />
                        <p className="truncate text-xs text-studio-muted">{creative.name}</p>
                      </div>
                    ))}
                  </div>
                  {creatives.length > 8 ? (
                    <p className="text-xs text-studio-tertiary">+{creatives.length - 8} more creative(s) loaded</p>
                  ) : null}
                </ToolSurface>
              ) : null}

              {isProgrammaticRenewalFlow && renewalReferenceSnapshot ? (
                <ToolSurface className="space-y-3">
                  <div>
                    <h3 className="studio-heading text-lg font-bold text-studio-text">Previous Campaign Reference</h3>
                    <p className="mt-1 text-sm text-studio-muted">
                      Loaded from {renewalReferenceSnapshot.campaignName} ({renewalReferenceSnapshot.id}). Edit creatives and settings above for the renewed campaign.
                    </p>
                  </div>
                  <div className="grid gap-3 text-xs text-studio-muted md:grid-cols-4">
                    <div className="rounded-xl border border-studio-border bg-black/20 p-3">
                      <p className="font-semibold text-studio-text">{renewalReferenceSnapshot.creatives?.length || 0}</p>
                      <p className="mt-1">Previous creatives</p>
                    </div>
                    <div className="rounded-xl border border-studio-border bg-black/20 p-3">
                      <p className="font-semibold text-studio-text">{renewalReferenceSnapshot.analysisResult?.length || 0}</p>
                      <p className="mt-1">Previous analysis results</p>
                    </div>
                    <div className="rounded-xl border border-studio-border bg-black/20 p-3">
                      <p className="truncate font-semibold text-studio-text">{renewalReferenceSnapshot.vertical || "—"}</p>
                      <p className="mt-1">Previous vertical</p>
                    </div>
                    <div className="rounded-xl border border-studio-border bg-black/20 p-3">
                      <p className="truncate font-semibold text-studio-text">{renewalReferenceSnapshot.campaignGoal || "—"}</p>
                      <p className="mt-1">Previous objective</p>
                    </div>
                  </div>
                </ToolSurface>
              ) : null}

              {isProgrammaticCreativeReplacementFlow && baselineCreatives.length > 0 ? (
                <ToolSurface className="space-y-4">
                  <div>
                    <h3 className="studio-heading text-xl font-bold text-studio-text">Previous Creatives</h3>
                    <p className="mt-1 text-sm text-studio-muted">
                      Baseline creatives from your saved campaign. Remove any baseline creative to exclude it from swap validation, analysis, and comparison.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {baselineCreatives.map((creative) => (
                      <div key={creative.id} className="space-y-2">
                        <CreativeCard creative={creative} onRemove={removeCreative} disableLayoutAnimation />
                        <p className="truncate text-xs text-studio-muted">{creative.name}</p>
                        <span className="inline-flex rounded-full border border-studio-border bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-studio-tertiary">
                          Baseline
                        </span>
                      </div>
                    ))}
                  </div>
                </ToolSurface>
              ) : null}

              {null}

              {(isLoading || isHydratingCreatives) && (
                <div className="py-4 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-studio-accent border-t-transparent" />
                  <p className="mt-2 text-xs text-studio-muted">
                    {isHydratingCreatives
                      ? "Restoring creatives…"
                      : uploadProgress
                        ? `Validating uploads… ${uploadProgress.completed} of ${uploadProgress.total}`
                        : "Validating uploads…"}
                  </p>
                </div>
              )}

              {creatives.length > 0 && (
                <ToolSurface>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-studio-text">Bulk Compression</p>
                      <p className="text-xs text-studio-muted">Reduce file weight for all creatives while keeping each banner&apos;s pixel dimensions unchanged.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToolInput
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={bulkTargetSizeKB}
                        onChange={(e) => handleBulkTargetSizeChange(e.target.value)}
                        placeholder="Target KB"
                        className="w-28 px-2 py-1.5 text-xs"
                      />
                      <span className="text-[10px] font-semibold text-studio-tertiary">KB</span>
                      <button
                        onClick={handleBulkCompressAll}
                        disabled={isBulkCompressing || compressingCreativeIds.length > 0}
                        className="studio-btn-primary studio-focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBulkCompressing
                          ? bulkCompressProgress.total > 0
                            ? `Compressing ${bulkCompressProgress.current}/${bulkCompressProgress.total}…`
                            : "Compressing All..."
                          : "Apply To All"}
                      </button>
                    </div>
                  </div>
                  {isBulkCompressing && bulkCompressProgress.total > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                        <div
                          className="h-full rounded-full bg-studio-accent transition-[width] duration-200"
                          style={{
                            width: `${Math.round((bulkCompressProgress.current / bulkCompressProgress.total) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-studio-tertiary">
                        Processing one creative at a time to keep the UI responsive.
                      </p>
                    </div>
                  )}
                </ToolSurface>
              )}

              {/* Unified Creative List */}
              {!usesProgrammaticFolderSections && groupedCreatives.length > 0 && (
                <div className="space-y-6">
                  {groupedCreatives.map((group) => (
                    <div key={group.id} className="space-y-3">
                      {programmaticUsesMultiFolder ? (
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-studio-accent">{group.label}</p>
                      ) : null}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {group.creatives.map((creative) => (
                      <div key={creative.id} className="flex flex-col gap-1">
                        <CreativeCard
                          creative={creative}
                          onEdit={!creative.valid ? (c) => setEditModalCreative(c) : undefined}
                          onRemove={removeCreative}
                          disableLayoutAnimation={isBulkCompressing || compressingCreativeIds.length > 0}
                        />
                        {editingId === creative.id ? (
                          <div className="flex gap-1 mt-1">
                            <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(creative.id); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 min-w-0 bg-white/10 border border-purple-500 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                            <button onClick={() => saveEdit(creative.id)} className="px-2 py-1 bg-sky-600 rounded-lg text-xs text-white font-semibold hover:bg-sky-700">✓</button>
                            <button onClick={() => setEditingId(null)} className="studio-btn-ghost rounded-lg px-2 py-1 text-xs font-semibold">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(creative.id, creative.name)} className="text-left flex items-center gap-1 mt-1 group/rn">
                            <span className="truncate text-xs text-[#c8c8d4] group-hover/rn:text-cyan-300">{creative.name}</span>
                            <span className="text-[10px] text-[#9a9aad] group-hover/rn:text-cyan-400">✏️</span>
                          </button>
                        )}
                        <button onClick={() => downloadCreative(creative)} className="studio-btn-ghost mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium">
                          <Download size={12} /> Download
                        </button>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={targetSizeByCreative[creative.id] ?? ""}
                            onChange={(e) => handleTargetSizeChange(creative.id, e.target.value)}
                            placeholder="Target KB"
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-500"
                          />
                          <span className="text-[10px] text-slate-500 font-semibold">KB</span>
                        </div>
                        <button
                          onClick={() => compressCreative(creative.id, {
                            enforceSizeCompliance: true,
                            targetSizeKB: targetSizeByCreative[creative.id],
                          })}
                          disabled={compressingCreativeIds.includes(creative.id) || String(creative.mimeType || "").toLowerCase() === "image/gif"}
                          className="flex items-center justify-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 transition bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg px-2 py-1.5 mt-1 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {compressingCreativeIds.includes(creative.id)
                            ? "Compressing..."
                            : String(creative.mimeType || "").toLowerCase() === "image/gif"
                              ? "GIF Unsupported"
                              : "Compress Size"}
                        </button>
                        {creative.validation?.issues?.length > 0 && (
                          <div className={`mt-2 rounded-lg border p-2 ${creative.valid ? "border-amber-500/25 bg-amber-500/10" : "border-red-500/25 bg-red-500/10"}`}>
                            <p className="text-[11px] font-semibold text-amber-300">
                              {creative.validation.status} • {creative.validation.issues.length} issue{creative.validation.issues.length > 1 ? "s" : ""}
                            </p>
                            <div className="mt-2 space-y-1.5">
                              {creative.validation.issues.slice(0, 3).map((issue, idx) => (
                                <ValidationIssueRow
                                  key={`${creative.id}-issue-${idx}`}
                                  issue={issue}
                                  creativeId={creative.id}
                                  onApplyFix={applyCreativeFix}
                                  isFixing={
                                    fixingCreativeIds.includes(creative.id)
                                    || compressingCreativeIds.includes(creative.id)
                                  }
                                  variant={creative.valid ? "warning" : "critical"}
                                />
                              ))}
                              {creative.validation.issues.length > 3 && (
                                <p className="text-[10px] text-amber-200/80">+{creative.validation.issues.length - 3} more issue(s)</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                    </div>
                  ))}
                </div>
              )}


              {validationSummary.warningCount > 0 && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="text-amber-300 mt-0.5" size={18} />
                  <p className="text-sm text-amber-100">
                    {validationSummary.warningCount} creative{validationSummary.warningCount > 1 ? "s have" : " has"} non-blocking warning{validationSummary.warningCount > 1 ? "s" : ""}. You can continue to analysis.
                  </p>
                </div>
              )}

              {false ? (
              <ToolSurface className="space-y-4">
                <div>
                  <h3 className="studio-heading text-lg font-bold text-studio-text">URL & Campaign Readiness</h3>
                  <p className="mt-1 text-sm text-studio-muted">
                    Enter your landing page URL to validate accessibility and campaign alignment.
                    Readiness checks run alongside URL validation.
                    {platform === "meta_ads" ? " URL is optional for Meta." : " URL is required for Google Ads and Programmatic."}
                  </p>
                </div>
                {recommendedDetailFields.length > 0 ? (
                  <MissingSetupFieldsPanel
                    title="Recommended campaign details"
                    description="Add any missing details below to improve readiness scoring and validation quality."
                    fields={recommendedDetailFields}
                    values={{
                      campaignName,
                      campaignBrief,
                      landingUrl: displayValidationUrl,
                    }}
                    onCampaignNameChange={setCampaignName}
                    onCampaignBriefChange={setCampaignBrief}
                    onLandingUrlChange={handleLandingUrlChange}
                  />
                ) : null}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">
                      Landing Page URL {platform !== "meta_ads" ? "(required)" : "(optional)"}
                    </label>
                    <ToolInput
                      type="url"
                      value={displayValidationUrl}
                      onChange={(e) => handleLandingUrlChange(e.target.value)}
                      placeholder="https://www.example.com/landing"
                    />
                    <p className="mt-2 text-xs text-studio-tertiary">
                      UTM parameters are detected and removed automatically. Only the clean URL is validated.
                      {displayValidationUrl.trim() && creatives.length > 0 && platform && effectiveCampaignGoal
                        ? " Validation runs automatically when you enter this step or change the URL."
                        : null}
                    </p>
                  </div>
                </div>
                {urlValidationRunning || readinessLoading ? (
                  <div className="rounded-xl border border-studio-accent/25 bg-studio-accent/10 px-4 py-3">
                    <p className="text-sm font-semibold text-studio-text">
                      {readinessProgress || "Checking URL against your campaign setup…"}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-studio-accent" />
                    </div>
                  </div>
                ) : null}
                {readinessError && !readinessReport ? (
                  <p className="text-sm text-studio-error">{readinessError}</p>
                ) : null}
                {activeUrlValidation?.submitted_url
                  && stripUtmFromUrl(activeUrlValidation.submitted_url) === stripUtmFromUrl(landingUrl.trim())
                  && !urlValidationRunning ? (
                  <UrlAlignmentSummaryCard urlValidation={activeUrlValidation} />
                ) : null}
                {readinessReport ? (
                  <div className="validation-report-dark studio-card overflow-hidden rounded-2xl border-studio-border bg-studio-surface-elevated">
                    <ValidationReport
                      report={readinessReport}
                      onCopy={() => addToast("Readiness report copied to clipboard.", "success")}
                    />
                  </div>
                ) : activeUrlValidation?.submitted_url
                  && stripUtmFromUrl(activeUrlValidation.submitted_url) === stripUtmFromUrl(landingUrl.trim())
                  && !urlValidationRunning
                  && !readinessLoading ? (
                  <p className="text-xs text-studio-tertiary">
                    Campaign readiness will appear here once validation finishes.
                  </p>
                ) : null}
              </ToolSurface>
              ) : null}

              {needsReviewCreatives.length > 0 ? (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-900">
                    {needsReviewCreatives.length} creative{needsReviewCreatives.length > 1 ? "s need" : " needs"} review (non-exact size match)
                  </p>
                  <p className="text-sm text-amber-950/90">
                    These files are close to supported sizes but not exact. You may continue after acknowledging the warning.
                  </p>
                  <label className="flex items-start gap-2 text-sm text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sizeReviewAcknowledged}
                      onChange={(e) => setSizeReviewAcknowledged(e.target.checked)}
                      className="mt-1 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>I reviewed the size warnings and want to continue to analysis.</span>
                  </label>
                </div>
              ) : null}
              <div className="flex gap-4 pt-4">
                <ToolNavBtn variant="back" onClick={goBack}>← Back</ToolNavBtn>
                <ToolNavBtn onClick={goNext} disabled={!canAdvanceToAnalysis}>Next: Campaign Intelligence →</ToolNavBtn>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AI ANALYSIS */}
          {step === 3 && (
            <motion.div key="step-3" variants={stepPanelVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
              <ToolSectionHeader
                step={3}
                title={isProgrammaticUrlUtmFlow ? "URL Validation" : "Campaign Intelligence"}
                description={isProgrammaticUrlUtmFlow
                  ? "Review URL accessibility and campaign alignment against your setup."
                  : `Analyze your creatives against ${PLATFORMS.find(p => p.id === platform)?.title} standards.`}
              />
              <p className="-mt-4 text-sm text-studio-muted">
                Selected goal: <span className="font-semibold capitalize text-studio-text">{campaignGoal}</span> · Selected vertical: <span className="font-semibold text-studio-text">{VERTICAL_TITLE_MAP[campaignVertical] || campaignVertical}</span>
                {campaignBrief?.trim() ? <> · Brief provided</> : null}
              </p>

              {isProgrammaticUrlUtmFlow ? (
                <>
                  {(urlValidationRunning || readinessLoading) && !urlUtmValidationReport ? (
                    <div className="space-y-4 py-10">
                      <p className="text-sm text-studio-muted">Validating landing page URL…</p>
                      <div className="studio-card animate-pulse rounded-2xl p-4">
                        <div className="mb-4 h-5 w-56 rounded bg-white/10" />
                        <div className="mb-3 h-24 rounded-xl bg-white/10" />
                        <div className="h-32 rounded-xl bg-white/10" />
                      </div>
                    </div>
                  ) : null}

                  {urlUtmValidationReport ? (
                    <UrlUtmValidationReportPanel report={urlUtmValidationReport} />
                  ) : null}

                  {baselineAnalysisResult && Array.isArray(baselineAnalysisResult) && baselineAnalysisResult.length > 0 ? (
                    <ToolSurface className="space-y-3">
                      <p className="text-sm font-semibold text-studio-text">Previous Analysis Reference</p>
                      <p className="text-sm text-studio-muted">
                        {baselineAnalysisResult.length} prior analysis result{baselineAnalysisResult.length === 1 ? "" : "s"} loaded from the saved campaign for comparison context.
                      </p>
                    </ToolSurface>
                  ) : null}
                </>
              ) : (
                <>
              {!analysisResult && !analysisLoading && !assistantChecking && (
                <ToolSurface className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-studio-accent/30 bg-studio-accent/10">
                    <span className="text-4xl">🧠</span>
                  </div>
                  <h3 className="studio-heading mb-3 text-xl font-bold text-studio-text">Ready to Analyze</h3>
                  <p className="mb-8 max-w-md text-sm text-studio-muted">
                    Run analysis for <strong className="text-studio-text">{creativesForAnalysis.length} valid creative(s)</strong> when you are ready.
                  </p>
                  <ToolNavBtn onClick={assessAndRunAnalysis} className="max-w-xs shadow-studio-glow">Start Analysis</ToolNavBtn>
                </ToolSurface>
              )}

              {assistantChecking && !analysisLoading && (
                <ToolSurface className="flex flex-col items-center justify-center p-10 text-center">
                  <p className="text-sm font-semibold text-studio-text">Checking campaign context…</p>
                  <p className="mt-2 max-w-md text-sm text-studio-muted">
                    The assistant is reviewing your brief and settings to decide whether any clarifications are needed.
                  </p>
                </ToolSurface>
              )}

              {analysisLoading && (
                <div className="space-y-4 py-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-studio-muted">
                        Analyzing {analysisProgress.total || creativesForAnalysis.length} creative{(analysisProgress.total || creativesForAnalysis.length) !== 1 ? "s" : ""} in parallel…
                      </p>
                      {isCreativeAdditionAdditionFlow && campaignAccessToken && activeCampaignId ? (
                        <p className="mt-1 text-xs text-studio-tertiary">
                          Stored brains are reused automatically when creatives have not changed.
                        </p>
                      ) : null}
                    </div>
                    {analysisProgress.total > 0 ? (
                      <p className="text-sm font-semibold tabular-nums text-studio-text">
                        {analysisProgress.completed}/{analysisProgress.total}
                      </p>
                    ) : null}
                  </div>
                  {analysisProgress.total > 0 ? (
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-studio-accent transition-all duration-300"
                        style={{ width: `${Math.round((analysisProgress.completed / analysisProgress.total) * 100)}%` }}
                      />
                    </div>
                  ) : null}
                  {analysisProgress.label ? (
                    <p className="text-xs text-studio-tertiary">
                      Latest: {analysisProgress.label}
                    </p>
                  ) : null}
                  <div className="studio-card animate-pulse rounded-2xl p-4">
                    <div className="mb-4 h-5 w-40 rounded bg-white/10" />
                    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="h-20 rounded-xl bg-white/10" />
                      <div className="h-20 rounded-xl bg-white/10" />
                      <div className="h-20 rounded-xl bg-white/10" />
                      <div className="h-20 rounded-xl bg-white/10" />
                    </div>
                    <div className="mb-3 h-32 rounded-xl bg-white/10" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="h-28 rounded-xl bg-white/10" />
                      <div className="h-28 rounded-xl bg-white/10" />
                      <div className="h-28 rounded-xl bg-white/10" />
                    </div>
                  </div>
                </div>
              )}

              {analysisResult && !analysisLoading && (
                <div className="studio-shell rounded-3xl p-4 shadow-studio md:p-6">
                  <AnalysisPanel
                    analysisResult={analysisResult}
                    campaignGoal={effectiveCampaignGoal || campaignGoal}
                    campaignVertical={campaignVertical}
                    platform={platform}
                    viewerName={viewerName}
                    creatives={creativesForAnalysis}
                    urlValidation={activeUrlValidation}
                    campaignBrief={campaignBrief}
                    campaignProductFocus={campaignProductFocus}
                    campaignIntent={resolvedCampaignIntent}
                    onDownloadReport={handleDownloadReport}
                    downloadLoading={isDownloadingReport}
                    programmaticTaskType={programmaticTaskType}
                    replacementComparisonReport={replacementComparisonReport}
                    renewalComparisonReport={renewalComparisonReport}
                    initialAnalysisTab={reportDeepLink?.analysisTab}
                    initialSelectedCreativeId={reportDeepLink?.selectedCreativeId}
                  />
                </div>
              )}
                </>
              )}

              <div className="flex gap-4 pt-6">
                <ToolNavBtn variant="back" onClick={goBack}>← Back</ToolNavBtn>
                <a
                  href="/dashboard"
                  className="studio-btn-ghost studio-focus-ring inline-flex items-center justify-center rounded-2xl border border-studio-border px-5 py-3 text-sm font-semibold text-studio-text transition hover:border-studio-accent/60"
                >
                  View Analysis in Dashboard
                </a>
                {showPreviewStudio ? (
                  <ToolNavBtn onClick={goNext}>Next: Preview Studio →</ToolNavBtn>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* STEP 4: PREVIEW STUDIO (display + video placement templates) */}
          {step === 4 && showPreviewStudio && (
            <motion.div key="step-4" variants={stepPanelVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <ToolSectionHeader
                  step={4}
                  title="Preview Studio"
                  description={platformAdapter.previewStudioDescription}
                />
                <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/dashboard"
                  className="studio-btn-ghost studio-focus-ring inline-flex items-center justify-center rounded-2xl border border-studio-border px-5 py-3 text-sm font-semibold text-studio-text transition hover:border-studio-accent/60"
                >
                  View Analysis in Dashboard
                </a>
                <ToolNavBtn variant="secondary" onClick={handleStartNewAnalysis} className="flex max-w-none flex-none items-center gap-2 px-6">
                  <RotateCcw size={18} /> Start New Analysis
                </ToolNavBtn>
                <ToolNavBtn variant="success" onClick={handleExportPptx} disabled={isExporting} className="flex max-w-none flex-none items-center gap-2 px-8">
                  <Download size={20} /> {isExporting
                    ? (isVideoPreviewStudio ? "Recording..." : "Exporting...")
                    : (isVideoPreviewStudio ? "Download Preview Video" : "Download Preview Report")}
                </ToolNavBtn>
              </div>
              </div>

              {(validCreatives.length > 0) && (
                <div className="studio-shell rounded-3xl p-6 md:p-8 shadow-studio">
                  <PreviewStudio
                  platform={platform}
                  creatives={previewEngineCreatives}
                  sourceCreatives={validCreatives.map((c) => ({
                    id: c.id,
                    name: c.name,
                    url: c.url,
                    fullUrl: c.fullUrl,
                    size: c.size || c.validation?.size || "1200x628",
                    mediaType: c.mediaType,
                    mimeType: c.mimeType,
                    videoUrl: c.mediaType === "video" ? c.fullUrl : undefined,
                    posterUrl: c.mediaType === "video" ? c.url : undefined,
                  }))}
                  vertical={campaignVertical || "general"}
                  goal={resolveApiGoal(campaignGoal, platform) || "awareness"}
                  brandName={previewTemplateContext.brandName}
                  targetAudience={previewTemplateContext.targetAudience}
                  tone={previewTemplateContext.tone}
                  keyMessage={previewTemplateContext.keyMessage}
                  imageUrls={previewTemplateContext.imageUrls}
                  onCopyCreative={handleCopyPreviewCreative}
                  campaignBrief={campaignBrief}
                  campaignIntent={resolvedCampaignIntent}
                  campaignIntentFingerprint={resolvedCampaignIntentFingerprint}
                  advertiserName={advertiserName}
                  campaignName={campaignName}
                  campaignProductFocus={campaignProductFocus}
                  advertiserId={advertiserId}
                  campaignId={activeCampaignId || loadedCampaignSnapshot?.id || ""}
                  creativeFingerprint={creativeFingerprint}
                  previewStudioCache={previewStudioCache}
                  onPreviewCacheUpdate={handlePreviewStudioCacheUpdate}
                  onExportContextChange={handlePreviewExportContextChange}
                  initialTemplateId={reportDeepLink?.templateId}
                  initialPreviewDevice={reportDeepLink?.device}
                  initialPreviewCreativeId={reportDeepLink?.previewCreativeId}
                  isVideoMode={isVideoPreviewStudio}
                />
                </div>
              )}

              {validCreatives.length === 0 && (
                <ToolSurface className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="mb-4 text-4xl">🌐</span>
                  <p className="font-semibold text-studio-text">No valid creatives to preview</p>
                  <p className="mt-1 text-sm text-studio-muted">Upload or import a creative in step 2 first.</p>
                </ToolSurface>
              )}

              <div className="flex gap-4 pt-4 flex-wrap">
                <ToolNavBtn variant="back" onClick={goBack}>← Back</ToolNavBtn>
                <ToolNavBtn variant="secondary" onClick={handleStartNewAnalysis} className="flex items-center gap-2">
                  <RotateCcw size={16} /> Start New Analysis
                </ToolNavBtn>
                <ToolNavBtn variant="success" onClick={handleExportPptx} disabled={isExporting} className="flex justify-center items-center gap-2">
                  <Download size={20} /> {isExporting
                    ? (isVideoPreviewStudio ? "Recording..." : "Generating...")
                    : (isVideoPreviewStudio ? "Download Preview Video" : "Download Preview Report")}
                </ToolNavBtn>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {editModalCreative && (
        <EditCreativeModal
          creative={editModalCreative}
          platform={platform}
          campaignType={platform === "google_ads" ? googleCampaignType : ""}
          onApply={handleCreativeUpdate}
          onClose={() => setEditModalCreative(null)}
        />
      )}

      <CampaignSupportChatWidget
        step={step}
        platform={platform}
        campaignGoal={campaignGoal}
        campaignVertical={campaignVertical}
        campaignName={campaignName}
        advertiserName={advertiserName}
        landingUrl={landingUrl}
        missingSetupFields={missingSetupFields.map((field) => field.label)}
      />

      <CampaignAssistantModal
        open={assistantModalOpen}
        reasoning={assistantReasoning}
        questions={assistantQuestions}
        submitting={assistantSubmitting}
        onClose={() => {
          if (assistantSubmitting) return;
          setAssistantModalOpen(false);
        }}
        onSubmit={handleAssistantSubmit}
      />

      <WysiwygExportHost ref={wysiwygExportRef} />

    </div>
  );
}
