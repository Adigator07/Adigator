"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  canAccessPreviewTool,
  consumePreviewToolRefresh,
  endGuestDemoSession,
  enterGuestDemoSession,
  isAuthenticatedUser,
  isDemoEntry,
  markPreviewToolRefresh,
  resetPreviewToolForDemo,
} from "@/app/lib/demoAccess";
import { MARKETING_SIGN_IN } from "@/app/lib/siteNavigation";

const PreviewTool = dynamic(() => import("./PreviewTool"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-medium">Loading Preview Tool...</p>
      </div>
    </div>
  ),
});

export default function PreviewToolGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let active = true;

    const handleBeforeUnload = () => {
      markPreviewToolRefresh();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    (async () => {
      const demoRequest = isDemoEntry(searchParams);
      const authed = await isAuthenticatedUser();

      if (demoRequest && !authed) {
        resetPreviewToolForDemo();
        const step = searchParams.get("step");
        if (step !== "1" && active) {
          router.replace("/preview-tool?demo=1&step=1");
          return;
        }
      }

      const access = await canAccessPreviewTool();
      if (!active) return;

      if (!access.allowed) {
        setBlocked(true);
        setReady(true);
        return;
      }

      if (!authed) {
        enterGuestDemoSession();
      }

      setReady(true);
    })();

    return () => {
      active = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!consumePreviewToolRefresh()) {
        endGuestDemoSession();
      }
    };
  }, [router, searchParams]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-medium">Preparing Preview Tool...</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">Demo Limit Reached</p>
          <h1 className="mt-3 text-2xl font-black">Your free demo session has been used</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Guest users receive one interactive Preview Tool experience. Sign in to unlock unlimited access to the Dashboard and Preview Tool.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={MARKETING_SIGN_IN.href}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0D0D0D]"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
            >
              Watch Demo Video
            </Link>
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
