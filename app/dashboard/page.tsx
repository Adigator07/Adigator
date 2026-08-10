"use client";

import { useEffect, useState } from "react";
import { getClientUser } from "../lib/supabaseAuthClient";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SkeletonStatCard } from "../components/SkeletonLoader";
import AdigatorLaunchScreen from "../components/AdigatorLaunchScreen";
import {
  fetchUserCreatives,
  fetchAnalyzerResultCreativeIds,
  trackUserActivity,
} from "../lib/supabaseDataService";
import {
  fetchUserDashboardAnalytics,
  computeCreativeCountStats,
} from "../lib/userDashboardAnalytics";
import UserAnalyticsCharts from "../components/dashboard/UserAnalyticsCharts";
import AdvertisersSection from "../components/dashboard/AdvertisersSection";
import { listAdvertisers, pruneInvalidAdvertisers, rebuildAdvertisersFromProgrammaticCampaigns, ADVERTISERS_STORAGE_KEY, type Advertiser } from "../lib/advertiserStore";
import { PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY } from "../lib/programmaticCampaignStore";
import { invalidateStorageCache } from "../lib/clientStorageCache";
import { resolveCampaignOwnerId } from "../lib/campaignOwnerScope";
import {
  Zap, TrendingUp, Eye, ImageIcon, Plus, ArrowRight, Clock, Shield, Building2, ShieldCheck,
} from "lucide-react";
import { useAdminAuth } from "../lib/admin-platform/AdminAuthContext";
import { useOrgAuth } from "../lib/organization-platform/OrgAuthContext";

const EASE = [0.22, 1, 0.36, 1] as const;

type DashboardUser = Awaited<ReturnType<typeof getClientUser>>;
type DashboardAnalytics = Awaited<ReturnType<typeof fetchUserDashboardAnalytics>>;

