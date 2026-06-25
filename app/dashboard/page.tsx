"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { SkeletonStatCard } from "../components/SkeletonLoader";
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
import {
  Zap, TrendingUp, Eye, ImageIcon, Plus, ArrowRight, Clock, Shield, Building2,
} from "lucide-react";
import { useAdminAuth } from "../lib/admin-platform/AdminAuthContext";
import { useOrgAuth } from "../lib/organization-platform/OrgAuthContext";

const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalCreatives: 0, validCreatives: 0, invalidCreatives: 0, platformsUsed: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdminAuth();
  const { isOrgAdmin, organizationName, memberRole } = useOrgAuth();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        void trackUserActivity("page_visit", {
          action_label: "Dashboard visited",
          metadata: { page: "dashboard" },
        }, { dedupeKey: "page-visit-dashboard" });

        const [creatives, activityStats, analyzedCreativeIds] = await Promise.all([
          fetchUserCreatives(),
          fetchUserDashboardAnalytics(user.id),
          fetchAnalyzerResultCreativeIds(),
        ]);

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
      }
      setLoading(false);
    };
    load();
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-10 pb-10">

      <motion.div variants={fade} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <span className="text-xs font-bold tracking-widest uppercase">{today}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Good day, {firstName}
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {organizationName
              ? `Your personal workspace · ${organizationName}${memberRole ? ` (${memberRole.replace("_", " ")})` : ""}`
              : "Your creative workflow at a glance"}
          </p>
        </div>
        <Link href="/preview-tool?step=1">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-shadow premium-card-glow"
          >
            <Plus size={18} /> Open Preview Tool
          </motion.button>
        </Link>
      </motion.div>

      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { href: "/preview-tool?step=1", icon: Plus, label: "Open Preview Tool", sub: "Launch the full analyzer workflow", color: "from-purple-600 to-blue-600" },
            { href: "/preview-tool?step=3", icon: Clock, label: "Resume Analysis", sub: "Continue where you left off", color: "from-blue-600 to-cyan-600" },
            ...(isOrgAdmin ? [{ href: "/dashboard/organization", icon: Building2, label: "Organization Console", sub: "Manage teams, users, and org activity", color: "from-sky-600 to-blue-600" }] : []),
            ...(isAdmin ? [{ href: "/dashboard/admin", icon: Shield, label: "Super Admin Console", sub: "Organizations, users, analytics & platform health", color: "from-amber-600 to-orange-600" }] : []),
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href + a.label} href={a.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -3 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-4 hover:border-purple-500/35 hover:bg-white/8 transition-all cursor-pointer overflow-hidden premium-card premium-card-glow"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{a.label}</p>
                    <p className="text-xs text-white/40">{a.sub}</p>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-purple-400 transition shrink-0" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Overview</h2>
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Creatives", value: stats.totalCreatives, Icon: ImageIcon, color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", text: "text-blue-400" },
              { label: "Valid Creatives", value: stats.validCreatives, Icon: TrendingUp, color: "from-green-500/20 to-green-600/10", border: "border-green-500/20", text: "text-green-400" },
              { label: "Invalid", value: stats.invalidCreatives, Icon: Zap, color: "from-red-500/20 to-red-600/10", border: "border-red-500/20", text: "text-red-400" },
              { label: "Platforms Used", value: stats.platformsUsed, Icon: Eye, color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20", text: "text-purple-400" },
            ].map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.color} p-5 transition-all premium-card premium-card-glow`}
              >
                <s.Icon size={20} className={`${s.text} mb-3`} />
                <p className="text-3xl font-extrabold text-white">{s.value.toLocaleString()}</p>
                <p className="text-sm text-white/40 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}
        {!loading && stats.validCreatives > 0 && stats.invalidCreatives > 0 ? (
          <p className="text-xs text-white/30 mt-2">
            Valid and invalid counts are cumulative across your upload history. A creative fixed after an initial failure may appear in both totals.
          </p>
        ) : null}
      </motion.div>

      <motion.div variants={fade}>
        <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Activity Analytics</h2>
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ) : (
          <UserAnalyticsCharts analytics={analytics} />
        )}
      </motion.div>

    </motion.div>
  );
}
