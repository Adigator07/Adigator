"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw, Link2 } from "lucide-react";
import { getFirebaseClientAuth } from "@/app/lib/firebase/client";
import { syncGoogleAdsIntoAdigator } from "@/app/lib/googleAds/syncClient";

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

function MetaIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M11.2 4.4c-4.2 0-7.6 3.4-7.6 7.6 0 4.2 3.4 7.6 7.6 7.6 4.2 0 7.6-3.4 7.6-7.6 0-4.2-3.4-7.6-7.6-7.6Zm-3.4 7.7c0-1.8 1.4-3.2 3.2-3.2 1.4 0 2.3.7 2.8 1.8l.7-1.7h1.5l-1.8 4.4c-.3.8-.8 1.2-1.5 1.2-.9 0-1.6-.6-1.9-1.7l-.7 1.7H8.3l1.4-3.5Zm6.3 0c0 1.8-1.4 3.2-3.2 3.2-1.4 0-2.3-.7-2.8-1.8l-.7 1.7h-1.5l1.8-4.4c.3-.8.8-1.2 1.5-1.2.9 0 1.6.6 1.9 1.7l.7-1.7h1.5l-1.5 3.5Z" fill="currentColor" />
    </svg>
  );
}

function ProgrammaticIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Zm2.5-.5a.5.5 0 0 0-.5.5v11c0 .28.22.5.5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11Zm1.8 3.2a.8.8 0 0 1 1.13 0l2.4 1.8a.8.8 0 0 1 0 1.3l-2.4 1.8a.8.8 0 0 1-1.13-1.3l1.8-1.35-1.8-1.35a.8.8 0 0 1 0-1.3Zm3.6 0a.8.8 0 0 1 1.13 0l2.4 1.8a.8.8 0 0 1 0 1.3l-2.4 1.8a.8.8 0 0 1-1.13-1.3l1.8-1.35-1.8-1.35a.8.8 0 0 1 0-1.3Z" fill="currentColor" />
    </svg>
  );
}

function openAdsWorkspaceTab() {
  const tab = window.open("https://ads.google.com/aw/campaigns", "_blank", "noopener,noreferrer");
  if (tab) tab.opener = null;
}

function toCampaignList(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    id: String(entry.id || ""),
    name: entry.campaignName || entry.name || "Untitled campaign",
    status: entry.googleAdsCampaignStatus || entry.status || "",
    sourceType: entry.googleAdsCampaignSource || entry.sourceType || "published",
    channelType: entry.googleAdsChannelType || entry.channelType || "",
    customerId: entry.googleAdsCustomerId || entry.customerId || "",
    loginCustomerId: entry.loginCustomerId || "",
    snapshot: Array.isArray(entry.creatives) && entry.creatives.length ? entry : null,
  }));
}

