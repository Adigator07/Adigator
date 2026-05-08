import Link from "next/link";
import { motion } from "framer-motion";
import { transitions } from "@/app/lib/motionTokens";

export default function CinematicCta() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={transitions.reveal}
      className="rounded-2xl border border-white/10 bg-linear-to-br from-purple-500/14 via-fuchsia-500/8 to-cyan-500/10 p-8 text-center backdrop-blur-xl md:p-12"
    >
      <h3 className="font-display text-4xl text-white md:text-5xl">Ready to launch with confidence?</h3>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
        Bring validation, analysis, and workflow speed into one premium creative intelligence platform.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/preview" className="btn-primary">
          Start Free Preview
          <span className="ml-1">→</span>
        </Link>
        <Link href="/product" className="btn-secondary">
          Explore Platform
        </Link>
      </div>
    </motion.div>
  );
}
