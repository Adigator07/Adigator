"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const EXPO_OUT = [0.16, 1, 0.3, 1];

export function WizardStepNav({
  steps,
  currentStep,
  onStepChange,
  lockedStepIds = [],
  layoutIdPrefix = "wizard-steps",
}) {
  const reduceMotion = useReducedMotion();
  const [shakeId, setShakeId] = useState(null);
  const [lockTooltip, setLockTooltip] = useState(null);
  const tabRefs = useRef([]);

  const activeIndex = steps.findIndex((s) => s.id === String(currentStep));
  const progress = steps.length > 1 ? (activeIndex + 1) / steps.length : 1;

  const handleClick = (stepItem, index) => {
    if (lockedStepIds.includes(stepItem.id)) {
      setShakeId(stepItem.id);
      setLockTooltip(stepItem.id);
      window.setTimeout(() => setShakeId(null), 400);
      window.setTimeout(() => setLockTooltip(null), 2200);
      return;
    }
    onStepChange(stepItem.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    let next = index + direction;
    while (next >= 0 && next < steps.length) {
      if (!lockedStepIds.includes(steps[next].id)) {
        onStepChange(steps[next].id);
        tabRefs.current[next]?.focus();
        break;
      }
      next += direction;
    }
  };

  return (
    <div className="w-full">
      <div className="relative mb-3 overflow-hidden rounded-full neon-progress-track" aria-hidden>
        <motion.div
          className="h-full w-full origin-left rounded-full neon-progress-fill"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: EXPO_OUT }}
        />
      </div>

      <div
        role="tablist"
        aria-label="Workflow steps"
        className="relative flex w-full flex-wrap gap-1 rounded-2xl border border-white/15 bg-[#1a1a28]/90 p-1 shadow-[0_0_24px_-6px_rgba(129,140,248,0.25)] backdrop-blur-md"
      >
        {steps.map((stepItem, index) => {
          const isActive = String(currentStep) === stepItem.id;
          const isCompleted = index < activeIndex;
          const isLocked = lockedStepIds.includes(stepItem.id);
          const isShaking = shakeId === stepItem.id;

          return (
            <div key={stepItem.id} className="relative min-w-0 flex-1">
              <button
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={isLocked || undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleClick(stepItem, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`studio-focus-ring relative z-10 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ease-out sm:px-4 ${
                  isLocked ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:-translate-y-px"
                } ${isShaking ? "studio-shake" : ""} ${
                  isActive ? "text-white" : "text-[#c8c8d4] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {isActive && !reduceMotion ? (
                  <motion.span
                    layoutId={`${layoutIdPrefix}-pill`}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                ) : isActive ? (
                  <span className="absolute inset-0 rounded-xl bg-studio-accent" />
                ) : null}

                <span className="relative z-10 flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold studio-tabular ${
                      isCompleted
                        ? "bg-studio-success/20 text-studio-success"
                        : isActive
                          ? "bg-white/15 text-white"
                          : "bg-white/[0.06] text-studio-muted"
                    }`}
                  >
                    {isLocked ? (
                      <Lock size={10} aria-hidden />
                    ) : isCompleted ? (
                      <Check size={11} strokeWidth={3} aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="studio-heading hidden truncate tracking-tight sm:inline">{stepItem.label}</span>
                </span>
              </button>

              {lockTooltip === stepItem.id && isLocked ? (
                <div
                  role="tooltip"
                  className="absolute left-1/2 top-full z-30 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-studio-border bg-studio-surface-elevated px-2.5 py-1.5 text-[10px] font-medium leading-snug text-studio-muted shadow-studio"
                >
                  {stepItem.lockReason || "Complete previous steps to unlock."}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ToolNavBtn({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}) {
  const variants = {
    primary: "studio-btn-primary studio-focus-ring text-white",
    back: "studio-btn-ghost studio-focus-ring text-studio-muted hover:text-studio-text",
    secondary: "studio-btn-ghost studio-focus-ring text-studio-text",
    success:
      "relative overflow-hidden rounded-xl border border-studio-success/40 bg-studio-success/15 font-bold text-studio-success shadow-[0_4px_20px_-6px_rgba(52,211,153,0.35)] transition-all duration-200 hover:bg-studio-success/25 hover:shadow-[0_8px_28px_-6px_rgba(52,211,153,0.45)] active:scale-[0.98]",
  };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`.trim()}
    >
      {children}
    </motion.button>
  );
}

export function ToolSelectionCard({ selected, onClick, children }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduceMotion ? undefined : { scale: 1.02, y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={`studio-focus-ring neon-card group relative w-full cursor-pointer overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 ease-out sm:p-8 ${
        selected ? "neon-card-selected" : "hover:border-cyan-400/40 hover:shadow-[0_0_32px_-6px_rgba(34,211,238,0.3)]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-70"
        }`}
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(34,211,238,0.15), transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 text-[#f4f4f8]">{children}</div>
    </motion.button>
  );
}

export function ToolStatCard({ value, label, tone = "default" }) {
  const tones = {
    default: "border-white/15 text-[#f4f4f8]",
    accent: "border-cyan-400/40 text-cyan-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.35)]",
    success: "border-emerald-400/40 text-emerald-300 shadow-[0_0_24px_-6px_rgba(74,222,128,0.3)]",
    warning: "border-amber-400/40 text-amber-300 shadow-[0_0_24px_-6px_rgba(252,211,77,0.3)]",
    error: "border-rose-400/40 text-rose-300 shadow-[0_0_24px_-6px_rgba(251,113,133,0.3)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EXPO_OUT }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`neon-card rounded-xl border p-4 text-center ${tones[tone]}`}
    >
      <p className="studio-tabular text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-[#c8c8d4]">{label}</p>
    </motion.div>
  );
}

export function ToolSectionHeader({ title, description, step }) {
  return (
    <div className="space-y-2">
      {step ? (
        <p className="tool-neon-accent text-xs font-bold uppercase tracking-[0.2em]">
          Step {step}
        </p>
      ) : null}
      <h2 className="studio-heading text-3xl font-bold tracking-tight text-[#f4f4f8] md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-base leading-relaxed text-[#c8c8d4]">{description}</p>
      ) : null}
    </div>
  );
}

export function ToolSummaryChip({ label, value }) {
  return (
    <div className="neon-card rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#f4f4f8]">{value}</p>
    </div>
  );
}

export function ToolInput({ className = "", ...props }) {
  return (
    <input
      className={`studio-focus-ring studio-field w-full rounded-xl px-4 py-3 text-sm outline-none transition ${className}`}
      {...props}
    />
  );
}

export function ToolTextarea({ className = "", ...props }) {
  return (
    <textarea
      className={`studio-focus-ring studio-field w-full resize-y rounded-xl px-4 py-3 text-sm outline-none transition ${className}`}
      {...props}
    />
  );
}

export function ToolSelect({ className = "", children, ...props }) {
  return (
    <select
      className={`studio-focus-ring studio-field w-full appearance-none rounded-xl px-4 py-3 text-sm outline-none transition ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function ToolSurface({ children, className = "" }) {
  return (
    <div className={`studio-card rounded-2xl p-5 md:p-6 ${className}`}>{children}</div>
  );
}

export function ToolFooterBar({ children }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-indigo-500/25 bg-[#0c0c14]/92 backdrop-blur-xl shadow-[0_-8px_32px_-8px_rgba(129,140,248,0.2)]">
      <div className="mx-auto flex w-full max-w-7xl gap-3 px-6 py-4 md:gap-4 md:px-10">{children}</div>
    </div>
  );
}

export function ToolDropzone({ active, onClick, onDragOver, onDragLeave, onDrop, children }) {
  return (
    <motion.div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      animate={
        active
          ? {
              borderColor: "rgba(34, 211, 238, 0.7)",
              boxShadow: "0 0 40px -4px rgba(34, 211, 238, 0.45), inset 0 0 30px rgba(34, 211, 238, 0.08)",
            }
          : {
              borderColor: "rgba(129, 140, 248, 0.35)",
              boxShadow: "0 0 24px -8px rgba(129, 140, 248, 0.2)",
            }
      }
      whileHover={{ scale: 1.005 }}
      className="studio-focus-ring neon-card relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-shadow duration-300 md:p-12"
    >
      {children}
    </motion.div>
  );
}

export function useToolMotionVariants() {
  const reduceMotion = useReducedMotion();

  return useMemo(
    () => ({
      container: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: reduceMotion
            ? { duration: 0 }
            : { staggerChildren: 0.06, delayChildren: 0.03 },
        },
        exit: { opacity: 0, transition: { duration: reduceMotion ? 0 : 0.18 } },
      },
      item: {
        hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduceMotion ? 0 : 0.35, ease: EXPO_OUT },
        },
      },
      stepPanel: {
        hidden: { opacity: 0, x: reduceMotion ? 0 : 20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: reduceMotion ? 0 : 0.38,
            ease: EXPO_OUT,
            staggerChildren: 0.07,
          },
        },
        exit: {
          opacity: 0,
          x: reduceMotion ? 0 : -16,
          transition: { duration: reduceMotion ? 0 : 0.22, ease: "easeIn" },
        },
      },
    }),
    [reduceMotion],
  );
}