export default function GoogleAdsConnectPanel({
  enabled,
  activePlatform = "all",
  onImportCampaign,
}) {
  const [loadingSession, setLoadingSession] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState("");

  const pendingOpenAdsRef = useRef(false);
  const awaitingReturnRef = useRef(false);
  const activeCampaignIdRef = useRef("");
  const lastPullAtRef = useRef(0);
  const currentAppEmail = getFirebaseClientAuth().currentUser?.email || "";
  const isGoogle = activePlatform === "google_ads" || activePlatform === "all";
  const isMeta = activePlatform === "meta_ads" || activePlatform === "all";
  const isProgrammatic = activePlatform === "programmatic" || activePlatform === "all";

  const logOutboundGoogleAdsClick = useCallback(async (source, destination = "google_ads_account") => {
    try {
      const user = getFirebaseClientAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      if (!token) return;
      await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: "google_ads_outbound_click",
          action_label: "Google Ads outbound redirect",
          metadata: { source, via: "button", destination },
        }),
      });
    } catch {
      // Best-effort logging only.
    }
  }, []);

  const logOutboundPlatformClick = useCallback(async (platform, source, destination = "platform_direct_open") => {
    try {
      const user = getFirebaseClientAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      if (!token) return;
      await fetch("/api/activity/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action_type: `${platform}_outbound_click`,
          action_label: `${platform} outbound redirect`,
          metadata: { source, via: "button", platform, destination },
        }),
      });
    } catch {
      // Best-effort logging only.
    }
  }, []);

  const applySessionPayload = useCallback((payload) => {
    const nextConnected = Boolean(payload.connected);
    const nextCustomerId = String(payload.customerId || "").trim();
    setConnected(nextConnected);
    setEmail(payload.email || "");
    setCustomerId(nextCustomerId);
    if (Array.isArray(payload.campaigns) && payload.campaigns.length) {
      setAvailableCampaigns(toCampaignList(payload.campaigns));
    }
    return {
      nextConnected,
      nextCustomerId,
      campaigns: Array.isArray(payload.campaigns) ? payload.campaigns : [],
    };
  }, []);

  const refreshSession = useCallback(async () => {
    if (!enabled) return { nextConnected: false, nextCustomerId: "", campaigns: [] };
    setLoadingSession(true);
    try {
      const response = await fetch("/api/google-ads/session", { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to read Google Ads session.");
      if (payload.error && !payload.connected) {
        setError(payload.error);
      } else if (payload.error && !(Array.isArray(payload.campaigns) && payload.campaigns.length)) {
        setError(String(payload.error));
      }
      const result = applySessionPayload(payload);
      if (!result.nextConnected) setAvailableCampaigns([]);
      return result;
    } catch (err) {
      setConnected(false);
      setEmail("");
      setCustomerId("");
      setAvailableCampaigns([]);
      setError(err?.message || "Unable to connect to Google Ads.");
      return { nextConnected: false, nextCustomerId: "", campaigns: [] };
    } finally {
      setLoadingSession(false);
    }
  }, [enabled, applySessionPayload]);

  const populateCampaign = useCallback((snapshotOrCampaign) => {
    if (!snapshotOrCampaign || typeof onImportCampaign !== "function") return;
    const id = String(snapshotOrCampaign.id || "");
    setActiveCampaignId(id);
    activeCampaignIdRef.current = id;
    onImportCampaign(snapshotOrCampaign);
  }, [onImportCampaign]);

  const pullCampaignsIntoAdigator = useCallback(async ({ populate = true } = {}) => {
    setError("");
    const session = await refreshSession();
    if (!session.nextConnected) return [];

    const user = getFirebaseClientAuth().currentUser;
    setLoadingCampaigns(true);
    setStatusMessage("Fetching campaigns from Google Ads...");

    try {
      let snapshots = [];
      const params = new URLSearchParams({ includeDrafts: "1", limit: "80" });
      if (session.nextCustomerId || customerId) params.set("customerId", session.nextCustomerId || customerId);
      const response = await fetch(`/api/google-ads/campaigns?${params.toString()}`, { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to load Google Ads campaigns.");
      snapshots = Array.isArray(payload.campaigns) ? payload.campaigns : [];
      if (!snapshots.length && payload?.error) {
        setError(String(payload.error));
      }

      const list = toCampaignList(snapshots);
      setAvailableCampaigns(list);

      if (snapshots.length) {
        setStatusMessage(`Loaded ${snapshots.length} campaign${snapshots.length === 1 ? "" : "s"} from Google Ads.`);
      } else {
        setStatusMessage("No live or draft campaigns were found on this Google Ads account yet.");
      }

      if (user) {
        void (async () => {
          try {
            const token = await user.getIdToken();
            if (!token) return;
            await syncGoogleAdsIntoAdigator({
              accessToken: token,
              ownerId: user.uid,
              customerId: session.nextCustomerId || customerId || undefined,
              advertiserName: "Google Ads",
            });
          } catch {
            // List display does not depend on background persistence.
          }
        })();
      }

      return snapshots;
    } catch (err) {
      setError(err?.message || "Unable to fetch Google Ads campaigns.");
      setStatusMessage("");
      return [];
    } finally {
      setLoadingCampaigns(false);
    }
  }, [refreshSession, customerId]);

  const startGoogleAdsOAuth = useCallback((useDifferent = false) => {
    const params = new URLSearchParams();
    if (useDifferent) params.set("useDifferent", "1");
    const loginHint = String(email || currentAppEmail || "").trim();
    if (!useDifferent && loginHint) params.set("loginHint", loginHint);
    params.set("returnTo", `${window.location.pathname}${window.location.search || ""}`);
    params.set("popup", "1");
    const url = `/api/google-ads/oauth/start?${params.toString()}`;
    const popup = window.open(url, "google-ads-oauth", "popup=yes,width=540,height=760");
    if (!popup) {
      params.set("popup", "0");
      window.location.assign(`/api/google-ads/oauth/start?${params.toString()}`);
      return;
    }
    let polls = 0;
    const timer = window.setInterval(() => {
      polls += 1;
      void refreshSession();
      if (polls >= 20) window.clearInterval(timer);
    }, 2000);
    window.setTimeout(() => window.clearInterval(timer), 45000);
  }, [email, currentAppEmail, refreshSession]);

  const openGoogleAdsWorkspace = useCallback(async () => {
    void logOutboundGoogleAdsClick("preview-open-ads-website", "google_ads_campaigns");
    awaitingReturnRef.current = true;
    setError("");
    setStatusMessage("");

    const session = await refreshSession();
    if (!session.nextConnected) {
      pendingOpenAdsRef.current = true;
      setStatusMessage("Authorize Google Ads, then your workspace will open.");
      startGoogleAdsOAuth(false);
      return;
    }

    openAdsWorkspaceTab();
    setStatusMessage("Finish your work in Google Ads. When you return here, campaigns are loaded automatically.");
  }, [logOutboundGoogleAdsClick, refreshSession, startGoogleAdsOAuth]);

  const openPlatformLogin = useCallback((platform, source = "preview-platform-direct") => {
    const destinations = {
      google_ads: "https://ads.google.com/aw/campaigns",
      meta: "https://www.facebook.com/adsmanager",
      programmatic: "https://www.thetradedesk.com/us/login",
    };
    const destination = destinations[platform];
    if (!destination) return;
    void logOutboundPlatformClick(platform, source, `${platform}_direct_open`);
    const tab = window.open(destination, "_blank", "noopener,noreferrer");
    if (tab) tab.opener = null;
  }, [logOutboundPlatformClick]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const session = await refreshSession();
      if (cancelled || !session.nextConnected) return;
      await pullCampaignsIntoAdigator({ populate: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshSession, pullCampaignsIntoAdigator]);

  useEffect(() => {
    const handleAuthResult = async (payload) => {
      if (!payload || payload.type !== "google-ads-auth") return;
      if (!payload.ok) {
        setError(payload.message || "Google Ads login failed.");
        return;
      }
      await pullCampaignsIntoAdigator({ populate: true });
      if (pendingOpenAdsRef.current) {
        pendingOpenAdsRef.current = false;
        openAdsWorkspaceTab();
        setStatusMessage("Finish your work in Google Ads. When you return here, campaigns are loaded automatically.");
      }
    };

    const handler = (event) => {
      void handleAuthResult(event?.data);
    };
    window.addEventListener("message", handler);

    const onStorage = (event) => {
      if (event.key !== "adigator_google_ads_oauth_result" || !event.newValue) return;
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
        channel = new BroadcastChannel("adigator-google-ads-auth");
        channel.onmessage = (event) => {
          void handleAuthResult(event.data);
        };
      }
    } catch {
      channel = null;
    }

    try {
      const stored = window.localStorage.getItem("adigator_google_ads_oauth_result");
      if (stored) {
        void handleAuthResult(JSON.parse(stored));
        window.localStorage.removeItem("adigator_google_ads_oauth_result");
      }
    } catch {
      // Ignore storage access issues.
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("google_ads") === "connected") {
      void pullCampaignsIntoAdigator({ populate: true });
    }

    return () => {
      window.removeEventListener("message", handler);
      window.removeEventListener("storage", onStorage);
      if (channel) channel.close();
    };
  }, [pullCampaignsIntoAdigator]);

  useEffect(() => {
    const onReturnToAdigator = () => {
      if (document.visibilityState === "hidden") return;
      if (!awaitingReturnRef.current) return;
      const now = Date.now();
      if (now - lastPullAtRef.current < 2500) return;
      lastPullAtRef.current = now;
      void pullCampaignsIntoAdigator({ populate: true });
    };
    window.addEventListener("focus", onReturnToAdigator);
    document.addEventListener("visibilitychange", onReturnToAdigator);
    return () => {
      window.removeEventListener("focus", onReturnToAdigator);
      document.removeEventListener("visibilitychange", onReturnToAdigator);
    };
  }, [pullCampaignsIntoAdigator]);

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
      if (campaign.name) params.set("campaignName", campaign.name);
      if (campaign.id) params.set("campaignId", campaign.id);
      if (campaign.customerId || customerId) params.set("customerId", campaign.customerId || customerId);
      if (campaign.loginCustomerId) params.set("loginCustomerId", campaign.loginCustomerId);
      const response = await fetch(`/api/google-ads/campaigns?${params.toString()}`, { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to load campaign details from Google Ads.");
      const snapshot = payload?.data || payload?.campaign;
      if (!snapshot) throw new Error("That campaign could not be loaded from Google Ads.");
      populateCampaign(snapshot);
      setStatusMessage(`Loaded ${snapshot.campaignName || campaign.name} from Google Ads.`);
    } catch (err) {
      setError(err?.message || "Unable to load campaign details from Google Ads.");
    } finally {
      setLoadingCampaigns(false);
    }
  }, [customerId, populateCampaign]);

  if (!enabled) return null;

  return (
    <section className="relative space-y-3 rounded-2xl border border-studio-accent/25 bg-studio-accent/5 p-3 pr-24 md:p-4 md:pr-28">
      <button
        type="button"
        onClick={() => {
          awaitingReturnRef.current = true;
          void pullCampaignsIntoAdigator({ populate: true });
        }}
        className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-studio-text hover:bg-white/10 md:right-4 md:top-4"
      >
        <RefreshCw size={14} className={loadingCampaigns || loadingSession ? "animate-spin" : ""} /> Refresh
      </button>

      <div className={`grid gap-3 ${isGoogle && isMeta && isProgrammatic ? "xl:grid-cols-3" : "xl:grid-cols-1"}`}>
        {isGoogle ? (
          <div className="rounded-2xl border border-white/15 bg-black/10 p-3">
            <div className="flex items-start justify-between gap-3 pr-16">
              <div>
                <p className="text-sm font-semibold text-studio-text">Google Ads</p>
                <p className="mt-1 text-xs leading-5 text-studio-tertiary">
                  Sign in with Google Ads to load every live campaign and draft into this section. Campaign Details is filled automatically.
                </p>
              </div>
              {connected ? (
                <span className="rounded-full bg-studio-success/15 px-2.5 py-1 text-[11px] font-semibold text-studio-success">
                  Connected
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => startGoogleAdsOAuth(false)}
                  disabled={loadingSession}
                  className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 disabled:opacity-60"
                >
                  Connect
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  pendingOpenAdsRef.current = false;
                  setError("");
                  setStatusMessage("Opening Google Ads login...");
                  startGoogleAdsOAuth(false);
                }}
                disabled={loadingSession}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] hover:bg-slate-100 disabled:opacity-60"
              >
                <Link2 size={16} />
                {connected ? "Reconnect Google Ads" : "Sign in with Google Ads"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void openGoogleAdsWorkspace();
                }}
                disabled={loadingSession}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-60"
              >
                <ExternalLink size={16} /> Open Ads website
              </button>
            </div>

            {connected ? (
              <div className="mt-3 rounded-xl border border-studio-success/25 bg-studio-success/10 px-3 py-2 text-xs font-semibold text-studio-success">
                Signed in {email ? `as ${email}` : "to Google Ads"}. All campaigns below were loaded from your account.
              </div>
            ) : (
              <p className="mt-3 text-xs leading-5 text-studio-tertiary">
                Use Sign in with Google Ads first. After Google authorization, every campaign and draft appears in this list.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Your Google Ads campaigns</p>
              {statusMessage ? (
                <p className="text-xs leading-5 text-studio-tertiary">{statusMessage}</p>
              ) : null}
              {loadingCampaigns && availableCampaigns.length === 0 ? (
                <p className="text-xs text-studio-tertiary">Loading campaigns from Google Ads...</p>
              ) : availableCampaigns.length > 0 ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {availableCampaigns.map((campaign) => {
                    const isDraft = campaign.sourceType === "draft" || campaign.status === "Draft";
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
                            ? "border-cyan-400/40 bg-cyan-500/10"
                            : "border-white/10 bg-black/25 hover:border-cyan-400/30 hover:bg-cyan-500/10"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-studio-text">
                            {campaign.name}
                          </span>
                          <span className="mt-1 block text-[11px] text-studio-tertiary">
                            {campaign.id ? `ID ${campaign.id}` : "No ID"}
                            {campaign.channelType ? ` · ${String(campaign.channelType).replace(/_/g, " ")}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-studio-muted">
                          {isDraft ? "Draft" : campaign.status || "Live"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-studio-tertiary">
                  {connected
                    ? "No campaigns were returned for this Google login yet. Use Refresh, or Reconnect Google Ads with the same Google account that owns the live campaign."
                    : "Sign in with Google Ads to see every campaign and draft here."}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {isMeta ? (
          <div className="rounded-2xl border border-white/15 bg-black/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-studio-text">Meta</p>
                <p className="mt-1 text-xs leading-5 text-studio-tertiary">Open Meta Ads Manager with its own direct login route.</p>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-studio-text">Direct</span>
            </div>
            <button
              type="button"
              onClick={() => openPlatformLogin("meta", "preview-connect-disconnected")}
              className="mt-3 inline-flex w-full items-center justify-start gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-studio-text"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#1877F2]">
                <MetaIcon className="h-4 w-4" />
              </span>
              Open Meta Ads Manager login
            </button>
          </div>
        ) : null}

        {isProgrammatic ? (
          <div className="rounded-2xl border border-white/15 bg-black/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-studio-text">Programmatic</p>
                <p className="mt-1 text-xs leading-5 text-studio-tertiary">Use a separate launch path for The Trade Desk.</p>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-studio-text">Direct</span>
            </div>
            <button
              type="button"
              onClick={() => openPlatformLogin("programmatic", "preview-connect-disconnected")}
              className="mt-3 inline-flex w-full items-center justify-start gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-studio-text"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#00D4FF]">
                <ProgrammaticIcon className="h-4 w-4" />
              </span>
              Open Trade Desk login
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-studio-error">{error}</p> : null}
    </section>
  );
}
