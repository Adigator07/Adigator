"use client";

import { useMemo, useState } from "react";
import {
  DeviceToggle,
  PreviewDeviceIncompatibleState,
  PreviewEmptyState,
  StudioContentPanel,
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

  const primaryTemplate = templates[0] || null;

  return (
    <div className="space-y-6">
      <StudioTabBar
        tabs={STUDIO_MODES}
        activeTab={studioMode}
        onChange={setStudioMode}
        layoutIdPrefix="google-meta-modes"
      />

      <StudioContentPanel panelKey={studioMode} className="space-y-5">
        {studioMode === "previews" ? (
          <>
            <StudioTabBar
              tabs={placementTabs}
              activeTab={activePlacement}
              onChange={setActivePlacement}
              layoutIdPrefix="placement-tabs"
              compact
            />
            {activePlacementConfig?.description ? (
              <p className="-mt-2 text-xs text-studio-muted">{activePlacementConfig.description}</p>
            ) : null}
          </>
        ) : (
          <p className="-mt-2 text-xs text-studio-muted">
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
                <DeviceToggle
                  options={deviceOptions}
                  activeDevice={device}
                  onChange={setDevice}
                  layoutIdPrefix="google-meta-device"
                />
              ) : (
                <div />
              )}
              <p className="text-xs text-studio-tertiary">
                {device === "desktop" ? "Desktop" : "Mobile"} view · predefined{" "}
                {isGoogle ? "Google Ads" : "Meta Ads"} layout
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
            ) : primaryTemplate ? (
              <div className="mx-auto w-full max-w-5xl">
                <div className="preview-environment-root studio-card overflow-hidden rounded-2xl shadow-studio [&_img]:h-auto [&_img]:max-w-none [&_img]:object-contain [&_img]:image-rendering-auto">
                  {renderEnvironmentCreative(primaryTemplate, handlers, device)}
                </div>
              </div>
            ) : (
              <PreviewEmptyState
                title="Preview unavailable"
                description="No preview template is available for this placement."
              />
            )}
          </>
        ) : null}

        {studioMode !== "previews" && !showAnalysisTools ? (
          <PreviewEmptyState title="Select a creative" description="Choose an uploaded creative to analyze." />
        ) : null}

        {studioMode !== "previews" && showAnalysisTools && creativeAnalysis.status === "loading" ? (
          <p className="text-sm text-studio-muted">Analyzing creative elements…</p>
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
      </StudioContentPanel>
    </div>
  );
}
