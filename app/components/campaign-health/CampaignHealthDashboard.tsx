"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { getFirebaseClientAuthOrNull } from "@/app/lib/firebase/client";
import { resolveCampaignOwnerId } from "@/app/lib/campaignOwnerScope";
import {
  HEALTH_INTERVALS,
  type CampaignHealthAlert,
  type CampaignHealthAuditEntry,
  type CampaignHealthMonitor,
  type CampaignHealthReport,
  type CampaignHealthWorkspace,
  type HealthCatalogAccount,
  type HealthCatalogCampaign,
} from "@/app/lib/campaignHealth/types";
import {
  emptyCampaignHealthWorkspace,
  monitorKey,
  readCampaignHealthWorkspace,
  writeCampaignHealthWorkspace,
} from "@/app/lib/campaignHealth/workspaceStore";

const ACCOUNT_CACHE_KEY = "adigator_health_accounts_v1";
const CAMPAIGN_CACHE_PREFIX = "adigator_health_campaigns_v1:";
const CACHE_TTL_MS = 60_000;

function readJsonCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expiresAt?: number; value?: T };
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

function writeJsonCache<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, value }));
  } catch {
    // Ignore quota errors.
  }
}

function initialOwnerId() {
  try {
    return getFirebaseClientAuthOrNull()?.currentUser?.uid || "";
  } catch {
    return "";
  }
}

