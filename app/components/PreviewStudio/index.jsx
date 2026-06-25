"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PreviewControls from "./PreviewControls";
import DownloadButton from "./DownloadButton";
import { CompatibleCreativePicker } from "./CompatibleCreativePicker";
import {
  PreviewEmptyState,
  PreviewErrorState,
  PreviewLoadingState,
  StudioTabBar,
} from "./PreviewShared";
import { buildAdCreative } from "./shared/buildAdCreative";
import {
  getDefaultPlacement,
  getPlacementConfig,
  mapExternalPlatform,
  PLACEMENTS,
} from "./shared/previewPlacements";
import { getPreviewComponent } from "./previewRegistry";
import { useGoogleCreativeAnalysis } from "@/app/hooks/useGoogleCreativeAnalysis";
import { useMetaCreativeAnalysis } from "@/app/hooks/useMetaCreativeAnalysis";
import GoogleSafeZoneOverlay from "./GoogleAds/GoogleSafeZoneOverlay";
import GoogleCropSimulation from "./GoogleAds/GoogleCropSimulation";
import MetaSafeZoneOverlay from "./MetaAds/MetaSafeZoneOverlay";
import MetaCropSimulation from "./MetaAds/MetaCropSimulation";
import ProgrammaticPreviewStudio from "./ProgrammaticPreviewStudio";
import StaticGoogleMetaPreviewStudio from "./StaticGoogleMetaPreviewStudio";

const GOOGLE_META_STUDIO_MODES = [
  { id: "previews", label: "Placement Previews" },
  { id: "safe_zone", label: "Safe Zone Overlay" },
  { id: "crop_simulation", label: "Crop Simulation" },
];

function TemplatePlacementPreviews({
  platform,
  placement,
  onPlatformChange,
  onPlacementChange,
  lockPlatform,
  sourceCreatives,
  compatibleSourceCreatives,
  selectedSourceId,
  onSelectSource,
  adCreative,
  previewRef,
}) {
  const PreviewComponent = getPreviewComponent(platform, placement);
  const placementConfig = getPlacementConfig(platform, placement);

  return (
    <>
      <PreviewControls
        platform={platform}
        placement={placement}
        onPlatformChange={onPlatformChange}
        onPlacementChange={onPlacementChange}
        lockPlatform={lockPlatform}
      />

      {sourceCreatives.length > 0 ? (
        <CompatibleCreativePicker
          sourceCreatives={sourceCreatives}
          compatibleCreatives={
            compatibleSourceCreatives.length ? compatibleSourceCreatives : sourceCreatives
          }
          selectedSourceId={selectedSourceId}
          onSelect={onSelectSource}
          activePlacementLabel={placementConfig?.label || placement}
          selectedSource={
            compatibleSourceCreatives.find((c) => c.id === selectedSourceId) ||
            sourceCreatives.find((c) => c.id === selectedSourceId) ||
            null
          }
        />
      ) : null}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-600">
          Previewing <strong>{placementConfig?.label || placement}</strong>
          {placementConfig?.width ? ` · ${placementConfig.width}px canvas` : ""}
        </p>
        <DownloadButton
          previewRef={previewRef}
          platform={platform}
          placement={placement}
          brandName={adCreative.brandName}
        />
      </div>

      <div className="overflow-auto max-h-[85vh] rounded-xl border border-gray-200 bg-gray-100 p-4">
        <div ref={previewRef} className="inline-block min-w-0">
          {PreviewComponent ? (
            <PreviewComponent {...adCreative} />
          ) : (
            <PreviewEmptyState
              title="Preview not available"
              description="Select a valid placement to render the preview template."
            />
          )}
        </div>
      </div>
    </>
  );
}

