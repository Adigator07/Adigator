"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dedupeTemplatesByEnvironment,
  fetchPreviewTemplates,
  filterCreativesByVertical,
} from "./previewUtils";
import {
  filterSourceCreativesByPlacement,
  filterTemplatesByPlacement,
  getDefaultPreviewPlacement,
  getDeviceOptionsForPlacement,
  getPreviewPlacement,
  getPreviewPlacementTabs,
} from "@/app/lib/previewPlacementRegistry";

/**
 * Shared placement-aware preview studio state for Google and Meta studios.
 */
export function usePlacementPreviewStudio({
  platform,
  brandName,
  vertical,
  targetAudience,
  goal,
  tone,
  keyMessage,
  imageUrls = [],
  sourceCreatives = [],
}) {
  const placementTabs = useMemo(() => getPreviewPlacementTabs(platform), [platform]);
  const defaultPlacement = useMemo(() => getDefaultPreviewPlacement(platform), [platform]);

  const [activePlacement, setActivePlacement] = useState(defaultPlacement);
  const [device, setDevice] = useState(() => {
    const options = getDeviceOptionsForPlacement(platform, defaultPlacement);
    return options[0]?.id || "mobile";
  });
  const templateCacheRef = useRef({});
  const [cacheVersion, setCacheVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const templates = templateCacheRef.current[activePlacement] || [];

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

  const loadTemplates = useCallback(async (force = false) => {
    if (!activePlacement) return;

    if (!force && templateCacheRef.current[activePlacement]) {
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const generated = await fetchPreviewTemplates({
        platform,
        brandName,
        vertical,
        targetAudience,
        goal,
        tone,
        keyMessage,
        imageUrls,
        placement: activePlacement,
      });
      templateCacheRef.current[activePlacement] = dedupeTemplatesByEnvironment(generated);
      setCacheVersion((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview templates");
    } finally {
      setLoading(false);
    }
  }, [
    activePlacement,
    platform,
    brandName,
    vertical,
    targetAudience,
    goal,
    tone,
    keyMessage,
    imageUrls,
  ]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selectedSource = useMemo(
    () => compatibleSourceCreatives.find((c) => c.id === selectedSourceId)
      || compatibleSourceCreatives[0]
      || null,
    [compatibleSourceCreatives, selectedSourceId],
  );

  const handlePlacementChange = useCallback((placementId) => {
    setActivePlacement(placementId);
  }, []);

  const handleRegenerate = useCallback(() => {
    loadTemplates(true);
  }, [loadTemplates]);

  return {
    placementTabs,
    activePlacement,
    activePlacementConfig,
    setActivePlacement: handlePlacementChange,
    device,
    setDevice,
    deviceOptions,
    compatibleSourceCreatives,
    selectedSource,
    selectedSourceId,
    setSelectedSourceId,
    templates,
    cacheVersion,
    loading,
    error,
    loadTemplates: handleRegenerate,
    filterCreativesByVertical,
    filterTemplatesByPlacement: (items) => filterTemplatesByPlacement(items, platform, activePlacement, device),
  };
}
