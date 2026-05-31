"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Pencil, RefreshCw } from "lucide-react";
import { calculateScale, formatScaleLabel } from "@/app/lib/scalingEngine";
import {
  analyzeAspectRatioFit,
  analyzeCreativeSlotFit,
  getCreativeSourceSize,
  getFitNoticeMessage,
} from "@/app/lib/creativeFitAnalysis";
import { getDeviceFrame } from "./previewDeviceLayouts";
import { DummyDisplayAd } from "./dummyAdPlaceholders";

export function TemplateFitNotice({ message, className = "" }) {
  if (!message) return null;
  return (
    <p className={`mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100 ${className}`}>
      {message}
    </p>
  );
}

/** Fixed-ratio container so uploaded creatives always fill placements cleanly. */
export function MediaFrame({
  creative,
  aspectRatio = "1 / 1",
  className = "",
  fit = "cover",
  showFitNotice = true,
}) {
  const fitAnalysis = useMemo(
    () => analyzeAspectRatioFit(getCreativeSourceSize(creative), aspectRatio, fit),
    [creative, aspectRatio, fit],
  );
  const fitMessage = showFitNotice ? getFitNoticeMessage(fitAnalysis) : null;

  return (
    <div>
      <div
        className={`relative w-full overflow-hidden bg-gray-100 ${className}`}
        style={{ aspectRatio }}
      >
        <AdImage creative={creative} className="absolute inset-0" fit={fitAnalysis.fitMode || fit} />
      </div>
      <TemplateFitNotice message={fitMessage} />
    </div>
  );
}

export function AdImage({ creative, className = "", alt = "Ad creative", fit = "cover" }) {
  const src = creative?.imageUrl || creative?.image;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block ${fitClass} ${className}`}
        style={fit === "contain" ? { width: "100%", height: "100%" } : undefined}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-600 text-xs text-center px-3 ${className}`}
      title={creative?.imagePrompt || "Image placeholder"}
    >
      <span className="line-clamp-3">{creative?.imagePrompt || "Your creative preview"}</span>
    </div>
  );
}

/** Renders the user's creative inside a fixed IAB slot — scaled to preserve full creative when possible. */
export function DisplayAdSlot({
  creative,
  width,
  height,
  label,
  showLabel = true,
  showAd = true,
  className = "",
  showFitNotice = true,
  fitMode = "cover",
  placeholderIndex = 0,
}) {
  const fitAnalysis = useMemo(
    () => analyzeCreativeSlotFit(getCreativeSourceSize(creative), width, height, fitMode),
    [creative, width, height, fitMode],
  );
  const fitMessage = showAd && showFitNotice ? getFitNoticeMessage(fitAnalysis) : null;
  const resolvedFit = fitAnalysis.fitMode || fitMode;

  if (!showAd) {
    return (
      <div className={className}>
        <DummyDisplayAd width={width} height={height} index={placeholderIndex} />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && showLabel ? (
        <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      ) : null}
      <div
        className="relative overflow-hidden border border-[#dadce0] bg-white shadow-sm flex items-center justify-center"
        style={{ width, height, maxWidth: "100%" }}
      >
        <AdImage creative={creative} className="max-w-full max-h-full" fit={resolvedFit} />
        <AdChoicesMark className="absolute top-1 right-1 rounded bg-white/90 px-1" />
      </div>
      <TemplateFitNotice message={fitMessage} />
    </div>
  );
}

export function BrandAvatar({ creative, size = 40 }) {
  const label = creative?.pageName || creative?.pageAvatar || creative?.headline || "B";
  const initial = String(label).trim().charAt(0).toUpperCase() || "B";
  const colors = ["#1877F2", "#E4405F", "#34A853", "#FBBC05", "#EA4335", "#9333EA"];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initial}
    </div>
  );
}

