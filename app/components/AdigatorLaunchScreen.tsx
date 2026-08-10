"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AdigatorOrbitLoader } from "@/app/components/ui/AdigatorOrbitLoader";
import { GoogleAdsIcon, MetaIcon, TradeDeskIcon } from "@/app/components/brand/PlatformBrandIcons";

type AdigatorLaunchScreenProps = {
  /** Auto-dismiss after ms. Omit to stay until the parent unmounts. */
  durationMs?: number;
  /** Keep sidebar/topbar clickable — overlay only covers the content area. */
  embedded?: boolean;
};

export default function AdigatorLaunchScreen({ durationMs, embedded = false }: AdigatorLaunchScreenProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (durationMs == null) return;
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${
        embedded ? "absolute inset-0 z-30" : "fixed inset-0 z-9999"
      } flex items-center justify-center overflow-hidden bg-[#050816] text-white`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px]" />

      <motion.div
        initial={reduceMotion ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <AdigatorOrbitLoader
          size="lg"
          tone="dark"
          label="Loading your dashboard"
          hint="Catch Campaign Mistakes Before Media Spend Begins"
        />

        <div className="mt-6 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <GoogleAdsIcon className="h-5 w-5" />
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <MetaIcon className="h-5 w-5" />
          </span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <TradeDeskIcon className="h-5 w-5" />
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
