"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  formatVerticalLabel,
  resolveCreativePreviewContext,
} from "@/app/lib/creativePreviewContext";

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
  campaignBrief = "",
  campaignIntent = "",
  campaignIntentFingerprint = "",
  advertiserName = "",
  brandName = "",
  campaignName = "",
  campaignProductFocus = "",
  advertiserId = "",
  campaignId = "",
  creativeFingerprint = "",
  previewStudioCache = null,
  onPreviewCacheUpdate,
  onExportContextChange,
  cacheOnly = false,
  initialTemplateId = null,
  initialPreviewDevice = null,
  initialPreviewCreativeId = null,
}) {
  const [activeTemplate, setActiveTemplate] = useState(
    () => initialTemplateId || PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS[0],
  );
  const [device, setDevice] = useState(() => initialPreviewDevice || "desktop");
  const [regenerateToken, setRegenerateToken] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(
    () => initialPreviewCreativeId || sourceCreatives[0]?.id || null,
  );
  const lastAutoTemplateCreativeRef = useRef(null);

  useEffect(() => {
    if (!sourceCreatives.length) return;
    if (!sourceCreatives.some((creative) => creative.id === selectedSourceId)) {
      setSelectedSourceId(sourceCreatives[0].id);
    }
  }, [sourceCreatives, selectedSourceId]);

  useEffect(() => {
    if (initialTemplateId) setActiveTemplate(initialTemplateId);
    if (initialPreviewDevice) setDevice(initialPreviewDevice);
    if (initialPreviewCreativeId) setSelectedSourceId(initialPreviewCreativeId);
  }, [initialTemplateId, initialPreviewDevice, initialPreviewCreativeId]);

  const selectedSource = useMemo(
    () => sourceCreatives.find((creative) => creative.id === selectedSourceId)
      || sourceCreatives[0]
      || null,
    [sourceCreatives, selectedSourceId],
  );

  const selectedCreativeWithAnalysis = useMemo(() => {
    if (!selectedSource) return null;
    const enriched = creatives.find((creative) => creative.id === selectedSource.id);
    const analyzerOutput = enriched?.analyzerOutput || {};
    const previewContext = resolveCreativePreviewContext(analyzerOutput, vertical);
    return {
      ...selectedSource,
      url: enriched?.url || selectedSource.url || selectedSource.fullUrl || "",
      analyzerOutput,
      ctaText: enriched?.ctaText || "",
      headline: enriched?.headline || selectedSource.name || "",
      previewVertical: enriched?.previewVertical || previewContext.creativeVertical,
      previewTemplate: enriched?.previewTemplate || previewContext.templateId,
    };
  }, [selectedSource, creatives, vertical]);

  const selectedPreviewContext = useMemo(() => (
    resolveCreativePreviewContext(selectedCreativeWithAnalysis?.analyzerOutput, vertical)
  ), [selectedCreativeWithAnalysis?.analyzerOutput, vertical]);

  useEffect(() => {
    if (!selectedCreativeWithAnalysis?.previewTemplate) return;
    if (lastAutoTemplateCreativeRef.current === selectedSourceId) return;
    setActiveTemplate(selectedCreativeWithAnalysis.previewTemplate);
    lastAutoTemplateCreativeRef.current = selectedSourceId;
  }, [selectedSourceId, selectedCreativeWithAnalysis?.previewTemplate]);

  useEffect(() => {
    onExportContextChange?.({
      platform: "programmatic",
      templateId: activeTemplate,
      device,
      creativeId: selectedSourceId,
      studioMode: "previews",
      getPreviewElement: null,
    });
  }, [activeTemplate, device, selectedSourceId, onExportContextChange]);

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

  const handlePreviewCacheUpdate = useCallback((cache) => {
    onPreviewCacheUpdate?.(cache);
    setRegenerateToken(0);
  }, [onPreviewCacheUpdate]);

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
          Each creative gets its own publisher preview based on its detected category.
          {selectedPreviewContext ? (
            <> Detected for this creative: <strong className="text-studio-text">{formatVerticalLabel(selectedPreviewContext.creativeVertical)}</strong> · auto template <strong className="text-studio-text">{PROGRAMMATIC_ENVIRONMENT_LABELS[selectedPreviewContext.templateId] || selectedPreviewContext.templateId}</strong>.</>
          ) : null}
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
            onRegenerate={cacheOnly ? undefined : handleRegenerate}
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
          <div className="preview-environment-root">
          <ContextualPreviewEngine
            key={`${selectedSourceId}-${activeTemplate}-${device}-${selectedCreativeWithAnalysis?.previewVertical || vertical}`}
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
            campaignBrief={campaignBrief}
            campaignIntent={campaignIntent}
            campaignIntentFingerprint={campaignIntentFingerprint}
            advertiserName={advertiserName}
            brandName={brandName}
            campaignName={campaignName}
            campaignProductFocus={campaignProductFocus}
            advertiserId={advertiserId}
            campaignId={campaignId}
            creativeFingerprint={creativeFingerprint}
            previewStudioCache={previewStudioCache}
            onPreviewCacheUpdate={handlePreviewCacheUpdate}
            regenerateNonce={regenerateToken}
            cacheOnly={cacheOnly}
          />
          </div>
        )}
      </StudioContentPanel>
    </div>
  );
}
