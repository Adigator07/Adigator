"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import PremiumParticles from "@/app/components/effects/PremiumParticles";
import { getAdaptivePerformanceTier, type PerformanceTier } from "@/app/lib/performanceTier";

type PremiumPageShellProps = {
  children: React.ReactNode;
};

export default function PremiumPageShell({ children }: PremiumPageShellProps) {
  const [showGrain, setShowGrain] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>("full");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = window.navigator as Navigator & {
      connection?: {
        addEventListener?: (type: string, listener: EventListener) => void;
        removeEventListener?: (type: string, listener: EventListener) => void;
      };
    };

    const updateTier = () => setPerformanceTier(getAdaptivePerformanceTier());
    updateTier();

    media.addEventListener("change", updateTier);
    window.addEventListener("resize", updateTier);
    nav.connection?.addEventListener?.("change", updateTier);

    return () => {
      media.removeEventListener("change", updateTier);
      window.removeEventListener("resize", updateTier);
      nav.connection?.removeEventListener?.("change", updateTier);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setShowGrain(!media.matches && performanceTier === "full");
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [performanceTier]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      setIsScrolling(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolling(false), 160);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#020617] text-white" data-scrolling={isScrolling ? "true" : "false"}>
      <PremiumParticles density="medium" mode={performanceTier} />
      {showGrain && <div className="grain" />}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Single ambient orb — lite gets static, full gets slow drift */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-10%",
            left: "-12%",
            width: 560,
            height: 560,
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 68%)",
            filter: "blur(64px)",
            willChange: "transform",
          }}
          animate={performanceTier === "lite" ? {} : { x: [0, 28, -18, 0], y: [0, -18, 12, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        {performanceTier !== "lite" && (
          <motion.div
            className="absolute rounded-full"
            style={{
              bottom: "-8%",
              right: "-10%",
              width: 460,
              height: 460,
              background: "radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 68%)",
              filter: "blur(56px)",
              willChange: "transform",
            }}
            animate={{ x: [0, -22, 14, 0], y: [0, 16, -12, 0] }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="absolute inset-0 ai-pixels" />
        <div className="absolute inset-0 ai-beam" />
        <div className="absolute inset-0 ai-nodes" />
        <div className="absolute inset-0 ai-rings" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      <Header />

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 px-6 py-8 text-center text-xs uppercase tracking-[0.14em] text-gray-500 md:px-10">
        © 2026 Adigator. Creative intelligence for modern teams.
      </footer>
    </main>
  );
}
