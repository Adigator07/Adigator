"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import ContextualPreviewEngine from "../ContextualPreviewEngine";

import { CompatibleCreativePicker } from "./CompatibleCreativePicker";

import {

  DeviceToggle,

  PreviewDeviceIncompatibleState,

  PreviewEmptyState,

  StudioTabBar,

} from "./PreviewShared";

import { StudioToolbar } from "./shared/envShared";

import {

  filterSourceCreativesByPlacement,

  getDefaultPreviewPlacement,

  getDeviceOptionsForPlacement,

  getPreviewPlacement,

  getPreviewPlacementTabs,

  PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS,

  PROGRAMMATIC_ENVIRONMENT_LABELS,

} from "@/app/lib/previewPlacementRegistry";

import {

  getSupportedDevicesForCreative,

  validatePreviewDeviceCompatibility,

} from "@/app/lib/previewDeviceCompatibility";



const ENVIRONMENT_TABS = PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS.map((id) => ({

  id,

  label: PROGRAMMATIC_ENVIRONMENT_LABELS[id] || id,

}));



/**

 * Programmatic preview studio — placement previews only (display/image creatives).

 */

export default function ProgrammaticPreviewStudio({

  sourceCreatives = [],

  creatives = [],

  vertical,

  goal,

  onCopyCreative,

  onEditCreative,

}) {

  const placementTabs = useMemo(() => getPreviewPlacementTabs("programmatic"), []);

  const [activePlacement, setActivePlacement] = useState(

    () => getDefaultPreviewPlacement("programmatic") || "native_ads",

  );

  const [activeEnvironment, setActiveEnvironment] = useState(

    () => PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS[0],

  );

  const [regenerateToken, setRegenerateToken] = useState(0);

  const [isRegenerating, setIsRegenerating] = useState(false);

  const [selectedSourceId, setSelectedSourceId] = useState(

    () => sourceCreatives[0]?.id || null,

  );



  const activePlacementConfig = useMemo(

    () => getPreviewPlacement("programmatic", activePlacement),

    [activePlacement],

  );



  const deviceOptions = useMemo(

    () => getDeviceOptionsForPlacement("programmatic", activePlacement),

    [activePlacement],

  );



  const [device, setDevice] = useState(() => deviceOptions[0]?.id || "desktop");



  const compatibleSourceCreatives = useMemo(

    () => filterSourceCreativesByPlacement(sourceCreatives, "programmatic", activePlacement),

    [sourceCreatives, activePlacement],

  );



  useEffect(() => {

    if (!deviceOptions.some((option) => option.id === device)) {

      setDevice(deviceOptions[0]?.id || "desktop");

    }

  }, [deviceOptions, device]);



  useEffect(() => {

    setActiveEnvironment(PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS[0]);

  }, [activePlacement]);



  useEffect(() => {

    if (!compatibleSourceCreatives.length) return;

    if (!compatibleSourceCreatives.some((creative) => creative.id === selectedSourceId)) {

      setSelectedSourceId(compatibleSourceCreatives[0].id);

    }

  }, [compatibleSourceCreatives, selectedSourceId]);



  const selectedSource = useMemo(

    () => compatibleSourceCreatives.find((creative) => creative.id === selectedSourceId)

      || compatibleSourceCreatives[0]

      || null,

    [compatibleSourceCreatives, selectedSourceId],

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

    if (!selectedSource) return { supported: true, message: null, sizeSupport: "both" };

    return validatePreviewDeviceCompatibility({

      platform: "programmatic",

      placementId: activePlacement,

      device,

      size: selectedSource.size || selectedSource.validation?.size,

    });

  }, [selectedSource, activePlacement, device]);



  const getSupportedDevices = useCallback(

    (size) => getSupportedDevicesForCreative("programmatic", activePlacement, size),

    [activePlacement],

  );



  const handleRegenerate = useCallback(() => {

    setIsRegenerating(true);

    setRegenerateToken((value) => value + 1);

    window.setTimeout(() => setIsRegenerating(false), 600);

  }, []);



  const showDeviceToggle = deviceOptions.length > 1;

  const alternateDevice = deviceOptions.find((option) => option.id !== device)?.id;

  const creativeSize = selectedSource?.size || selectedSource?.validation?.size;

  const isMobileDevice = device === "mobile";

  const mobileUnsupported = isMobileDevice && !selectedSourceDeviceValidation.supported;

  const canPreview = selectedSourceDeviceValidation.supported && Boolean(selectedCreativeWithAnalysis);



  const mobileUnsupportedTitle = creativeSize

    ? `${creativeSize} is not available for Mobile placements`

    : "This creative is not available for Mobile placements";



  const mobileUnsupportedMessage = mobileUnsupported

    ? (selectedSourceDeviceValidation.message

      || `${creativeSize || "This size"} cannot be previewed on mobile for ${activePlacementConfig?.label || "this placement"}. Switch to Desktop view or upload a mobile-compatible size such as 320×50, 320×100, or 300×250.`)

    : null;



  return (

    <div className="space-y-5">

      <StudioTabBar

        tabs={placementTabs}

        activeTab={activePlacement}

        onChange={setActivePlacement}

      />



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

        getSupportedDevicesForCreative={getSupportedDevices}

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

          count={canPreview ? 1 : 0}

          device={device}

          onRegenerate={handleRegenerate}

          isRegenerating={isRegenerating}

        />

      </div>



      {isRegenerating ? (

        <p className="text-xs text-cyan-300/80">

          Refreshing {PROGRAMMATIC_ENVIRONMENT_LABELS[activeEnvironment]} preview…

        </p>

      ) : null}



      {!compatibleSourceCreatives.length ? (

        <PreviewEmptyState

          title="No compatible creatives for this placement"

          description={`Upload sizes supported by ${activePlacementConfig?.label || "this placement"} — e.g. ${(activePlacementConfig?.compatibleSizes || []).slice(0, 4).join(", ")}`}

        />

      ) : mobileUnsupported ? (

        <PreviewDeviceIncompatibleState

          title={mobileUnsupportedTitle}

          message={mobileUnsupportedMessage}

          device={device}

          creativeSize={creativeSize}

          alternateDevice={alternateDevice}

          onSwitchDevice={alternateDevice ? setDevice : undefined}

        />

      ) : !canPreview ? (

        <PreviewDeviceIncompatibleState

          message={selectedSourceDeviceValidation.message}

          device={device}

          creativeSize={creativeSize}

          alternateDevice={alternateDevice}

          onSwitchDevice={alternateDevice ? setDevice : undefined}

        />

      ) : (

        <div className="space-y-4">

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">

              Display Website Preview

            </p>

            <p className="mt-1 text-[11px] text-gray-500">

              {isMobileDevice

                ? "Mobile view shows the ad unit at its original aspect ratio — switch to Desktop for full publisher website contexts."

                : "Select a publisher template below. Only the active template is generated to save tokens."}

            </p>

          </div>



          {!isMobileDevice ? (

            <div className="space-y-2">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">

                Publisher template

              </p>

              <StudioTabBar

                tabs={ENVIRONMENT_TABS}

                activeTab={activeEnvironment}

                onChange={setActiveEnvironment}

              />

            </div>

          ) : null}



          <ContextualPreviewEngine

            key={`${selectedSourceId}-${activeEnvironment}-${device}-${regenerateToken}`}

            creatives={[selectedCreativeWithAnalysis]}

            vertical={vertical}

            goal={goal}

            controlledDevice={device}

            hideDeviceToggle

            hideCreativeSidebar

            hideEnvironmentSelector

            allowedEnvironmentFamilies={[activeEnvironment]}

            placementLabel={PROGRAMMATIC_ENVIRONMENT_LABELS[activeEnvironment]}

            previewPlatform="programmatic"

            previewPlacement={activePlacement}

            onCopyCreative={onCopyCreative}

            onEditCreative={onEditCreative}

            getSupportedDevicesForCreative={getSupportedDevices}

          />

        </div>

      )}

    </div>

  );

}

