"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DeviceToggle,
  PreviewEmptyState,
  PreviewErrorState,
  PreviewLoadingState,
  StudioTabBar,
} from "../PreviewShared";
import { StudioToolbar } from "../shared/envShared";
import {
  enrichCreativesWithUploadedImages,
  fetchPreviewTemplates,
  filterCreativesByVertical,
} from "../previewUtils";
import {
  META_CHANNEL_TABS,
  renderEnvironmentCreative,
  resolveCreativeEnvironment,
} from "@/app/lib/environmentRegistry";

function matchesMetaTab(creative, tabId, deviceMode) {
  const env = resolveCreativeEnvironment(creative, deviceMode);
  const tab = META_CHANNEL_TABS.find((item) => item.id === tabId);
  if (!tab || tab.id === "all") return true;
  return tab.environments?.includes(env);
}

export default function MetaAdsPreviewStudio({
  vertical,
  goal,
  brandName,
  targetAudience,
  tone,
  keyMessage,
  imageUrls = [],
  onCopyCreative,
  onEditCreative,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [device, setDevice] = useState("mobile");
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const generated = await fetchPreviewTemplates({
        platform: "meta_ads",
        brandName,
        vertical,
        targetAudience,
        goal,
        tone,
        keyMessage,
        imageUrls,
      });
      setCreatives(enrichCreativesWithUploadedImages(generated, imageUrls));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Meta templates");
    } finally {
      setLoading(false);
    }
  }, [brandName, vertical, targetAudience, goal, tone, keyMessage, imageUrls]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredCreatives = useMemo(() => {
    return filterCreativesByVertical(creatives, vertical).filter(
      (creative) => matchesMetaTab(creative, activeTab, device),
    );
  }, [creatives, vertical, activeTab, device]);

  const handlers = useMemo(
    () => ({ onCopy: onCopyCreative, onEdit: onEditCreative }),
    [onCopyCreative, onEditCreative],
  );

  if (loading) return <PreviewLoadingState label="Building Meta Ads environments…" />;
  if (error) return <PreviewErrorState message={error} onRetry={loadTemplates} />;
  if (!filteredCreatives.length) {
    return (
      <div className="space-y-4">
        <StudioTabBar tabs={META_CHANNEL_TABS} activeTab={activeTab} onChange={setActiveTab} />
        <PreviewEmptyState
          title="No previews in this channel"
          description="Try the All tab or regenerate previews. Your uploaded creative will appear inside each environment."
        />
        <div className="flex justify-center">
          <button type="button" onClick={loadTemplates} className="rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-4 py-2 text-sm text-cyan-100">
            Regenerate previews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <StudioTabBar tabs={META_CHANNEL_TABS} activeTab={activeTab} onChange={setActiveTab} />
        <DeviceToggle
          options={[
            { id: "mobile", label: "Mobile" },
            { id: "desktop", label: "Desktop" },
          ]}
          activeDevice={device}
          onChange={setDevice}
        />
      </div>

      <StudioToolbar count={filteredCreatives.length} device={device} onRegenerate={loadTemplates} isRegenerating={loading} />

      <div className="grid grid-cols-1 gap-8">
        {filteredCreatives.map((creative) => (
          <div key={creative.id}>
            {renderEnvironmentCreative(creative, handlers, device)}
          </div>
        ))}
      </div>
    </div>
  );
}
