"use client";

import { useState } from "react";
import {
  AdImage,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  ScaledEnvironment,
} from "@/app/components/PreviewStudio/shared/envShared";
import { parseSize } from "@/app/components/PreviewStudio/previewUtils";

export default function FallbackEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const dims = parseSize(creative.size) || { width: 300, height: 250, label: "300x250" };

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge={creative.placement || "Ad Preview"}
      badgeClassName="bg-gray-500/20 text-gray-100 border-gray-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment
        naturalWidth={Math.min(dims.width + 80, 920)}
        naturalHeight={dims.height + 120}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        <div className="p-6 bg-white" style={{ width: Math.min(dims.width + 80, 920) }}>
          <p className="text-xs text-gray-500 mb-3">
            Preview for {creative.environment || creative.type || "unknown placement"}
          </p>
          <DisplayAdSlot
            creative={creative}
            width={dims.width}
            height={dims.height}
            label={`Placement · ${dims.label}`}
            showAd
          />
          <p className="mt-3 text-sm font-semibold text-gray-900">{creative.headline}</p>
          <p className="text-sm text-gray-600 mt-1">{creative.description}</p>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