export function AdChoicesMark({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] text-gray-400 ${className}`}>
      ▲ AdChoices
    </span>
  );
}

export function useScaledEnvironment(naturalWidth, naturalHeight) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setScale(calculateScale(node.clientWidth, naturalWidth, naturalHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [naturalWidth, naturalHeight]);

  return {
    containerRef,
    scale,
    scaleLabel: formatScaleLabel(scale),
    displayHeight: Math.max(naturalHeight * scale, 120),
  };
}

export function ScaledEnvironment({
  naturalWidth,
  naturalHeight,
  children,
  className = "",
  onScaleChange,
  interactive = false,
}) {
  const { containerRef, scale, displayHeight } = useScaledEnvironment(naturalWidth, naturalHeight);

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-xl bg-[#eceff1] ${className}`}
      style={{ height: displayHeight }}
    >
      <div
        className={interactive ? "pointer-events-auto" : ""}
        style={{
          width: naturalWidth,
          height: naturalHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function EnvironmentPreviewCard({
  creative,
  platformBadge,
  badgeClassName = "bg-blue-500/20 text-blue-200 border-blue-400/30",
  scaleLabel,
  deviceMode,
  fitNotice,
  hideSizeLabel = false,
  onCopy,
  onEdit,
  children,
}) {
  const sourceSize = getCreativeSourceSize(creative);
  const deviceLabel = deviceMode === "desktop" ? "Desktop view" : deviceMode === "mobile" ? "Mobile view" : null;

  return (
    <article className="rounded-2xl border border-white/10 bg-[#0b1020] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 bg-black/30">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClassName}`}>
            {platformBadge || creative.placement}
          </span>
          {deviceLabel ? (
            <span className="text-[10px] text-cyan-300/80">{deviceLabel}</span>
          ) : null}
          {!hideSizeLabel && sourceSize ? (
            <span className="text-[10px] font-mono text-gray-400">{sourceSize}</span>
          ) : !hideSizeLabel && creative.size ? (
            <span className="text-[10px] font-mono text-gray-400">{creative.size}</span>
          ) : null}
          {scaleLabel ? (
            <span className="text-[10px] text-gray-500">{scaleLabel}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onCopy ? (
            <button type="button" onClick={() => onCopy(creative)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-200 hover:bg-white/10" title="Copy JSON">
              <Copy size={14} />
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" onClick={() => onEdit(creative)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-200 hover:bg-white/10" title="Edit">
              <Pencil size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-[#111827]/40">
        {children}
        <TemplateFitNotice message={fitNotice} />
      </div>
    </article>
  );
}

export function StudioToolbar({ count, device, onRegenerate, isRegenerating }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-sm text-gray-300">
        <span className="font-semibold text-white">{count}</span> environment preview{count === 1 ? "" : "s"}
        <span className="text-gray-500 ml-2">· {device === "mobile" ? "Mobile" : "Desktop"} view</span>
      </p>
      {onRegenerate ? (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
          {isRegenerating ? "Regenerating…" : "Regenerate previews"}
        </button>
      ) : null}
    </div>
  );
}

export function GoogleLogo() {
  return (
    <div className="flex items-center gap-0.5 font-bold text-xl tracking-tight" style={{ fontFamily: "Arial, sans-serif" }}>
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
    </div>
  );
}

export function YouTubeLogo() {
  return (
    <div className="flex items-center gap-1 font-bold text-white" style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
      <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-[#ff0000] text-[10px]">▶</span>
      <span className="text-lg tracking-tight">YouTube</span>
    </div>
  );
}

export function FacebookLogo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white font-bold text-xl">f</div>
  );
}

export function InstagramLogo() {
  return (
    <div className="text-xl font-semibold tracking-tight text-black" style={{ fontFamily: "system-ui, sans-serif" }}>
      Instagram
    </div>
  );
}

export function PhoneFrame({ width = 390, height = 820, children, className = "", style = {} }) {
  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-[2rem] border-[10px] border-gray-900 bg-white shadow-xl ${className}`}
      style={{ width, height, maxWidth: "100%", ...style }}
    >
      {children}
    </div>
  );
}

export function DesktopBrowserFrame({ width = 1280, height = 820, children, className = "", style = {} }) {
  return (
    <div
      className={`mx-auto overflow-hidden rounded-xl border border-gray-700 bg-[#1c1f27] shadow-2xl ${className}`}
      style={{ width, maxWidth: "100%", ...style }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-400 font-mono truncate">
          https://preview.adigator.app/placement
        </div>
      </div>
      <div className="overflow-hidden bg-white" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

export function ScaledDeviceEnvironment({
  deviceMode,
  mobile,
  desktop,
  forceMobile = false,
  onScaleChange,
  children,
  className = "",
}) {
  const frame = getDeviceFrame(deviceMode, { mobile, desktop, forceMobile });

  return (
    <ScaledEnvironment
      naturalWidth={frame.width}
      naturalHeight={frame.height}
      onScaleChange={onScaleChange}
      className={className}
    >
      {typeof children === "function" ? children(frame) : children}
    </ScaledEnvironment>
  );
}

export function DeviceChrome({ isMobile, width, height, children, className = "", style = {} }) {
  if (isMobile) {
    return (
      <PhoneFrame width={width} height={height} className={className} style={style}>
        {children}
      </PhoneFrame>
    );
  }

  return (
    <DesktopBrowserFrame width={width} height={height} className={className} style={style}>
      {children}
    </DesktopBrowserFrame>
  );
}
