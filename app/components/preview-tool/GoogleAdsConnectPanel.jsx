"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function isScopeInsufficientError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("insufficient authentication scopes")
    || message.includes("access_token_scope_insufficient")
    || message.includes("request had insufficient authentication scopes");
}

export default function GoogleAdsConnectPanel({
  enabled,
  onImportCampaign,
  campaignName,
}) {
  const [loadingSession, setLoadingSession] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [createBudget, setCreateBudget] = useState("5000000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  const currentAppEmail = getFirebaseClientAuth().currentUser?.email || "";

  const openOAuth = useCallback((useDifferent = false, loginHint = email || currentAppEmail) => {
    const params = new URLSearchParams();
    if (useDifferent) params.set("useDifferent", "1");
    const resolvedLoginHint = String(loginHint || "").trim();
    if (!useDifferent && resolvedLoginHint) params.set("loginHint", resolvedLoginHint);
    const query = params.toString();
    const url = `/api/google-ads/oauth/start${query ? `?${query}` : ""}`;
    window.open(url, "google-ads-oauth", "popup=yes,width=540,height=760");
  }, [email, currentAppEmail]);

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

  const loadAccounts = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/google-ads/accounts", { cache: "no-store" });
      const payload = await readJsonResponse(response, "Failed to load accounts.");
      const items = Array.isArray(payload.accounts) ? payload.accounts : [];
      setAccounts(items);
      if (items.length > 0) {
        setSelectedCustomerId((current) => current || items[0].customerId);
      }
      if (payload.connectedEmail) setEmail(payload.connectedEmail);
      setConnected(true);
    } catch (err) {
      if (isScopeInsufficientError(err)) {
        setConnected(false);
        setEmail("");
        setError("Google Ads access needs to be re-authorized with the Ads scope. Reconnecting now...");
        window.setTimeout(() => openOAuth(true), 250);
        return;
      }
      setError(err?.message || "Unable to load Google Ads accounts.");
    } finally {
      setBusy(false);
    }
  }, [openOAuth]);

  const loadCampaigns = useCallback(async () => {
    if (!selectedCustomerId) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/google-ads/campaigns?customerId=${encodeURIComponent(selectedCustomerId)}&limit=50`, {
        cache: "no-store",
      });
      const payload = await readJsonResponse(response, "Failed to load campaigns.");
      const items = Array.isArray(payload.campaigns) ? payload.campaigns : [];
      setCampaigns(items);
      if (items.length > 0) {
        setSelectedCampaignId((current) => current || items[0].id);
      }
    } catch (err) {
      if (isScopeInsufficientError(err)) {
        setConnected(false);
        setError("Google Ads access needs to be re-authorized with the Ads scope. Reconnecting now...");
        window.setTimeout(() => openOAuth(true), 250);
        return;
      }
      setError(err?.message || "Unable to load campaigns.");
    } finally {
      setBusy(false);
    }
  }, [selectedCustomerId, openOAuth]);

  useEffect(() => {
    if (!enabled) return;
    void refreshSession();
  }, [enabled, refreshSession]);

  useEffect(() => {
    if (!enabled || !connected) return;
    void loadAccounts();
  }, [enabled, connected, loadAccounts]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    void loadCampaigns();
  }, [selectedCustomerId, loadCampaigns]);

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

  const handleCreateCampaign = async () => {
    if (!selectedCustomerId) {
      setError("Select a Google Ads account first.");
      return;
    }

    const resolvedName = String(campaignName || "").trim() || `Adigator Campaign ${new Date().toISOString().slice(0, 10)}`;
    const budgetMicros = Number(createBudget || 0);
    if (!Number.isFinite(budgetMicros) || budgetMicros <= 0) {
      setError("Enter a valid budget in micros (e.g. 5000000).\n");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/google-ads/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          campaignName: resolvedName,
          amountMicros: budgetMicros,
          advertisingChannelType: "DISPLAY",
          status: "PAUSED",
        }),
      });
      const payload = await readJsonResponse(response, "Failed to create campaign.");

      const created = payload?.campaign;
      if (created) {
        onImportCampaign?.(created);
        await loadCampaigns();
      }
    } catch (err) {
      setError(err?.message || "Unable to create campaign in Google Ads.");
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) return null;

  return (
    <section className="relative space-y-3 rounded-2xl border border-studio-accent/25 bg-studio-accent/5 p-3 pr-24 md:p-4 md:pr-28">
      <button
        type="button"
        onClick={() => {
          void refreshSession();
          if (connected) void loadAccounts();
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
                Google Ads account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text"
              >
                {accounts.length === 0 ? <option value="">No accessible accounts</option> : null}
                {accounts.map((account) => (
                  <option key={account.customerId} value={account.customerId}>
                    {account.name} ({account.customerId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
                Campaign to import
              </label>
              <select
                value={selectedCampaignId}
                onChange={(event) => setSelectedCampaignId(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text"
              >
                {campaigns.length === 0 ? <option value="">No campaigns found</option> : null}
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
                New campaign budget (micros)
              </label>
              <input
                type="number"
                min={50000}
                step={10000}
                value={createBudget}
                onChange={(event) => setCreateBudget(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-studio-text"
              />
            </div>
            <button
              type="button"
              onClick={() => { void handleCreateCampaign(); }}
              disabled={busy || !selectedCustomerId}
              className="self-end rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-sm font-semibold text-studio-text disabled:opacity-60"
            >
              Create New Campaign In Google Ads
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!selectedCampaign) return;
                onImportCampaign?.(selectedCampaign);
              }}
              disabled={!selectedCampaign || busy}
              className="rounded-xl bg-studio-accent px-4 py-2 text-sm font-semibold text-[#071225] disabled:opacity-60"
            >
              Import Campaign Into Step 1
            </button>
            <span className="text-xs text-studio-muted">Manual setup is still available below.</span>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-studio-error">{error}</p> : null}
    </section>
  );
}
