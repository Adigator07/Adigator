"use client";

import { useMemo } from "react";
import {
  DeviceToggle,
  PreviewEmptyState,
  PreviewErrorState,
  PreviewLoadingState,
  StudioTabBar,
} from "../PreviewShared";
import { StudioToolbar } from "../shared/envShared";
import {
  applySourceCreativeToTemplates,
} from "../previewUtils";
import { renderEnvironmentCreative } from "@/app/lib/environmentRegistry";
import { usePlacementPreviewStudio } from "../usePlacementPreviewStudio";

export default function GoogleAdsPreviewStudio({
  vertical,
  goal,
  brandName,
  targetAudience,
  tone,
  keyMessage,
  imageUrls = [],
  sourceCreatives = [],
  onCopyCreative,
  onEditCreative,
}) {
  const studio = usePlacementPreviewStudio({
    platform: "google_ads",
    brandName,
    vertical,
    targetAudience,
    goal,
    tone,
    keyMessage,
    imageUrls,
    sourceCreatives,
  });

  const {
    placementTabs,
    activePlacement,
    activePlacementConfig,
    setActivePlacement,
    device,
    setDevice,
    deviceOptions,
    compatibleSourceCreatives,
    selectedSource,
    selectedSourceId,
    setSelectedSourceId,
    templates,
    loading,
    error,
    loadTemplates,
    filterCreativesByVertical,
    filterTemplatesByPlacement,
  } = studio;

  const creativesForSelectedSource = useMemo(() => {
    const base = filterCreativesByVertical(templates, vertical);
    const scoped = filterTemplatesByPlacement(base);
    const withImage = applySourceCreativeToTemplates(scoped, selectedSource);
    return withImage;
  }, [templates, vertical, selectedSource, filterCreativesByVertical, filterTemplatesByPlacement]);

  const handlers = useMemo(
    () => ({ onCopy: onCopyCreative, onEdit: onEditCreative }),
    [onCopyCreative, onEditCreative],
  );

  const showDeviceToggle = deviceOptions.length > 1;

  if (loading && !templates.length) {
    return <PreviewLoadingState label={`Building ${activePlacementConfig?.label || "Google Ads"} previews…`} />;
  }
  if (error && !templates.length) {
    return <PreviewErrorState message={error} onRetry={loadTemplates} />;
  }

  return (
    <div className="space-y-5">
      <StudioTabBar tabs={placementTabs} activeTab={activePlacement} onChange={setActivePlacement} />

      {activePlacementConfig?.description ? (
        <p className="text-xs text-gray-500 -mt-2">{activePlacementConfig.description}</p>
      ) : null}

      {sourceCreatives.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Compatible creatives
          </p>
          {compatibleSourceCreatives.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                {compatibleSourceCreatives.map((creative) => {
                  const active = creative.id === selectedSourceId;
                  return (
                    <button
                      key={creative.id}
                      type="button"
                      onClick={() => setSelectedSourceId(creative.id)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                      }`}
                    >
                      {creative.url ? (
                        <img src={creative.url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : null}
                      <span className="truncate max-w-[120px]">{creative.name || "Creative"}</span>
                      {creative.size ? (
                        <span className="font-mono text-[10px] text-gray-500">{creative.size}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Showing {selectedSource?.name || "selected creative"} in {activePlacementConfig?.label} placements.
              </p>
            </>
          ) : (
            <PreviewEmptyState
              title="No compatible creatives for this placement"
              description={`Upload a creative matching ${activePlacementConfig?.label} sizes (e.g. ${(activePlacementConfig?.compatibleSizes || []).slice(0, 3).join(", ")})`}
            />
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {showDeviceToggle ? (
          <DeviceToggle
            options={deviceOptions}
            activeDevice={device}
            onChange={setDevice}
          />
        ) : (
          <div />
        )}
        <StudioToolbar
          count={creativesForSelectedSource.length}
          device={device}
          onRegenerate={loadTemplates}
          isRegenerating={loading}
        />
      </div>

      {loading && templates.length ? (
        <p className="text-xs text-cyan-300/80">Refreshing {activePlacementConfig?.label} templates…</p>
      ) : null}

      {!creativesForSelectedSource.length ? (
        <PreviewEmptyState
          title="No previews for this placement"
          description={compatibleSourceCreatives.length
            ? "Try regenerating templates or switch placement."
            : "Upload a compatible creative size for this placement."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {creativesForSelectedSource.map((creative) => (
            <div key={`${selectedSourceId}-${creative.id}-${creative.environment}`}>
              {renderEnvironmentCreative(creative, handlers, device)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
