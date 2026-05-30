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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
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
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                      : deviceSupported
                        ? "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                        : "border-amber-500/30 bg-amber-500/5 text-amber-100/80 hover:border-amber-400/40"
                  }`}
                >
                  {creative.url ? (
                    <img src={creative.url} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : null}
                  <span className="truncate max-w-[120px]">{creative.name || "Creative"}</span>
                  {size ? (
                    <span className="font-mono text-[10px] text-gray-500">{size}</span>
                  ) : null}
                  {!deviceSupported && supportedDevices.length ? (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] uppercase text-amber-200">
                      {supportedDevices.join("/")} only
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
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
