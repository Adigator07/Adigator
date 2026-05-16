"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const ContextualPreviewEngine = dynamic(() => import("./ContextualPreviewEngine"), { ssr: false, loading: () => <div className="py-20 text-center text-gray-500 text-sm">Loading contextual engine…</div> });
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
  SUPPORTED_DISPLAY_SIZE_GROUPS,
  DSP_PARTNERS,
} from "../lib/creativeValidation";

// Platform and CTA constants (previously from localAnalyzer)
const PLATFORM_SIZES = {
  google_ads: {
    desktop_display: [
      "300x250",
      "336x280",
      "728x90",
      "970x90",
      "970x250",
      "160x600",
      "300x600",
      "468x60",
      "250x250",
      "200x200",
    ],
    mobile_display: ["320x50", "320x100", "300x250", "320x480", "480x320"],
    responsive_native_assets: ["1200x628", "1200x1200", "1080x1080", "960x1200", "1200x1500"],
  },
  meta_ads: {
    feed_placements: ["1080x1080", "1080x1350", "1200x628"],
    story_reels: ["1080x1920"],
    carousel: ["1080x1080"],
    flexible_native_assets: ["1200x1200", "1200x628"],
  },
  programmatic: {
    standard_display: SUPPORTED_DISPLAY_SIZE_GROUPS.desktop,
    mobile_display: SUPPORTED_DISPLAY_SIZE_GROUPS.mobile,
    high_impact_premium: SUPPORTED_DISPLAY_SIZE_GROUPS.high_impact,
    native_social_display: SUPPORTED_DISPLAY_SIZE_GROUPS.native,
  },
};

const PLATFORM_INTELLIGENCE_LABEL = {
  google_ads: "Inventory Intelligence",
  meta_ads: "Placement Intelligence",
  programmatic: "Cross-Inventory Intelligence",
};

const GROUP_LABELS = {
  desktop_display: "Desktop Display",
  mobile_display: "Mobile Display",
  responsive_native_assets: "Responsive / Native Assets",
  feed_placements: "Feed Placements",
  story_reels: "Story / Reels",
  carousel: "Carousel",
  flexible_native_assets: "Flexible Native Assets",
  standard_display: "Standard Display",
  high_impact_premium: "High-Impact / Premium",
  native_social_display: "Native / Social Display",
};

const GOAL_CTA = {
  awareness: ["Learn More", "Discover", "Explore", "Watch Now", "See Now"],
  conversion: ["Buy Now", "Sign Up", "Get Started", "Download", "Claim Offer"],
  traffic: ["Visit Site", "Learn More", "Read More", "Explore Now"],
  app_installs: ["Install Now", "Download App", "Get the App", "Try It Free"],
  lead_generation: ["Get Quote", "Request Demo", "Contact Sales", "Book Consultation"],
  engagement: ["Comment", "Share", "React", "Join the Conversation"],
  video_views: ["Watch Video", "Watch More", "Play Now", "See How It Works"],
  retargeting: ["Complete Purchase", "Return to Cart", "Claim Offer", "Shop Again"],
};

const DEFAULT_CAMPAIGN_GOAL = "awareness";
const WORKFLOW_STORAGE_KEY = "adigator_workflow_v1";
const ANALYSIS_SESSION_STORAGE_KEY = "adigator_analysis_session_id";

function parseStoredJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clampStep(value) {
  const numeric = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(numeric, 1), TOTAL_STEPS);
}
import {
  UploadCloud, CheckCircle2, XCircle, AlertCircle,
  Download, LayoutGrid, Square, CheckSquare,
  Newspaper, ShoppingCart, Coffee, Activity, Laptop, Briefcase, GraduationCap, Gamepad2, Film,
  Monitor, Smartphone
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
  const base = "flex-1 py-3 px-6 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed";
  const bg = variant === "primary"
    ? "bg-linear-to-r from-blue-600 to-purple-600 text-white"
    : variant === "back"
      ? "bg-white/10 hover:bg-white/20 text-white"
      : "bg-linear-to-r from-green-600 to-emerald-600 text-white";

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
      animate={selected ? { boxShadow: ["0 0 0 rgba(168,85,247,0)", "0 0 22px rgba(168,85,247,0.25)", "0 0 0 rgba(168,85,247,0)"] } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      transition={selected ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-8 border-2 transition-all duration-200 bg-linear-to-br ${selected ? `${activeClasses} shadow-2xl` : "border-white/10 bg-white/5 hover:border-white/25"
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

const LOW_AVAILABILITY_SIZES = new Set([
  "234x60",
  "120x240",
  "180x150",
  "300x1050",
]);

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
  google_ads: ["awareness", "traffic", "conversion", "lead_generation", "engagement", "app_installs", "video_views", "retargeting"],
  meta_ads: ["awareness", "traffic", "conversion", "lead_generation", "engagement", "app_installs", "video_views", "retargeting"],
  programmatic: ["awareness", "consideration", "conversion"],
};

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
  { id: "ecommerce", title: "E-commerce / Retail" }
];

const VERTICAL_TITLE_MAP = Object.fromEntries(VERTICALS.map((v) => [v.id, v.title]));


const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const VALID_VERTICALS = new Set([
  "automotive", "banking", "ecommerce", "education", "entertainment",
  "finance", "food", "gaming", "healthcare", "hotels", "luxury",
  "news_media", "real_estate", "sports", "technology", "travel",
]);

// ── OpenAI-Only Analyzer ─────────────────────────────────────────────────────

async function analyzeAllCreatives(creatives, goal, platform, vertical) {
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
        why_audience_may_resist: undefined,
        business_consequence: undefined,
        attention_analysis: undefined,
        behavioral_response: undefined,
        strategic_recommendations: undefined,
        expected_improvement: undefined,
        strategic_alignment_score: undefined,
      };
    }

    return candidate;
  };

  for (const creative of creatives) {
    try {
      // Fetch image from URL and convert to Blob
      const imageRes = await fetch(creative.url);
      if (!imageRes.ok) throw new Error(`Failed to fetch image: ${creative.url}`);
      const imageBlob = await imageRes.blob();

      const formData = new FormData();
      formData.append("image", imageBlob, "creative.jpg");
      formData.append("goal", goal);
      formData.append("vertical", verticalForApi);
      formData.append("platform", platform || "programmatic");

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
            behavioral_response: undefined,
            attention_analysis: undefined,
            strategic_recommendations: undefined,
            strategic_alignment_score: undefined,
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
          behavioral_response: undefined,
          attention_analysis: undefined,
          strategic_recommendations: undefined,
          strategic_alignment_score: undefined,
        } 
      });
    }
  }
  return results;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataURL(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not parse image dimensions"));
    img.src = dataUrl;
  });
}