function gradeClass(grade: string) {
  if (grade === "healthy") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (grade === "watch") return "text-amber-800 bg-amber-50 border-amber-200";
  if (grade === "at_risk") return "text-orange-800 bg-orange-50 border-orange-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function severityClass(severity: string) {
  if (severity === "critical") return "border-red-200 bg-red-50 text-red-800";
  if (severity === "high") return "border-orange-200 bg-orange-50 text-orange-800";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

export default function CampaignHealthDashboard() {
  const [ownerId, setOwnerId] = useState(initialOwnerId);
  const [workspace, setWorkspace] = useState<CampaignHealthWorkspace>(() => (
    initialOwnerId() ? readCampaignHealthWorkspace(initialOwnerId()) : emptyCampaignHealthWorkspace("")
  ));
  const [accounts, setAccounts] = useState<HealthCatalogAccount[]>([]);
  const [connected, setConnected] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  const persist = useCallback((next: CampaignHealthWorkspace) => {
    setWorkspace(next);
    writeCampaignHealthWorkspace(next);
  }, []);

  useEffect(() => {
    let active = true;
    void resolveCampaignOwnerId().then((id) => {
      if (!active || !id) return;
      setOwnerId(id);
      setWorkspace(readCampaignHealthWorkspace(id));
    });
    return () => {
      active = false;
    };
  }, []);

  const loadAccounts = useCallback(async () => {
    const cached = readJsonCache<{ connected: boolean; accounts: HealthCatalogAccount[] }>(ACCOUNT_CACHE_KEY);
    if (cached?.accounts?.length) {
      setConnected(cached.connected);
      setAccounts(cached.accounts);
      setSelectedAccount((current) => current || cached.accounts[0]?.customerId || "");
      setLoadingCatalog(false);
    } else {
      setLoadingCatalog(true);
    }

    setCatalogError("");
    try {
      const response = await fetch("/api/campaign-health/catalog", { cache: "no-store" });
      const payload = await response.json();
      const nextAccounts = Array.isArray(payload.accounts) ? payload.accounts as HealthCatalogAccount[] : [];
      setConnected(Boolean(payload.connected));
      setAccounts((current) => {
        const previous = new Map(current.map((account) => [account.customerId, account]));
        return nextAccounts.map((account) => ({
          ...account,
          campaigns: account.campaigns.length
            ? account.campaigns
            : (previous.get(account.customerId)?.campaigns || []),
        }));
      });
      if (!response.ok) setCatalogError(payload.error || "Could not load Google Ads campaigns.");
      if (nextAccounts[0]?.customerId) {
        setSelectedAccount((current) => current || nextAccounts[0].customerId);
      }
      writeJsonCache(ACCOUNT_CACHE_KEY, { connected: Boolean(payload.connected), accounts: nextAccounts });
    } catch (error) {
      if (!cached?.accounts?.length) {
        setCatalogError(error instanceof Error ? error.message : "Could not load Google Ads campaigns.");
      }
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const loadedCampaignsRef = useRef(new Set<string>());

  const loadAccountCampaigns = useCallback(async (account: HealthCatalogAccount) => {
    if (loadedCampaignsRef.current.has(account.customerId)) return;
    const cacheKey = `${CAMPAIGN_CACHE_PREFIX}${account.customerId}:${account.loginCustomerId || ""}`;
    const cached = readJsonCache<HealthCatalogCampaign[]>(cacheKey);
    if (cached?.length) {
      loadedCampaignsRef.current.add(account.customerId);
      setAccounts((current) => current.map((item) => (
        item.customerId === account.customerId ? { ...item, campaigns: cached } : item
      )));
      return;
    }

    setLoadingCampaigns(true);
    try {
      const params = new URLSearchParams({ customerId: account.customerId });
      if (account.loginCustomerId) params.set("loginCustomerId", account.loginCustomerId);
      const response = await fetch(`/api/campaign-health/catalog?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      const campaigns = Array.isArray(payload.campaigns) ? payload.campaigns as HealthCatalogCampaign[] : [];
      writeJsonCache(cacheKey, campaigns);
      loadedCampaignsRef.current.add(account.customerId);
      setAccounts((current) => current.map((item) => (
        item.customerId === account.customerId ? { ...item, campaigns } : item
      )));
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Could not load campaigns for this account.");
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const account = accounts.find((item) => item.customerId === selectedAccount) || accounts[0];
    if (!account || account.campaigns.length) return;
    void loadAccountCampaigns(account);
  }, [accounts, loadAccountCampaigns, selectedAccount]);

  const selectedIds = useMemo(
    () => new Set(workspace.monitors.filter((monitor) => monitor.enabled).map((monitor) => monitor.id)),
    [workspace.monitors],
  );

  const toggleCampaign = (account: HealthCatalogAccount, campaign: HealthCatalogCampaign) => {
    const id = monitorKey(account.customerId, campaign.id);
    const exists = workspace.monitors.find((monitor) => monitor.id === id);
    let monitors: CampaignHealthMonitor[];
    let audit = workspace.audit;
    if (exists) {
      const enabled = !exists.enabled;
      monitors = workspace.monitors.map((monitor) => (monitor.id === id ? { ...monitor, enabled } : monitor));
      audit = [{
        id: `audit-${id}-${Date.now()}`,
        monitorId: id,
        campaignName: campaign.name,
        event: enabled ? "monitor_added" : "monitor_removed",
        summary: enabled ? `Started monitoring ${campaign.name}` : `Stopped monitoring ${campaign.name}`,
        createdAt: new Date().toISOString(),
      }, ...audit].slice(0, 200);
    } else {
      const monitor: CampaignHealthMonitor = {
        id,
        customerId: account.customerId,
        loginCustomerId: account.loginCustomerId,
        accountName: account.name,
        campaignId: campaign.id,
        campaignName: campaign.name,
        channelType: campaign.channelType,
        status: campaign.status,
        enabled: true,
        lastScore: null,
        lastGrade: null,
        lastCheckedAt: null,
        lastIssueIds: [],
      };
      monitors = [monitor, ...workspace.monitors];
      audit = [{
        id: `audit-${id}-${Date.now()}`,
        monitorId: id,
        campaignName: campaign.name,
        event: "monitor_added",
        summary: `Started monitoring ${campaign.name} in ${account.name}`,
        createdAt: new Date().toISOString(),
      }, ...audit].slice(0, 200);
    }
    persist({ ...workspace, ownerId, monitors, audit });
  };

  const runChecks = useCallback(async () => {
    const enabled = workspace.monitors.filter((monitor) => monitor.enabled);
    if (!enabled.length) return;
    setRunning(true);
    setRunMessage("");
    try {
      const response = await fetch("/api/campaign-health/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitors: enabled }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Health check failed.");
      const reports = (payload.reports || []) as CampaignHealthReport[];
      const openedAlerts = (payload.openedAlerts || []) as CampaignHealthAlert[];
      const audit = (payload.audit || []) as CampaignHealthAuditEntry[];
      const reportMap = { ...workspace.reports };
      const monitors = workspace.monitors.map((monitor) => {
        const report = reports.find((item) => item.monitorId === monitor.id);
        if (!report) return monitor;
        reportMap[monitor.id] = report;
        return {
          ...monitor,
          lastScore: report.score,
          lastGrade: report.grade,
          lastCheckedAt: report.snapshot.checkedAt,
          lastIssueIds: report.issues.map((issue) => issue.id),
          campaignName: report.snapshot.campaignName || monitor.campaignName,
          status: report.snapshot.status || monitor.status,
        };
      });
      persist({
        ...workspace,
        ownerId,
        monitors,
        reports: reportMap,
        alerts: [...openedAlerts, ...workspace.alerts].slice(0, 100),
        audit: [...audit, ...workspace.audit].slice(0, 200),
      });
      setRunMessage(`Checked ${reports.length} campaign${reports.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setRunMessage(error instanceof Error ? error.message : "Health check failed.");
    } finally {
      setRunning(false);
    }
  }, [ownerId, persist, workspace]);

  const runChecksRef = useRef(runChecks);
  runChecksRef.current = runChecks;

  useEffect(() => {
    if (!ownerId) return undefined;
    const intervalMs = Math.max(15, workspace.intervalMinutes) * 60 * 1000;
    const timer = window.setInterval(() => {
      void runChecksRef.current();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [ownerId, workspace.intervalMinutes]);

  const openAlerts = workspace.alerts.filter((alert) => !alert.acknowledged);
  const activeAccount = accounts.find((account) => account.customerId === selectedAccount) || accounts[0];
  const monitoredReports = workspace.monitors
    .filter((monitor) => monitor.enabled)
    .map((monitor) => workspace.reports[monitor.id])
    .filter((report): report is CampaignHealthReport => Boolean(report));

  const averageScore = monitoredReports.length
    ? Math.round(monitoredReports.reduce((sum, report) => sum + report.score, 0) / monitoredReports.length)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Campaign Health & Validation</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-800">Keep live Google Ads campaigns healthy</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Select accounts and campaigns to monitor. Adigator IQ checks budgets, conversion tracking, ads, landing pages, and policy status, then alerts you with actionable fixes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/forecast" className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800">
            Audience Forecast
          </Link>
          <button
            type="button"
            onClick={() => void runChecks()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <RefreshCw size={16} className={running ? "animate-spin" : ""} />
            {running ? "Checking…" : "Run health check"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Monitored campaigns", value: workspace.monitors.filter((monitor) => monitor.enabled).length, icon: HeartPulse },
          { label: "Average health score", value: averageScore == null ? "—" : averageScore, icon: ShieldCheck },
          { label: "Open alerts", value: openAlerts.length, icon: Bell },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Icon size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">{card.label}</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      {!connected && !loadingCatalog ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-950">Connect Google Ads to start monitoring</p>
          <p className="mt-1 text-sm text-amber-900/80">Sign in once, then choose the accounts and campaigns Adigator IQ should watch.</p>
          <a href="/api/google-ads/oauth/start" className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
            Connect Google Ads
          </a>
        </div>
      ) : null}

      {catalogError ? <p className="text-sm text-red-600">{catalogError}</p> : null}
      {runMessage ? <p className="text-sm text-slate-600">{runMessage}</p> : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">Campaigns to monitor</h2>
            <label className="text-xs font-semibold text-slate-500">
              Check interval
              <select
                className="ml-2 rounded-lg border border-sky-200 bg-white px-2 py-1 text-sm text-slate-800"
                value={String(workspace.intervalMinutes)}
                onChange={(event) => persist({
                  ...workspace,
                  ownerId,
                  intervalMinutes: Number(event.target.value),
                  audit: [{
                    id: `audit-interval-${Date.now()}`,
                    event: "interval_changed",
                    summary: `Monitoring interval set to ${event.target.value} minutes`,
                    createdAt: new Date().toISOString(),
                  }, ...workspace.audit].slice(0, 200),
                })}
              >
                {HEALTH_INTERVALS.map((interval) => (
                  <option key={interval.id} value={interval.minutes}>{interval.label}</option>
                ))}
              </select>
            </label>
          </div>
          {loadingCatalog ? <p className="text-sm text-slate-500">Loading accounts…</p> : null}
          {accounts.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {accounts.map((account) => (
                <button
                  key={account.customerId}
                  type="button"
                  onClick={() => setSelectedAccount(account.customerId)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    activeAccount?.customerId === account.customerId
                      ? "border-sky-500 bg-sky-50 text-sky-800"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {account.name}
                </button>
              ))}
            </div>
          ) : null}
          <div className="max-h-[420px] space-y-2 overflow-y-auto overscroll-y-contain pr-1">
            {loadingCampaigns ? <p className="text-sm text-slate-500">Loading campaigns…</p> : null}
            {(activeAccount?.campaigns || []).map((campaign) => {
              const id = monitorKey(activeAccount?.customerId || "", campaign.id);
              const checked = selectedIds.has(id);
              return (
                <label key={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 px-3 py-3 hover:border-sky-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => activeAccount && toggleCampaign(activeAccount, campaign)}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-800">{campaign.name}</span>
                    <span className="text-xs text-slate-500">{campaign.status} · {campaign.channelType || "Google Ads"}</span>
                  </span>
                </label>
              );
            })}
            {!loadingCatalog && !loadingCampaigns && !(activeAccount?.campaigns || []).length ? (
              <p className="text-sm text-slate-500">No campaigns found in this account.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-red-700">
              <AlertTriangle size={16} />
              <h2 className="text-lg font-bold">Workspace alerts</h2>
            </div>
            <div className="space-y-3">
              {openAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className={`rounded-xl border p-3 ${severityClass(alert.severity)}`}>
                  <p className="text-sm font-semibold">{alert.campaignName}: {alert.title}</p>
                  <p className="mt-1 text-xs opacity-90">{alert.detail}</p>
                  <p className="mt-2 text-xs font-medium">{alert.recommendation}</p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold underline"
                    onClick={() => persist({
                      ...workspace,
                      ownerId,
                      alerts: workspace.alerts.map((item) => item.id === alert.id ? { ...item, acknowledged: true } : item),
                    })}
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
              {!openAlerts.length ? <p className="text-sm text-slate-500">No open alerts. New issues will appear here automatically.</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Health scores & recommendations</h2>
        <div className="space-y-4">
          {monitoredReports.map((report) => (
            <article key={report.monitorId} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800">{report.snapshot.campaignName}</h3>
                  <p className="text-xs text-slate-500">
                    {report.snapshot.status} · last check {new Date(report.snapshot.checkedAt).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm font-bold ${gradeClass(report.grade)}`}>
                  {report.score} · {report.grade.replace("_", " ")}
                </span>
              </div>
              {report.issues.length ? (
                <ul className="mt-3 space-y-2">
                  {report.issues.map((issue) => (
                    <li key={issue.id} className="text-sm text-slate-700">
                      <span className="font-semibold">{issue.title}.</span> {issue.recommendation}
                      <ol className="mt-1 list-decimal pl-5 text-xs text-slate-500">
                        {issue.steps.map((step) => <li key={step}>{step}</li>)}
                      </ol>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 size={16} /> No blocking issues on the latest check.
                </p>
              )}
            </article>
          ))}
          {!monitoredReports.length ? (
            <p className="text-sm text-slate-500">Select campaigns and run a health check to see scores.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <Activity size={16} />
          <h2 className="text-lg font-bold">Audit history</h2>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto overscroll-y-contain">
          {workspace.audit.slice(0, 40).map((entry) => (
            <p key={entry.id} className="border-b border-slate-50 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{new Date(entry.createdAt).toLocaleString()}</span>
              {" · "}
              {entry.summary}
            </p>
          ))}
          {!workspace.audit.length ? <p className="text-sm text-slate-500">Checks, alerts, and monitor changes will be listed here.</p> : null}
        </div>
      </section>
    </div>
  );
}
