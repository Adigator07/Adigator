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

export default function GoogleAdsConnectPanel({
  enabled,
}) {
  const [loadingSession, setLoadingSession] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const currentAppEmail = getFirebaseClientAuth().currentUser?.email || "";

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
    void logOutboundGoogleAdsClick(source, "google_ads_oauth_start");
    const loginUrl = "/api/google-ads/oauth/start?useDifferent=1";
    const tab = window.open(loginUrl, "_blank", "noopener,noreferrer");
    if (tab) tab.opener = null;
  }, [logOutboundGoogleAdsClick]);

  const openGoogleAdsAccount = useCallback((source = "preview-google-ads-account") => {
    const destination = "https://ads.google.com/aw/accounts";
    void logOutboundGoogleAdsClick(source, "google_ads_accounts_list");
    const tab = window.open(destination, "_blank", "noopener,noreferrer");
    if (tab) tab.opener = null;
  }, [logOutboundGoogleAdsClick]);

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

      {!connected ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openOAuth(false)}
              disabled={loadingSession}
              className="inline-flex items-center gap-2 rounded-xl bg-studio-accent px-4 py-2.5 text-sm font-semibold text-[#071225] disabled:opacity-60"
            >
              <Link2 size={16} /> Continue with Google
            </button>
            <button
              type="button"
              onClick={() => openGoogleAdsLogin("preview-connect-disconnected")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-4 py-2.5 text-sm font-semibold text-studio-text"
            >
              <ExternalLink size={16} /> Connect Google Ads
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openOAuth(true)}
              disabled={loadingSession}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-4 py-2.5 text-sm font-semibold text-studio-text disabled:opacity-60"
            >
              <ExternalLink size={16} /> Use a different Google account
            </button>
            <button
              type="button"
              onClick={() => openOAuth(false)}
              disabled={loadingSession}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-4 py-2.5 text-sm font-semibold text-studio-tertiary disabled:opacity-60"
            >
              same account as for adi
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-studio-success/30 bg-studio-success/10 px-3 py-1 text-xs font-semibold text-studio-success">
            <CheckCircle2 size={14} /> Connected {email ? `as ${email}` : "to Google Ads"}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openGoogleAdsAccount("preview-connect-connected")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold text-studio-text"
            >
              <ExternalLink size={14} /> Open Google Ads Account
            </button>
            <button
              type="button"
              onClick={() => openOAuth(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold text-studio-text"
            >
              <ExternalLink size={14} /> Switch Google account
            </button>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-studio-error">{error}</p> : null}
    </section>
  );
}
