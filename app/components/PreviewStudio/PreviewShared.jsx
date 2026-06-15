"use client";

import { Copy, Pencil } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { calculateScale } from "@/app/lib/scalingEngine";

export function PreviewCardShell({
  creative,
  platformLabel,
  children,
  onCopy,
  onEdit,
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 bg-black/20">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
              {platformLabel}
            </span>
            <span className="text-xs text-gray-300 truncate">{creative.placement}</span>
            {creative.size ? (
              <span className="text-[10px] text-gray-500 font-mono">{creative.size}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
            {creative.type?.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onCopy ? (
            <button
              type="button"
              onClick={() => onCopy(creative)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-200 hover:bg-white/10"
            >
              <Copy size={12} /> Copy
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(creative)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-200 hover:bg-white/10"
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
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <p className="mt-4 text-sm text-gray-300">{label}</p>
    </div>
  );
}

export function PreviewEmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/10 bg-white/[0.03]">
      <span className="text-4xl mb-3">📭</span>
      <p className="text-white font-semibold">{title}</p>
      <p className="text-gray-400 text-sm mt-1 max-w-md">{description}</p>
    </div>
  );
}

export function PreviewErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-red-500/20 bg-red-500/5">
      <p className="text-red-200 font-semibold">Template generation failed</p>
      <p className="text-red-200/70 text-sm mt-2 max-w-md">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-2 text-sm text-red-100 hover:bg-red-500/30"
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
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-amber-500/25 bg-amber-500/5">
      <span className="text-3xl mb-3">⚠️</span>
      <p className="text-amber-100 font-semibold max-w-lg">
        {title || `Not supported for ${deviceLabel} placements`}
      </p>
      <p className="text-amber-200/80 text-sm mt-2 max-w-md leading-relaxed">{message}</p>
      {creativeSize ? (
        <p className="mt-3 text-[11px] font-mono text-amber-300/60">Creative size: {creativeSize}</p>
      ) : null}
      {onSwitchDevice && alternateDevice ? (
        <button
          type="button"
          onClick={() => onSwitchDevice(alternateDevice)}
          className="mt-5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25"
        >
          Switch to {alternateDevice === "desktop" ? "Desktop" : "Mobile"} view
        </button>
      ) : null}
    </div>
  );
}

export function StudioTabBar({ tabs, activeTab, onChange, variant = "dark" }) {
  const isLight = variant === "light";
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            activeTab === tab.id
              ? isLight
                ? "bg-sky-500 text-white shadow-sm"
                : "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
              : isLight
                ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DeviceToggle({ options, activeDevice, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
            activeDevice === option.id
              ? "bg-white text-slate-900"
              : "text-gray-300 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
