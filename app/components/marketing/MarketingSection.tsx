"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
  dark?: boolean;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  center = false,
  dark = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""} ${className}`}>
      {eyebrow ? (
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
            dark ? "text-white/45" : "text-[#8A8A82]"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em] ${
          eyebrow ? "mt-3" : ""
        } ${dark ? "text-white" : "text-[#0D0D0D]"}`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-white/60" : "text-[#5A5A55]"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function FadeIn({ children, className = "", delay = 0 }: FadeInProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type MarketingCardProps = {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  hover?: boolean;
};

export function MarketingCard({
  children,
  className = "",
  dark = false,
  hover = true,
}: MarketingCardProps) {
  return (
    <article
      className={`rounded-2xl border p-6 sm:rounded-3xl sm:p-7 ${
        dark
          ? "border-white/10 bg-white/[0.04] text-white"
          : "border-[#DEDDD5] bg-white text-[#0D0D0D] shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
      } ${hover ? "saas-hover transition duration-300 hover:-translate-y-0.5" : ""} ${className}`}
    >
      {children}
    </article>
  );
}

type SoftBandProps = {
  children: ReactNode;
  className?: string;
  dark?: boolean;
};

export function SoftBand({ children, className = "", dark = false }: SoftBandProps) {
  return (
    <section
      className={`relative overflow-hidden ${
        dark
          ? "border-y border-[#1A1A1A] bg-[#0A0A0A] text-white"
          : "border-y border-[#DEDDD5] bg-[#FAFAF7] text-[#0D0D0D]"
      } ${className}`}
    >
      {dark ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(200,240,77,0.08),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(255,255,255,0.04),transparent_45%)]"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(200,240,77,0.12),transparent_45%)]"
          aria-hidden
        />
      )}
      <div className="relative">{children}</div>
    </section>
  );
}

type WorkflowStepsProps = {
  steps: { label: string; detail?: string }[];
  dark?: boolean;
};

export function WorkflowSteps({ steps, dark = false }: WorkflowStepsProps) {
  return (
    <ol className="mt-6 space-y-3">
      {steps.map((step, index) => (
        <li key={step.label} className="flex gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              dark ? "bg-[#C8F04D]/15 text-[#C8F04D]" : "bg-[#EEF0E7] text-[#0D0D0D]"
            }`}
          >
            {index + 1}
          </span>
          <div>
            <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#0D0D0D]"}`}>{step.label}</p>
            {step.detail ? (
              <p className={`mt-0.5 text-sm leading-relaxed ${dark ? "text-white/55" : "text-[#5A5A55]"}`}>
                {step.detail}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

type FinalCtaProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export function FinalCtaBand({ title, description, href, label }: FinalCtaProps) {
  return (
    <section className="relative overflow-hidden bg-[#0D0D0D] py-14 text-white sm:py-16 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,240,77,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-[min(1100px,92vw)] flex-col items-center text-center">
        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight tracking-[-0.04em]">{title}</h2>
        <p className="mt-4 max-w-xl text-base text-white/60 sm:text-lg">{description}</p>
        <Link
          href={href}
          className="saas-hover mt-8 inline-flex rounded-full bg-[#C8F04D] px-9 py-4 text-base font-bold text-[#0D0D0D] transition hover:bg-[#b9da4a]"
        >
          {label}
        </Link>
      </div>
    </section>
  );
}
