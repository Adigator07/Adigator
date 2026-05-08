"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";
import PremiumParticles from "@/app/components/effects/PremiumParticles";

type PremiumPageShellProps = {
  children: React.ReactNode;
};

export default function PremiumPageShell({ children }: PremiumPageShellProps) {
  const [showGrain, setShowGrain] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setShowGrain(!media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

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
      <PremiumParticles density="medium" />
      {showGrain && <div className="grain" />}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-12%",
            left: "-14%",
            width: 640,
            height: 640,
            background: "radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 68%)",
            filter: "blur(58px)",
            willChange: "transform",
          }}
          animate={{ x: [0, 34, -26, 0], y: [0, -24, 14, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "18%",
            right: "-14%",
            width: 540,
            height: 540,
            background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 68%)",
            filter: "blur(56px)",
            willChange: "transform",
          }}
          animate={{ x: [0, -36, 22, 0], y: [0, 20, -16, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            bottom: "-10%",
            left: "34%",
            width: 460,
            height: 460,
            background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 68%)",
            filter: "blur(52px)",
            willChange: "transform",
          }}
          animate={{ x: [0, 28, -16, 0], y: [0, -14, 22, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-0 ai-pixels" />
        <div className="absolute inset-0 ai-beam" />
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
