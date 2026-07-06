"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, CheckCircle2, Zap } from "lucide-react";

const CAMPAIGN_TASKS = [
  {
    id: "campaign-setup",
    icon: "📋",
    ariaLabel: "Clipboard",
    title: "Campaign Setup",
    description: "Campaign brief, creatives, URLs, platform rules",
  },
  {
    id: "creative-addition",
    icon: "🖼️",
    ariaLabel: "Framed picture",
    title: "Creative Addition",
    description: "Dimensions, messaging, placement compatibility",
  },
  {
    id: "creative-swap",
    icon: "🔄",
    ariaLabel: "Refresh",
    title: "Creative Swap",
    description: "Version check, CTA, landing page alignment",
  },
  {
    id: "landing-page-update",
    icon: "🌐",
    ariaLabel: "Globe",
    title: "Landing Page Update",
    description: "Offer, messaging, trust signals, CTA",
  },
  {
    id: "url-utm-update",
    icon: "🔗",
    ariaLabel: "Link",
    title: "URL / UTM Update",
    description: "URL health, UTM, tracking validation",
  },
  {
    id: "campaign-renewal",
    icon: "📅",
    ariaLabel: "Calendar",
    title: "Campaign Renewal",
    description: "Asset freshness, links, compliance",
  },
] as const;

function TaskFlowSteps() {
  return (
    <div className="mt-4 flex flex-col items-center gap-1" aria-hidden>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#C8F04D]/80">
        <CheckCircle2 size={12} />
        Validate
      </div>
      <ArrowDown size={12} className="text-white/25" />
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
        <Zap size={12} />
        Execute
      </div>
    </div>
  );
}

function TaskCard({
  task,
  index,
  reduceMotion,
}: {
  task: (typeof CAMPAIGN_TASKS)[number];
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative min-h-[48px] rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:border-[#C8F04D]/40 hover:shadow-[0_0_32px_rgba(200,240,77,0.12)] focus-within:border-[#C8F04D]/50 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#C8F04D]/50"
      tabIndex={0}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_0%_0%,rgba(200,240,77,0.06),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:gap-4">
        <div className="flex flex-1 flex-col">
          <span className="text-[32px] leading-none" role="img" aria-label={task.ariaLabel}>
            {task.icon}
          </span>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-white">{task.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{task.description}</p>
        </div>
        <TaskFlowSteps />
      </div>
    </motion.article>
  );
}

export default function CampaignTaskValidationSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em]">
          Every Campaign Task Deserves Validation
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
          Whether you&apos;re launching a new campaign, adding creatives, updating landing pages, or renewing an
          existing campaign, every task should be validated before execution to reduce rework and operational risk.
        </p>
      </motion.div>

      <div className="relative mt-10 overflow-hidden rounded-[28px] border border-[#2A2A2A] bg-[#0A0A0A] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(14,165,233,0.08),transparent_50%),radial-gradient(ellipse_at_70%_100%,rgba(200,240,77,0.06),transparent_50%)]"
          aria-hidden
        />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {CAMPAIGN_TASKS.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} reduceMotion={!!reduceMotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
