"use client";

import { useMemo, useState } from "react";
import {
  DeviceToggle,
  PreviewDeviceIncompatibleState,
  PreviewEmptyState,
  StudioTabBar,
} from "./PreviewShared";
import { CompatibleCreativePicker } from "./CompatibleCreativePicker";
import { renderEnvironmentCreative } from "@/app/lib/environmentRegistry";
import { useStaticPlacementPreviewStudio } from "./useStaticPlacementPreviewStudio";
import { useGoogleCreativeAnalysis } from "@/app/hooks/useGoogleCreativeAnalysis";
import { useMetaCreativeAnalysis } from "@/app/hooks/useMetaCreativeAnalysis";
import GoogleSafeZoneOverlay from "./GoogleAds/GoogleSafeZoneOverlay";
import GoogleCropSimulation from "./GoogleAds/GoogleCropSimulation";
import MetaSafeZoneOverlay from "./MetaAds/MetaSafeZoneOverlay";
import MetaCropSimulation from "./MetaAds/MetaCropSimulation";

const STUDIO_MODES = [
  { id: "previews", label: "Placement Previews" },
  { id: "safe_zone", label: "Safe Zone Overlay" },
  { id: "crop_simulation", label: "Crop Simulation" },
];

export default function StaticGoogleMetaPreviewStudio({
  platform,
  vertical,
  goal,
  brandName,
  keyMessage,
  sourceCreatives = [],
  onCopyCreative,
  onEditCreative,
}) {
  const [studioMode, setStudioMode] = useState("previews");
  const isGoogle = platform === "google_ads";

  const studio = useStaticPlacementPreviewStudio({
    platform,
    brandName,
    vertical,
    goal,
    keyMessage,
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
    selectedSourceDeviceValidation,
    getSupportedDevicesForCreative,
    templates,
  } = studio;

  const googleAnalysis = useGoogleCreativeAnalysis(isGoogle ? selectedSource : null);
  const metaAnalysis = useMetaCreativeAnalysis(!isGoogle ? selectedSource : null);
  const creativeAnalysis = isGoogle ? googleAnalysis : metaAnalysis;

  const handlers = useMemo(
    () => ({ onCopy: onCopyCreative, onEdit: onEditCreative }),
    [onCopyCreative, onEditCreative],
  );

  const showDeviceToggle = deviceOptions.length > 1;
  const alternateDevice = deviceOptions.find((option) => option.id !== device)?.id;
  const canPreview = selectedSourceDeviceValidation.supported && templates.length > 0;
  const showAnalysisTools = Boolean(selectedSource?.url || selectedSource?.fullUrl);
  const analysisReady = creativeAnalysis.status === "ready" && creativeAnalysis.imageUrl;

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
            ? "Analyze safe zones against predefined placement layouts."
            : "Preview how your creative crops across common ad formats."}
        </p>
      )}

      <CompatibleCreativePicker
        sourceCreatives={sourceCreatives}
        compatibleCreatives={compatibleSourceCreatives}
        selectedSourceId={selectedSourceId}
        onSelect={setSelectedSourceId}
        activePlacementLabel={activePlacementConfig?.label || "Placements"}
        selectedSource={selectedSource}
        getSupportedDevicesForCreative={getSupportedDevicesForCreative}
        activeDevice={device}
      />

      {studioMode === "previews" ? (
        <>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {showDeviceToggle ? (
              <DeviceToggle options={deviceOptions} activeDevice={device} onChange={setDevice} />
            ) : (
              <div />
            )}
            <p className="text-xs text-gray-500">
              {device === "desktop" ? "Desktop" : "Mobile"} view · predefined {isGoogle ? "Google Ads" : "Meta Ads"} layout
            </p>
          </div>

          {!compatibleSourceCreatives.length ? (
            <PreviewEmptyState
              title="No compatible creatives"
              description={`Upload a size supported by ${activePlacementConfig?.label || "this placement"}.`}
            />
          ) : !canPreview ? (
            <PreviewDeviceIncompatibleState
              message={selectedSourceDeviceValidation.message}
              device={device}
              creativeSize={selectedSource?.size}
              alternateDevice={alternateDevice}
              onSwitchDevice={alternateDevice ? setDevice : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {templates.map((creative) => (
                <div key={creative.id}>
                  {renderEnvironmentCreative(creative, handlers, device)}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {studioMode !== "previews" && !showAnalysisTools ? (
        <PreviewEmptyState title="Select a creative" description="Choose an uploaded creative to analyze." />
      ) : null}

      {studioMode !== "previews" && showAnalysisTools && creativeAnalysis.status === "loading" ? (
        <p className="text-sm text-gray-500">Analyzing creative elements…</p>
      ) : null}

      {studioMode === "safe_zone" && analysisReady && isGoogle ? (
        <GoogleSafeZoneOverlay
          imageUrl={creativeAnalysis.imageUrl}
          imageSize={creativeAnalysis.imageSize}
          elements={creativeAnalysis.elements}
          detectionSource={creativeAnalysis.detectionSource}
        />
      ) : null}

      {studioMode === "safe_zone" && analysisReady && !isGoogle ? (
        <MetaSafeZoneOverlay
          imageUrl={creativeAnalysis.imageUrl}
          imageSize={creativeAnalysis.imageSize}
          elements={creativeAnalysis.elements}
          detectionSource={creativeAnalysis.detectionSource}
        />
      ) : null}

      {studioMode === "crop_simulation" && analysisReady && isGoogle ? (
        <GoogleCropSimulation
          imageUrl={creativeAnalysis.imageUrl}
          imageSize={creativeAnalysis.imageSize}
          elements={creativeAnalysis.elements}
        />
      ) : null}

      {studioMode === "crop_simulation" && analysisReady && !isGoogle ? (
        <MetaCropSimulation
          imageUrl={creativeAnalysis.imageUrl}
          imageSize={creativeAnalysis.imageSize}
          elements={creativeAnalysis.elements}
        />
      ) : null}
    </div>
  );
}
