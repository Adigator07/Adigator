"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DeviceToggle,
  PreviewDeviceIncompatibleState,
  PreviewEmptyState,
  StudioContentPanel,
  StudioTabBar,
} from "./PreviewShared";
import { CompatibleCreativePicker } from "./CompatibleCreativePicker";
import { StudioToolbar } from "./shared/envShared";
import ContextualPreviewEngine from "../ContextualPreviewEngine";
import {
  PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS,
  PROGRAMMATIC_ENVIRONMENT_LABELS,
} from "@/app/lib/previewPlacementRegistry";
import {
  getSupportedDevicesForCreative,
  validatePreviewDeviceCompatibility,
} from "@/app/lib/previewDeviceCompatibility";

const TEMPLATE_TABS = PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS.map((id) => ({
  id,
  label: PROGRAMMATIC_ENVIRONMENT_LABELS[id] || id,
}));

/** Fixed placement used internally for size/device checks — UI shows templates only. */
const PROGRAMMATIC_PREVIEW_PLACEMENT = "open_web";

const DEVICE_OPTIONS = [
  { id: "desktop", label: "Desktop" },
  { id: "mobile", label: "Mobile" },
];

/**
 * Programmatic preview studio — OpenAI publisher templates (News, Blog, Native Display, Health).
 */
export default function ProgrammaticPreviewStudio({
  sourceCreatives = [],
  creatives = [],
  vertical,
  goal,
  onCopyCreative,
  onEditCreative,
}) {
  const [activeTemplate, setActiveTemplate] = useState(
    () => PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS[0],
  );
  const [device, setDevice] = useState("desktop");
  const [regenerateToken, setRegenerateToken] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(
    () => sourceCreatives[0]?.id || null,
  );

  useEffect(() => {
    if (!sourceCreatives.length) return;
    if (!sourceCreatives.some((creative) => creative.id === selectedSourceId)) {
      setSelectedSourceId(sourceCreatives[0].id);
    }
  }, [sourceCreatives, selectedSourceId]);

  const selectedSource = useMemo(
    () => sourceCreatives.find((creative) => creative.id === selectedSourceId)
      || sourceCreatives[0]
      || null,
    [sourceCreatives, selectedSourceId],
  );

  const selectedCreativeWithAnalysis = useMemo(() => {
    if (!selectedSource) return null;
    const enriched = creatives.find((creative) => creative.id === selectedSource.id);
    return {
      ...selectedSource,
      url: enriched?.url || selectedSource.url || selectedSource.fullUrl || "",
      analyzerOutput: enriched?.analyzerOutput || {},
      ctaText: enriched?.ctaText || "",
      headline: enriched?.headline || selectedSource.name || "",
    };
  }, [selectedSource, creatives]);

  const selectedSourceDeviceValidation = useMemo(() => {
    if (!selectedSource) return { supported: true, message: null };
    return validatePreviewDeviceCompatibility({
      platform: "programmatic",
      placementId: PROGRAMMATIC_PREVIEW_PLACEMENT,
      device,
      size: selectedSource.size || selectedSource.validation?.size,
    });
  }, [selectedSource, device]);

  const getSupportedDevices = useCallback(
    (size) => getSupportedDevicesForCreative("programmatic", PROGRAMMATIC_PREVIEW_PLACEMENT, size),
    [],
  );

  const handleRegenerate = useCallback(() => {
    setIsRegenerating(true);
    setRegenerateToken((value) => value + 1);
    window.setTimeout(() => setIsRegenerating(false), 600);
  }, []);

  const alternateDevice = device === "mobile" ? "desktop" : "mobile";
  const creativeSize = selectedSource?.size || selectedSource?.validation?.size;
  const isMobileDevice = device === "mobile";
  const mobileUnsupported = isMobileDevice && !selectedSourceDeviceValidation.supported;
  const canPreview = selectedSourceDeviceValidation.supported && Boolean(selectedCreativeWithAnalysis);

  const mobileUnsupportedTitle = creativeSize
    ? `${creativeSize} is not available for mobile preview`
    : "This creative is not available for mobile preview";

  const mobileUnsupportedMessage = mobileUnsupported
    ? (selectedSourceDeviceValidation.message
      || `${creativeSize || "This size"} cannot be previewed on mobile. Switch to Desktop or upload a mobile-friendly size such as 320×50 or 300×250.`)
    : null;

  return (
    <div className="space-y-6">
      <StudioTabBar
        tabs={TEMPLATE_TABS}
        activeTab={activeTemplate}
        onChange={setActiveTemplate}
        layoutIdPrefix="programmatic-templates"
        compact
      />

      <StudioContentPanel panelKey={activeTemplate} className="space-y-5">
        <p className="-mt-2 text-xs text-studio-muted">
          Choose a publisher template. Previews are generated to match your campaign vertical and creative.
        </p>

        <CompatibleCreativePicker
          sourceCreatives={sourceCreatives}
          compatibleCreatives={sourceCreatives}
          selectedSourceId={selectedSourceId}
          onSelect={setSelectedSourceId}
          activePlacementLabel={PROGRAMMATIC_ENVIRONMENT_LABELS[activeTemplate] || "template"}
          selectedSource={selectedSource}
          getSupportedDevicesForCreative={getSupportedDevices}
          activeDevice={device}
        />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <DeviceToggle
            options={DEVICE_OPTIONS}
            activeDevice={device}
            onChange={setDevice}
            layoutIdPrefix="programmatic-device"
          />
          <StudioToolbar
            count={canPreview ? 1 : 0}
            device={device}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        </div>

        {isRegenerating ? (
          <p className="text-xs text-studio-accent">
            Refreshing {PROGRAMMATIC_ENVIRONMENT_LABELS[activeTemplate]} preview…
          </p>
        ) : null}

        {!sourceCreatives.length ? (
          <PreviewEmptyState
            title="No creatives to preview"
            description="Upload and validate creatives in Step 2 to preview them here."
          />
        ) : mobileUnsupported ? (
          <PreviewDeviceIncompatibleState
            title={mobileUnsupportedTitle}
            message={mobileUnsupportedMessage}
            device={device}
            creativeSize={creativeSize}
            alternateDevice={alternateDevice}
            onSwitchDevice={setDevice}
          />
        ) : !canPreview ? (
          <PreviewDeviceIncompatibleState
            message={selectedSourceDeviceValidation.message}
            device={device}
            creativeSize={creativeSize}
            alternateDevice={alternateDevice}
            onSwitchDevice={setDevice}
          />
        ) : (
          <ContextualPreviewEngine
            key={`${selectedSourceId}-${activeTemplate}-${device}-${regenerateToken}`}
            creatives={[selectedCreativeWithAnalysis]}
            vertical={vertical}
            goal={goal}
            controlledDevice={device}
            hideDeviceToggle
            hideCreativeSidebar
            hideEnvironmentSelector
            studioMode
            fixedEnvironment={activeTemplate}
            placementLabel={PROGRAMMATIC_ENVIRONMENT_LABELS[activeTemplate]}
            previewPlatform="programmatic"
            previewPlacement={PROGRAMMATIC_PREVIEW_PLACEMENT}
            onCopyCreative={onCopyCreative}
            onEditCreative={onEditCreative}
            getSupportedDevicesForCreative={getSupportedDevices}
          />
        )}
      </StudioContentPanel>
    </div>
  );
}
