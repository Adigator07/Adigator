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
  applySourceCreativeToTemplates,
  dedupeTemplatesByEnvironment,
  fetchPreviewTemplates,
  filterCreativesByVertical,
} from "../previewUtils";
import {
  GOOGLE_CHANNEL_TABS,
  renderEnvironmentCreative,
  resolveCreativeEnvironment,
} from "@/app/lib/environmentRegistry";

function matchesGoogleTab(creative, tabId, deviceMode) {
  const env = resolveCreativeEnvironment(creative, deviceMode);
  const tab = GOOGLE_CHANNEL_TABS.find((item) => item.id === tabId);
  if (!tab || tab.id === "all") return true;
  return tab.environments?.includes(env);
}

export default function GoogleAdsPreviewStudio({
  vertical,
  goal,
  brandName,
  targetAudience,
  tone,
  keyMessage,
  imageUrls = [],
  sourceCreatives = [],
  onCopyCreative,
  onEditCreative,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [device, setDevice] = useState("desktop");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState(
    () => sourceCreatives[0]?.id || null,
  );

  useEffect(() => {
    if (sourceCreatives.length && !sourceCreatives.some((c) => c.id === selectedSourceId)) {
      setSelectedSourceId(sourceCreatives[0].id);
    }
  }, [sourceCreatives, selectedSourceId]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const generated = await fetchPreviewTemplates({
        platform: "google_ads",
        brandName,
        vertical,
        targetAudience,
        goal,
        tone,
        keyMessage,
        imageUrls,
      });
      setTemplates(dedupeTemplatesByEnvironment(generated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Google templates");
    } finally {
      setLoading(false);
    }
  }, [brandName, vertical, targetAudience, goal, tone, keyMessage, imageUrls]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selectedSource = useMemo(
    () => sourceCreatives.find((c) => c.id === selectedSourceId) || sourceCreatives[0] || null,
    [sourceCreatives, selectedSourceId],
  );

  const creativesForSelectedSource = useMemo(() => {
    const base = filterCreativesByVertical(templates, vertical);
    const withImage = applySourceCreativeToTemplates(base, selectedSource);
    return withImage.filter((creative) => matchesGoogleTab(creative, activeTab, device));
  }, [templates, vertical, selectedSource, activeTab, device]);

  const handlers = useMemo(
    () => ({ onCopy: onCopyCreative, onEdit: onEditCreative }),
    [onCopyCreative, onEditCreative],
  );

  if (loading) return <PreviewLoadingState label="Building Google Ads environments…" />;
  if (error) return <PreviewErrorState message={error} onRetry={loadTemplates} />;

  if (!creativesForSelectedSource.length && !templates.length) {
    return (
      <div className="space-y-4">
        <StudioTabBar tabs={GOOGLE_CHANNEL_TABS} activeTab={activeTab} onChange={setActiveTab} />
        <PreviewEmptyState
          title="No previews in this channel"
          description="Try the All tab or regenerate previews."
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
      {sourceCreatives.length > 1 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Preview creative
          </p>
          <div className="flex flex-wrap gap-2">
            {sourceCreatives.map((creative) => {
              const active = creative.id === selectedSourceId;
              return (
                <button
                  key={creative.id}
                  type="button"
                  onClick={() => setSelectedSourceId(creative.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                      : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                  }`}
                >
                  {creative.url ? (
                    <img src={creative.url} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : null}
                  <span className="truncate max-w-[120px]">{creative.name || "Creative"}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Showing {selectedSource?.name || "selected creative"} across all Google Ads environments.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <StudioTabBar tabs={GOOGLE_CHANNEL_TABS} activeTab={activeTab} onChange={setActiveTab} />
        <DeviceToggle
          options={[
            { id: "desktop", label: "Desktop" },
            { id: "mobile", label: "Mobile" },
          ]}
          activeDevice={device}
          onChange={setDevice}
        />
      </div>

      <StudioToolbar count={creativesForSelectedSource.length} device={device} onRegenerate={loadTemplates} isRegenerating={loading} />

      {!creativesForSelectedSource.length ? (
        <PreviewEmptyState
          title="No previews in this channel"
          description="Try the All tab or switch device view."
        />
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {creativesForSelectedSource.map((creative) => (
            <div key={`${selectedSourceId}-${creative.id}-${creative.environment}`}>
              {renderEnvironmentCreative(creative, handlers, device)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