function deriveStatusFromIssues(issues) {
  if (issues.some((issue) => issue.severity === "high")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "medium")) return "WARNING";
  return "PASS";
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
  const storedStepFallback = useMemo(() => {
    if (typeof window === "undefined") return 1;
    const storedWorkflow = parseStoredJson(localStorage.getItem(WORKFLOW_STORAGE_KEY), {});
    return clampStep(storedWorkflow?.step || 1);
  }, []);
  const step = clampStep(urlStepParam || String(storedStepFallback));
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const [platform, setPlatform] = useState(() => {
    if (typeof window === "undefined") return "programmatic";
    return localStorage.getItem("adigator_platform") || "programmatic";
  });
  const [campaignGoal, setCampaignGoal] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_CAMPAIGN_GOAL;
    const savedGoal = localStorage.getItem("adigator_goal");
    const savedPlatform = localStorage.getItem("adigator_platform") || "programmatic";
    const allowedGoalIds = PLATFORM_GOAL_IDS[savedPlatform] || PLATFORM_GOAL_IDS.programmatic;
    if (savedGoal && savedGoal !== "null" && allowedGoalIds.includes(savedGoal)) {
      return savedGoal;
    }
    return allowedGoalIds[0] || DEFAULT_CAMPAIGN_GOAL;
  });
  const [campaignVertical, setCampaignVertical] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedVertical = localStorage.getItem("adigator_vertical");
    return savedVertical && savedVertical !== "null" ? savedVertical : null;
  });
  const [analysisSessionId, setAnalysisSessionId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ANALYSIS_SESSION_STORAGE_KEY);
  });
  const mountRef = useRef(false);

  const [creatives, setCreatives] = useState(() => {
    if (typeof window === "undefined") return [];
    const storedWorkflow = parseStoredJson(localStorage.getItem(WORKFLOW_STORAGE_KEY), {});
    return Array.isArray(storedWorkflow?.creatives) ? storedWorkflow.creatives : [];
  });
  const [drag, setDrag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editModalCreative, setEditModalCreative] = useState(null);
  const [originalBackups, setOriginalBackups] = useState({});

  const [analysisResult, setAnalysisResult] = useState(() => {
    if (typeof window === "undefined") return null;
    const storedWorkflow = parseStoredJson(localStorage.getItem(WORKFLOW_STORAGE_KEY), {});
    return Array.isArray(storedWorkflow?.analysisResult) ? storedWorkflow.analysisResult : null;
  });
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [viewerName, setViewerName] = useState("");

  const [selectedTemplate] = useState("newspaper");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "multiple";
    const storedWorkflow = parseStoredJson(localStorage.getItem(WORKFLOW_STORAGE_KEY), {});
    return storedWorkflow?.viewMode === "single" || storedWorkflow?.viewMode === "multiple" ? storedWorkflow.viewMode : "multiple";
  });
  const [showSlotLabels, setShowSlotLabels] = useState(() => {
    if (typeof window === "undefined") return false;
    const storedWorkflow = parseStoredJson(localStorage.getItem(WORKFLOW_STORAGE_KEY), {});
    return typeof storedWorkflow?.showSlotLabels === "boolean" ? storedWorkflow.showSlotLabels : false;
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    if (urlStepParam) return;
    router.replace(`${pathname}?step=${step}`, { scroll: false });
  }, [urlStepParam, step, pathname, router]);

  useEffect(() => {
    localStorage.setItem("adigator_platform", platform);
    localStorage.setItem("adigator_goal", campaignGoal || DEFAULT_CAMPAIGN_GOAL);
    if (campaignVertical) localStorage.setItem("adigator_vertical", campaignVertical);
    else localStorage.removeItem("adigator_vertical");

    try {
      localStorage.setItem(
        WORKFLOW_STORAGE_KEY,
        JSON.stringify({
          step,
          creatives,
          analysisResult,
          viewMode,
          showSlotLabels,
        })
      );
    } catch {
      // Ignore quota/serialization issues and keep runtime state alive.
    }
  }, [
    platform,
    campaignGoal,
    campaignVertical,
    step,
    creatives,
    analysisResult,
    viewMode,
    showSlotLabels,
  ]);

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
      throw new Error(message);
    }

    const payload = await response.json();
    const sessionId = payload?.sessionId;
    if (!sessionId) {
      throw new Error("Session creation succeeded but no sessionId was returned.");
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
    const fallbackGoal = allowedGoalIds[0] || DEFAULT_CAMPAIGN_GOAL;
    const nextGoal = allowedGoalIds.includes(campaignGoal) ? campaignGoal : fallbackGoal;

    setPlatform(id);
    if (nextGoal !== campaignGoal) {
      setCampaignGoal(nextGoal);
    }
    scrollToSection(goalSectionRef);

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession({ platform: id, campaign_goal: nextGoal });
      })
      .catch((error) => {
        console.error("Failed to persist platform selection", error);
      });
  }, [campaignGoal, scrollToSection, ensureAnalysisSession, updateAnalysisSession]);

  const handleGoalSelect = useCallback((id) => {
    const goalIds = PLATFORM_GOAL_IDS[platform] || PLATFORM_GOAL_IDS.programmatic;
    if (!goalIds.includes(id)) return;
    setCampaignGoal(id);

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession({ campaign_goal: id });
      })
      .catch((error) => {
        console.error("Failed to persist campaign goal", error);
      });
  }, [platform, ensureAnalysisSession, updateAnalysisSession]);

  const handleVerticalSelect = useCallback((id) => {
    setCampaignVertical(id);

    void ensureAnalysisSession()
      .then((sessionId) => {
        if (!sessionId) return;
        return updateAnalysisSession({ vertical: id });
      })
      .catch((error) => {
        console.error("Failed to persist campaign vertical", error);
      });
  }, [ensureAnalysisSession, updateAnalysisSession]);

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

  const validationResults = creatives.map((c) => c?.validation).filter(Boolean);
  const validationSummary = validationResults.length
    ? buildValidationSummary(validationResults)
    : { totalIssues: 0, criticalCount: 0, warningCount: 0, inventoryImpactScore: 100 };

  const goNext = useCallback(() => {
    if (step === 1 && !isConfigComplete) return;
    if (step === 2 && !canAdvanceToAnalysis) return;
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    router.push(`${pathname}?step=${nextStep}`, { scroll: true });
  }, [step, isConfigComplete, canAdvanceToAnalysis, pathname, router]);

  const goBack = useCallback(() => {
    if (step === 1) {
      router.push("/");
      return;
    }
    const prevStep = Math.max(step - 1, 1);
    router.push(`${pathname}?step=${prevStep}`, { scroll: true });
  }, [step, router, pathname]);

  useEffect(() => {
    if (!mountRef.current) return;
    if (step > 1 && !isConfigComplete) {
      router.replace(`${pathname}?step=1`, { scroll: false });
    }
  }, [step, isConfigComplete, pathname, router]);

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

  const saveToSupabase = useCallback(async (creative) => {
    try {
      const user = await getUser();
      if (!user) return;
      await supabase.from("creatives").upsert({
        id: creative.id,
        user_id: user.id,
        name: creative.name,
        size: creative.size,
        valid: creative.valid,
        previewed: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) { console.error("saveToSupabase error:", e); }
  }, [getUser]);

  const handleFiles = async (files) => {
    if (!platform) { addToast("Please select a platform first.", "error"); return; }
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    setIsLoading(true);
    try {
      const preparedCreatives = await Promise.all(fileList.map(async (file) => {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImageFromDataURL(dataUrl);
        const size = `${img.width}x${img.height}`;
        const validation = await validateCreativeAsset({
          file,
          image: img,
          platform,
          imageDataUrl: dataUrl,
        });

        const lowAvailabilityIssue = LOW_AVAILABILITY_SIZES.has(size)
          ? {
            type: "technical",
            severity: "medium",
            message: `${size} is valid but often has lower fill in open programmatic inventory.`,
            recommendation: "Keep this size if required, but prioritize 300x250, 336x280, 728x90, 970x250, or 300x600 for broader scale.",
            scorePenalty: 5,
          }
          : null;

        const mergedIssues = lowAvailabilityIssue
          ? [...validation.issues, lowAvailabilityIssue]
          : validation.issues;

        const normalizedValidation = {
          ...validation,
          issues: mergedIssues,
          status: deriveStatusFromIssues(mergedIssues),
        };

        return {
          id: `${Date.now()}-${file.name}-${size}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: dataUrl,
          size,
          valid: normalizedValidation.valid && normalizedValidation.status !== "CRITICAL",
          originalFile: file.name,
          fileSizeKB: Math.round(file.size / 1024),
          validation: normalizedValidation,
          placementType: normalizedValidation.intelligence?.placementType,
          deviceClassification: normalizedValidation.intelligence?.deviceClassification,
          iabCompatibility: normalizedValidation.intelligence?.iabCompatibility,
          dspCompatibility: normalizedValidation.intelligence?.dspCompatibility,
          inventoryAvailability: normalizedValidation.intelligence?.inventory,
          auctionReadiness: normalizedValidation.intelligence?.auctionReadiness,
          premiumPlacementPotential: normalizedValidation.intelligence?.premiumPlacement,
        };
      }));

      setCreatives((prev) => [...prev, ...preparedCreatives]);
      preparedCreatives.forEach((creative) => saveToSupabase(creative));

      const uploadSummary = buildValidationSummary(preparedCreatives.map((c) => c.validation));
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

  const downloadCreative = useCallback((creative) => {
    if (!creative.url) return;
    const a = document.createElement("a");
    a.href = creative.url;
    a.download = `${creative.name || "creative"}.${creative.url.startsWith("data:image/png") ? "png" : creative.url.startsWith("data:image/gif") ? "gif" : "jpg"}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    addToast(`Downloaded: ${creative.name}`, "success");
  }, [addToast]);

  const removeCreative = async (id) => {
    setCreatives((prev) => prev.filter((c) => c.id !== id));
    try {
      const user = await getUser();
      if (user) await supabase.from("creatives").delete().eq("id", id).eq("user_id", user.id);
    } catch (e) { console.error("removeCreative error:", e); }
  };

  const handleCreativeUpdate = useCallback((id, updates) => {
    setCreatives((prev) => {
      return prev.map((c) => {
        if (c.id !== id) return c;
        if (!originalBackups[id]) setOriginalBackups((b) => ({ ...b, [id]: { ...c } }));
        const newValidation = updates.validation ?? c.validation;
        const newValid = newValidation
          ? newValidation.valid && newValidation.status !== "CRITICAL"
          : allowedSizes.includes(updates.size || c.size);
        const updated = { ...c, ...updates, validation: newValidation, valid: newValid };
        saveToSupabase(updated);
        return updated;
      });
    });
  }, [originalBackups, allowedSizes, saveToSupabase]);

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
      const results = await analyzeAllCreatives(validCreatives, campaignGoal, platform, campaignVertical);
      setAnalysisResult(results);

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
  }, [validCreatives, campaignGoal, platform, campaignVertical, addToast]);

  useEffect(() => {
    if (step !== 3) return;
    if (analysisLoading || analysisResult) return;
    if (uploadedCreatives.length === 0) return;

    const timer = window.setTimeout(() => {
      void runAnalysis();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [step, analysisLoading, analysisResult, uploadedCreatives.length, runAnalysis]);

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
    } catch (err) { console.error(err); addToast("Failed to generate PDF", "error"); }
  }, [analysisResult, campaignGoal, platform, addToast]);

  const handleExportPptx = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true); addToast("Generating PPTX...", "info");
    try {
      const { exportToPptx } = await import("../lib/exportPptx");
      const templateName = TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Template";
      const filename = await exportToPptx(
        creatives.filter((c) => c.valid), 
        viewMode, 
        templateName,
        { goal: campaignGoal, platform }
      );
      addToast(`Downloaded: ${filename}`, "success");
    } catch { addToast("Export failed.", "error"); }
    finally { setIsExporting(false); }
  }, [isExporting, creatives, viewMode, selectedTemplate, addToast, campaignGoal, platform]);


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Adigator Creative Studio
          </h1>
          <div className="hidden lg:flex items-center gap-1 text-xs">
            {STEP_LABELS.map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-all ${step === idx + 1 ? "bg-purple-500/30 text-purple-300" : step > idx + 1 ? "text-green-400" : "text-gray-600"
                  }`}>
                  {step > idx + 1 ? "✓" : `${idx + 1}.`} {label}
                </div>
                {idx < STEP_LABELS.length - 1 && <span className="text-white/15 mx-0.5">›</span>}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* PROGRESS */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full origin-left bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: step / TOTAL_STEPS }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <AnimatePresence mode="wait">

          {/* STEP 1: SETUP CAMPAIGN */}
          {step === 1 && (
            <motion.div key="step-1" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12 pb-28">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 1: Setup Campaign</h2>
                <p className="text-gray-400">Configure platform, goal, and audience before uploading creatives.</p>
              </div>

              <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Selected Setup</p>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                  <p className="text-gray-300">Platform: <span className="text-white font-semibold">{PLATFORMS.find((p) => p.id === platform)?.title || platform}</span></p>
                  <p className="text-gray-300">Goal: <span className="text-white font-semibold">{getGoalTitle(campaignGoal, platform)}</span></p>
                  <p className="text-gray-300">Vertical: <span className="text-white font-semibold">{campaignVertical ? VERTICALS.find(v => v.id === campaignVertical)?.title : "None"}</span></p>
                </div>
              </motion.div>


              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white">Choose Platform</h3>
                  <p className="mt-1 text-gray-400">Where will these ads run? This determines size validation and best practices.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PLATFORMS.map((p) => (
                    <SelectionCard key={p.id} selected={platform === p.id} onClick={() => handlePlatformSelect(p.id)} activeClasses={`${p.color} ${p.border}`}>
                      <div className="text-5xl mb-4">{p.icon}</div>
                      <h3 className={`text-2xl font-extrabold mb-2 ${platform === p.id ? "text-white" : "text-gray-200"}`}>{p.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-4">{p.desc}</p>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-white/70 uppercase">{PLATFORM_INTELLIGENCE_LABEL[p.id]}:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(p.groups).map(([key, sizes]) => (
                            <span key={`${p.id}-${key}`} className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">
                              {GROUP_LABELS[key] || key}: {sizes.length}
                            </span>
                          ))}
                          {[...new Set(Object.values(p.groups).flat().slice(0, 6))].map((s, idx) => (
                            <span key={`${p.id}-${s}-${idx}`} className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">{s}</span>
                          ))}
                        </div>
                      </div>
                    </SelectionCard>
                  ))}
                </div>
              </motion.section>

              <motion.section ref={goalSectionRef} variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white">What is the campaign objective?</h3>
                  <p className="mt-1 text-gray-400">Select the marketing intent. This directly changes analysis psychology and scoring behavior.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {availableGoals.map((g) => (
                    <SelectionCard key={g.id} selected={campaignGoal === g.id} onClick={() => handleGoalSelect(g.id)} activeClasses={`${g.color} ${g.border}`}>
                      <div className="text-5xl mb-4">{g.emoji}</div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">{g.subtitle}</p>
                      <h3 className={`text-2xl font-extrabold mb-2 ${campaignGoal === g.id ? "text-white" : "text-gray-200"}`}>{getGoalTitle(g.id, platform)}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-6">{g.desc}</p>
                      {campaignGoal === g.id && (
                        <div className="bg-white/10 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-300 uppercase mb-2">Recommended CTAs:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(GOAL_CTA[g.id] || GOAL_CTA.awareness).map(cta => (
                              <span key={cta} className="px-2 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/30 rounded text-[10px]">{cta}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </SelectionCard>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white">Industry Vertical</h3>
                  <p className="mt-1 text-gray-400">Select the vertical for your campaign.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {VERTICALS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVerticalSelect(v.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        campaignVertical === v.id
                          ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </motion.section>

              <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/85 backdrop-blur-xl">
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
                <h2 className="text-4xl font-bold text-white mb-2">Step 2: Upload & Validate</h2>
                <p className="text-gray-400">
                  {selectedPlatformConfig?.title} {PLATFORM_INTELLIGENCE_LABEL[platform]} active: {allowedSizes.length} supported formats across intelligent inventory clusters.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-white">{PLATFORM_INTELLIGENCE_LABEL[platform]}</h3>
                  <p className="text-xs text-purple-200/90 bg-purple-500/15 border border-purple-500/25 rounded-full px-3 py-1">
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

              {isLoading && (
                <div className="text-center py-4"><div className="inline-block w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
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

              {/* Valid List */}
              {validCreatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Valid Creatives</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {validCreatives.map((creative) => (
                      <div key={creative.id} className="flex flex-col gap-1">
                        <CreativeCard creative={creative} onRemove={removeCreative} />
                        {editingId === creative.id ? (
                          <div className="flex gap-1 mt-1">
                            <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(creative.id); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 min-w-0 bg-white/10 border border-purple-500 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                            <button onClick={() => saveEdit(creative.id)} className="px-2 py-1 bg-purple-600 rounded-lg text-xs text-white">✓</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(creative.id, creative.name)} className="text-left flex items-center gap-1 mt-1 group/rn">
                            <span className="text-xs text-gray-400 truncate group-hover/rn:text-purple-300">{creative.name}</span>
                            <span className="text-[10px] text-gray-600 group-hover/rn:text-purple-400">✏️</span>
                          </button>
                        )}
                        <button onClick={() => downloadCreative(creative)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 mt-1">
                          <Download size={12} /> Download
                        </button>
                        {creative.validation?.issues?.length > 0 && (
                          <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2">
                            <p className="text-[11px] font-semibold text-amber-300">
                              {creative.validation.status} • {creative.validation.issues.length} issue{creative.validation.issues.length > 1 ? "s" : ""}
                            </p>
                            <div className="mt-2 space-y-1.5">
                              {creative.validation.issues.slice(0, 3).map((issue, idx) => (
                                <div key={`${creative.id}-issue-${idx}`} className="rounded-md border border-white/10 bg-black/15 p-1.5">
                                  <p className="text-[10px] text-amber-100 font-semibold uppercase tracking-wide">
                                    {issue.severity} • {issue.type}
                                  </p>
                                  <p className="text-[10px] text-amber-100/90 mt-0.5 leading-snug">{issue.message}</p>
                                  <p className="text-[10px] text-amber-200/80 mt-0.5 leading-snug">Fix: {issue.recommendation}</p>
                                </div>
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
                          <CreativeCard creative={creative} onEdit={(c) => setEditModalCreative(c)} onRemove={removeCreative} />
                          {creative.validation?.issues?.length > 0 && (
                            <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-2">
                              {creative.validation.issues.slice(0, 3).map((issue, idx) => (
                                <div key={`${creative.id}-critical-issue-${idx}`} className="mb-1.5 last:mb-0 rounded-md border border-white/10 bg-black/15 p-1.5">
                                  <p className="text-[10px] text-red-200 font-semibold uppercase tracking-wide">
                                    {issue.severity} • {issue.type}
                                  </p>
                                  <p className="text-[10px] text-red-100 mt-0.5 leading-snug">{issue.message}</p>
                                  <p className="text-[10px] text-red-200/80 mt-0.5 leading-snug">Fix: {issue.recommendation}</p>
                                </div>
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
                  Selected goal: <span className="text-white font-semibold capitalize">{campaignGoal}</span> · Selected vertical: <span className="text-white font-semibold">{VERTICAL_TITLE_MAP[campaignVertical] || campaignVertical}</span>
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
                  <p className="text-gray-400">See your creatives in realistic interactive website contexts.</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportPptx} disabled={isExporting}
                  className="px-8 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60">
                  <Download size={20} /> {isExporting ? "Exporting..." : "Export PPTX"}
                </motion.button>
              </div>

              {validCreatives.length > 0 && (
                <ContextualPreviewEngine
                  creatives={validCreatives.map((creative, index) => ({
                    id: creative.id,
                    name: creative.name,
                    url: creative.url || creative.imageDataUrl || creative.image || "",
                    size: creative.size,
                    analyzerOutput: getEntryPayload(analysisResult?.[index]) || {},
                    ctaText: "",
                    headline: (getEntryPayload(analysisResult?.[index]) || {}).main_strategic_problem ?? "",
                  }))}
                  vertical={campaignVertical || "general"}
                  goal={campaignGoal || "awareness"}
                />
              )}

              {validCreatives.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/3 border border-white/10 rounded-2xl">
                  <span className="text-4xl mb-4">🌐</span>
                  <p className="text-white font-semibold">No valid creatives to preview</p>
                  <p className="text-gray-400 text-sm mt-1">Upload and validate a creative in step 2 first.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
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
          onApply={handleCreativeUpdate}
          onClose={() => setEditModalCreative(null)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
