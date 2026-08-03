"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Activity, BarChart3, Gauge, Globe2 } from "lucide-react";
import { timeAsyncOperation, useRouteLoadTelemetry } from "@/app/lib/routeTelemetry";

type QaSummary = {
  health: number;
  tracking: number;
  landingPage: number;
  aiReadiness: number;
  approvals: number;
};

type AlertItem = {
  title: string;
  severity: string;
  detail: string;
};

type CampaignItem = {
  id: string;
  name: string;
  platform: string;
  owner: string;
  status: string;
  score: number;
  lastReviewed: string;
  nextAction: string;
  flags: string[];
};

type Recommendation = {
  title: string;
  detail: string;
};

type IntegrationState = {
  connected: boolean;
  platform: string;
  label: string;
  customerId?: string;
};

export function QaOverviewDashboard() {
  const [summary, setSummary] = useState<QaSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [integration, setIntegration] = useState<IntegrationState>({ connected: false, platform: "Google Ads", label: "Connect Google Ads to import live campaign data" });
  const [subtleMessage, setSubtleMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const markRouteReady = useRouteLoadTelemetry("qa");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await timeAsyncOperation(
          "qa",
          "GET /api/qa/overview",
          () => fetch("/api/qa/overview", { cache: "no-store" }),
        );
        const payload = await response.json();
        if (!active) return;
        setSummary(payload.summary);
        setAlerts(payload.alerts);
        setCampaigns(payload.campaigns);
        setRecommendations(payload.recommendations);
        setIntegration(payload.integration || {
          connected: false,
          platform: "Google Ads",
          label: "Connect Google Ads to import live campaign data",
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    const onAuthMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; message?: string } | undefined;
      if (payload?.type === "google-ads-auth") {
        setSubtleMessage(payload.message || "Google Ads status refreshed.");
        void load();
      }
    };

    void load();
    window.addEventListener("message", onAuthMessage);
    return () => {
      active = false;
      window.removeEventListener("message", onAuthMessage);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      markRouteReady("data_ready", {
        hasSummary: Boolean(summary),
        campaignCount: campaigns.length,
      });
    }
  }, [campaigns.length, loading, markRouteReady, summary]);

  const scoreCards = useMemo(() => {
    if (!summary) return [];
    return [
      { key: "Health", value: summary.health, icon: ShieldCheck, tone: "from-emerald-500/20 to-emerald-400/10" },
      { key: "Tracking", value: summary.tracking, icon: Activity, tone: "from-sky-500/20 to-sky-400/10" },
      { key: "Landing page", value: summary.landingPage, icon: Globe2, tone: "from-violet-500/20 to-violet-400/10" },
      { key: "AI readiness", value: summary.aiReadiness, icon: Sparkles, tone: "from-amber-500/20 to-amber-400/10" },
      { key: "Approvals", value: summary.approvals, icon: Gauge, tone: "from-rose-500/20 to-rose-400/10" },
    ];
  }, [summary]);

  const handleConnectGoogleAds = () => {
    const popup = window.open("/api/google-ads/oauth/start", "google-ads-connect", "width=640,height=760,scrollbars=yes,resizable=yes");
    if (!popup) {
      setSubtleMessage("Popups are blocked. Please allow them and try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(247,250,252,0.95))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">Campaign QA command center</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Enterprise-grade launch quality monitoring</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Monitor readiness, protect budget, and surface the highest-risk issues before approvals are finalized.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Live readiness: {loading ? "—" : `${summary?.health ?? 0}/100`}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Live data source</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">{integration.connected ? `Connected to ${integration.platform}` : "Google Ads sync is not active yet"}</h3>
              <p className="mt-1 text-sm text-slate-600">{integration.label}{integration.customerId ? ` · Customer ${integration.customerId}` : ""}</p>
            </div>
            <button
              type="button"
              onClick={handleConnectGoogleAds}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {integration.connected ? "Reconnect Google Ads" : "Connect Google Ads"}
            </button>
          </div>
          {subtleMessage ? <p className="mt-3 text-sm text-sky-700">{subtleMessage}</p> : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {scoreCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.key}
                whileHover={{ y: -3, scale: 1.01 }}
                className={`rounded-2xl border border-slate-200/80 bg-linear-to-br ${card.tone} p-4`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{card.key}</p>
                  <Icon className="h-4 w-4 text-slate-600" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-900">{loading ? "—" : card.value}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Live campaign queue</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">High-priority launch reviews</h3>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <BarChart3 className="h-3.5 w-3.5" />
              {campaigns.length} active campaigns
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
                    <p className="text-xs text-slate-500">{campaign.platform} · Owner {campaign.owner}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{campaign.score}/100</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{campaign.status}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {campaign.flags.map((flag) => (
                    <span key={flag} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">{flag}</span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <p>Next action: {campaign.nextAction}</p>
                  <p>Reviewed {campaign.lastReviewed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-amber-200/80 bg-amber-50/70 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-black text-slate-900">Critical alerts</h3>
            </div>
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-amber-200/80 bg-white/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">{alert.severity}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{alert.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-600" />
              <h3 className="text-lg font-black text-slate-900">Recommended actions</h3>
            </div>
            <div className="mt-4 space-y-3">
              {recommendations.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">AI approval assistant</p>
            <h3 className="mt-1 text-xl font-black">Launch decisions should be evidence-based and fast</h3>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Open review flow <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> <span className="text-sm font-semibold">Auto-validated</span></div>
            <p className="mt-3 text-sm text-slate-300">Consent state, GA4 tagging, and canonical checks are updated in real time.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2 text-sky-400"><Activity className="h-4 w-4" /> <span className="text-sm font-semibold">Budget protection</span></div>
            <p className="mt-3 text-sm text-slate-300">Risk scoring blocks launches with unresolved tracking or landing-page drift.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2 text-violet-400"><ShieldCheck className="h-4 w-4" /> <span className="text-sm font-semibold">Approval confidence</span></div>
            <p className="mt-3 text-sm text-slate-300">Reviewers can see the evidence trail and recommended remediation steps in one place.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
