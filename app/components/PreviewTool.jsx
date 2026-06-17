"use client";

import { useState, useRef, useEffect, useCallback, useMemo, startTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const PreviewStudio = dynamic(() => import("./PreviewStudio"), { ssr: false, loading: () => <div className="py-20 text-center text-gray-500 text-sm">Loading preview studio…</div> });
import EditCreativeModal from "./EditCreativeModal";
import CreativeCard from "./CreativeCard";
import AnalysisPanel from "./AnalysisPanel";
import { supabase } from "../lib/supabase";
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
import { readImageDimensionsFromBlob } from "../lib/imageDimensions";
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
  hydrateCreativesList,
  revokeCreativeObjectUrls,
  storeCompressedCreativeBlobs,
  storeUploadedCreativeFile,
  stripCreativeForPersistence,
} from "../lib/creativeAssetStore";
import {
  readStoredAnalysisResult,
  readStoredWorkflow,
  writeStoredAnalysisResult,
  writeStoredWorkflow,
} from "../lib/workflowStorage";
import {
  trackUserActivity,
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
  readStoredUrlValidation,
  runUrlValidationRequest,
  writeStoredUrlValidation,
} from "../lib/urlValidationClient";

// Platform size matrix — sourced from creativeSizeRegistry via creativeValidation
const PLATFORM_SIZES = PLATFORM_SUPPORTED_SIZE_GROUPS;

const PLATFORM_INTELLIGENCE_LABEL = {
  google_ads: "Inventory Intelligence",
  meta_ads: "Placement Intelligence",
  programmatic: "Cross-Inventory Intelligence",
};

const GROUP_LABELS = PLATFORM_SIZE_GROUP_LABELS;

const ANALYSIS_SESSION_STORAGE_KEY = "adigator_analysis_session_id";

function clampStep(value) {
  const numeric = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(numeric, 1), TOTAL_STEPS);
}
import {
  UploadCloud, CheckCircle2, XCircle, AlertCircle,
  Download, LayoutGrid, Square, CheckSquare, RotateCcw,
  Newspaper, ShoppingCart, Coffee, Activity, Laptop, Briefcase, GraduationCap, Gamepad2, Film,
  Monitor, Smartphone,
} from "lucide-react";

// ── Toast Component ──────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium text-white ${t.type === "success" ? "bg-green-900/80 border-green-500/40" :
                t.type === "error" ? "bg-red-900/80 border-red-500/40" : "bg-slate-900/80 border-white/20"
              }`}
          >
            <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "⏳"}</span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function NavBtn({ onClick, children, variant = "primary", disabled = false, className = "" }) {
  const base = "preview-tool-interactive flex-1 py-3 px-6 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed border shadow-md";
  const bg = variant === "primary"
    ? "bg-sky-500 border-sky-600 text-white hover:bg-sky-600 hover:shadow-lg"
    : variant === "back"
      ? "bg-white border-sky-500 text-sky-700 hover:bg-sky-50 hover:border-sky-600 hover:shadow-md"
      : variant === "secondary"
        ? "bg-white border-gray-300 text-black hover:bg-gray-50 hover:shadow-md"
        : "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 hover:shadow-lg";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${bg} ${className}`.trim()}
    >
      {children}
    </motion.button>
  );
}

