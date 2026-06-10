"use client";

import { useMemo, useState } from "react";
import {
  DeviceToggle,
  PreviewDeviceIncompatibleState,
  PreviewEmptyState,
  PreviewErrorState,
  PreviewLoadingState,
  StudioTabBar,
} from "../PreviewShared";
import { CompatibleCreativePicker } from "../CompatibleCreativePicker";
import { StudioToolbar } from "../shared/envShared";
import { applySourceCreativeToTemplates } from "../previewUtils";
import { renderEnvironmentCreative } from "@/app/lib/environmentRegistry";
import { usePlacementPreviewStudio } from "../usePlacementPreviewStudio";
import { useMetaCreativeAnalysis } from "@/app/hooks/useMetaCreativeAnalysis";
import MetaSafeZoneOverlay from "./MetaSafeZoneOverlay";
import MetaCropSimulation from "./MetaCropSimulation";

const STUDIO_MODES = [
  { id: "previews", label: "Placement Previews" },
  { id: "safe_zone", label: "Safe Zone Overlay" },
  { id: "crop_simulation", label: "Crop Simulation" },
];

export default function MetaAdsPreviewStudio({
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
  const [studioMode, setStudioMode] = useState("previews");

  const studio = usePlacementPreviewStudio({
    platform: "meta_ads",
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
    selectedSourceDeviceValidation,
    getSupportedDevicesForCreative,
    setSelectedSourceId,
    templates,
    loading,
    error,
    loadTemplates,
    filterCreativesByVertical,
    filterTemplatesByPlacement,
  } = studio;

  const creativeAnalysis = useMetaCreativeAnalysis(selectedSource);

  const creativesForSelectedSource = useMemo(() => {
    const base = filterCreativesByVertical(templates, vertical);
    const scoped = filterTemplatesByPlacement(base);
    return applySourceCreativeToTemplates(scoped, selectedSource);
  }, [templates, vertical, selectedSource, filterCreativesByVertical, filterTemplatesByPlacement]);

  const handlers = useMemo(
    () => ({ onCopy: onCopyCreative, onEdit: onEditCreative }),
    [onCopyCreative, onEditCreative],
  );

  const showDeviceToggle = deviceOptions.length > 1;
  const alternateDevice = deviceOptions.find((option) => option.id !== device)?.id;
  const canPreview = selectedSourceDeviceValidation.supported;
  const showAnalysisTools = Boolean(selectedSource?.url || selectedSource?.fullUrl);
  const analysisReady = creativeAnalysis.status === "ready" && creativeAnalysis.imageUrl;

  if (loading && !templates.length) {
    return <PreviewLoadingState label={`Building ${activePlacementConfig?.label || "Meta Ads"} previews…`} />;
  }
  if (error && !templates.length) {
    return <PreviewErrorState message={error} onRetry={loadTemplates} />;
  }

  return (
    <div className="space-y-5">
      <StudioTabBar tabs={STUDIO_MODES} activeTab={studioMode} onChange={setStudioMode} />

      {studioMode === "previews" ? (
        <>
          <StudioTabBar tabs={placementTabs} activeTab={activePlacement} onChange={setActivePlacement} />

          {activePlacementConfig?.description ? (
            <p className="text-xs text-gray-500 -mt-2">{activePlacementConfig.description}</p>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-gray-500 -mt-2">
          {studioMode === "safe_zone"
            ? "Analyze whether logos, text, faces, and CTAs stay inside Meta safe areas for Feed, Story, and Reels."
            : "See how your creative crops across Facebook Feed, Instagram Feed, Stories, and Reels placements."}
        </p>
      )}

      <CompatibleCreativePicker
        sourceCreatives={sourceCreatives}
        compatibleCreatives={compatibleSourceCreatives}
        selectedSourceId={selectedSourceId}
        onSelect={setSelectedSourceId}
        activePlacementLabel={activePlacementConfig?.label || "Meta placements"}
        selectedSource={selectedSource}
        getSupportedDevicesForCreative={getSupportedDevicesForCreative}
        activeDevice={device}
      />

      {studioMode === "previews" ? (
        <>
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
              count={canPreview ? creativesForSelectedSource.length : 0}
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
          ) : !canPreview ? (
            <PreviewDeviceIncompatibleState
              message={selectedSourceDeviceValidation.message}
              device={device}
              creativeSize={selectedSource?.size || selectedSource?.validation?.size}
              alternateDevice={alternateDevice}
              onSwitchDevice={alternateDevice ? setDevice : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {creativesForSelectedSource.map((creative) => (
                <div key={`${selectedSourceId}-${creative.id}-${creative.environment}-${device}`}>
                  {renderEnvironmentCreative(creative, handlers, device)}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {studioMode !== "previews" && !showAnalysisTools ? (
        <PreviewEmptyState
          title="Select a creative to analyze"
          description="Choose an uploaded image from the creative picker above."
        />
      ) : null}

      {studioMode !== "previews" && showAnalysisTools && creativeAnalysis.status === "loading" ? (
        <PreviewLoadingState label="Analyzing creative elements for safe zones and crop simulation…" />
      ) : null}

      {studioMode !== "previews" && showAnalysisTools && creativeAnalysis.status === "error" ? (
        <PreviewErrorState message={creativeAnalysis.error} onRetry={creativeAnalysis.retry} />
      ) : null}

      {studioMode === "safe_zone" && analysisReady ? (
        <MetaSafeZoneOverlay
          imageUrl={creativeAnalysis.imageUrl}
          imageSize={creativeAnalysis.imageSize}
          elements={creativeAnalysis.elements}
          detectionSource={creativeAnalysis.detectionSource}
        />
      ) : null}

      {studioMode === "crop_simulation" && analysisReady ? (
        <MetaCropSimulation
          imageUrl={creativeAnalysis.imageUrl}
          imageSize={creativeAnalysis.imageSize}
          elements={creativeAnalysis.elements}
        />
      ) : null}
    </div>
  );
}
