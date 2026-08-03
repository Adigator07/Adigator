"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Link2, CheckCircle2 } from "lucide-react";
import { getFirebaseClientAuth } from "@/app/lib/firebase/client";

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

export default function GoogleAdsConnectPanel({
  enabled,
  activePlatform = "all",
  onImportCampaign,
  campaignName = "",
  campaignId = "",
}) {
  const [loadingSession, setLoadingSession] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [importCampaignName, setImportCampaignName] = useState(campaignName);
  const [importCampaignId, setImportCampaignId] = useState(campaignId);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");

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
          metadata: {
            source,
            via: "button",
            destination,
          },
        }),
      });
    } catch {
      // Best-effort logging only; never block outbound navigation.
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
          metadata: {
            source,
            via: "button",
            platform,
            destination,
          },
        }),
      });
    } catch {
      // Best-effort logging only; never block outbound navigation.
    }
  }, []);

  const openOAuth = useCallback((useDifferent = false, loginHint = email || currentAppEmail) => {
    const params = new URLSearchParams();
    if (useDifferent) params.set("useDifferent", "1");
    const resolvedLoginHint = String(loginHint || "").trim();
    if (!useDifferent && resolvedLoginHint) params.set("loginHint", resolvedLoginHint);
    const query = params.toString();
    const url = `/api/google-ads/oauth/start${query ? `?${query}` : ""}`;
    window.open(url, "google-ads-oauth", "popup=yes,width=540,height=760");
  }, [email, currentAppEmail]);

  const openGoogleAdsLogin = useCallback((source = "preview-google-ads-connect") => {
    void logOutboundGoogleAdsClick(source, "google_ads_direct_open");
    const loginUrl = "https://ads.google.com/aw/accounts";
    const tab = window.open(loginUrl, "_blank", "noopener,noreferrer");
    if (tab) tab.opener = null;
  }, [logOutboundGoogleAdsClick]);

  const openGoogleAdsAccount = useCallback((source = "preview-google-ads-account") => {
    const destination = "https://ads.google.com/aw/accounts";
    void logOutboundGoogleAdsClick(source, "google_ads_accounts_list");
    const tab = window.open(destination, "_blank", "noopener,noreferrer");
    if (tab) tab.opener = null;
  }, [logOutboundGoogleAdsClick]);

  const openPlatformLogin = useCallback((platform, source = "preview-platform-direct") => {
    const destinations = {
      google_ads: "https://ads.google.com/aw/accounts",
      meta: "https://www.facebook.com/adsmanager",
      programmatic: "https://www.thetradedesk.com/us/login",
    };

    const destination = destinations[platform];
    if (!destination) return;

    void logOutboundPlatformClick(platform, source, `${platform}_direct_open`);
    const tab = window.open(destination, "_blank", "noopener,noreferrer");
    if (tab) tab.opener = null;
  }, [logOutboundPlatformClick]);

  const refreshSession = useCallback(async () => {
    if (!enabled) return;
    setLoadingSession(true);
    setError("");
    try {
      const response = await fetch("/api/google-ads/session", { cache: "no-store" });
      const payload = await readJsonResponse(response, "Unable to read Google Ads session.");
      setConnected(Boolean(payload.connected));
      setEmail(payload.email || "");
    } catch (err) {
      setConnected(false);
      setEmail("");
      setError(err?.message || "Unable to connect to Google Ads.");
    } finally {
      setLoadingSession(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refreshSession();
  }, [enabled, refreshSession]);

  useEffect(() => {
    setImportCampaignName(campaignName || "");
  }, [campaignName]);

  useEffect(() => {
    setImportCampaignId(campaignId || "");
  }, [campaignId]);

  useEffect(() => {
    const handler = (event) => {
      if (!event?.data || event.data.type !== "google-ads-auth") return;
      if (event.data.ok) {
        void refreshSession();
      } else {
        setError(event.data.message || "Google Ads login failed.");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refreshSession]);

  const importFromConnectedGoogleAds = useCallback(async () => {
    setImportSuccess("");
    setError("");

    if (!connected) {
      setError("Google Ads is not connected yet. Connect first, then import.");
      return;
    }

    const name = String(importCampaignName || "").trim();
    const id = String(importCampaignId || "").trim();
    if (!name && !id) {
      setError("Enter campaign name or campaign ID to import from Google Ads.");
      return;
    }

    const user = getFirebaseClientAuth().currentUser;
    if (!user) {
      setError("Sign in to Adigator first. Import saves campaigns under your Adigator account.");
      return;
    }

    setImportLoading(true);
    try {
      const token = await user.getIdToken();
      if (!token) throw new Error("Unable to verify Adigator session. Please sign in again.");

      const params = new URLSearchParams({ platform: "google_ads" });
      if (name) params.set("campaign_name", name);
      if (id) params.set("campaign_id", id);

      const response = await fetch(`/api/campaigns?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await readJsonResponse(response, "Unable to import campaign from Google Ads.");
      if (!payload?.data) {
        throw new Error("No matching campaign found in connected Google Ads account. Check name or ID and retry.");
      }

      const imported = payload.data;
      if (typeof onImportCampaign === "function") {
        onImportCampaign(imported);
      }

      const sourceLabel = imported.googleAdsCampaignSource === "draft" ? "Draft" : "Published";
      setImportSuccess(`Imported ${sourceLabel} campaign and saved it in Adigator.`);
    } catch (err) {
      setError(err?.message || "Google Ads import failed.");
    } finally {
      setImportLoading(false);
    }
  }, [connected, importCampaignId, importCampaignName, onImportCampaign]);

  if (!enabled) return null;

  return (
    <section className="relative space-y-3 rounded-2xl border border-studio-accent/25 bg-studio-accent/5 p-3 pr-24 md:p-4 md:pr-28">
      <button
        type="button"
        onClick={() => {
          void refreshSession();
        }}
        className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-studio-text hover:bg-white/10 md:right-4 md:top-4"
      >
        <RefreshCw size={14} /> Refresh
      </button>

      <div className={`grid gap-3 ${isGoogle && isMeta && isProgrammatic ? "xl:grid-cols-3" : "xl:grid-cols-1"}`}>
        {isGoogle ? (
          <div className="rounded-2xl border border-white/15 bg-black/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-studio-text">Google Ads</p>
                <p className="mt-1 text-xs leading-5 text-studio-tertiary">Use your own Google account to connect and open Ads workspace.</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${connected ? "bg-studio-success/15 text-studio-success" : "bg-white/10 text-studio-text"}`}>
                {connected ? "Connected" : "Connect"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openOAuth(false)}
                disabled={loadingSession}
                className="inline-flex items-center gap-2 rounded-xl bg-studio-accent px-3 py-2 text-sm font-semibold text-[#071225] disabled:opacity-60"
              >
                <Link2 size={15} /> Continue with Google
              </button>
              <button
                type="button"
                onClick={() => openGoogleAdsLogin("preview-connect-disconnected")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-studio-text"
              >
                <ExternalLink size={15} /> Open Google Ads
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-500/8 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Import Campaign Into Adigator</p>
              <p className="text-xs leading-5 text-studio-tertiary">Supports published and draft campaigns from your connected Google Ads account.</p>

              <div className="grid gap-2 md:grid-cols-2">
                <input
                  type="text"
                  value={importCampaignName}
                  onChange={(event) => setImportCampaignName(event.target.value)}
                  placeholder="Campaign name"
                  className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text outline-none placeholder:text-studio-tertiary focus:border-cyan-400/40"
                />
                <input
                  type="text"
                  value={importCampaignId}
                  onChange={(event) => setImportCampaignId(event.target.value)}
                  placeholder="Campaign ID"
                  className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text outline-none placeholder:text-studio-tertiary focus:border-cyan-400/40"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  void importFromConnectedGoogleAds();
                }}
                disabled={importLoading || loadingSession}
                className="inline-flex items-center gap-2 rounded-xl bg-studio-accent px-3 py-2 text-sm font-semibold text-[#071225] disabled:opacity-60"
              >
                {importLoading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {importLoading ? "Importing..." : "Import & Save in Adigator"}
              </button>

              {importSuccess ? (
                <p className="text-xs font-semibold text-studio-success">{importSuccess}</p>
              ) : null}
            </div>

            {connected ? (
              <div className="mt-3 rounded-xl border border-studio-success/25 bg-studio-success/10 px-3 py-2 text-xs font-semibold text-studio-success">
                Connected {email ? `as ${email}` : "to Google Ads"}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openOAuth(true)}
                disabled={loadingSession}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-studio-text disabled:opacity-60"
              >
                <ExternalLink size={15} /> Use a different Google account
              </button>
            )}
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