function SelectionCard({ selected, onClick, children, activeClasses }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      animate={selected ? { boxShadow: ["0 0 0 rgba(14,165,233,0)", "0 0 24px rgba(14,165,233,0.4)", "0 0 0 rgba(14,165,233,0)"] } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      transition={selected ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      onClick={onClick}
      className={`preview-tool-interactive cursor-pointer rounded-2xl p-8 border-2 transition-all duration-200 shadow-sm hover:shadow-md ${selected ? "border-sky-500 bg-sky-50 shadow-lg" : "border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50"
        }`}
    >
      {children}
    </motion.div>
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

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Setup", "Upload", "Analysis", "Preview Studio"];

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

const GOALS = [
  {
    id: "awareness", emoji: "📣", title: "Awareness", subtitle: "Introduce Brand",
    color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50",
    desc: "Maximize reach, visual clarity, and brand recognition.",
  },
  {
    id: "consideration", emoji: "🤔", title: "Consideration", subtitle: "Evaluate Product",
    color: "from-purple-600/30 to-purple-800/20", border: "border-purple-500/50",
    desc: "Balance information, value proposition, and moderate CTA.",
  },
  {
    id: "conversion", emoji: "⚡", title: "Conversion", subtitle: "Drive Action",
    color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50",
    desc: "Strong CTA, high contrast, urgent direct messaging.",
  },
  {
    id: "traffic", emoji: "🧭", title: "Traffic", subtitle: "Drive Visits",
    color: "from-sky-600/30 to-sky-800/20", border: "border-sky-500/50",
    desc: "Prioritize click-through clarity with low-friction value communication.",
  },
  {
    id: "app_installs", emoji: "📲", title: "App Installs", subtitle: "Acquire Users",
    color: "from-indigo-600/30 to-indigo-800/20", border: "border-indigo-500/50",
    desc: "Highlight app utility fast, reduce cognitive load, and drive install intent.",
  },
  {
    id: "lead_generation", emoji: "🧾", title: "Leads", subtitle: "Capture Leads",
    color: "from-emerald-600/30 to-emerald-800/20", border: "border-emerald-500/50",
    desc: "Build trust with offer clarity, authority signals, and qualification framing.",
  },
  {
    id: "engagement", emoji: "💬", title: "Engagement", subtitle: "Spark Interaction",
    color: "from-teal-600/30 to-teal-800/20", border: "border-teal-500/50",
    desc: "Create conversation-worthy hooks to increase social interactions.",
  },
  {
    id: "video_views", emoji: "🎬", title: "Video Views", subtitle: "Maximize Watch Time",
    color: "from-rose-600/30 to-rose-800/20", border: "border-rose-500/50",
    desc: "Optimize first-frame curiosity and narrative pull for continued viewing.",
  },
  {
    id: "retargeting", emoji: "🔁", title: "Retargeting", subtitle: "Recover Intent",
    color: "from-amber-600/30 to-amber-800/20", border: "border-amber-500/50",
    desc: "Reinforce relevance and urgency for users already familiar with your offer.",
  },
];

const PLATFORM_GOAL_IDS = {
  google_ads: ["awareness", "traffic", "conversion", "lead_generation", "engagement", "app_installs", "retargeting"],
  meta_ads: ["awareness", "traffic", "conversion", "lead_generation", "engagement", "app_installs", "retargeting"],
  programmatic: ["awareness", "consideration", "conversion"],
};

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

function getGoalTitle(goalId, platformId) {
  if (goalId === "conversion" && platformId !== "programmatic") return "Conversions";
  const found = GOALS.find((goal) => goal.id === goalId);
  return found?.title || goalId;
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


const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const VALID_VERTICALS = new Set([
  "automotive", "banking", "ecommerce", "education", "entertainment",
  "fashion", "finance", "fitness", "food", "gaming", "healthcare", "hotels", "luxury",
  "news_media", "real_estate", "sports", "technology", "travel",
]);

// ── OpenAI-Only Analyzer ─────────────────────────────────────────────────────

async function analyzeAllCreatives(creatives, goal, platform, vertical, audienceStage) {
  const results = [];
  const verticalForApi = VALID_VERTICALS.has(vertical) ? vertical : "technology";

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

  for (const creative of creatives) {
    try {
      const imageBlob = await getCreativeFullBlob(creative);
      if (!imageBlob) {
        throw new Error(`Could not load image bytes for ${creative.name || creative.id}. Re-upload the creative and try again.`);
      }

      const formData = new FormData();
      formData.append("image", imageBlob, `${creative.name || "creative"}.jpg`);
      formData.append("goal", goal);
      formData.append("vertical", verticalForApi);
      formData.append("platform", platform || "programmatic");
      formData.append("audience_stage", audienceStage || "cold");

      const analysisRes = await fetch("/api/analyze-creative", {
        method: "POST",
        body: formData,
      });

      if (!analysisRes.ok) {
        let apiError = analysisRes.statusText;
        try {
          const body = await analysisRes.json();
          apiError = body?.error || apiError;
        } catch { /* noop */ }
        // Pass minimal error marker with expected schema fields
        results.push({ 
          creative, 
          data: { 
            error: apiError,
            main_strategic_problem: undefined,
            attention_analysis: undefined,
            strategic_recommendations: undefined,
            strategic_alignment_score: undefined,
            adigator_analysis: undefined,
          } 
        });
        continue;
      }

      const aiJson = await analysisRes.json();
      const payload = extractStrategicPayload(aiJson);
      results.push({ creative, data: payload });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Analysis failed";
      console.error(`Analysis failed for ${creative.url}:`, err);
      // Pass minimal error marker with expected schema fields
      results.push({ 
        creative, 
        data: { 
          error: errMessage,
          main_strategic_problem: undefined,
          attention_analysis: undefined,
          strategic_recommendations: undefined,
          strategic_alignment_score: undefined,
          adigator_analysis: undefined,
        } 
      });
    }
  }
  return results;
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
  const step = clampStep(urlStepParam || "1");
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const [platform, setPlatform] = useState(null);
  const [campaignGoal, setCampaignGoal] = useState(null);
  const [campaignVertical, setCampaignVertical] = useState(null);
  const [campaignAudienceStage, setCampaignAudienceStage] = useState(null);
  const [campaignName, setCampaignName] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [urlValidation, setUrlValidation] = useState(() => {
    if (typeof window === "undefined") return null;
    return readStoredUrlValidation();
  });
  const [urlValidationRunning, setUrlValidationRunning] = useState(false);
  const [analysisSessionId, setAnalysisSessionId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY);
  });
  const mountRef = useRef(false);
  const configHydratedRef = useRef(false);

  const [creatives, setCreatives] = useState([]);
  const [isHydratingCreatives, setIsHydratingCreatives] = useState(true);
  const [drag, setDrag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const [analysisResult, setAnalysisResult] = useState(() => {
    if (typeof window === "undefined") return null;
    return readStoredAnalysisResult();
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [viewerName, setViewerName] = useState("");
  const {
    report: readinessReport,
    loading: readinessLoading,
    error: readinessError,
    progressLabel: readinessProgress,
    runValidation: runReadinessValidation,
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

  useEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
    };
  }, []);

  /** Restore campaign config from localStorage only when resuming past Step 1. */
  useEffect(() => {
    if (step <= 1 || configHydratedRef.current || typeof window === "undefined") return;
    configHydratedRef.current = true;

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

    const storedLandingUrl = localStorage.getItem("adigator_landing_url");
    if (!landingUrl && storedLandingUrl) {
      setLandingUrl(storedLandingUrl);
    }

    if (!urlValidation) {
      const storedUrlValidation = readStoredUrlValidation();
      if (storedUrlValidation) {
        setUrlValidation(storedUrlValidation);
      }
    }
  }, [
    step,
    platform,
    campaignGoal,
    campaignVertical,
    campaignAudienceStage,
    campaignName,
    landingUrl,
    urlValidation,
  ]);

  useEffect(() => {
    creativesRef.current = creatives;
  }, [creatives]);

  const runUrlValidation = useCallback(async () => {
    const trimmedUrl = landingUrl.trim();
    if (!trimmedUrl) {
      const skipped = {
        status: "skipped",
        submitted_url: "",
        final_url: null,
        summary: "No landing page URL was provided.",
        reasons: [],
        suggestions: ["Add a landing page URL in Step 2 to validate destination alignment."],
        confidence: 0,
        source: "unavailable",
        checked_at: new Date().toISOString(),
      };
      setUrlValidation(skipped);
      writeStoredUrlValidation(skipped);
      return skipped;
    }

    setUrlValidationRunning(true);
    try {
      const validForUrlCheck = creatives.filter((c) => c?.valid && (c.url || c.image || c.title));
      const result = await runUrlValidationRequest({
        url: trimmedUrl,
        platform,
        objective: campaignGoal,
        vertical: campaignVertical,
        campaignName: campaignName.trim() || "Campaign",
        creatives: validForUrlCheck.length ? validForUrlCheck : creatives,
        getCreativeBlob: getCreativeFullBlob,
      });
      setUrlValidation(result);
      writeStoredUrlValidation(result);
      return result;
    } catch (error) {
      console.error("URL validation failed", error);
      addToast(error?.message || "URL validation failed.", "error");
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
    creatives,
    addToast,
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
        || creative.validation?.size !== creative.size,
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
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    if (urlStepParam) return;
    router.replace(`${pathname}?step=1`, { scroll: false });
  }, [urlStepParam, pathname, router]);

  useEffect(() => {
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

    if (landingUrl) localStorage.setItem("adigator_landing_url", landingUrl);
    else localStorage.removeItem("adigator_landing_url");
  }, [platform, campaignGoal, campaignVertical, campaignAudienceStage, campaignName, landingUrl]);

  useEffect(() => {
    if (workflowPersistTimerRef.current) {
      clearTimeout(workflowPersistTimerRef.current);
    }

    const delayMs = isBulkCompressing || compressingCreativeIds.length > 0 ? 1200 : 350;

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
  ]);

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

  const isConfigComplete = Boolean(platform && campaignGoal && campaignVertical);

  const scrollToSection = useCallback((ref) => {
    if (!ref?.current) return;
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const createAnalysisSession = useCallback(async (initialValues = {}) => {
    const token = await getAccessToken();
    if (!token) return null;

    let response;
    try {
      response = await fetch("/api/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(initialValues),
      });
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
    const sessionId = payload?.sessionId;
    if (!sessionId) {
      console.warn("Session creation succeeded but no sessionId was returned.");
      return null;
    }

    setAnalysisSessionId(sessionId);
    return sessionId;
  }, [getAccessToken]);

  const updateAnalysisSession = useCallback(async (updates) => {
    if (!analysisSessionId) return false;

    try {
      const token = await getAccessToken();
      if (!token) return false;

      const response = await fetch("/api/session/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: analysisSessionId, ...updates }),
      });

      if (!response.ok) {
        let message = "Unable to update analysis session.";
        try {
          const payload = await response.json();
          if (payload?.error) message = payload.error;
        } catch {
          // Ignore parse errors and keep fallback message.
        }
        console.error("Session update failed:", message);
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
  }, [analysisSessionId, getAccessToken]);

  const getUser = useCallback(async () => {
    if (userRef.current) return userRef.current;
    const { data: { session } } = await supabase.auth.getSession();
    userRef.current = session?.user || null;
    return userRef.current;
  }, []);

  const ensureAnalysisSession = useCallback(async () => {
    if (analysisSessionId) return analysisSessionId;

    const user = await getUser();
    if (!user) return null;

    return createAnalysisSession({
      campaign_goal: campaignGoal || null,
      vertical: campaignVertical || null,
      platform: platform || null,
      status: "draft",
    });
  }, [analysisSessionId, getUser, createAnalysisSession, campaignGoal, campaignVertical, platform]);

  const handlePlatformSelect = useCallback((id) => {
    const allowedGoalIds = PLATFORM_GOAL_IDS[id] || PLATFORM_GOAL_IDS.programmatic;
    const nextGoal = allowedGoalIds.includes(campaignGoal) ? campaignGoal : null;
    const platformChanged = id !== platform;

    setPlatform(id);
    setCampaignGoal(nextGoal);
    if (platformChanged) {
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

  const handleGoalSelect = useCallback((id) => {
    if (!platform) return;
    const goalIds = PLATFORM_GOAL_IDS[platform] || PLATFORM_GOAL_IDS.programmatic;
    if (!goalIds.includes(id)) return;
    setCampaignGoal(id);

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

  const selectedPlatformConfig = PLATFORMS.find((p) => p.id === platform);
  const availableGoalIds = PLATFORM_GOAL_IDS[platform] || PLATFORM_GOAL_IDS.programmatic;
  const availableGoals = GOALS.filter((goal) => availableGoalIds.includes(goal.id));
  const allowedSizes = useMemo(() => (
    platform ? [...new Set(Object.values(PLATFORM_SIZES[platform] || {}).flat())] : []
  ), [platform]);

  const validCreatives = useMemo(() => creatives.filter((c) => c && c.valid && (c.url || c.text || c.image || c.title)), [creatives]);
  const invalidCreatives = useMemo(() => creatives.filter((c) => c && (!c.valid || !(c.url || c.text || c.image || c.title))), [creatives]);
  const uploadedCreatives = validCreatives;
  const primaryCreativeUrl = getPersistableCreativeUrl(uploadedCreatives[0]);
  const canAdvanceToAnalysis = uploadedCreatives.length > 0;

  useEffect(() => {
    lastSessionPayloadRef.current = null;
  }, [analysisSessionId]);

  useEffect(() => {
    if (!mountRef.current || !analysisSessionId) return;

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
    if (step === 1 && !isConfigComplete) return;
    if (step === 2 && !canAdvanceToAnalysis) return;

    if (step === 2 && landingUrl.trim()) {
      const needsRefresh = !urlValidation
        || urlValidation.submitted_url !== landingUrl.trim()
        || urlValidation.status === "pending";
      if (needsRefresh && !urlValidationRunning) {
        await runUrlValidation();
      }
    }

    const nextStep = Math.min(step + 1, TOTAL_STEPS);
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
    router.push(`${pathname}?step=${nextStep}`, { scroll: true });
  }, [
    step,
    isConfigComplete,
    canAdvanceToAnalysis,
    pathname,
    router,
    platform,
    campaignGoal,
    campaignVertical,
    campaignAudienceStage,
    landingUrl,
    urlValidation,
    urlValidationRunning,
    runUrlValidation,
  ]);

  const goBack = useCallback(() => {
    if (step === 1) {
      void trackUserActivity("navigation", {
        action_label: "Exit preview tool",
        platform,
        campaign_goal: campaignGoal,
        metadata: { direction: "exit", from_step: step },
      }, { dedupeKey: "nav-exit-step-1" });
      router.push("/");
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
    router.push(`${pathname}?step=${prevStep}`, { scroll: true });
  }, [step, router, pathname, platform, campaignGoal, campaignVertical, campaignAudienceStage]);

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
    setLandingUrl("");
    setUrlValidation(null);
    setUrlValidationRunning(false);
    clearStoredUrlValidation();
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

    sessionInitRef.current = false;
    lastSessionPayloadRef.current = null;

    localStorage.removeItem("adigator_platform");
    localStorage.removeItem("adigator_goal");
    localStorage.removeItem("adigator_vertical");
    localStorage.removeItem("adigator_audience_stage");
    localStorage.removeItem("adigator_campaign_name");
    localStorage.removeItem("adigator_landing_url");
    clearStoredUrlValidation();
    localStorage.removeItem(ANALYSIS_SESSION_STORAGE_KEY);

    configHydratedRef.current = false;

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
    router.push(`${pathname}?step=1`, { scroll: true });
  }, [addToast, pathname, router, step, platform, campaignGoal, campaignVertical]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (step > 1 && !isConfigComplete) {
      router.replace(`${pathname}?step=1`, { scroll: false });
    }
  }, [step, isConfigComplete, pathname, router]);

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

  // Guard against entering analysis without creatives
  useEffect(() => {
    if (!mountRef.current) return;
    if (step === 3 && uploadedCreatives.length === 0) {
      router.push(`${pathname}?step=2`, { scroll: true });
    }
  }, [step, uploadedCreatives.length, pathname, router]);

  useEffect(() => {
    if (!mountRef.current || sessionInitRef.current) return;

    sessionInitRef.current = true;

    let cancelled = false;

    const initSession = async () => {
      try {
        const id = await ensureAnalysisSession();
        if (!cancelled && id) {
          setAnalysisSessionId(id);
        }
      } catch (error) {
        if (!cancelled) {
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
        if (!result.skipped && !result.schemaUnavailable) {
          console.error("saveCreative error:", result.error.message || result.error);
        }
        return null;
      }

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

  const handleFiles = async (files) => {
    if (!platform) { addToast("Please select a platform first.", "error"); return; }
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    setIsLoading(true);
    try {
      const preparedCreatives = await mapWithConcurrency(fileList, 2, async (file, fileIndex) => {
        const dimensions = await readImageDimensionsFromBlob(file, { fileName: file.name });
        const validation = await validateCreativeAsset({
          file,
          image: { width: dimensions.width, height: dimensions.height },
          platform,
        });
        const size = dimensions.size;
        const normalizedValidation = finalizeValidationForPlatform(validation, platform, size);

        const creativeId = `${Date.now()}-${fileIndex}-${file.name}-${size}`;
        const { displayUrl, fullUrl } = await storeUploadedCreativeFile(creativeId, file);
        const contentHash = await hashFileContent(file);

        return attachSourceDimensions({
          id: creativeId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: displayUrl,
          fullUrl,
          hasStoredAssets: true,
          size,
          contentHash,
          valid: normalizedValidation.valid && normalizedValidation.status !== "CRITICAL",
          originalFile: file.name,
          mimeType: file.type || "image/jpeg",
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
        }, dimensions.width, dimensions.height);
      });

      startTransition(() => {
        setCreatives((prev) => [...prev, ...preparedCreatives]);
      });

      window.setTimeout(() => {
        preparedCreatives.forEach((creative) => {
          void persistCreative(creative);
        });
      }, 0);

      const uploadSummary = buildValidationSummary(preparedCreatives.map((c) => c.validation));
      void trackUserActivity("upload", {
        action_label: "Creative uploaded",
        platform,
        campaign_goal: campaignGoal,
        vertical: campaignVertical,
        metadata: {
          count: preparedCreatives.length,
          creative_names: preparedCreatives.map((c) => c.name),
          sizes: preparedCreatives.map((c) => c.size),
          ad_sizes: preparedCreatives.map((c) => c.size),
          valid_count: preparedCreatives.filter((c) => c.valid).length,
          invalid_count: preparedCreatives.filter((c) => !c.valid).length,
          audience_stage: campaignAudienceStage,
        },
      }, { dedupeKey: `upload-${platform}-${preparedCreatives.length}-${preparedCreatives[0]?.name || "batch"}` });
      if (uploadSummary.criticalCount > 0) {
        addToast(`Uploaded ${preparedCreatives.length} creatives: ${uploadSummary.warningCount} warning(s), ${uploadSummary.criticalCount} critical.`, "error");
      } else if (uploadSummary.warningCount > 0) {
        addToast(`Uploaded ${preparedCreatives.length} creatives with ${uploadSummary.warningCount} warning(s).`, "info");
      } else {
        addToast(`Uploaded ${preparedCreatives.length} creatives. All checks passed.`, "success");
      }
    } catch (err) {
      addToast(err?.message || "Failed to validate uploaded files.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const compressCreative = useCallback(async (creativeId, options = {}) => {
    const {
      enforceSizeCompliance = false,
      targetSizeKB,
      silent = false,
      reencodeOnly = false,
      forceOutputType = null,
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

      let bestCandidate;
      try {
        if (reencodeOnly) {
          bestCandidate = await compressDrawable(imageSource.drawable, {
            outputType,
            quality: outputType === "image/png" ? 1 : 0.92,
            scale: 1,
            sourceWidth: imageSource.width,
            sourceHeight: imageSource.height,
            includeDataUrl: false,
          });
        } else {
          bestCandidate = await compressImageToTarget(imageSource.drawable, {
            outputType,
            targetBytes: sizeThresholdBytes,
            sourceWidth: imageSource.width,
            sourceHeight: imageSource.height,
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

      const sourceDims = resolvePersistedDimensions(creative) || {
        width: imageSource.width,
        height: imageSource.height,
      };
      const scaledDown = (bestCandidate.scale ?? 1) < 0.999;
      const outputWidth = scaledDown ? bestCandidate.width : sourceDims.width;
      const outputHeight = scaledDown ? bestCandidate.height : sourceDims.height;

      const validation = await validateCreativeAsset({
        file: finalFile,
        image: { width: outputWidth, height: outputHeight },
        platform,
      });
      const finalSize = `${outputWidth}x${outputHeight}`;

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
      }, outputWidth, outputHeight);

      startTransition(() => {
        setCreatives((prev) => prev.map((entry) => (entry.id === creativeId ? updatedCreative : entry)));
      });
      void persistCreative(updatedCreative);

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
  }, [platform, addToast, persistCreative]);

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
        addToast("Fix skipped — creative may already meet the requirement.", "info");
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

    setCreatives((prev) => prev.filter((c) => c.id !== id));
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
        void persistCreative(updated);
        return updated;
      });
    });
  }, [originalBackups, allowedSizes, persistCreative]);

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

  const runAnalysis = useCallback(async () => {
    if (validCreatives.length === 0) { addToast("No valid creatives to analyze.", "error"); return; }
    if (!campaignGoal || !platform || !campaignVertical) { addToast("Missing configuration.", "error"); return; }

    setAnalysisLoading(true); setAnalysisResult(null);
    try {
      void trackUserActivity("analyzer_usage", {
        action_label: "Analysis started",
        platform,
        campaign_goal: campaignGoal,
        vertical: campaignVertical,
        metadata: {
          creative_count: validCreatives.length,
          audience_stage: campaignAudienceStage,
          ad_sizes: validCreatives.map((c) => c.size),
          placements: platform ? Object.keys(PLATFORM_SIZES[platform] || {}) : [],
        },
      }, { dedupeKey: `analyzer-start-${platform}-${campaignGoal}-${validCreatives.length}` });

      const results = await analyzeAllCreatives(validCreatives, campaignGoal, platform, campaignVertical, campaignAudienceStage);
      setAnalysisResult(results);

      const linkedCreatives = await Promise.all(
        validCreatives.map(async (creative) => {
          const supabaseCreativeId = creative.supabaseCreativeId || await persistCreative(creative);
          return { creative, supabaseCreativeId };
        }),
      );

      await Promise.all(
        results.map(async (entry, index) => {
          const supabaseCreativeId = linkedCreatives[index]?.supabaseCreativeId;
          if (!supabaseCreativeId) return;
          await saveAnalyzerResult({
            creativeId: supabaseCreativeId,
            platform,
            goal: campaignGoal,
            resultJson: getEntryPayload(entry) || {},
          });
        }),
      );

      await trackUserActivity("analyzer_usage", {
        action_label: "Analysis completed",
        platform,
        campaign_goal: campaignGoal,
        vertical: campaignVertical,
        metadata: {
          creative_count: results.length,
          audience_stage: campaignAudienceStage,
          creative_names: validCreatives.map((c) => c.name).filter(Boolean),
          ad_sizes: validCreatives.map((c) => c.size),
        },
      }, { dedupeKey: `analyzer-complete-${platform}-${campaignGoal}-${results.length}` });

      const authed = await isAuthenticatedUser();
      if (!authed) { /* guest demo already consumed on entry */ }

      const goalMisaligned = results.filter((entry) => getEntryPayload(entry)?.goal_alignment?.is_aligned === false);
      const verticalMisaligned = results.filter((entry) => getEntryPayload(entry)?.vertical_alignment?.is_aligned === false);

      if (goalMisaligned.length === 0 && verticalMisaligned.length === 0) {
        addToast(`Analyzed ${results.length} creative${results.length !== 1 ? "s" : ""}. All creatives align with selected goal and vertical.`, "success");
      } else {
        addToast(
          `Analyzed ${results.length} creative${results.length !== 1 ? "s" : ""}. Goal mismatches: ${goalMisaligned.length}, Vertical mismatches: ${verticalMisaligned.length}.`,
          "error"
        );
      }
    } catch (err) {
      addToast(err.message || "Analysis failed.", "error");
    } finally {
      setAnalysisLoading(false);
    }
  }, [validCreatives, campaignGoal, platform, campaignVertical, campaignAudienceStage, addToast, persistCreative]);

  useEffect(() => {
    if (step !== 3) return;
    if (isHydratingCreatives) return;
    if (analysisLoading || analysisResult) return;
    if (uploadedCreatives.length === 0) return;

    const timer = window.setTimeout(() => {
      void runAnalysis();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [step, isHydratingCreatives, analysisLoading, analysisResult, uploadedCreatives.length, runAnalysis]);

  useEffect(() => {
    if (!analysisSessionId) return;
    if (!Array.isArray(analysisResult) || analysisResult.length === 0) return;

    void updateAnalysisSession({ status: "analysis_completed" }).catch((error) => {
      console.error("Failed to mark analysis as completed", error);
    });
  }, [analysisSessionId, analysisResult, updateAnalysisSession]);

  const handleDownloadReport = useCallback(async () => {
    if (!analysisResult) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: 'a4', unit: 'pt' });

      const setBg = () => { doc.setFillColor(15, 23, 42); doc.rect(0, 0, 595.28, 841.89, 'F'); };
      setBg();

      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("Adigator Creative Analysis Report", 40, 55);

      doc.setFontSize(12); doc.setTextColor(203, 213, 225);
      doc.text(`Platform: ${(platform || '').toUpperCase()} | Goal: ${(campaignGoal || '').toUpperCase()}`, 40, 80);
      doc.text(`Date: ${new Date().toLocaleString()}`, 40, 98);

      const sorted = [...analysisResult].sort(compareStrategicEntries);

      doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.text("Creative Ranking", 40, 130);

      let currentY = 152;
      sorted.forEach((res, rank) => {
        const payload = getEntryPayload(res) || {};
        const score = getStrategicAlignmentScore(payload) ?? 0;
        const flow = getStrategicFlow(payload);
        if (score >= 70) doc.setTextColor(74, 222, 128);
        else if (score >= 45) doc.setTextColor(250, 204, 21);
        else doc.setTextColor(248, 113, 113);

        doc.setFontSize(13);
        doc.text(`${rank === 0 ? "1st" : rank === 1 ? "2nd" : rank === 2 ? "3rd" : `#${rank + 1}`}. ${res.creative.name} — ${score}/100`, 40, currentY);
        currentY += 16;

        doc.setFontSize(10); doc.setTextColor(148, 163, 184);
        let verdict = "";
        if (score >= 80) verdict = `"${res.creative.name}" is perfect and strongly aligned with all standards.`;
        else if (score >= 65) verdict = `"${res.creative.name}" meets most standards — minor improvements suggested.`;
        else if (score >= 45) verdict = `"${res.creative.name}" needs work — CTA alignment and visibility require attention.`;
        else verdict = `"${res.creative.name}" has critical issues — align strategic message before scaling spend.`;

        const lines = doc.splitTextToSize(verdict, 515);
        doc.text(lines, 50, currentY);
        currentY += lines.length * 14 + 4;

        const summaryLines = doc.splitTextToSize(`Strategic summary: ${flow.strategicAlignmentSummary}`, 515);
        doc.text(summaryLines, 50, currentY);
        currentY += summaryLines.length * 14 + 6;

        if (currentY > 760) { doc.addPage(); setBg(); currentY = 40; }
      });

      for (const res of analysisResult) {
        doc.addPage(); setBg();
        doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text(`Creative: ${res.creative.name}`, 40, 48);

        let cy = 72;
        try { doc.addImage(res.creative.url, 40, cy, 200, 130); cy += 145; } catch { }

        const payload = getEntryPayload(res) || {};
        const flow = getStrategicFlow(payload);
        const recommendations = getValidatedRecommendations(payload);
        const s = getStrategicAlignmentScore(payload) ?? 0;
        if (s >= 70) doc.setTextColor(74, 222, 128);
        else if (s >= 45) doc.setTextColor(250, 204, 21);
        else doc.setTextColor(248, 113, 113);

        doc.setFontSize(15); doc.text(`Strategic Alignment: ${s}/100`, 40, cy); cy += 20;

        doc.setTextColor(148, 163, 184); doc.setFontSize(11);
        const problemLines = doc.splitTextToSize(`Main strategic problem: ${flow.mainStrategicProblem}`, 515);
        doc.text(problemLines, 40, cy); cy += problemLines.length * 14 + 6;
        const consequenceLines = doc.splitTextToSize(`Business consequence: ${flow.businessConsequence}`, 515);
        doc.text(consequenceLines, 40, cy); cy += consequenceLines.length * 14 + 10;

        doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text("Top Interventions:", 40, cy); cy += 18;
        doc.setTextColor(203, 213, 225); doc.setFontSize(11);
        recommendations.slice(0, 3).forEach((rec) => {
          const lines = doc.splitTextToSize(`• ${rec.recommended_change}`, 515);
          doc.text(lines, 40, cy); cy += lines.length * 14;
        });
      }

      doc.save("Campaign_Analysis_Report.pdf");
      void trackUserActivity("download", {
        action_label: "PDF report downloaded",
        platform,
        campaign_goal: campaignGoal,
        metadata: {
          format: "pdf",
          creative_count: Array.isArray(analysisResult) ? analysisResult.length : 0,
        },
      }, { dedupeKey: `download-pdf-${platform}-${campaignGoal}` });
    } catch (err) { console.error(err); addToast("Failed to generate PDF", "error"); }
  }, [analysisResult, campaignGoal, platform, addToast]);

  const handleExportPptx = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true); addToast("Generating PPTX...", "info");
    try {
      const { exportToPptx } = await import("../lib/exportPptx");
      const { computeCampaignOverview } = await import("../lib/analyzerInsights");
      const templateName = TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Template";
      const exportCreatives = validCreatives.map((creative, index) => ({
        ...creative,
        analysisData: getEntryPayload(analysisResult?.[index]) || null,
      }));
      const overview = analysisResult?.length
        ? computeCampaignOverview(
          analysisResult,
          platform,
          campaignGoal,
          campaignVertical,
          (v) => VERTICAL_TITLE_MAP[v] || v,
          (g) => g?.replace(/_/g, " "),
        )
        : null;
      const filename = await exportToPptx(
        exportCreatives,
        viewMode,
        templateName,
        {
          goal: campaignGoal,
          platform,
          vertical: campaignVertical,
          verticalLabel: VERTICAL_TITLE_MAP[campaignVertical] || campaignVertical,
          overview,
        },
      );
      void trackUserActivity("generate_action", {
        action_label: "PPTX export generated",
        platform,
        campaign_goal: campaignGoal,
        metadata: {
          format: "pptx",
          template: templateName,
          view_mode: viewMode,
          creative_count: creatives.filter((c) => c.valid).length,
        },
      }, { dedupeKey: `generate-pptx-${platform}-${selectedTemplate}` });
      void trackUserActivity("download", {
        action_label: "PPTX downloaded",
        platform,
        campaign_goal: campaignGoal,
        metadata: { format: "pptx", filename },
      }, { dedupeKey: `download-pptx-${filename}` });
      addToast(`Downloaded: ${filename}`, "success");
    } catch { addToast("Export failed.", "error"); }
    finally { setIsExporting(false); }
  }, [isExporting, validCreatives, analysisResult, viewMode, selectedTemplate, addToast, campaignGoal, platform, campaignVertical]);

  const previewEngineCreatives = useMemo(
    () => validCreatives.map((creative, index) => ({
      id: creative.id,
      name: creative.name,
      url: creative.url || creative.imageDataUrl || creative.image || "",
      size: creative.size,
      analyzerOutput: getEntryPayload(analysisResult?.[index]) || {},
      ctaText: getEntryPayload(analysisResult?.[index])?.signals?.cta || "",
      headline: getEntryPayload(analysisResult?.[index])?.signals?.headline
        || getEntryPayload(analysisResult?.[index])?.main_strategic_problem
        || creative.name
        || "",
    })),
    [validCreatives, analysisResult],
  );

  const previewTemplateContext = useMemo(() => {
    const primaryPayload = getEntryPayload(analysisResult?.[0]) || {};
    const signals = primaryPayload.signals || {};
    return {
      brandName: signals.brand || validCreatives[0]?.name || "Brand",
      targetAudience: campaignAudienceStage || "Prospective customers",
      tone: campaignGoal === "awareness"
        ? "Brand-forward and scroll-stopping"
        : campaignGoal === "consideration"
          ? "Credible and persuasive"
          : "Direct and conversion-focused",
      keyMessage: signals.primary_message || signals.headline || primaryPayload.main_strategic_problem || "",
      imageUrls: validCreatives
        .map((creative) => creative.url || creative.imageDataUrl || creative.image || "")
        .filter(Boolean),
    };
  }, [analysisResult, validCreatives, campaignAudienceStage, campaignGoal]);

  const handleCopyPreviewCreative = useCallback(async (creative) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(creative, null, 2));
      addToast("Creative template copied to clipboard.", "success");
    } catch {
      addToast("Could not copy creative template.", "error");
    }
  }, [addToast]);

  const handleRunReadinessCheck = useCallback(async () => {
    if (!platform || !campaignGoal) {
      addToast("Complete campaign setup before running readiness check.", "error");
      return;
    }
    if (creatives.length === 0) {
      addToast("Upload at least one creative first.", "error");
      return;
    }
    if (platform !== "meta_ads" && !landingUrl.trim()) {
      addToast("Landing page URL is required for Programmatic and Google Ads validation.", "error");
      return;
    }

    const [result] = await Promise.all([
      runReadinessValidation({
        platform,
        url: landingUrl.trim() || undefined,
        objective: campaignGoal,
        campaignName: campaignName.trim() || "Campaign",
        vertical: campaignVertical || undefined,
        creatives: creatives.map((c) => ({
          id: c.id,
          name: c.name,
          size: c.size,
          fileSize: c.fileSizeBytes,
          mimeType: c.mimeType,
          contentHash: c.contentHash,
          validation: c.validation,
        })),
      }),
      landingUrl.trim() ? runUrlValidation() : Promise.resolve(null),
    ]);

    if (result) {
      addToast(`Readiness score: ${result.overall_score}/100 — ${result.readiness_level.replace("_", " ")}`, result.readiness_level === "ready" ? "success" : "info");
    } else {
      addToast("Readiness check failed.", "error");
    }
  }, [
    platform,
    campaignGoal,
    creatives,
    landingUrl,
    campaignName,
    campaignVertical,
    runReadinessValidation,
    runUrlValidation,
    addToast,
  ]);


  return (
    <div className="preview-tool-white min-h-screen bg-gradient-to-b from-white to-slate-50 text-[#1C1C1E]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-sky-500 to-cyan-500 border-b border-sky-600 px-6 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black text-white drop-shadow-md">
            Adigator Creative Studio
          </h1>
          <div className="hidden">
            {STEP_LABELS.map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`flex items-center gap-1 px-3 py-2 rounded-lg font-bold transition-all ${step === idx + 1 ? "bg-white/25 text-white shadow-md" : step > idx + 1 ? "bg-emerald-400/20 text-emerald-700 font-bold" : "text-white/70"
                  }`}>
                  {step > idx + 1 ? "✓" : `${idx + 1}.`} {label}
                </div>
                {idx < STEP_LABELS.length - 1 && <span className="text-white/25 mx-1">›</span>}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* PROGRESS */}
      <div className="h-1 bg-slate-300">
        <motion.div
          className="h-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: step / TOTAL_STEPS }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <AnimatePresence mode="wait">

          {/* STEP 1: SETUP CAMPAIGN */}
          {step === 1 && (
            <motion.div key="step-1" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8 pb-24">
              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h2 className="text-4xl font-bold text-slate-900">Step 1: Campaign Setup</h2>
                  <p className="mt-2 text-slate-700 text-lg">Configure platform, goal, and vertical before uploading creatives.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Platform</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPlatformConfig?.title || "Not selected"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Campaign Goal</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{campaignGoal ? getGoalTitle(campaignGoal, platform) : "Not selected"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Industry Vertical</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{campaignVertical ? (VERTICAL_TITLE_MAP[campaignVertical] || campaignVertical) : "Not selected"}</p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Choose Advertising Platform</h3>
                  <p className="mt-1 text-slate-600">Select where this campaign will run.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLATFORMS.map((p) => (
                    <SelectionCard key={p.id} selected={platform === p.id} onClick={() => handlePlatformSelect(p.id)} activeClasses={`${p.color} ${p.border}`}>
                      <div className="text-5xl mb-4">{p.icon}</div>
                      <h3 className={`text-2xl font-extrabold mb-2 ${platform === p.id ? "text-sky-600" : "text-slate-800"}`}>{p.title}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{p.desc}</p>
                    </SelectionCard>
                  ))}
                </div>
              </motion.section>

              <motion.section ref={goalSectionRef} variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">What is the campaign objective?</h3>
                  <p className="mt-1 text-slate-600">Select the marketing intent. This directly changes analysis priorities and scoring behavior.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {availableGoals.map((g) => (
                    <SelectionCard key={g.id} selected={campaignGoal === g.id} onClick={() => handleGoalSelect(g.id)} activeClasses={`${g.color} ${g.border}`}>
                      <div className="text-5xl mb-4">{g.emoji}</div>
                      <p className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-1">{g.subtitle}</p>
                      <h3 className={`text-2xl font-extrabold mb-2 ${campaignGoal === g.id ? "text-sky-600" : "text-slate-800"}`}>{getGoalTitle(g.id, platform)}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed mb-6">{g.desc}</p>
                    </SelectionCard>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Campaign Details</h3>
                  <p className="mt-1 text-slate-600">Used for readiness scoring, mismatch detection, and report export.</p>
                </div>
                <div className="max-w-xl">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q2 Running Shoes Awareness"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Industry Vertical</h3>
                  <p className="mt-1 text-slate-600">Select the vertical for your campaign.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {VERTICALS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVerticalSelect(v.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                        campaignVertical === v.id
                          ? "bg-gradient-to-r from-sky-500 to-cyan-500 border-sky-600 text-white shadow-lg shadow-sky-500/30"
                          : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </motion.section>

              <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-300 bg-white/95 backdrop-blur-xl shadow-2xl">
                <div className="mx-auto flex w-full max-w-7xl gap-4 px-6 py-4 md:px-10">
                  <NavBtn variant="back" onClick={goBack}>
                    ← Back
                  </NavBtn>
                  <NavBtn
                    onClick={goNext}
                    disabled={!platform || !campaignGoal || !campaignVertical}
                  >
                    Upload Creatives →
                  </NavBtn>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: UPLOAD & VALIDATE */}
          {step === 2 && (
            <motion.div key="step-2" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-2">Step 2: Upload & Validate</h2>
                <p className="text-slate-700 text-lg">
                  {selectedPlatformConfig?.title} {PLATFORM_INTELLIGENCE_LABEL[platform]} active: {allowedSizes.length} supported formats across intelligent inventory clusters.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-300 bg-slate-50 p-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{PLATFORM_INTELLIGENCE_LABEL[platform]}</h3>
                  <p className="text-xs text-sky-700 bg-sky-100 border border-sky-300 rounded-full px-3 py-1 font-semibold">
                    {selectedPlatformConfig?.title || "Platform"} • Creative Compatibility Matrix
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(selectedPlatformConfig?.groups || {}).map(([groupKey, sizes], index) => {
                    const themes = [
                      { box: "border-blue-500/25 bg-blue-500/8", title: "text-blue-300", chip: "text-blue-100" },
                      { box: "border-purple-500/25 bg-purple-500/8", title: "text-purple-300", chip: "text-purple-100" },
                      { box: "border-fuchsia-500/25 bg-fuchsia-500/8", title: "text-fuchsia-300", chip: "text-fuchsia-100" },
                      { box: "border-emerald-500/25 bg-emerald-500/8", title: "text-emerald-300", chip: "text-emerald-100" },
                    ];
                    const theme = themes[index % themes.length];
                    return (
                      <div key={groupKey} className={`rounded-2xl border p-4 ${theme.box}`}>
                        <p className={`text-xs uppercase tracking-wider font-bold mb-3 ${theme.title}`}>{GROUP_LABELS[groupKey] || groupKey}</p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <span key={`${groupKey}-${size}`} className={`px-2 py-1 rounded-md bg-white/10 text-[11px] border border-white/10 ${theme.chip}`}>
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Platform Distribution Intelligence</p>
                  <div className="flex flex-wrap gap-2">
                    {(platform === "programmatic"
                      ? DSP_PARTNERS
                      : platform === "google_ads"
                        ? ["Google Display Network", "Responsive Display", "YouTube Companion"]
                        : ["Meta Feed", "Meta Stories", "Meta Reels", "Meta Carousel"]
                    ).map((channel) => (
                      <span key={channel} className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                className={`relative rounded-3xl border-2 border-dashed transition-all p-12 text-center cursor-pointer ${drag ? "border-purple-500 bg-purple-500/10" : "border-white/20 bg-white/5 hover:border-purple-400"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud size={48} className="mx-auto mb-4 text-purple-400" />
                <h3 className="text-2xl font-bold text-white mb-2">{drag ? "Drop files here" : "Upload Creatives"}</h3>
                <p className="text-gray-400 mb-6 text-sm">or click to browse your computer</p>
                <input ref={fileRef} type="file" multiple hidden accept="image/*" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
              </div>

              {(isLoading || isHydratingCreatives) && (
                <div className="text-center py-4">
                  <div className="inline-block w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-xs text-gray-400">
                    {isHydratingCreatives ? "Restoring creatives…" : "Validating uploads…"}
                  </p>
                </div>
              )}

              {/* Validation Summary Stats */}
              {creatives.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-linear-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-400">{creatives.length}</p>
                    <p className="text-sm text-gray-400 mt-1">Total</p>
                  </div>
                  <div className="bg-linear-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-400">{validCreatives.length}</p>
                    <p className="text-sm text-gray-400 mt-1">Ready</p>
                  </div>
                  <div className="bg-linear-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-400">{validationSummary.warningCount}</p>
                    <p className="text-sm text-gray-400 mt-1">Warnings</p>
                  </div>
                  <div className="bg-linear-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-400">{validationSummary.criticalCount}</p>
                    <p className="text-sm text-gray-400 mt-1">Critical</p>
                  </div>
                </div>
              )}

              {validationResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{validationSummary.totalIssues}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Issues</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:col-span-3">
                    <p className="text-2xl font-bold text-cyan-300">{validationSummary.inventoryImpactScore}/100</p>
                    <p className="text-sm text-gray-400 mt-1">Inventory Impact Score</p>
                  </div>
                </div>
              )}

              {creatives.length > 0 && (
                <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Bulk Compression</p>
                      <p className="text-xs text-slate-600">Set one target size and apply compression to all creatives at once.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={bulkTargetSizeKB}
                        onChange={(e) => handleBulkTargetSizeChange(e.target.value)}
                        placeholder="Target KB"
                        className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-500"
                      />
                      <span className="text-[10px] text-slate-500 font-semibold">KB</span>
                      <button
                        onClick={handleBulkCompressAll}
                        disabled={isBulkCompressing || compressingCreativeIds.length > 0}
                        className="rounded-lg border border-sky-300 bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-[width] duration-200"
                          style={{
                            width: `${Math.round((bulkCompressProgress.current / bulkCompressProgress.total) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Processing one creative at a time to keep the UI responsive.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Valid List */}
              {validCreatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Valid Creatives</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {validCreatives.map((creative) => (
                      <div key={creative.id} className="flex flex-col gap-1">
                        <CreativeCard
                          creative={creative}
                          onRemove={removeCreative}
                          disableLayoutAnimation={isBulkCompressing || compressingCreativeIds.length > 0}
                        />
                        {editingId === creative.id ? (
                          <div className="flex gap-1 mt-1">
                            <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(creative.id); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 min-w-0 bg-white/10 border border-purple-500 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                            <button onClick={() => saveEdit(creative.id)} className="px-2 py-1 bg-sky-600 rounded-lg text-xs text-white font-semibold hover:bg-sky-700">✓</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-slate-200 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold hover:bg-slate-300">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(creative.id, creative.name)} className="text-left flex items-center gap-1 mt-1 group/rn">
                            <span className="text-xs text-slate-700 truncate group-hover/rn:text-sky-700">{creative.name}</span>
                            <span className="text-[10px] text-slate-500 group-hover/rn:text-sky-600">✏️</span>
                          </button>
                        )}
                        <button onClick={() => downloadCreative(creative)} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-700 transition bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2 py-1.5 mt-1 font-medium">
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
                          <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2">
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
                                  variant="warning"
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
              )}

              {/* Invalid List */}
              {invalidCreatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2"><XCircle className="text-red-500" /> Critical Creatives (Fix Before Analysis)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {invalidCreatives.map((creative) => {
                      return (
                        <div key={creative.id} className="space-y-2">
                          <CreativeCard
                            creative={creative}
                            onEdit={(c) => setEditModalCreative(c)}
                            onRemove={removeCreative}
                            disableLayoutAnimation={isBulkCompressing || compressingCreativeIds.length > 0}
                          />
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
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 transition bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg px-2 py-1.5 mt-1 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {compressingCreativeIds.includes(creative.id)
                              ? "Compressing..."
                              : String(creative.mimeType || "").toLowerCase() === "image/gif"
                                ? "GIF Unsupported"
                                : "Compress Size"}
                          </button>
                          {creative.validation?.issues?.length > 0 && (
                            <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-2">
                              {creative.validation.issues.slice(0, 3).map((issue, idx) => (
                                <ValidationIssueRow
                                  key={`${creative.id}-critical-issue-${idx}`}
                                  issue={issue}
                                  creativeId={creative.id}
                                  onApplyFix={applyCreativeFix}
                                  isFixing={
                                    fixingCreativeIds.includes(creative.id)
                                    || compressingCreativeIds.includes(creative.id)
                                  }
                                  variant="critical"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

              <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">URL Validation</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Enter the destination URL for this campaign. We compare it against your uploaded creatives using AI and show
                    whether it is <span className="font-semibold">Aligned</span> or <span className="font-semibold">Misaligned</span> in the Step 3 Overview tab only.
                    {platform === "meta_ads" ? " URL is optional for Meta." : " URL is required for Programmatic and Google Ads."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Landing Page URL {platform !== "meta_ads" ? "(required)" : "(optional)"}
                    </label>
                    <input
                      type="url"
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      placeholder="https://www.example.com/landing"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={runUrlValidation}
                      disabled={urlValidationRunning || !landingUrl.trim() || creatives.length === 0}
                      className="w-full rounded-xl bg-sky-600 border border-sky-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {urlValidationRunning ? "Validating URL…" : "Validate URL"}
                    </button>
                  </div>
                </div>
                {urlValidationRunning ? (
                  <p className="text-xs text-sky-700 font-medium">Checking URL against your creatives with OpenAI…</p>
                ) : urlValidation?.submitted_url && urlValidation.submitted_url === landingUrl.trim() ? (
                  <p className="text-xs text-slate-500">
                    URL check complete — open Step 3 Overview to see alignment status and suggestions.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Campaign Readiness Report</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Rule-based checks for creative specs, URL health, UTM tags, duplicates, and objective alignment.
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleRunReadinessCheck}
                    disabled={readinessLoading || urlValidationRunning || creatives.length === 0}
                    className="w-full md:w-auto rounded-xl bg-emerald-600 border border-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {readinessLoading || urlValidationRunning ? "Validating…" : "Run Campaign Readiness Check"}
                  </button>
                </div>
                {readinessLoading ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <p className="text-sm font-semibold text-sky-800">{readinessProgress}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-sky-200 overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-sky-500 animate-pulse" />
                    </div>
                  </div>
                ) : null}
                {readinessError && !readinessReport ? (
                  <p className="text-sm text-red-600">{readinessError}</p>
                ) : null}
                {readinessReport ? (
                  <ValidationReport
                    report={readinessReport}
                    onCopy={() => addToast("Readiness report copied to clipboard.", "success")}
                  />
                ) : null}
              </div>

              <div className="flex gap-4 pt-4">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
                <NavBtn onClick={goNext} disabled={uploadedCreatives.length === 0}>Next: AI Analysis →</NavBtn>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AI ANALYSIS */}
          {step === 3 && (
            <motion.div key="step-3" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 3: AI Analysis</h2>
                <p className="text-gray-400">Analyze your creatives against {PLATFORMS.find(p => p.id === platform)?.title} standards.</p>
                <p className="text-gray-500 text-sm mt-2">
                  Selected goal: <span className="text-white font-semibold capitalize">{campaignGoal}</span> · Audience stage: <span className="text-white font-semibold">{AUDIENCE_STAGES.find((stage) => stage.id === campaignAudienceStage)?.title || "Cold Audience"}</span> · Selected vertical: <span className="text-white font-semibold">{VERTICAL_TITLE_MAP[campaignVertical] || campaignVertical}</span>
                </p>
              </div>

              {!analysisResult && !analysisLoading && (
                <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10 text-center">
                  <div className="w-20 h-20 mb-6 bg-linear-to-br from-fuchsia-500/20 to-purple-600/20 rounded-full flex items-center justify-center border border-fuchsia-500/30">
                    <span className="text-4xl">🧠</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Ready to Analyze</h3>
                  <p className="text-sm text-gray-400 mb-8 max-w-md">
                    Run analysis for <strong>{validCreatives.length} valid creative(s)</strong> when you are ready.
                  </p>
                  <NavBtn onClick={runAnalysis} className="px-8 shadow-lg shadow-purple-500/30">Start Analysis</NavBtn>
                </div>
              )}

              {analysisLoading && (
                <div className="py-10 space-y-4">
                  <p className="text-gray-300 text-sm">Analyzing {validCreatives.length} creatives with deterministic engine...</p>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
                    <div className="h-5 w-40 bg-white/10 rounded mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="h-20 bg-white/10 rounded-xl" />
                      <div className="h-20 bg-white/10 rounded-xl" />
                      <div className="h-20 bg-white/10 rounded-xl" />
                      <div className="h-20 bg-white/10 rounded-xl" />
                    </div>
                    <div className="h-32 bg-white/10 rounded-xl mb-3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="h-28 bg-white/10 rounded-xl" />
                      <div className="h-28 bg-white/10 rounded-xl" />
                      <div className="h-28 bg-white/10 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {analysisResult && !analysisLoading && (
                <>
                  <AnalysisPanel
                    analysisResult={analysisResult}
                    campaignGoal={campaignGoal}
                    campaignVertical={campaignVertical}
                    platform={platform}
                    viewerName={viewerName}
                    creatives={validCreatives}
                    urlValidation={urlValidation}
                    onDownloadReport={handleDownloadReport}
                  />
                </>
              )}

              <div className="flex gap-4 pt-6">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
                <NavBtn onClick={goNext}>Next: Preview Studio →</NavBtn>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PREVIEW STUDIO */}
          {step === 4 && (
            <motion.div key="step-4" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Step 4: Preview Studio</h2>
                  <p className="text-gray-400">
                    {platform === "google_ads"
                      ? "Preview Google Search, Display, Shopping, and App Install templates."
                      : platform === "meta_ads"
                        ? "Preview Facebook, Instagram, Stories, Reels, Carousel, and Messenger templates."
                        : "See your creatives in realistic interactive website contexts."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStartNewAnalysis}
                  className="px-6 py-3 bg-white border border-gray-200 text-black rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 shadow-md">
                  <RotateCcw size={18} className="text-black" /> Start New Analysis
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportPptx} disabled={isExporting}
                  className="px-8 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60">
                  <Download size={20} /> {isExporting ? "Exporting..." : "Export PPTX"}
                </motion.button>
              </div>
              </div>

              {(platform === "programmatic" ? validCreatives.length > 0 : Boolean(platform)) && (
                <PreviewStudio
                  platform={platform}
                  creatives={previewEngineCreatives}
                  sourceCreatives={validCreatives.map((c) => ({
                    id: c.id,
                    name: c.name,
                    url: c.url,
                    fullUrl: c.fullUrl,
                    size: c.size,
                  }))}
                  vertical={campaignVertical || "general"}
                  goal={campaignGoal || "awareness"}
                  brandName={previewTemplateContext.brandName}
                  targetAudience={previewTemplateContext.targetAudience}
                  tone={previewTemplateContext.tone}
                  keyMessage={previewTemplateContext.keyMessage}
                  imageUrls={previewTemplateContext.imageUrls}
                  onCopyCreative={handleCopyPreviewCreative}
                />
              )}

              {platform === "programmatic" && validCreatives.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/3 border border-white/10 rounded-2xl">
                  <span className="text-4xl mb-4">🌐</span>
                  <p className="text-white font-semibold">No valid creatives to preview</p>
                  <p className="text-gray-400 text-sm mt-1">Upload and validate a creative in step 2 first.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 flex-wrap">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
                <NavBtn variant="secondary" onClick={handleStartNewAnalysis} className="flex items-center gap-2">
                  <RotateCcw size={16} /> Start New Analysis
                </NavBtn>
                <NavBtn variant="success" onClick={handleExportPptx} disabled={isExporting} className="flex justify-center items-center gap-2">
                  <Download size={20} /> {isExporting ? "Generating..." : "Download PPTX"}
                </NavBtn>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {editModalCreative && (
        <EditCreativeModal
          creative={editModalCreative}
          platform={platform}
          onApply={handleCreativeUpdate}
          onClose={() => setEditModalCreative(null)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
