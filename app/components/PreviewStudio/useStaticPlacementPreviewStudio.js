"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  filterSourceCreativesByPlacement,
  getDefaultPreviewPlacement,
  getDeviceOptionsForPlacement,
  getPreviewPlacement,
  getPreviewPlacementTabs,
} from "@/app/lib/previewPlacementRegistry";
import {
  filterSourceCreativesByDevice,
  getSupportedDevicesForCreative,
  validatePreviewDeviceCompatibility,
} from "@/app/lib/previewDeviceCompatibility";
import { buildStaticPlacementTemplates } from "./staticPreviewTemplates";

/**
 * Placement-aware preview studio without OpenAI — uses predefined environment layouts.
 */
export function useStaticPlacementPreviewStudio({
  platform,
  brandName,
  vertical,
  goal,
  keyMessage,
  sourceCreatives = [],
}) {
  const placementTabs = useMemo(() => getPreviewPlacementTabs(platform), [platform]);
  const defaultPlacement = useMemo(() => getDefaultPreviewPlacement(platform), [platform]);

  const [activePlacement, setActivePlacement] = useState(defaultPlacement);
  const [device, setDevice] = useState(() => {
    const options = getDeviceOptionsForPlacement(platform, defaultPlacement);
    return options[0]?.id || "mobile";
  });
  const [selectedSourceId, setSelectedSourceId] = useState(
    () => sourceCreatives[0]?.id || null,
  );

  const activePlacementConfig = useMemo(
    () => getPreviewPlacement(platform, activePlacement),
    [platform, activePlacement],
  );

  const compatibleSourceCreatives = useMemo(
    () => filterSourceCreativesByPlacement(sourceCreatives, platform, activePlacement),
    [sourceCreatives, platform, activePlacement],
  );

  const deviceOptions = useMemo(
    () => getDeviceOptionsForPlacement(platform, activePlacement),
    [platform, activePlacement],
  );

  const deviceCompatibleSourceCreatives = useMemo(
    () => filterSourceCreativesByDevice(compatibleSourceCreatives, platform, activePlacement, device),
    [compatibleSourceCreatives, platform, activePlacement, device],
  );

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
    if (!selectedSource) return { supported: true, message: null };
    return validatePreviewDeviceCompatibility({
      platform,
      placementId: activePlacement,
      device,
      size: selectedSource.size || selectedSource.validation?.size,
    });
  }, [selectedSource, platform, activePlacement, device]);

  const getSupportedDevicesForCreativeFn = useCallback(
    (size) => getSupportedDevicesForCreative(platform, activePlacement, size),
    [platform, activePlacement],
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
    });
  }, [platform, activePlacement, selectedSource, brandName, vertical, goal, keyMessage]);

  return {
    placementTabs,
    activePlacement,
    activePlacementConfig,
    setActivePlacement,
    device,
    setDevice,
    deviceOptions,
    compatibleSourceCreatives,
    deviceCompatibleSourceCreatives,
    selectedSource,
    selectedSourceId,
    setSelectedSourceId,
    selectedSourceDeviceValidation,
    getSupportedDevicesForCreative: getSupportedDevicesForCreativeFn,
    templates: templatesForSource,
    loading: false,
    error: "",
    loadTemplates: () => {},
  };
}
