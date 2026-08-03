"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type AdigatorLaunchScreenProps = {
  durationMs?: number;
};

export default function AdigatorLaunchScreen({ durationMs = 1200 }: AdigatorLaunchScreenProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden bg-[#050816] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px]" />

      <motion.div
        initial={reduceMotion ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={reduceMotion ? undefined : { letterSpacing: ["0.12em", "0.22em", "0.12em"] }}
          transition={reduceMotion ? undefined : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="text-center text-[clamp(2.4rem,5vw,4rem)] font-black tracking-[0.12em] text-white"
        >
          Adigator
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { width: 0, opacity: 0.6 }}
          animate={reduceMotion ? { width: 140, opacity: 1 } : { width: 140, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 h-1 overflow-hidden rounded-full bg-white/15"
        >
          <motion.div
            animate={reduceMotion ? undefined : { x: ["-110%", "110%"] }}
            transition={reduceMotion ? undefined : { duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/3 rounded-full bg-linear-to-r from-sky-400 via-cyan-300 to-emerald-400"
          />
        </motion.div>

        <p className="mt-4 text-sm font-medium uppercase tracking-[0.28em] text-white/65">
          preparing your workspace
        </p>
      </motion.div>
    </motion.div>
  );
}
