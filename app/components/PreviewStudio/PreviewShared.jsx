"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Lock, Pencil } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateScale } from "@/app/lib/scalingEngine";

const EXPO_OUT = [0.16, 1, 0.3, 1];

export function StudioContentPanel({ panelKey, children, className = "" }) {
  const reduceMotion = useReducedMotion();

  const variants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        x: reduceMotion ? 0 : 10,
        y: reduceMotion ? 0 : 4,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: reduceMotion ? 0 : 0.28,
          ease: EXPO_OUT,
        },
      },
      exit: {
        opacity: 0,
        x: reduceMotion ? 0 : -10,
        transition: {
          duration: reduceMotion ? 0 : 0.2,
          ease: "easeIn",
        },
      },
    }),
    [reduceMotion],
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={panelKey}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function StudioTabBar({
  tabs,
  activeTab,
  onChange,
  variant = "dark",
  lockedTabs = [],
  layoutIdPrefix = "studio-tabs",
  compact = false,
}) {
  const reduceMotion = useReducedMotion();
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0);
  const [shakeId, setShakeId] = useState(null);
  const [lockTooltip, setLockTooltip] = useState(null);
  const tabRefs = useRef([]);

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const isLight = variant === "light";

  useEffect(() => {
    if (activeIndex >= 0) {
      setMaxVisitedIndex((prev) => Math.max(prev, activeIndex));
    }
  }, [activeIndex]);

  const progress = tabs.length > 1 ? (maxVisitedIndex + 1) / tabs.length : 1;

  const handleTabClick = (tab, index) => {
    if (lockedTabs.includes(tab.id)) {
      setShakeId(tab.id);
      setLockTooltip(tab.id);
      window.setTimeout(() => setShakeId(null), 400);
      window.setTimeout(() => setLockTooltip(null), 2200);
      return;
    }
    onChange(tab.id);
    setMaxVisitedIndex((prev) => Math.max(prev, index));
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    let next = index + direction;

    while (next >= 0 && next < tabs.length) {
      if (!lockedTabs.includes(tabs[next].id)) {
        onChange(tabs[next].id);
        tabRefs.current[next]?.focus();
        break;
      }
      next += direction;
    }
  };

  const shellClass = isLight
    ? "border-slate-200 bg-slate-100/80"
    : "border-studio-border bg-studio-surface";

  return (
    <div className="w-full">
      <div
        className={`relative mb-2 h-px overflow-hidden rounded-full ${
          isLight ? "bg-slate-200" : "bg-white/[0.06]"
        }`}
        aria-hidden
      >
        <motion.div
          className={`h-full origin-left rounded-full ${
            isLight ? "bg-sky-500" : "bg-studio-accent"
          }`}
          initial={false}
          animate={{ scaleX: progress }}
          transition={{
            duration: reduceMotion ? 0 : 0.4,
            ease: EXPO_OUT,
          }}
          style={{ width: "100%" }}
        />
      </div>

      <div
        role="tablist"
        aria-label="Studio steps"
        className={`relative inline-flex max-w-full flex-wrap gap-1 rounded-2xl border p-1 ${shellClass}`}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isCompleted = index < activeIndex;
          const isLocked = lockedTabs.includes(tab.id);
          const isShaking = shakeId === tab.id;
          const showTooltip = lockTooltip === tab.id;

          return (
            <div key={tab.id} className="relative">
              <button
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${layoutIdPrefix}-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`${layoutIdPrefix}-panel-${tab.id}`}
                aria-disabled={isLocked || undefined}
                tabIndex={isActive ? 0 : -1}
                title={isLocked ? tab.lockReason || "Complete previous steps first" : undefined}
                onClick={() => handleTabClick(tab, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`studio-focus-ring relative z-10 inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-200 ease-out ${
                  compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"
                } ${
                  isLocked
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer hover:-translate-y-px"
                } ${
                  isShaking ? "studio-shake" : ""
                } ${
                  isActive
                    ? isLight
                      ? "text-white"
                      : "text-white"
                    : isLight
                      ? "text-slate-600 hover:bg-white/70"
                      : "text-studio-muted hover:bg-white/[0.04] hover:text-studio-text"
                }`}
              >
                {isActive && !reduceMotion ? (
                  <motion.span
                    layoutId={`${layoutIdPrefix}-pill`}
                    className={`absolute inset-0 rounded-xl ${
                      isLight
                        ? "bg-sky-500 shadow-sm"
                        : "bg-studio-accent shadow-studio-glow"
                    }`}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                  />
                ) : isActive ? (
                  <span
                    className={`absolute inset-0 rounded-xl ${
                      isLight ? "bg-sky-500" : "bg-studio-accent"
                    }`}
                  />
                ) : null}

                <span className="relative z-10 flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold studio-tabular ${
                      isCompleted
                        ? isLight
                          ? "bg-emerald-500 text-white"
                          : "bg-studio-success/20 text-studio-success"
                        : isActive
                          ? isLight
                            ? "bg-white/20 text-white"
                            : "bg-white/15 text-white"
                          : isLight
                            ? "bg-slate-200 text-slate-600"
                            : "bg-white/[0.06] text-studio-muted"
                    }`}
                  >
                    {isLocked ? (
                      <Lock size={10} aria-hidden />
                    ) : isCompleted ? (
                      <motion.span
                        key={`check-${tab.id}`}
                        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, ease: EXPO_OUT }}
                      >
                        <Check size={11} strokeWidth={3} aria-hidden />
                      </motion.span>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="studio-heading tracking-tight">{tab.label}</span>
                </span>
              </button>

              {showTooltip && isLocked ? (
                <div
                  role="tooltip"
                  className={`absolute left-1/2 top-full z-20 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium leading-snug ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-700 shadow-lg"
                      : "border-studio-border bg-studio-surface-elevated text-studio-muted shadow-studio"
                  }`}
                >
                  {tab.lockReason || "Complete previous steps to unlock."}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PreviewCardShell({
  creative,
  platformLabel,
  children,
  onCopy,
  onEdit,
}) {
  return (
    <article className="studio-card overflow-hidden shadow-studio">
      <div className="flex items-center justify-between gap-3 border-b border-studio-border bg-black/20 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-studio-accent/30 bg-studio-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-studio-accent">
              {platformLabel}
            </span>
            <span className="truncate text-xs text-studio-muted">{creative.placement}</span>
            {creative.size ? (
              <span className="font-mono text-[10px] text-studio-tertiary">{creative.size}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-studio-tertiary">
            {creative.type?.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onCopy ? (
            <button
              type="button"
              onClick={() => onCopy(creative)}
              className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium"
            >
              <Copy size={12} /> Copy
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(creative)}
              className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium"
            >
              <Pencil size={12} /> Edit
            </button>
          ) : null}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </article>
  );
}

export function ScaledAdFrame({ width, height, children, className = "" }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateScale = () => {
      const containerWidth = node.clientWidth || width;
      setScale(calculateScale(containerWidth, width, height));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [width, height]);

  const scaledHeight = useMemo(() => Math.ceil(height * scale), [height, scale]);

  return (
    <div ref={containerRef} className={`w-full overflow-hidden ${className}`} style={{ height: scaledHeight }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function PreviewLoadingState({ label = "Generating platform templates…" }) {
  return (
    <div className="studio-card flex flex-col items-center justify-center rounded-2xl py-20 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-studio-accent border-t-transparent" />
      <p className="mt-4 text-sm text-studio-muted">{label}</p>
    </div>
  );
}

export function PreviewEmptyState({ title, description }) {
  return (
    <div className="studio-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
      <span className="mb-3 text-4xl">📭</span>
      <p className="font-semibold text-studio-text">{title}</p>
      <p className="mt-1 max-w-md text-sm text-studio-muted">{description}</p>
    </div>
  );
}

export function PreviewErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-studio-error/25 bg-studio-error/5 py-16 text-center">
      <p className="font-semibold text-studio-error">Template generation failed</p>
      <p className="mt-2 max-w-md text-sm text-studio-error/80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="studio-btn-ghost studio-focus-ring mt-4 border-studio-error/30 px-4 py-2 text-sm text-studio-error hover:bg-studio-error/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function PreviewDeviceIncompatibleState({
  title = undefined,
  message,
  device,
  creativeSize,
  onSwitchDevice,
  alternateDevice,
}) {
  const deviceLabel = device === "desktop" ? "Desktop" : "Mobile";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-studio-warning/25 bg-studio-warning/5 py-16 text-center">
      <span className="mb-3 text-3xl">⚠️</span>
      <p className="max-w-lg font-semibold text-studio-warning">
        {title || `Not supported for ${deviceLabel} placements`}
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-studio-warning/80">{message}</p>
      {creativeSize ? (
        <p className="mt-3 font-mono text-[11px] text-studio-warning/60">Creative size: {creativeSize}</p>
      ) : null}
      {onSwitchDevice && alternateDevice ? (
        <button
          type="button"
          onClick={() => onSwitchDevice(alternateDevice)}
          className="studio-btn-ghost studio-focus-ring mt-5 border-studio-warning/40 px-4 py-2 text-sm font-semibold text-studio-warning hover:bg-studio-warning/10"
        >
          Switch to {alternateDevice === "desktop" ? "Desktop" : "Mobile"} view
        </button>
      ) : null}
    </div>
  );
}

export function DeviceToggle({ options, activeDevice, onChange, layoutIdPrefix = "device-toggle" }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="inline-flex rounded-xl border border-studio-border bg-studio-surface p-1">
      {options.map((option) => {
        const isActive = activeDevice === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`studio-focus-ring relative rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ease-out ${
              isActive
                ? "text-white"
                : "text-studio-muted hover:bg-white/[0.04] hover:text-studio-text"
            }`}
          >
            {isActive && !reduceMotion ? (
              <motion.span
                layoutId={`${layoutIdPrefix}-pill`}
                className="absolute inset-0 rounded-lg bg-studio-accent shadow-studio-glow"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : isActive ? (
              <span className="absolute inset-0 rounded-lg bg-studio-accent" />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