function DashboardLoadingPanel({
  title,
  subtitle,
  progress,
}: {
  title: string;
  subtitle: string;
  progress: number;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center py-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4 w-full max-w-xs">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <span>Loaded</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-sky-100/80">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-sky-500 via-cyan-400 to-emerald-400"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const reduceMotion = useReducedMotion();
  const [user, setUser] = useState<DashboardUser>(null);
  const [stats, setStats] = useState({ totalCreatives: 0, validCreatives: 0, invalidCreatives: 0, platformsUsed: 0 });
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaignOwnerId, setCampaignOwnerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [advertisersLoading, setAdvertisersLoading] = useState(true);
  const [overviewLoadingProgress, setOverviewLoadingProgress] = useState(12);
  const [advertisersLoadingProgress, setAdvertisersLoadingProgress] = useState(10);
  const { isAdmin } = useAdminAuth();
  const { isOrgAdmin, organizationName, memberRole } = useOrgAuth();
  const displayedOverviewProgress = loading ? overviewLoadingProgress : 100;
  const displayedAdvertisersProgress = advertisersLoading ? advertisersLoadingProgress : 100;

  const stageTransition = {
    duration: reduceMotion ? 0 : 0.32,
    ease: EASE,
  };
  const crossfadeTransition = {
    duration: reduceMotion ? 0 : 0.28,
    ease: EASE,
  };
  const hoverLift = reduceMotion ? undefined : { y: -2 };
  const hoverTap = reduceMotion ? undefined : { y: 0 };

  useEffect(() => {
    if (!loading) return undefined;

    const interval = window.setInterval(() => {
      setOverviewLoadingProgress((current) => Math.min(92, current + (current < 60 ? 9 : 4)));
    }, 180);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    if (!advertisersLoading) return undefined;

    const interval = window.setInterval(() => {
      setAdvertisersLoadingProgress((current) => Math.min(94, current + (current < 55 ? 8 : 3)));
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [advertisersLoading]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const currentUser = await Promise.race([
          getClientUser(),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 4000);
          }),
        ]);
        if (!active) return;

        setUser(currentUser);
        if (!currentUser) {
          setAdvertisersLoading(false);
          return;
        }

        const ownerIdPromise = resolveCampaignOwnerId();

        void trackUserActivity("page_visit", {
          action_label: "Dashboard visited",
          metadata: { page: "dashboard" },
        }, { dedupeKey: "page-visit-dashboard" });

        const dataPromise = Promise.all([
          fetchUserCreatives(),
          fetchUserDashboardAnalytics(currentUser.id),
          fetchAnalyzerResultCreativeIds(),
        ]);

        const ownerId = await ownerIdPromise;
        if (!active) return;

        setCampaignOwnerId(ownerId);
        rebuildAdvertisersFromProgrammaticCampaigns(ownerId);
        setAdvertisers(pruneInvalidAdvertisers(ownerId));
        setAdvertisersLoading(false);

        const [creatives, activityStats, analyzedCreativeIds] = await dataPromise;
        if (!active) return;

        const counts = computeCreativeCountStats(creatives, activityStats, analyzedCreativeIds);
        const platformSet = new Set(
          activityStats.platformUsage.filter((p) => p.count > 0).map((p) => p.platform),
        );

        setStats({
          totalCreatives: counts.totalCreatives,
          validCreatives: counts.validCreatives,
          invalidCreatives: counts.invalidCreatives,
          platformsUsed: platformSet.size,
        });
        setAnalytics(activityStats);
      } catch (error) {
        console.warn("[Dashboard] Failed to load dashboard data:", error);
      } finally {
        if (active) {
          setLoading(false);
          setAdvertisersLoading(false);
        }
      }
    };

    void load();

    const failSafe = window.setTimeout(() => {
      if (active) {
        setLoading(false);
        setAdvertisersLoading(false);
      }
    }, 6000);

    return () => {
      active = false;
      window.clearTimeout(failSafe);
    };
  }, []);

  useEffect(() => {
    if (!campaignOwnerId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshAdvertisers = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        setAdvertisers(listAdvertisers(campaignOwnerId));
      }, 300);
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key
        && event.key !== ADVERTISERS_STORAGE_KEY
        && event.key !== PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY
      ) {
        return;
      }
      if (event.key) invalidateStorageCache(event.key);
      refreshAdvertisers();
    };

    window.addEventListener("adigator-advertisers-updated", refreshAdvertisers);
    window.addEventListener("storage", handleStorage);
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("adigator-advertisers-updated", refreshAdvertisers);
      window.removeEventListener("storage", handleStorage);
    };
  }, [campaignOwnerId]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const overviewStats = [
    { label: "Total Creatives", value: stats.totalCreatives, Icon: ImageIcon, color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/25", text: "text-blue-400" },
    { label: "Valid Creatives", value: stats.validCreatives, Icon: TrendingUp, color: "from-green-500/20 to-green-600/10", border: "border-green-500/25", text: "text-green-400" },
    { label: "Invalid", value: stats.invalidCreatives, Icon: Zap, color: "from-red-500/20 to-red-600/10", border: "border-red-500/25", text: "text-red-400" },
    { label: "Platforms Used", value: stats.platformsUsed, Icon: Eye, color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/25", text: "text-purple-400" },
  ];

  return (
    <>
      <div className="relative min-h-[50vh]">
        {loading ? <AdigatorLaunchScreen embedded /> : null}
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={
            loading
              ? (reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 })
              : { opacity: 1, y: 0 }
          }
          transition={stageTransition}
          className="relative space-y-10 pb-10"
        >
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sky-600">
              <span className="text-xs font-bold uppercase tracking-widest">{today}</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-800">
              Good day, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {organizationName
                ? `Your personal workspace · ${organizationName}${memberRole ? ` (${memberRole.replace("_", " ")})` : ""}`
                : "Your creative workflow at a glance"}
            </p>
          </div>
          <div>
            <Link href="/preview-tool?step=campaign-setup">
              <motion.button
                whileHover={hoverLift}
                whileTap={hoverTap}
                transition={{ duration: 0.2, ease: EASE }}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 transition-shadow hover:shadow-sky-500/40 premium-card-glow"
              >
                <Plus size={18} /> Open Campaign Intelligence Studio
              </motion.button>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: "/preview-tool?step=campaign-setup", icon: Plus, label: "Campaign Intelligence Studio", sub: "Launch Campaign Setup through Preview Studio", color: "from-purple-600 to-blue-600" },
              { href: "/preview-tool?step=campaign-intelligence", icon: Clock, label: "Resume Campaign Intelligence", sub: "Continue where you left off", color: "from-blue-600 to-cyan-600" },
              { href: "/dashboard/qa", icon: ShieldCheck, label: "QA Workspace", sub: "Review readiness, alerts, and launch recommendations", color: "from-emerald-600 to-cyan-600" },
              ...(isOrgAdmin ? [{ href: "/dashboard/organization", icon: Building2, label: "Organization Console", sub: "Manage teams, users, and org activity", color: "from-sky-600 to-blue-600" }] : []),
              ...(isAdmin ? [{ href: "/dashboard/admin", icon: Shield, label: "Super Admin Console", sub: "Organizations, users, analytics & platform health", color: "from-amber-600 to-orange-600" }] : []),
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href + a.label} href={a.href}>
                  <motion.div
                    whileHover={hoverLift}
                    whileTap={hoverTap}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-white/70 bg-white/88 p-4 shadow-[0_18px_50px_-28px_rgba(14,116,144,0.35)] transition-all hover:border-sky-200/90 hover:bg-white premium-card premium-card-glow"
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${a.color} shadow-sm`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                      <p className="text-xs text-slate-500">{a.sub}</p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:text-sky-600" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Overview</h2>
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.div
                key="overview-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={crossfadeTransition}
                className="space-y-4"
              >
                <DashboardLoadingPanel
                  title="Overview Sync"
                  subtitle="Preparing strategic metrics, platform usage, and validation history."
                  progress={displayedOverviewProgress}
                />
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="overview-ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={crossfadeTransition}
              >
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {overviewStats.map((s) => (
                    <motion.div
                      key={s.label}
                      whileHover={hoverLift}
                      whileTap={hoverTap}
                      transition={{ duration: 0.2, ease: EASE }}
                      className={`rounded-2xl border ${s.border} bg-white/88 p-5 shadow-[0_18px_45px_-24px_rgba(14,116,144,0.3)] transition-all premium-card premium-card-glow`}
                    >
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${s.color}`}>
                        <s.Icon size={20} className={`${s.text}`} />
                      </div>
                      <p className="text-3xl font-extrabold text-slate-800">{s.value.toLocaleString()}</p>
                      <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                    </motion.div>
                  ))}
                </div>
                {stats.validCreatives > 0 && stats.invalidCreatives > 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Valid and invalid counts are cumulative across your upload history. A creative fixed after an initial failure may appear in both totals.
                  </p>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <AdvertisersSection advertisers={advertisers} loading={advertisersLoading} ownerId={campaignOwnerId} loadingProgress={displayedAdvertisersProgress} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Activity Analytics</h2>
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.div
                key="analytics-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={crossfadeTransition}
                className="h-64 rounded-2xl border border-white/50 bg-white/70"
              />
            ) : (
              <motion.div
                key="analytics-ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={crossfadeTransition}
              >
                <UserAnalyticsCharts analytics={analytics} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </>
  );
}
