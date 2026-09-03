"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { motion, useReducedMotion } from "framer-motion";
import MarketingFooter from "@/app/components/MarketingFooter";
import MarketingNav from "@/app/components/MarketingNav";
import { GoogleAdsIcon } from "@/app/components/brand/PlatformBrandIcons";
import { SITE_EMAILS } from "@/app/lib/siteConfig";
import {
  getFirebaseClientAuth,
  hasFirebaseClientConfig,
} from "@/app/lib/firebase/client";

type SessionState = {
  connected: boolean;
  email: string;
};

const STEPS = [
  { title: "Sign in", body: "Use your Adigator IQ account first." },
  { title: "Connect", body: "We’ll send you to Google’s own sign-in page." },
  { title: "Approve", body: "Pick the Google Ads account you already manage, then you’re back here." },
];

function oauthStartUrl(useDifferent = false) {
  const params = new URLSearchParams({
    returnTo: "/google-ads-oauth",
    popup: "1",
  });
  if (useDifferent) params.set("useDifferent", "1");
  return `/api/google-ads/oauth/start?${params.toString()}`;
}

export default function GoogleAdsOAuthPage() {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<SessionState>({ connected: false, email: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const fade = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
      };

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/google-ads/session", { cache: "no-store" });
      const payload = await response.json();
      setSession({
        connected: Boolean(payload?.connected),
        email: String(payload?.email || ""),
      });
    } catch {
      setSession({ connected: false, email: "" });
    }
  }, []);

  useEffect(() => {
    if (!hasFirebaseClientConfig()) {
      setAuthReady(true);
      return;
    }
    const auth = getFirebaseClientAuth();
    return onAuthStateChanged(auth, (user) => {
      setSignedIn(Boolean(user));
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (searchParams.get("google_ads") === "connected") {
      setNotice("Google Ads is connected.");
      void refreshSession();
    }
  }, [refreshSession, searchParams]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "google-ads-auth") return;
      setBusy(false);
      if (event.data.ok) {
        setNotice("Google Ads is connected.");
        void refreshSession();
      } else {
        setNotice(event.data.message || "Google Ads did not connect. Try again.");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refreshSession]);

  function startConnect(useDifferent = false) {
    setBusy(true);
    setNotice("Opening Google…");
    const url = oauthStartUrl(useDifferent);
    const popup = window.open(url, "google-ads-oauth", "popup=yes,width=540,height=760");
    if (!popup) {
      const fallback = new URL(url, window.location.origin);
      fallback.searchParams.set("popup", "0");
      window.location.assign(`${fallback.pathname}${fallback.search}`);
      return;
    }
    window.setTimeout(() => setBusy(false), 1500);
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/google-ads/disconnect", { method: "POST" });
      setNotice("Disconnected.");
      await refreshSession();
    } catch {
      setNotice("Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/google-ads-oauth" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1080px,92vw)] pb-16">
          <motion.div
            initial={fade ? "hidden" : false}
            animate="visible"
            variants={fade}
            className="overflow-hidden rounded-[32px] border border-[#DEDDD5] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:p-10"
          >
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6B7280]">Google Ads</p>
                <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.05] tracking-[-0.04em]">
                  Connect Google Ads
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#5C5C56]">
                  Link the Google Ads account you already own or manage. Google handles the sign-in. We only get access
                  after you say yes.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {!authReady ? (
                    <span className="text-sm text-[#5C5C56]">Checking your account…</span>
                  ) : !signedIn ? (
                    <Link
                      href="/login?next=/google-ads-oauth"
                      className="marketing-btn-lime saas-hover inline-flex rounded-full px-7 py-3.5 text-sm font-bold"
                    >
                      Sign in to connect
                    </Link>
                  ) : session.connected ? (
                    <>
                      <span className="rounded-full border border-[#C8F04D]/50 bg-[#F7FCE8] px-4 py-2 text-sm font-semibold text-[#3D4A1A]">
                        Connected{session.email ? ` as ${session.email}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => startConnect(true)}
                        disabled={busy}
                        className="marketing-btn-outline saas-hover rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
                      >
                        Use a different account
                      </button>
                      <button
                        type="button"
                        onClick={() => void disconnect()}
                        disabled={busy}
                        className="text-sm font-semibold text-[#5C5C56] underline underline-offset-2 disabled:opacity-60"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startConnect(false)}
                      disabled={busy}
                      className="marketing-btn-lime saas-hover inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold disabled:opacity-60"
                    >
                      <GoogleAdsIcon className="h-5 w-5" />
                      {busy ? "Opening Google…" : "Connect Google Ads"}
                    </button>
                  )}
                  <Link href="/preview-tool?step=campaign-setup" className="text-sm font-semibold text-[#0D0D0D] underline underline-offset-2">
                    Go to campaign setup
                  </Link>
                </div>

                {notice ? <p className="mt-4 text-sm font-medium text-[#3D4A1A]">{notice}</p> : null}
              </div>

              <div className="rounded-[24px] border border-[#E6E5DC] bg-[#FAFAF7] p-5 sm:p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DEDDD5] bg-white">
                  <GoogleAdsIcon className="h-7 w-7" />
                </div>
                <ol className="space-y-4">
                  {STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D0D0D] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{step.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-[#5C5C56]">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#DEDDD5] bg-white px-5 py-5">
              <p className="text-sm font-bold">You stay in control</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5C56]">
                You only connect accounts you own or are allowed to manage. You can disconnect here, or revoke access in
                your Google Account settings.
              </p>
            </div>
            <div className="rounded-2xl border border-[#DEDDD5] bg-white px-5 py-5">
              <p className="text-sm font-bold">Need help?</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5C56]">
                Email{" "}
                <a href={`mailto:${SITE_EMAILS.hello}`} className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  {SITE_EMAILS.hello}
                </a>
                {" · "}
                <Link href="/privacy" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  Privacy
                </Link>
                {" · "}
                <Link href="/terms" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  Terms
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
