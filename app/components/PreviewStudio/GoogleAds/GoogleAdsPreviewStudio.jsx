"use client";

import { useMemo } from "react";
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

      <CompatibleCreativePicker
        sourceCreatives={sourceCreatives}
        compatibleCreatives={compatibleSourceCreatives}
        selectedSourceId={selectedSourceId}
        onSelect={setSelectedSourceId}
        activePlacementLabel={activePlacementConfig?.label || "this placement"}
        selectedSource={selectedSource}
        getSupportedDevicesForCreative={getSupportedDevicesForCreative}
        activeDevice={device}
      />

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
    </div>
  );
}
