"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Globe2, Mail, Shield, User } from "lucide-react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseClientAuth, getFirebaseClientFirestore } from "../lib/firebase/client";
import RouteAccessShell from "@/app/components/RouteAccessShell";
import { syncGoogleAdsIntoAdigator } from "@/app/lib/googleAds/syncClient";
import { syncMetaAdsIntoAdigator } from "@/app/lib/metaAds/syncClient";

type GoogleAdsConnectionState = {
  connected?: boolean;
  expired?: boolean;
  message?: string;
  email?: string;
  customerId?: string;
  account?: { name?: string; currencyCode?: string; timeZone?: string };
  campaigns?: Array<{
    id: string;
    name: string;
    status: string;
    suggestedGoal?: string;
    sourceType?: "published" | "draft";
  }>;
};

type MetaAdsConnectionState = {
  connected?: boolean;
  expired?: boolean;
  message?: string;
  email?: string;
  adAccountId?: string;
  account?: { name?: string; currency?: string; timeZone?: string };
  campaigns?: Array<{
    id: string;
    name: string;
    status: string;
    objective?: string;
  }>;
};

type SettingsUser = {
  id: string;
  email: string | null;
  user_metadata: {
    full_name?: string;
  };
};

function SettingsPageContent() {
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [googleAdsState, setGoogleAdsState] = useState<GoogleAdsConnectionState | null>(null);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(false);
  const [googleAdsConnecting, setGoogleAdsConnecting] = useState(false);
  const [googleAdsNotice, setGoogleAdsNotice] = useState("");
  const [googleAdsSyncing, setGoogleAdsSyncing] = useState(false);
  const [metaAdsState, setMetaAdsState] = useState<MetaAdsConnectionState | null>(null);
  const [metaAdsLoading, setMetaAdsLoading] = useState(false);
  const [metaAdsConnecting, setMetaAdsConnecting] = useState(false);
  const [metaAdsNotice, setMetaAdsNotice] = useState("");
  const [metaAdsSyncing, setMetaAdsSyncing] = useState(false);

  const ensureProfileName = async (firebaseUser: { uid: string; email: string | null; displayName: string | null }) => {
    const db = getFirebaseClientFirestore();
    const fallbackName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || `user-${firebaseUser.uid.slice(0, 6)}`;
    const ref = doc(db, "userProfiles", firebaseUser.uid);
    const profileSnap = await getDoc(ref);
    const profile = profileSnap.exists() ? profileSnap.data() : null;
    const resolvedUsername = profile?.username || profile?.fullName || fallbackName;

    if (!profileSnap.exists() || !profile?.username || !profile?.fullName) {
      await setDoc(ref, {
        email: firebaseUser.email || "",
        username: resolvedUsername,
        fullName: resolvedUsername,
        updatedAt: serverTimestamp(),
        createdAt: profileSnap.exists() ? profile?.createdAt || serverTimestamp() : serverTimestamp(),
      }, { merge: true });
    }

    if (!firebaseUser.displayName && resolvedUsername) {
      await updateProfile(getFirebaseClientAuth().currentUser!, { displayName: resolvedUsername });
    }

    return resolvedUsername;
  };

  const buildImmediateProfile = (firebaseUser: { uid: string; email: string | null; displayName: string | null }): SettingsUser => {
    const fallbackName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || `user-${firebaseUser.uid.slice(0, 6)}`;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      user_metadata: {
        full_name: fallbackName,
      },
    };
  };

  const loadGoogleAdsState = async () => {
    setGoogleAdsLoading(true);
    setGoogleAdsNotice("");
    try {
      const response = await fetch("/api/google-ads/session", { cache: "no-store" });
      const payload = (await response.json()) as GoogleAdsConnectionState;
      setGoogleAdsState(payload);
      if (!payload.connected && payload.message) {
        setGoogleAdsNotice(payload.message);
      }
    } catch (connectError) {
      const detail = connectError instanceof Error ? connectError.message : "Unable to load Google Ads status.";
      setGoogleAdsState({ connected: false, message: detail });
      setGoogleAdsNotice(detail);
    } finally {
      setGoogleAdsLoading(false);
    }
  };

  const handleSyncGoogleAds = async (options?: { silent?: boolean }) => {
    if (!user?.id) {
      setGoogleAdsNotice("Sign in to Adigator before syncing Google Ads campaigns.");
      return;
    }

    setGoogleAdsSyncing(true);
    if (!options?.silent) setGoogleAdsNotice("Syncing Google Ads campaigns and drafts into Adigator…");

    try {
      const authUser = getFirebaseClientAuth().currentUser;
      if (!authUser) throw new Error("Sign in to Adigator first.");
      const token = await authUser.getIdToken();
      const result = await syncGoogleAdsIntoAdigator({
        accessToken: token,
        ownerId: user.id,
        customerId: googleAdsState?.customerId || undefined,
        advertiserName: googleAdsState?.account?.name || "Google Ads",
      });
      setGoogleAdsNotice(
        result.message
          || `Synced ${result.total} campaign${result.total === 1 ? "" : "s"} (${result.drafts} draft${result.drafts === 1 ? "" : "s"}) into Adigator.`,
      );
      await loadGoogleAdsState();
    } catch (syncError) {
      const detail = syncError instanceof Error ? syncError.message : "Unable to sync Google Ads campaigns.";
      setGoogleAdsNotice(detail);
    } finally {
      setGoogleAdsSyncing(false);
    }
  };

  const loadMetaAdsState = async () => {
    setMetaAdsLoading(true);
    try {
      const response = await fetch("/api/meta-ads/session", { cache: "no-store" });
      const payload = (await response.json()) as MetaAdsConnectionState;
      setMetaAdsState(payload);
      if (!payload.connected && payload.message) setMetaAdsNotice(payload.message);
    } catch (connectError) {
      const detail = connectError instanceof Error ? connectError.message : "Unable to load Meta Ads status.";
      setMetaAdsState({ connected: false, message: detail });
      setMetaAdsNotice(detail);
    } finally {
      setMetaAdsLoading(false);
    }
  };

  const handleSyncMetaAds = async (options?: { silent?: boolean }) => {
    if (!user?.id) {
      setMetaAdsNotice("Sign in to Adigator before syncing Meta Ads campaigns.");
      return;
    }
    setMetaAdsSyncing(true);
    if (!options?.silent) setMetaAdsNotice("Syncing Meta Ads campaigns into Adigator…");
    try {
      const authUser = getFirebaseClientAuth().currentUser;
      if (!authUser) throw new Error("Sign in to Adigator first.");
      const token = await authUser.getIdToken();
      const result = await syncMetaAdsIntoAdigator({
        accessToken: token,
        ownerId: user.id,
        adAccountId: metaAdsState?.adAccountId || undefined,
        advertiserName: metaAdsState?.account?.name || "Meta Ads",
      });
      setMetaAdsNotice(result.message || `Synced ${result.total} Meta Ads campaign${result.total === 1 ? "" : "s"} into Adigator.`);
      await loadMetaAdsState();
    } catch (syncError) {
      const detail = syncError instanceof Error ? syncError.message : "Unable to sync Meta Ads campaigns.";
      setMetaAdsNotice(detail);
    } finally {
      setMetaAdsSyncing(false);
    }
  };

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    let active = true;

    const applyResolvedUser = async (firebaseUser: { uid: string; email: string | null; displayName: string | null } | null) => {
      if (!active) return;
      if (!firebaseUser) {
        setUser(null);
        setUsername("");
        setLoading(false);
        return;
      }

      setUser(buildImmediateProfile(firebaseUser));
      setUsername(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "");
      setLoading(false);

      const resolvedUsername = await ensureProfileName({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });

      if (!active) return;
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        user_metadata: {
          full_name: resolvedUsername,
        },
      });
      setUsername(resolvedUsername);
    };

    void applyResolvedUser(auth.currentUser ? {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
    } : null);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void (async () => {
        await applyResolvedUser(firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        } : null);
      })();
    });

    const timer = window.setTimeout(() => {
      void loadGoogleAdsState();
      void loadMetaAdsState();
    }, 0);
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; message?: string; ok?: boolean } | undefined;
      if (payload?.type === "google-ads-auth") {
        setGoogleAdsNotice(payload.message || "Google Ads connected.");
        void (async () => {
          await loadGoogleAdsState();
          if (payload.ok !== false) {
            await handleSyncGoogleAds({ silent: true });
          }
        })();
      }
      if (payload?.type === "meta-ads-auth") {
        setMetaAdsNotice(payload.message || "Meta Ads connected.");
        void (async () => {
          await loadMetaAdsState();
          if (payload.ok !== false) {
            await handleSyncMetaAds({ silent: true });
          }
        })();
      }
    };
    window.addEventListener("message", onMessage);

    return () => {
      active = false;
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const handleUsernameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const auth = getFirebaseClientAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You need to be signed in to update your username.");
      }

      await updateProfile(currentUser, { displayName: trimmedUsername });
      await setDoc(doc(getFirebaseClientFirestore(), "userProfiles", currentUser.uid), {
        email: currentUser.email || "",
        username: trimmedUsername,
        fullName: trimmedUsername,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setUser((current) => current ? {
        ...current,
        user_metadata: {
          ...(current.user_metadata || {}),
          full_name: trimmedUsername,
        },
      } : current);
      setMessage("Username saved.");
    } catch (submitError) {
      const submitMessage = submitError instanceof Error ? submitError.message : "Unable to save username.";
      setError(submitMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogleAds = () => {
    setGoogleAdsConnecting(true);
    setGoogleAdsNotice("Opening Google authorization...");
    const popup = window.open("/api/google-ads/oauth/start", "google-ads-connect", "width=640,height=760,scrollbars=yes,resizable=yes");
    if (!popup) {
      setGoogleAdsConnecting(false);
      setGoogleAdsNotice("Popups are blocked. Please allow them and try again.");
    }
    window.setTimeout(() => setGoogleAdsConnecting(false), 1200);
  };

  const handleDisconnectGoogleAds = async () => {
    try {
      setGoogleAdsLoading(true);
      const response = await fetch("/api/google-ads/disconnect", { method: "POST" });
      const payload = (await response.json()) as GoogleAdsConnectionState;
      setGoogleAdsState(payload);
      setGoogleAdsNotice(payload.message || "Google Ads disconnected.");
    } catch (connectError) {
      const detail = connectError instanceof Error ? connectError.message : "Unable to disconnect Google Ads.";
      setGoogleAdsNotice(detail);
    } finally {
      setGoogleAdsLoading(false);
    }
  };

  const handleConnectMetaAds = () => {
    setMetaAdsConnecting(true);
    setMetaAdsNotice("Opening Meta authorization...");
    const popup = window.open("/api/meta-ads/oauth/start?useDifferent=1", "meta-ads-connect", "width=640,height=760,scrollbars=yes,resizable=yes");
    if (!popup) {
      setMetaAdsConnecting(false);
      setMetaAdsNotice("Popups are blocked. Please allow them and try again.");
    }
    window.setTimeout(() => setMetaAdsConnecting(false), 1200);
  };

  const handleDisconnectMetaAds = async () => {
    try {
      setMetaAdsLoading(true);
      const response = await fetch("/api/meta-ads/disconnect", { method: "POST" });
      const payload = (await response.json()) as MetaAdsConnectionState;
      setMetaAdsState(payload);
      setMetaAdsNotice(payload.message || "Meta Ads disconnected.");
    } catch (connectError) {
      const detail = connectError instanceof Error ? connectError.message : "Unable to disconnect Meta Ads.";
      setMetaAdsNotice(detail);
    } finally {
      setMetaAdsLoading(false);
    }
  };

  const email = user?.email || "";
  const profileDisplayName = user?.user_metadata?.full_name || username || "Profile";

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/50 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-white/40 mt-1">Manage your account, preferences, and connected ad data</p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <User size={18} />
            <h2 className="font-semibold">Profile</h2>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500/30 to-cyan-500/20 text-lg font-bold text-white/80 animate-pulse">
                  A
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
                    <div className="mt-2 h-3 w-52 animate-pulse rounded-full bg-white/8" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Username</p>
                      <div className="mt-2 h-3.5 w-24 animate-pulse rounded-full bg-white/10" />
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Email</p>
                      <div className="mt-2 h-3.5 w-32 animate-pulse rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-sky-500/20">
                    {(profileDisplayName || email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-white">{profileDisplayName}</p>
                    <p className="mt-1 text-sm text-white/45">Active Adigator account profile</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Username</p>
                        <p className="mt-2 text-sm font-medium text-white">{username || "Not set"}</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Email</p>
                        <p className="mt-2 text-sm font-medium text-white break-all">{email || "No email available"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="text-xs uppercase tracking-wide text-white/40">Username</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-sky-400/60"
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-white/40">Email</label>
                <p className="mt-1 text-white font-medium flex items-center gap-2">
                  <Mail size={14} className="text-white/40" />
                  {email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save username"}
                </button>
                {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
              </div>
              </form>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sky-400">
            <Globe2 size={18} />
            <h2 className="font-semibold">Ad accounts</h2>
          </div>
          <p className="text-sm text-white/50">
            Connect Google Ads or Meta Ads to bring your campaigns into Adigator.
          </p>

          {googleAdsLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <div className="space-y-4">
              {googleAdsState?.connected ? (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">Google Ads connected</p>
                      <p className="text-sm text-white/70">{googleAdsState.account?.name || "Connected account"}</p>
                      <p className="text-xs text-white/45">
                        Customer ID: {googleAdsState.customerId || "—"} · Email: {googleAdsState.email || "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSyncGoogleAds()}
                        disabled={googleAdsSyncing}
                        className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {googleAdsSyncing ? "Syncing…" : "Sync campaigns to Adigator"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadGoogleAdsState()}
                        className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 transition hover:bg-black/30"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDisconnectGoogleAds()}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {googleAdsState.campaigns && googleAdsState.campaigns.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">Recent campaigns and drafts</p>
                      {googleAdsState.campaigns.map((campaign) => (
                        <div key={`${campaign.sourceType || "published"}-${campaign.id}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
                          <div className="flex items-center justify-between gap-2">
                            <span>{campaign.name}</span>
                            <span className="text-xs text-white/45">
                              {campaign.sourceType === "draft" ? "Draft" : campaign.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-white/55">
                      No campaigns listed yet. Click Sync to pull published and draft campaigns into Adigator.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white/70">No Google Ads account connected yet.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleConnectGoogleAds}
                      disabled={googleAdsConnecting}
                      className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {googleAdsConnecting ? "Opening…" : "Connect Google Ads"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadGoogleAdsState()}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/20"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}

              {googleAdsNotice ? <p className="text-sm text-sky-300">{googleAdsNotice}</p> : null}

              {metaAdsLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-white/5" />
              ) : metaAdsState?.connected ? (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">Meta Ads connected</p>
                      <p className="text-sm text-white/70">{metaAdsState.account?.name || "Connected account"}</p>
                      <p className="text-xs text-white/45">
                        Ad account: {metaAdsState.adAccountId || "—"} · {metaAdsState.email || "—"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSyncMetaAds()}
                        disabled={metaAdsSyncing}
                        className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {metaAdsSyncing ? "Syncing…" : "Sync campaigns to Adigator"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void loadMetaAdsState()}
                        className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80 transition hover:bg-black/30"
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDisconnectMetaAds()}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white/70">No Meta Ads account connected yet.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleConnectMetaAds}
                      disabled={metaAdsConnecting}
                      className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {metaAdsConnecting ? "Opening…" : "Connect Meta Ads"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadMetaAdsState()}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white transition hover:bg-white/20"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}
              {metaAdsNotice ? <p className="text-sm text-sky-300">{metaAdsNotice}</p> : null}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-cyan-400">
            <Bell size={18} />
            <h2 className="font-semibold">Diagnostics</h2>
          </div>
          <p className="text-sm text-white/50">
            Review internal route and API timing signals for Preview Tool, QA, and Communications.
          </p>
          <Link
            href="/dashboard/telemetry"
            className="inline-flex items-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Open Telemetry Viewer
          </Link>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Bell size={18} />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <p className="text-sm text-white/50">
            Email notifications for analysis completion and export readiness are coming soon.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Shield size={18} />
            <h2 className="font-semibold">Security</h2>
          </div>
          <p className="text-sm text-white/50">
            Password and session management are handled through your login provider.
          </p>
          <Link
            href="/login"
            className="inline-flex text-sm font-semibold text-sky-400 hover:text-sky-300"
          >
            Sign in with a different account →
          </Link>
        </motion.section>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RouteAccessShell routeKey="settings" title="Settings">
      <SettingsPageContent />
    </RouteAccessShell>
  );
}
