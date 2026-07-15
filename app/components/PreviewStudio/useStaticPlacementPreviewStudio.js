"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterSourceCreativesByDevice,
  getSupportedDevicesForCreative,
  validatePreviewDeviceCompatibility,
} from "@/app/lib/previewDeviceCompatibility";
import {
  getDefaultVideoPreviewPlacement,
  getVideoPreviewPlacement,
  getVideoPreviewPlacementTabs,
} from "@/app/lib/videoPreviewPlacements";
import {
  getDefaultPreviewPlacement,
  getDeviceOptionsForPlacement,
  getPreviewPlacement,
  getPreviewPlacementTabs,
  filterSourceCreativesByPlacement,
} from "@/app/lib/previewPlacementRegistry";
import { buildStaticPlacementTemplates } from "./staticPreviewTemplates";

/**
 * Placement-aware preview studio (display or video).
 * Video mode uses platform-specific video templates; display keeps existing placements.
 */
export function useStaticPlacementPreviewStudio({
  platform,
  brandName,
  vertical,
  goal,
  keyMessage,
  sourceCreatives = [],
  isVideoMode = false,
}) {
  const placementTabs = useMemo(
    () => (isVideoMode ? getVideoPreviewPlacementTabs(platform) : getPreviewPlacementTabs(platform)),
    [platform, isVideoMode],
  );
  const defaultPlacement = useMemo(
    () => (isVideoMode ? getDefaultVideoPreviewPlacement(platform) : getDefaultPreviewPlacement(platform)),
    [platform, isVideoMode],
  );

  const [activePlacement, setActivePlacement] = useState(defaultPlacement);
  const [device, setDevice] = useState(() => {
    if (isVideoMode) {
      const placement = getVideoPreviewPlacement(platform, defaultPlacement);
      const devices = placement?.devices || ["mobile", "desktop"];
      return devices.includes("mobile") ? "mobile" : (devices[0] || "mobile");
    }
    const options = getDeviceOptionsForPlacement(platform, defaultPlacement);
    return options[0]?.id || "mobile";
  });
  const [selectedSourceId, setSelectedSourceId] = useState(
    () => sourceCreatives[0]?.id || null,
  );

  const activePlacementConfig = useMemo(
    () => (isVideoMode
      ? getVideoPreviewPlacement(platform, activePlacement)
      : getPreviewPlacement(platform, activePlacement)),
    [platform, activePlacement, isVideoMode],
  );

  const compatibleSourceCreatives = useMemo(() => {
    if (isVideoMode) {
      const videos = sourceCreatives.filter((c) => c?.mediaType === "video" || c?.videoUrl || c?.fullUrl);
      return videos.length ? videos : sourceCreatives;
    }
    return filterSourceCreativesByPlacement(sourceCreatives, platform, activePlacement);
  }, [sourceCreatives, platform, activePlacement, isVideoMode]);

  const deviceOptions = useMemo(() => {
    if (isVideoMode) {
      const devices = activePlacementConfig?.devices || ["mobile", "desktop"];
      const ordered = devices.includes("mobile")
        ? ["mobile", ...devices.filter((id) => id !== "mobile")]
        : devices;
      return ordered.map((id) => ({
        id,
        label: id === "mobile" ? "Mobile" : "Desktop",
      }));
    }
    return getDeviceOptionsForPlacement(platform, activePlacement);
  }, [platform, activePlacement, isVideoMode, activePlacementConfig]);

  const deviceCompatibleSourceCreatives = useMemo(() => {
    if (isVideoMode) return compatibleSourceCreatives;
    return filterSourceCreativesByDevice(compatibleSourceCreatives, platform, activePlacement, device);
  }, [compatibleSourceCreatives, platform, activePlacement, device, isVideoMode]);

  useEffect(() => {
    if (!placementTabs.some((tab) => tab.id === activePlacement)) {
      setActivePlacement(defaultPlacement);
    }
  }, [placementTabs, activePlacement, defaultPlacement]);

  useEffect(() => {
    if (!deviceOptions.some((option) => option.id === device)) {
      setDevice(deviceOptions[0]?.id || "mobile");
    }
  }, [deviceOptions, device]);

  useEffect(() => {
    if (!compatibleSourceCreatives.length) return;
    if (!compatibleSourceCreatives.some((c) => c.id === selectedSourceId)) {
      setSelectedSourceId(compatibleSourceCreatives[0].id);
    }
  }, [compatibleSourceCreatives, selectedSourceId]);

  const selectedSource = useMemo(
    () => deviceCompatibleSourceCreatives.find((c) => c.id === selectedSourceId)
      || compatibleSourceCreatives.find((c) => c.id === selectedSourceId)
      || compatibleSourceCreatives[0]
      || null,
    [deviceCompatibleSourceCreatives, compatibleSourceCreatives, selectedSourceId],
  );

  const selectedSourceDeviceValidation = useMemo(() => {
    if (!selectedSource || isVideoMode) return { supported: true, message: null };
    return validatePreviewDeviceCompatibility({
      platform,
      placementId: activePlacement,
      device,
      size: selectedSource.size || selectedSource.validation?.size,
    });
  }, [selectedSource, platform, activePlacement, device, isVideoMode]);

  const getSupportedDevicesForCreativeFn = useCallback(
    (size) => {
      if (isVideoMode) return (activePlacementConfig?.devices || ["desktop", "mobile"]);
      return getSupportedDevicesForCreative(platform, activePlacement, size);
    },
    [platform, activePlacement, isVideoMode, activePlacementConfig],
  );

  const templatesForSource = useMemo(() => {
    if (!selectedSource) return [];
    return buildStaticPlacementTemplates({
      platform,
      placementId: activePlacement,
      sourceCreative: selectedSource,
      brandName,
      vertical,
      goal,
      keyMessage,
      isVideoMode,
    });
  }, [platform, activePlacement, selectedSource, brandName, vertical, goal, keyMessage, isVideoMode]);

  return {
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
    getSupportedDevicesForCreative: getSupportedDevicesForCreativeFn,
    templates: templatesForSource,
    isVideoMode,
  };
}
