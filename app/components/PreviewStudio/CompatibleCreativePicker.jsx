"use client";

import { PreviewEmptyState } from "./PreviewShared";

export function CompatibleCreativePicker({
  sourceCreatives,
  compatibleCreatives,
  selectedSourceId,
  onSelect,
  activePlacementLabel,
  selectedSource,
  getSupportedDevicesForCreative,
  activeDevice,
}) {
  if (!sourceCreatives.length) return null;

  return (
    <div className="studio-card rounded-xl px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-studio-muted">
        Compatible creatives
      </p>
      {compatibleCreatives.length ? (
        <>
          <div className="flex flex-wrap gap-2">
            {compatibleCreatives.map((creative) => {
              const active = creative.id === selectedSourceId;
              const size = creative.size || creative.validation?.size;
              const supportedDevices = getSupportedDevicesForCreative?.(size) || [];
              const deviceSupported = supportedDevices.includes(activeDevice);
              return (
                <button
                  key={creative.id}
                  type="button"
                  onClick={() => onSelect(creative.id)}
                  className={`studio-focus-ring inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200 ease-out hover:-translate-y-px active:scale-[0.98] ${
                    active
                      ? "border-studio-accent/50 bg-studio-accent/15 text-studio-text shadow-studio-glow"
                      : deviceSupported
                        ? "border-studio-border bg-white/[0.03] text-studio-muted hover:border-studio-border-hover hover:bg-white/[0.05]"
                        : "border-studio-warning/30 bg-studio-warning/5 text-studio-warning/90 hover:border-studio-warning/40"
                  }`}
                >
                  {creative.url ? (
                    <img src={creative.url} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : null}
                  <span className="max-w-[120px] truncate">{creative.name || "Creative"}</span>
                  {size ? (
                    <span className="font-mono text-[10px] text-studio-tertiary">{size}</span>
                  ) : null}
                  {!deviceSupported && supportedDevices.length ? (
                    <span className="rounded bg-studio-warning/20 px-1.5 py-0.5 text-[9px] uppercase text-studio-warning">
                      {supportedDevices.join("/")} only
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-studio-tertiary">
            Showing {selectedSource?.name || "selected creative"} in {activePlacementLabel} placements.
          </p>
        </>
      ) : (
        <PreviewEmptyState
          title="No compatible creatives for this placement"
          description={`Upload a creative matching ${activePlacementLabel} sizes.`}
        />
      )}
    </div>
  );
}
