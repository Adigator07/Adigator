"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  canAccessPreviewTool,
  clearGuestDemoRestriction,
  consumePreviewToolRefresh,
  endGuestDemoSession,
  enterGuestDemoSession,
  isAuthenticatedUser,
  isDemoEntry,
  markPreviewToolRefresh,
  resetPreviewToolForDemo,
} from "@/app/lib/demoAccess";
import { MARKETING_SIGN_IN } from "@/app/lib/siteNavigation";
import { useRouteLoadTelemetry } from "@/app/lib/routeTelemetry";
import { AdigatorOrbitLoader } from "@/app/components/ui/AdigatorOrbitLoader";

const PreviewTool = dynamic(() => import("./PreviewTool"), {
  ssr: false,
  loading: () => (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1220]">
      <div className="agi-fog-layer opacity-20 mix-blend-screen" aria-hidden />
      <div className="agi-light-cycle opacity-35" aria-hidden />
      <AdigatorOrbitLoader
        size="lg"
        tone="dark"
        label="Loading Campaign Intelligence Studio"
        hint="Catch Campaign Mistakes Before Media Spend Begins"
      />
    </div>
  ),
});

export default function PreviewToolGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("unknown");
  const markRouteReady = useRouteLoadTelemetry("preview-tool");

  const handleResetGuestBlock = () => {
    clearGuestDemoRestriction();
    resetPreviewToolForDemo();
    setBlocked(false);
    setReady(false);
    router.replace("/preview-tool?demo=1&step=campaign-setup");
  };

  useEffect(() => {
    void import("./PreviewTool");
  }, []);

  useEffect(() => {
    let active = true;

    const handleBeforeUnload = () => {
      markPreviewToolRefresh();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    (async () => {
      const demoRequest = isDemoEntry(searchParams);
      let authed = await isAuthenticatedUser();

      if (demoRequest && !authed) {
        resetPreviewToolForDemo();
        const step = searchParams.get("step");
        if (step !== "1" && step !== "campaign-setup" && active) {
          router.replace("/preview-tool?demo=1&step=campaign-setup");
          return;
        }
      }

      const access = await canAccessPreviewTool();
      if (!active) return;

      if (!authed && !access.allowed && access.reason === "demo_exhausted") {
        // Guard against delayed auth hydration causing false guest blocking.
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        authed = await isAuthenticatedUser();
        if (authed) {
          clearGuestDemoRestriction();
          setBlocked(false);
          setReady(true);
          markRouteReady("ready", { blocked: false, authed: true });
          return;
        }
      }

      if (authed) {
        clearGuestDemoRestriction();
      }

      if (!access.allowed) {
        setBlockReason(access.reason || "unknown");
        setBlocked(true);
        setReady(true);
        markRouteReady("blocked", { reason: access.reason || "unknown", authed });
        return;
      }

      if (!authed) {
        enterGuestDemoSession();
      }

      setBlocked(false);
      setReady(true);
      markRouteReady("ready", { blocked: false, authed });
    })();

    return () => {
      active = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!consumePreviewToolRefresh()) {
        endGuestDemoSession();
      }
    };
  }, [markRouteReady, router, searchParams]);

  if (!ready) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1220]">
        <div className="agi-fog-layer opacity-20 mix-blend-screen" aria-hidden />
        <div className="agi-light-cycle opacity-35" aria-hidden />
        <AdigatorOrbitLoader
          size="lg"
          tone="dark"
          label="Preparing Campaign Intelligence Studio"
          hint="Catch Campaign Mistakes Before Media Spend Begins"
        />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#19060a,#0f0305_45%,#160509)] text-white flex items-center justify-center px-6">
        <div className="agi-login-grid" aria-hidden />
        <div className="agi-login-scan" aria-hidden />
        <div className="pointer-events-none absolute -left-24 top-10 h-88 w-88 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.34),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-88 w-88 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.3),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[28px_28px]" />

        <div className="relative max-w-lg rounded-3xl border border-rose-200/30 bg-white/5 p-8 text-center backdrop-blur-xl shadow-[0_25px_70px_rgba(127,29,29,0.5)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">Demo Limit Reached</p>
          <h1 className="mt-3 text-2xl font-black text-white">Your free demo session has been used</h1>
          <p className="mt-3 text-sm leading-relaxed text-rose-50/85">
            Guest users receive one interactive Campaign Intelligence Studio experience. Sign in to unlock unlimited access to the Dashboard and Campaign Intelligence Studio.
          </p>
          <p className="mt-3 text-xs text-rose-100/75">Reason: {blockReason}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={MARKETING_SIGN_IN.href}
              className="rounded-full border border-rose-200/45 bg-[linear-gradient(135deg,rgba(244,63,94,0.48),rgba(220,38,38,0.36))] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-rose-100/30 bg-white/8 px-6 py-3 text-sm font-semibold text-rose-50 transition hover:bg-white/15"
            >
              Watch Demo Video
            </Link>
            <button
              type="button"
              onClick={handleResetGuestBlock}
              className="rounded-full border border-rose-100/30 bg-white/8 px-6 py-3 text-sm font-semibold text-rose-50 transition hover:bg-white/15"
            >
              Reset Demo On This Browser
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <PreviewTool />
    </div>
  );
}
