"use client";

import type { RefObject } from "react";
import ContextualPreviewEngine from "@/app/components/ContextualPreviewEngine";
import { PROGRAMMATIC_ENVIRONMENT_LABELS } from "@/app/lib/previewPlacementRegistry";
import {
  getSupportedDevicesForCreative,
} from "@/app/lib/previewDeviceCompatibility";

const PROGRAMMATIC_PREVIEW_PLACEMENT = "open_web";

type PreviewCreative = {
  id: string;
  name: string;
  url?: string;
  size?: string;
  analyzerOutput?: Record<string, unknown>;
  ctaText?: string;
  headline?: string;
  previewVertical?: string;
  previewTemplate?: string;
};

type Props = {
  creative: PreviewCreative;
  templateId: string;
  device: "desktop" | "mobile";
  vertical: string;
  goal: string;
  campaignBrief?: string;
  campaignIntent?: string;
  campaignIntentFingerprint?: string;
  advertiserName?: string;
  brandName?: string;
  campaignName?: string;
  campaignProductFocus?: string;
  advertiserId?: string;
  campaignId?: string;
  creativeFingerprint?: string;
  previewStudioCache?: unknown;
  captureRef?: RefObject<HTMLElement | null>;
};

export default function PreviewStudioExportFrame({
  creative,
  templateId,
  device,
  vertical,
  goal,
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
  captureRef,
}: Props) {
  const templateLabel = PROGRAMMATIC_ENVIRONMENT_LABELS[templateId as keyof typeof PROGRAMMATIC_ENVIRONMENT_LABELS] || templateId;
  const getSupportedDevices = (size: string) =>
    getSupportedDevicesForCreative("programmatic", PROGRAMMATIC_PREVIEW_PLACEMENT, size);

  return (
    <div
      ref={captureRef as RefObject<HTMLDivElement>}
      className="preview-tool overflow-visible bg-[#07070f] text-[#f4f4f8]"
      style={{ width: 1280 }}
      data-export-preview={`${creative.id}-${templateId}-${device}`}
    >
      <div className="border-b border-white/10 bg-white/[0.03] px-8 py-5">
        <p className="tool-neon-accent text-[11px] font-semibold uppercase tracking-[0.22em]">Preview Studio Export</p>
        <h2 className="mt-2 text-xl font-black text-[#f4f4f8]">{creative.name}</h2>
        <p className="mt-1 text-sm text-[#c8c8d4]">
          {templateLabel} · {device === "mobile" ? "Mobile" : "Desktop"} · {creative.size || "—"}
        </p>
      </div>

      <div className="preview-environment-root overflow-visible px-8 py-6">
        <ContextualPreviewEngine
          creatives={[{
            ...creative,
            url: creative.url || "",
            size: creative.size || "",
          }]}
          vertical={vertical}
          goal={goal as "awareness" | "consideration" | "conversion"}
          controlledDevice={device}
          hideDeviceToggle
          hideCreativeSidebar
          hideEnvironmentSelector
          studioMode
          fixedEnvironment={templateId}
          placementLabel={templateLabel}
          previewPlatform="programmatic"
          previewPlacement={PROGRAMMATIC_PREVIEW_PLACEMENT}
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
          previewStudioCache={previewStudioCache as never}
          exportMode
        />
      </div>
    </div>
  );
}
