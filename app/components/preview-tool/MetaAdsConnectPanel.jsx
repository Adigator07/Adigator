"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Link2, Plus, RefreshCw } from "lucide-react";
import { getFirebaseClientAuth } from "@/app/lib/firebase/client";
import { META_OBJECTIVES } from "@/app/lib/campaignObjectives";
import { syncMetaAdsIntoAdigator } from "@/app/lib/metaAds/syncClient";

async function readJsonResponse(response, fallbackMessage) {
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`${fallbackMessage} Server returned non-JSON response (${response.status}).`);
    }
  }
  if (!response.ok) {
    throw new Error(payload?.error || `${fallbackMessage} (${response.status}).`);
  }
  return payload || {};
}

function toCampaignList(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    id: String(entry.id || ""),
    name: entry.campaignName || entry.name || "Untitled campaign",
    status: entry.metaAdsCampaignStatus || entry.status || "",
    sourceType: entry.metaAdsCampaignSource || entry.sourceType || "published",
    objective: entry.metaAdsObjective || entry.objective || entry.campaignGoal || "",
    adAccountId: entry.metaAdsAdAccountId || entry.adAccountId || "",
    snapshot: Array.isArray(entry.creatives) && entry.creatives.length ? entry : null,
  }));
}

function openMetaAdsManager(adAccountId = "") {
  const digits = String(adAccountId || "").replace(/^act_/i, "");
  const url = digits
    ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${digits}`
    : "https://adsmanager.facebook.com/adsmanager";
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (tab) tab.opener = null;
}

export default function MetaAdsConnectPanel({
  enabled,
  onImportCampaign,
}) {
  const [loadingSession, setLoadingSession] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignObjective, setNewCampaignObjective] = useState("meta_awareness");
  const [creating, setCreating] = useState(false);

  const awaitingReturnRef = useRef(false);
  const lastPullAtRef = useRef(0);

  const populateCampaign = useCallback((snapshotOrCampaign) => {
    if (!snapshotOrCampaign || typeof onImportCampaign !== "function") return;
    const id = String(snapshotOrCampaign.id || "");
    setActiveCampaignId(id);
    onImportCampaign(snapshotOrCampaign);
  }, [onImportCampaign]);

  const refreshSession = useCallback(async () => {
    if (!enabled) return { nextConnected: false, nextAdAccountId: "" };
    setLoadingSession(true);
    try {
      const response = await fetch("/api/meta-ads/session", { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to read Meta Ads session.");
      const nextConnected = Boolean(payload.connected);
      setConnected(nextConnected);
      setEmail(payload.email || "");
      if (!nextConnected) {
        setAvailableCampaigns([]);
        setAccounts([]);
      }
      if (payload.error && !payload.connected) setError(payload.error);
      return { nextConnected, nextAdAccountId: String(payload.adAccountId || "") };
    } catch (err) {
      setConnected(false);
      setEmail("");
      setAvailableCampaigns([]);
      setError(err?.message || "Unable to connect to Meta Ads.");
      return { nextConnected: false, nextAdAccountId: "" };
    } finally {
      setLoadingSession(false);
    }
  }, [enabled]);

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/meta-ads/accounts", { cache: "no-store" });
    const payload = await readJsonResponse(response, "Unable to load Meta ad accounts.");
    const nextAccounts = Array.isArray(payload.accounts) ? payload.accounts : [];
    setAccounts(nextAccounts);
    return { accounts: nextAccounts, preferred: String(payload.preferredAdAccountId || nextAccounts[0]?.id || "") };
  }, []);

  const pullCampaigns = useCallback(async ({ populate = false, accountIdOverride = "" } = {}) => {
    setError("");
    const session = await refreshSession();
    if (!session.nextConnected) return [];

    setLoadingCampaigns(true);
    setStatusMessage("Fetching campaigns from Meta Ads...");
    try {
      await loadAccounts();
      const accountId = accountIdOverride;
      const params = new URLSearchParams({ limit: "80" });
      if (accountId) params.set("adAccountId", accountId);
      const response = await fetch(`/api/meta-ads/campaigns?${params.toString()}`, { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to load Meta Ads campaigns.");
      if (payload.adAccountId) setAdAccountId(payload.adAccountId);
      const snapshots = Array.isArray(payload.campaigns) ? payload.campaigns : [];
      setAvailableCampaigns(toCampaignList(snapshots));
      setStatusMessage(
        snapshots.length
          ? `Loaded ${snapshots.length} live/draft campaign${snapshots.length === 1 ? "" : "s"} from Meta Ads.`
          : "No live or draft campaigns were found on this Meta ad account yet.",
      );

      const user = getFirebaseClientAuth().currentUser;
      if (user) {
        void (async () => {
          try {
            const token = await user.getIdToken();
            if (!token) return;
            await syncMetaAdsIntoAdigator({
              accessToken: token,
              ownerId: user.uid,
              adAccountId: accountId,
              advertiserName: "Meta Ads",
            });
          } catch {
            // List display does not depend on background persistence.
          }
        })();
      }
      return snapshots;
    } catch (err) {
      setError(err?.message || "Unable to fetch Meta Ads campaigns.");
      setStatusMessage("");
      return [];
    } finally {
      setLoadingCampaigns(false);
    }
  }, [adAccountId, loadAccounts, refreshSession]);

  const startMetaOAuth = useCallback((useDifferent = false) => {
    const params = new URLSearchParams();
    if (useDifferent) params.set("useDifferent", "1");
    params.set("returnTo", `${window.location.pathname}${window.location.search || ""}`);
    params.set("popup", "1");
    const url = `/api/meta-ads/oauth/start?${params.toString()}`;
    const popup = window.open(url, "meta-ads-oauth", "popup=yes,width=540,height=760");
    if (!popup) {
      params.set("popup", "0");
      window.location.assign(`/api/meta-ads/oauth/start?${params.toString()}`);
      return;
    }
    let polls = 0;
    const timer = window.setInterval(() => {
      polls += 1;
      void refreshSession();
      if (polls >= 20) window.clearInterval(timer);
    }, 2000);
    window.setTimeout(() => window.clearInterval(timer), 45000);
  }, [refreshSession]);

  const loadSelectedCampaign = useCallback(async (campaign) => {
    if (!campaign) return;
    if (campaign.snapshot) {
      populateCampaign(campaign.snapshot);
      return;
    }
    setLoadingCampaigns(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (campaign.id) params.set("campaignId", campaign.id);
      if (campaign.name) params.set("campaignName", campaign.name);
      if (campaign.adAccountId || adAccountId) params.set("adAccountId", campaign.adAccountId || adAccountId);
      const response = await fetch(`/api/meta-ads/campaigns?${params.toString()}`, { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to load campaign details from Meta Ads.");
      const snapshot = payload?.data || payload?.campaign;
      if (!snapshot) throw new Error("That campaign could not be loaded from Meta Ads.");
      populateCampaign(snapshot);
      setStatusMessage(`Loaded ${snapshot.campaignName || campaign.name} from Meta Ads.`);
    } catch (err) {
      setError(err?.message || "Unable to load campaign details from Meta Ads.");
    } finally {
      setLoadingCampaigns(false);
    }
  }, [adAccountId, populateCampaign]);

  const createCampaign = useCallback(async () => {
    const name = newCampaignName.trim();
    if (!name) {
      setError("Enter a campaign name to create it in Meta Ads.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/meta-ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountId,
          campaignName: name,
          objective: newCampaignObjective,
        }),
      });
      const payload = await readJsonResponse(response, "Unable to create the Meta campaign.");
      const created = payload.campaign;
      setNewCampaignName("");
      setStatusMessage(`Created ${created?.name || name} in Meta Ads as paused. Loading it into Adigator…`);
      await pullCampaigns({ populate: false });
      if (created?.id) {
        await loadSelectedCampaign({
          id: created.id,
          name: created.name || name,
          adAccountId: payload.adAccountId || adAccountId,
        });
      }
    } catch (err) {
      setError(err?.message || "Unable to create the Meta campaign.");
    } finally {
      setCreating(false);
    }
  }, [adAccountId, loadSelectedCampaign, newCampaignName, newCampaignObjective, pullCampaigns]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const session = await refreshSession();
      if (cancelled || !session.nextConnected) return;
      await pullCampaigns({ populate: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, pullCampaigns, refreshSession]);

  useEffect(() => {
    const handleAuthResult = async (payload) => {
      if (!payload || payload.type !== "meta-ads-auth") return;
      if (!payload.ok) {
        setStatusMessage("");
        setError(payload.message || "Meta Ads login failed.");
        setConnected(false);
        return;
      }
      setError("");
      setStatusMessage("Meta authorization complete. Loading campaigns...");
      await pullCampaigns({ populate: true });
    };
    const handler = (event) => {
      void handleAuthResult(event?.data);
    };
    window.addEventListener("message", handler);
    const onStorage = (event) => {
      if (event.key !== "adigator_meta_ads_oauth_result" || !event.newValue) return;
      try {
        void handleAuthResult(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed auth payloads.
      }
    };
    window.addEventListener("storage", onStorage);
    let channel;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel("adigator-meta-ads-auth");
        channel.onmessage = (event) => {
          void handleAuthResult(event.data);
        };
      }
    } catch {
      channel = null;
    }
    try {
      const stored = window.localStorage.getItem("adigator_meta_ads_oauth_result");
      if (stored) {
        void handleAuthResult(JSON.parse(stored));
        window.localStorage.removeItem("adigator_meta_ads_oauth_result");
      }
    } catch {
      // Ignore storage access issues.
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_ads") === "connected") {
      void pullCampaigns({ populate: true });
    }
    return () => {
      window.removeEventListener("message", handler);
      window.removeEventListener("storage", onStorage);
      if (channel) channel.close();
    };
  }, [pullCampaigns]);

  useEffect(() => {
    const onReturnToAdigator = () => {
      if (document.visibilityState === "hidden") return;
      if (!awaitingReturnRef.current) return;
      const now = Date.now();
      if (now - lastPullAtRef.current < 2500) return;
      lastPullAtRef.current = now;
      void pullCampaigns({ populate: true });
    };
    window.addEventListener("focus", onReturnToAdigator);
    document.addEventListener("visibilitychange", onReturnToAdigator);
    return () => {
      window.removeEventListener("focus", onReturnToAdigator);
      document.removeEventListener("visibilitychange", onReturnToAdigator);
    };
  }, [pullCampaigns]);

  if (!enabled) return null;

  return (
    <section className="relative space-y-3 rounded-2xl border border-studio-accent/25 bg-studio-accent/5 p-3 pr-24 md:p-4 md:pr-28">
      <button
        type="button"
        onClick={() => {
          awaitingReturnRef.current = true;
          void pullCampaigns({ populate: true });
        }}
        className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-studio-text hover:bg-white/10 md:right-4 md:top-4"
      >
        <RefreshCw size={14} className={loadingCampaigns || loadingSession ? "animate-spin" : ""} /> Refresh
      </button>

      <div className="rounded-2xl border border-white/15 bg-black/10 p-3">
        <div className="flex items-start justify-between gap-3 pr-16">
          <div>
            <p className="text-sm font-semibold text-studio-text">Meta Ads</p>
            <p className="mt-1 text-xs leading-5 text-studio-tertiary">
              Connect Meta Ads, choose an ad account, then select an existing campaign or create a new paused campaign.
            </p>
          </div>
          {connected ? (
            <span className="rounded-full bg-studio-success/15 px-2.5 py-1 text-[11px] font-semibold text-studio-success">
              Connected
            </span>
          ) : (
            <button
              type="button"
              onClick={() => startMetaOAuth(false)}
              disabled={loadingSession}
              className="rounded-full border border-sky-300/40 bg-sky-500/20 px-2.5 py-1 text-[11px] font-semibold text-sky-100 disabled:opacity-60"
            >
              Connect
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setError("");
              setStatusMessage(connected
                ? "Reconnecting so Meta can ask for Ads Manager permissions..."
                : "Opening Meta Ads login...");
              startMetaOAuth(connected);
            }}
            disabled={loadingSession}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
          >
            <Link2 size={16} />
            {connected ? "Reconnect Meta Ads" : "Sign in with Meta Ads"}
          </button>
          <button
            type="button"
            onClick={() => {
              awaitingReturnRef.current = true;
              openMetaAdsManager(adAccountId);
              setStatusMessage("Finish your work in Ads Manager. When you return here, campaigns refresh automatically.");
            }}
            disabled={loadingSession}
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
          >
            <ExternalLink size={16} /> Open Ads Manager
          </button>
        </div>

        {connected ? (
          <div className="mt-3 rounded-xl border border-studio-success/25 bg-studio-success/10 px-3 py-2 text-xs font-semibold text-studio-success">
            Signed in {email ? `as ${email}` : "to Meta Ads"}. Select a campaign below to fill Campaign Details.
          </div>
        ) : (
          <p className="mt-3 text-xs leading-5 text-studio-tertiary">
            Use Sign in with Meta Ads first. Facebook must show Ads management and Ads read — approve those. If it never lists Ads permissions, add ads_read and ads_management on the app, then on the Login for Business configuration (create a new configuration if the existing one still only returns public_profile).
          </p>
        )}

        {connected && accounts.length > 0 ? (
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
            Ad account
            <select
              value={adAccountId}
              onChange={(event) => {
                const nextAccountId = event.target.value;
                setAdAccountId(nextAccountId);
                void pullCampaigns({ populate: false, accountIdOverride: nextAccountId });
              }}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm font-medium normal-case tracking-normal text-studio-text"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.id})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Your Meta Ads campaigns</p>
          {statusMessage ? <p className="text-xs leading-5 text-studio-tertiary">{statusMessage}</p> : null}
          {loadingCampaigns && availableCampaigns.length === 0 ? (
            <p className="text-xs text-studio-tertiary">Loading campaigns from Meta Ads...</p>
          ) : availableCampaigns.length > 0 ? (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {availableCampaigns.map((campaign) => {
                const selected = activeCampaignId && campaign.id === activeCampaignId;
                return (
                  <button
                    key={campaign.id || campaign.name}
                    type="button"
                    onClick={() => {
                      void loadSelectedCampaign(campaign);
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2 text-left ${
                      selected
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-black/25 hover:border-sky-400/30 hover:bg-sky-500/10"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-studio-text">{campaign.name}</span>
                      <span className="mt-1 block text-[11px] text-studio-tertiary">
                        {campaign.id ? `ID ${campaign.id}` : "No ID"}
                        {campaign.objective ? ` · ${String(campaign.objective).replace(/_/g, " ")}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-studio-muted">
                      {campaign.status || "Live"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-studio-tertiary">
              {connected
                ? "No published or unpublished drafts on this Meta ad account yet. Check the ad account dropdown matches Ads Manager, or publish the draft as paused in Ads Manager, then Refresh. You can also create a paused campaign below."
                : "Sign in with Meta Ads to see live and draft campaigns here."}
            </p>
          )}
        </div>

        {connected ? (
          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">Create a new campaign</p>
            <input
              value={newCampaignName}
              onChange={(event) => setNewCampaignName(event.target.value)}
              placeholder="Campaign name"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text"
            />
            <select
              value={newCampaignObjective}
              onChange={(event) => setNewCampaignObjective(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text"
            >
              {META_OBJECTIVES.map((objective) => (
                <option key={objective.id} value={objective.id}>{objective.title}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void createCampaign()}
              disabled={creating || loadingCampaigns}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
            >
              <Plus size={16} />
              {creating ? "Creating…" : "Create paused campaign in Meta"}
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-studio-error">{error}</p> : null}
    </section>
  );
}
