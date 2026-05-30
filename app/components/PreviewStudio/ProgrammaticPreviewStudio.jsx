"use client";

import { useEffect, useMemo, useState } from "react";
import ContextualPreviewEngine from "../ContextualPreviewEngine";
import { DeviceToggle, PreviewEmptyState, StudioTabBar } from "./PreviewShared";
import {
  filterSourceCreativesByPlacement,
  getDefaultPreviewPlacement,
  getDeviceOptionsForPlacement,
  getPreviewPlacement,
  getPreviewPlacementTabs,
} from "@/app/lib/previewPlacementRegistry";
import {
  getSupportedDevicesForCreative,
} from "@/app/lib/previewDeviceCompatibility";

/**
 * Programmatic preview studio with placement-aware creative filtering.
 * Delegates rendering to ContextualPreviewEngine with compatible creatives only.
 */
export default function ProgrammaticPreviewStudio({ creatives, vertical, goal }) {
  const placementTabs = useMemo(() => getPreviewPlacementTabs("programmatic"), []);
  const [activePlacement, setActivePlacement] = useState(
    () => getDefaultPreviewPlacement("programmatic") || "native_ads",
  );

  const placementConfig = useMemo(
    () => getPreviewPlacement("programmatic", activePlacement),
    [activePlacement],
  );

  const deviceOptions = useMemo(
    () => getDeviceOptionsForPlacement("programmatic", activePlacement),
    [activePlacement],
  );

  const [device, setDevice] = useState(() => deviceOptions[0]?.id || "desktop");

  const compatibleCreatives = useMemo(
    () => filterSourceCreativesByPlacement(creatives, "programmatic", activePlacement),
    [creatives, activePlacement],
  );

  useEffect(() => {
    setDevice(deviceOptions[0]?.id || "desktop");
  }, [activePlacement, deviceOptions]);

  return (
    <div className="space-y-5">
      <StudioTabBar
        tabs={placementTabs}
        activeTab={activePlacement}
        onChange={setActivePlacement}
      />

      {placementConfig?.description ? (
        <p className="text-xs text-gray-500 -mt-2">{placementConfig.description}</p>
      ) : null}

      {deviceOptions.length > 1 ? (
        <DeviceToggle
          options={deviceOptions}
          activeDevice={device}
          onChange={setDevice}
        />
      ) : null}

      {placementConfig?.environmentFamilies?.length ? (
        <p className="text-[11px] text-gray-500">
          Recommended contexts: {placementConfig.environmentFamilies.join(", ")}
        </p>
      ) : null}

      {compatibleCreatives.length ? (
        <ContextualPreviewEngine
          key={`${activePlacement}-${device}`}
          creatives={compatibleCreatives}
          vertical={vertical}
          goal={goal}
          controlledDevice={device}
          onDeviceChange={setDevice}
          hideDeviceToggle={deviceOptions.length > 1}
          previewPlatform="programmatic"
          previewPlacement={activePlacement}
          getSupportedDevicesForCreative={(size) => getSupportedDevicesForCreative("programmatic", activePlacement, size)}
        />
      ) : (
        <PreviewEmptyState
          title="No compatible creatives for this placement"
          description={`Upload sizes supported by ${placementConfig?.label || "this placement"} — e.g. ${(placementConfig?.compatibleSizes || []).slice(0, 4).join(", ")}`}
        />
      )}
    </div>
  );
}