function GoogleMetaAnalysisTools({
  platform,
  studioMode,
  sourceCreatives,
  compatibleSourceCreatives,
  selectedSourceId,
  onSelectSource,
}) {
  const selectedSource =
    compatibleSourceCreatives.find((c) => c.id === selectedSourceId) ||
    sourceCreatives.find((c) => c.id === selectedSourceId) ||
    null;

  const isGoogle = platform === "google";
  const googleAnalysis = useGoogleCreativeAnalysis(isGoogle ? selectedSource : null);
  const metaAnalysis = useMetaCreativeAnalysis(!isGoogle ? selectedSource : null);
  const creativeAnalysis = isGoogle ? googleAnalysis : metaAnalysis;

  const showAnalysisTools = Boolean(selectedSource?.url || selectedSource?.fullUrl);
  const analysisReady = creativeAnalysis.status === "ready" && creativeAnalysis.imageUrl;

  const modeDescription =
    studioMode === "safe_zone"
      ? isGoogle
        ? "Checks headlines, logos, products, faces, and CTAs against Google Ads safe zones."
        : "Checks logos, text, faces, and CTAs against Meta safe areas for Feed, Story, and Reels."
      : isGoogle
        ? "Preview how your creative crops across common Google ad formats."
        : "Preview how your creative crops across Meta Feed, Stories, and Reels.";

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">{modeDescription}</p>

      <CompatibleCreativePicker
        sourceCreatives={sourceCreatives}
        compatibleCreatives={
          compatibleSourceCreatives.length ? compatibleSourceCreatives : sourceCreatives
        }
        selectedSourceId={selectedSourceId}
        onSelect={onSelectSource}
        activePlacementLabel={
          studioMode === "safe_zone" ? "Safe zone analysis" : "Crop simulation"
        }
        selectedSource={selectedSource}
      />

      {!showAnalysisTools ? (
        <PreviewEmptyState
          title="Select a creative to analyze"
          description="Choose an uploaded image from the creative picker above."
        />
      ) : null}

      {showAnalysisTools && creativeAnalysis.status === "loading" ? (
        <PreviewLoadingState
          label={
            isGoogle
              ? "Analyzing creative for Google Ads safe zones and crops…"
              : "Analyzing creative for Meta safe zones and crops…"
          }
        />
      ) : null}

      {showAnalysisTools && creativeAnalysis.status === "error" ? (
        <PreviewErrorState message={creativeAnalysis.error} onRetry={creativeAnalysis.retry} />
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

export default function PreviewStudio({
  platform: externalPlatform,
  creatives = [],
  sourceCreatives = [],
  brandName,
  keyMessage,
  vertical,
  goal,
  imageUrls = [],
  onCopyCreative,
  onEditCreative,
}) {
  const mappedPlatform = mapExternalPlatform(externalPlatform);
  const [platform, setPlatform] = useState(mappedPlatform);
  const [placement, setPlacement] = useState(() => getDefaultPlacement(mappedPlatform));
  const [studioMode, setStudioMode] = useState("previews");
  const [selectedSourceId, setSelectedSourceId] = useState(
    () => sourceCreatives[0]?.id || null,
  );
  const previewRef = useRef(null);

  const isGoogleMeta = externalPlatform === "google_ads" || externalPlatform === "meta_ads";

  useEffect(() => {
    const next = mapExternalPlatform(externalPlatform);
    setPlatform(next);
    setPlacement(getDefaultPlacement(next));
    setStudioMode("previews");
  }, [externalPlatform]);

  useEffect(() => {
    if (!PLACEMENTS[platform]?.some((p) => p.id === placement)) {
      setPlacement(getDefaultPlacement(platform));
    }
  }, [platform, placement]);

  const compatibleSourceCreatives = sourceCreatives;

  useEffect(() => {
    if (!compatibleSourceCreatives.length) return;
    if (!compatibleSourceCreatives.some((c) => c.id === selectedSourceId)) {
      setSelectedSourceId(compatibleSourceCreatives[0].id);
    }
  }, [compatibleSourceCreatives, selectedSourceId]);

  const adCreative = useMemo(
    () =>
      buildAdCreative({
        sourceCreatives: compatibleSourceCreatives.length
          ? compatibleSourceCreatives
          : sourceCreatives,
        selectedSourceId,
        brandName,
        keyMessage,
        creatives,
        imageUrls,
      }),
    [
      compatibleSourceCreatives,
      sourceCreatives,
      selectedSourceId,
      brandName,
      keyMessage,
      creatives,
      imageUrls,
    ],
  );

  const handlePlatformChange = (nextPlatform) => {
    setPlatform(nextPlatform);
    setPlacement(getDefaultPlacement(nextPlatform));
  };

  if (!externalPlatform) {
    return (
      <PreviewEmptyState
        title="Select a platform in Step 1"
        description="Choose Programmatic Ads, Google Ads, or Meta Ads to open the matching preview studio."
      />
    );
  }

  if (externalPlatform === "programmatic") {
    return (
      <ProgrammaticPreviewStudio
        sourceCreatives={sourceCreatives}
        creatives={creatives}
        vertical={vertical}
        goal={goal}
        onCopyCreative={onCopyCreative}
        onEditCreative={onEditCreative}
      />
    );
  }

  if (externalPlatform === "google_ads" || externalPlatform === "meta_ads") {
    return (
      <StaticGoogleMetaPreviewStudio
        platform={externalPlatform}
        vertical={vertical}
        goal={goal}
        brandName={brandName}
        keyMessage={keyMessage}
        sourceCreatives={sourceCreatives}
        onCopyCreative={onCopyCreative}
        onEditCreative={onEditCreative}
      />
    );
  }

  return (
    <div className="space-y-5">
      {isGoogleMeta ? (
        <StudioTabBar
          tabs={GOOGLE_META_STUDIO_MODES}
          activeTab={studioMode}
          onChange={setStudioMode}
          variant="light"
        />
      ) : null}

      {studioMode === "previews" || !isGoogleMeta ? (
        <TemplatePlacementPreviews
          platform={platform}
          placement={placement}
          onPlatformChange={handlePlatformChange}
          onPlacementChange={setPlacement}
          lockPlatform
          sourceCreatives={sourceCreatives}
          compatibleSourceCreatives={compatibleSourceCreatives}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
          adCreative={adCreative}
          previewRef={previewRef}
        />
      ) : (
        <GoogleMetaAnalysisTools
          platform={platform}
          studioMode={studioMode}
          sourceCreatives={sourceCreatives}
          compatibleSourceCreatives={compatibleSourceCreatives}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
        />
      )}
    </div>
  );
}
