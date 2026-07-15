import {
  VIDEO_LAUNCH_READY_MAX_BYTES,
  VIDEO_NEEDS_REVIEW_MAX_BYTES,
  formatVideoFileSize,
  getVideoFileSizeTier,
  getVideoSpecsForPlatform,
} from "@/app/lib/video/videoSpecs";
import type { VideoValidationIssue, VideoValidationResult } from "@/app/lib/video/videoValidation";

export type VideoQaStatus = "pass" | "warn" | "fail";

export type VideoValidationChecklistItem = {
  key: string;
  label: string;
  status: VideoQaStatus;
  text: string;
};

const CHECKLIST_DEFS = [
  { key: "format", label: "File format", types: ["format"] },
  { key: "file_size", label: "File size", types: ["file_size"] },
  { key: "resolution", label: "Resolution", types: ["resolution", "resolution_soft"] },
  { key: "aspect_ratio", label: "Aspect ratio", types: ["aspect_ratio"] },
  {
    key: "duration",
    label: "Duration",
    types: ["duration_min", "duration_max", "duration_reels", "duration_non_skippable", "duration_skippable"],
  },
  { key: "video_codec", label: "Video codec (H.264 recommended)", types: ["video_codec"] },
  { key: "audio_codec", label: "Audio codec (AAC recommended)", types: ["audio_codec", "missing_audio"] },
  { key: "frame_rate", label: "Frame rate", types: ["frame_rate"] },
  { key: "corrupted", label: "Corrupted file detection", types: ["corrupted", "empty_video"] },
] as const;

function worstStatus(current: VideoQaStatus, next: VideoQaStatus): VideoQaStatus {
  if (current === "fail" || next === "fail") return "fail";
  if (current === "warn" || next === "warn") return "warn";
  return "pass";
}

function issueToStatus(severity: string): VideoQaStatus {
  if (severity === "high") return "fail";
  if (severity === "medium") return "warn";
  return "warn";
}

function collectIssues(
  issues: VideoValidationIssue[],
  types: readonly string[],
): VideoValidationIssue[] {
  return issues.filter((issue) => types.includes(issue.type));
}

function buildChecklistItem(
  def: (typeof CHECKLIST_DEFS)[number],
  issues: VideoValidationIssue[],
  passText: string,
  unknownText?: string,
): VideoValidationChecklistItem {
  const matched = collectIssues(issues, def.types);
  if (matched.length === 0) {
    return {
      key: def.key,
      label: def.label,
      status: "pass",
      text: unknownText || passText,
    };
  }

  let status: VideoQaStatus = "pass";
  for (const issue of matched) {
    status = worstStatus(status, issueToStatus(issue.severity));
  }

  return {
    key: def.key,
    label: def.label,
    status,
    text: matched.map((issue) => issue.message).join(" "),
  };
}

function buildFileSizeItem(fileSizeBytes: number, platformMaxBytes: number): VideoValidationChecklistItem {
  const tier = getVideoFileSizeTier(fileSizeBytes, platformMaxBytes);
  const label = formatVideoFileSize(fileSizeBytes);

  if (tier === "critical") {
    return {
      key: "file_size",
      label: "File size",
      status: "fail",
      text: `${label} exceeds the platform upload limit (${formatVideoFileSize(platformMaxBytes)}).`,
    };
  }
  if (tier === "review" && fileSizeBytes > VIDEO_NEEDS_REVIEW_MAX_BYTES) {
    return {
      key: "file_size",
      label: "File size",
      status: "warn",
      text: `${label} is above 500 MB and needs review. Compress toward ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} for launch-ready delivery.`,
    };
  }
  if (tier === "review") {
    return {
      key: "file_size",
      label: "File size",
      status: "warn",
      text: `${label} is in the ${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)}–${formatVideoFileSize(VIDEO_NEEDS_REVIEW_MAX_BYTES)} review band. Compress toward ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} for launch-ready delivery.`,
    };
  }
  return {
    key: "file_size",
    label: "File size",
    status: "pass",
    text: `${label} is within the ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} launch-ready target.`,
  };
}

function buildCodecItem(
  key: "video_codec" | "audio_codec",
  label: string,
  issues: VideoValidationIssue[],
  recommended: string,
): VideoValidationChecklistItem {
  const types = key === "audio_codec" ? ["audio_codec", "missing_audio"] : ["video_codec"];
  const matched = collectIssues(issues, types);
  if (matched.length > 0) {
    let status: VideoQaStatus = "pass";
    for (const issue of matched) {
      status = worstStatus(status, issueToStatus(issue.severity));
    }
    return {
      key,
      label,
      status,
      text: matched.map((issue) => issue.message).join(" "),
    };
  }
  return {
    key,
    label,
    status: "pass",
    text: `No codec issues detected. ${recommended} recommended when re-encoding.`,
  };
}

function buildFrameRateItem(issues: VideoValidationIssue[], frameRate?: number | null): VideoValidationChecklistItem {
  const matched = collectIssues(issues, ["frame_rate"]);
  if (matched.length > 0) {
    return buildChecklistItem(
      { key: "frame_rate", label: "Frame rate", types: ["frame_rate"] },
      issues,
      "",
    );
  }
  if (frameRate != null && frameRate > 0) {
    return {
      key: "frame_rate",
      label: "Frame rate",
      status: "pass",
      text: `${frameRate} fps is within the supported range.`,
    };
  }
  return {
    key: "frame_rate",
    label: "Frame rate",
    status: "pass",
    text: "Frame rate could not be measured in-browser. 24, 30, or 60 fps are safe defaults.",
  };
}

export function buildVideoValidationChecklist({
  issues = [],
  fileSizeBytes = 0,
  platform = "meta_ads",
  frameRate = null,
  validationResults = {},
}: {
  issues?: VideoValidationIssue[];
  fileSizeBytes?: number;
  platform?: string;
  frameRate?: number | null;
  validationResults?: Record<string, Pick<VideoValidationResult, "pass" | "errors" | "warnings">>;
}): VideoValidationChecklistItem[] {
  const specs = getVideoSpecsForPlatform(platform);
  const platformMaxBytes = specs.maxFileSizeBytes;
  const allowedFormats = specs.allowedExtensions
    .map((ext) => ext.replace(".", "").toUpperCase())
    .join(" / ");

  const items: VideoValidationChecklistItem[] = CHECKLIST_DEFS.map((def) => {
    if (def.key === "file_size") {
      const sizeIssue = collectIssues(issues, ["file_size"]);
      if (sizeIssue.length > 0) {
        return buildChecklistItem(def, issues, "", "");
      }
      return buildFileSizeItem(fileSizeBytes, platformMaxBytes);
    }
    if (def.key === "video_codec") {
      return buildCodecItem(
        "video_codec",
        def.label,
        issues,
        "H.264",
      );
    }
    if (def.key === "audio_codec") {
      return buildCodecItem(
        "audio_codec",
        def.label,
        issues,
        "AAC",
      );
    }
    if (def.key === "frame_rate") {
      return buildFrameRateItem(issues, frameRate);
    }
    if (def.key === "format") {
      return buildChecklistItem(
        def,
        issues,
        `Supported container (${allowedFormats}) with H.264 recommended.`,
      );
    }
    if (def.key === "corrupted") {
      const matched = collectIssues(issues, def.types);
      if (matched.length > 0) {
        return buildChecklistItem(def, issues, "", "");
      }
      return {
        key: def.key,
        label: def.label,
        status: "pass",
        text: "Video decoded successfully. File is readable and playable.",
      };
    }
    return buildChecklistItem(
      def,
      issues,
      `No ${def.label.toLowerCase()} issues detected.`,
    );
  });

  const platformEntries = Object.entries(validationResults);
  if (platformEntries.length > 0) {
    const failed = platformEntries.filter(([, result]) => !result.pass);
    items.push({
      key: "platform_compatibility",
      label: "Platform compatibility",
      status: failed.length === 0 ? "pass" : failed.some(([, result]) => (result.errors || []).length > 0) ? "fail" : "warn",
      text: failed.length === 0
        ? `Passes ${platformEntries.map(([name]) => name).join(" & ")} video ad specs.`
        : failed.map(([name]) => `${name}: issues detected`).join(" · "),
    });
  } else {
    const hardFails = issues.filter((issue) => issue.severity === "high");
    items.push({
      key: "platform_compatibility",
      label: "Platform compatibility",
      status: hardFails.length > 0 ? "fail" : issues.some((issue) => issue.severity === "medium") ? "warn" : "pass",
      text: hardFails.length > 0
        ? "One or more platform requirements failed."
        : "No blocking platform compatibility issues detected.",
    });
  }

  return items;
}

export function getVideoValidationLevelLabel(tier: "ready" | "review" | "critical") {
  if (tier === "critical") {
    return { emoji: "🔴", label: "Critical", tone: "red" as const };
  }
  if (tier === "review") {
    return { emoji: "🟡", label: "Needs Review", tone: "amber" as const };
  }
  return { emoji: "🟢", label: "Launch Ready", tone: "emerald" as const };
}

export const VIDEO_VALIDATION_LEVELS = [
  {
    emoji: "🟢",
    label: "Launch Ready",
    description: `≤ ${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)}`,
    tier: "ready" as const,
  },
  {
    emoji: "🟡",
    label: "Needs Review",
    description: `${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)}–${formatVideoFileSize(VIDEO_NEEDS_REVIEW_MAX_BYTES)}`,
    tier: "review" as const,
  },
  {
    emoji: "🔴",
    label: "Critical",
    description: "Above the platform upload limit",
    tier: "critical" as const,
  },
];

export type VideoPlatformQaItem = {
  status: VideoQaStatus;
  text: string;
  count?: number;
};

const VIDEO_PLATFORM_SPECS_SUMMARY: Record<
  string,
  {
    label: string;
    format: string;
    maxSize: string;
    aspects: string;
    resolution: string;
    duration: string;
    placements: string[];
  }
> = {
  google_ads: {
    label: "Google Ads (Video)",
    format: "MP4 (H.264, AAC)",
    maxSize: "100 MB recommended (≤150 MB launch-ready)",
    aspects: "16:9, 1:1, 9:16",
    resolution: "720p–1080p",
    duration: "6s–60s+",
    placements: ["YouTube", "Google Video Partners", "Discover", "Gmail"],
  },
  meta_ads: {
    label: "Meta Ads (Facebook & Instagram)",
    format: "MP4/MOV (H.264, AAC)",
    maxSize: "100 MB recommended (4 GB supported)",
    aspects: "1:1, 4:5, 9:16, 16:9",
    resolution: "1080×1080, 1080×1350, 1080×1920",
    duration: "6s–60s+",
    placements: [
      "Facebook Feed",
      "Instagram Feed",
      "Reels",
      "Stories",
      "In-Stream",
      "Audience Network",
    ],
  },
  programmatic: {
    label: "Programmatic Ads (DV360/OpenRTB)",
    format: "MP4 (H.264, AAC)",
    maxSize: "100–150 MB",
    aspects: "16:9, 1:1, 9:16",
    resolution: "720p–1080p",
    duration: "6s, 15s, 30s",
    placements: [
      "In-Stream",
      "Out-Stream",
      "CTV/OTT",
      "Mobile Apps",
      "Publisher Websites",
    ],
  },
};

function worstItemStatus(current: VideoQaStatus, next: VideoQaStatus): VideoQaStatus {
  return worstStatus(current, next);
}

function checklistStatusToQa(status: VideoQaStatus): VideoQaStatus {
  return status;
}

/** Aggregate Technical QA for video campaigns (platform-aware, never uses 150 KB image rules). */
export function buildVideoTechnicalQaSection(
  insights: Array<{
    mediaType?: string;
    videoValidationMeta?: { checklist?: VideoValidationChecklistItem[]; fileSizeLabel?: string; sizeTier?: string };
    creativeName?: string;
  }>,
  platform: string,
): { summary: string; items: VideoPlatformQaItem[]; passRate: number } {
  const spec = VIDEO_PLATFORM_SPECS_SUMMARY[platform] || VIDEO_PLATFORM_SPECS_SUMMARY.meta_ads;
  const videoInsights = insights.filter((i) => i.mediaType === "video" || i.videoValidationMeta);
  const checklistKeys = [
    "format",
    "file_size",
    "resolution",
    "aspect_ratio",
    "duration",
    "video_codec",
    "audio_codec",
    "frame_rate",
    "platform_compatibility",
  ] as const;

  const aggregated = new Map<string, { status: VideoQaStatus; texts: string[]; count: number }>();

  for (const insight of videoInsights) {
    const checklist = insight.videoValidationMeta?.checklist || [];
    for (const key of checklistKeys) {
      const item = checklist.find((entry) => entry.key === key);
      if (!item) continue;
      const existing = aggregated.get(key);
      if (!existing) {
        aggregated.set(key, { status: item.status, texts: [item.text], count: 1 });
      } else {
        existing.status = worstItemStatus(existing.status, item.status);
        existing.count += 1;
        if (!existing.texts.includes(item.text) && existing.texts.length < 2) {
          existing.texts.push(item.text);
        }
      }
    }
  }

  const items: VideoPlatformQaItem[] = [
    {
      status: "pass",
      text: `${spec.label}: format ${spec.format}; recommended max ${spec.maxSize}; aspect ${spec.aspects}; resolution ${spec.resolution}; duration ${spec.duration}.`,
    },
  ];

  for (const key of checklistKeys) {
    const agg = aggregated.get(key);
    if (!agg) continue;
    items.push({
      status: checklistStatusToQa(agg.status),
      text: agg.texts[0],
      count: agg.count > 1 ? agg.count : undefined,
    });
  }

  if (!aggregated.has("file_size")) {
    items.push({
      status: "pass",
      text: `Video file-size guidance uses MB (≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} launch-ready), not the 150 KB image display rule.`,
    });
  }

  const pass = items.filter((i) => i.status === "pass").length;
  const warn = items.filter((i) => i.status === "warn").length;
  const fail = items.filter((i) => i.status === "fail").length;
  const scored = items.length || 1;
  const passRate = Math.round((pass / scored) * 100);

  return {
    summary: `${spec.label} video technical checks: ${pass} passed · ${warn} warnings · ${fail} failures across ${videoInsights.length || insights.length} creative(s).`,
    items,
    passRate,
  };
}

/** Placement QA for video campaigns using platform video inventory. */
export function buildVideoPlacementQaSection(
  insights: Array<{ mediaType?: string; videoValidationMeta?: { checklist?: VideoValidationChecklistItem[] } }>,
  platform: string,
): {
  summary: string;
  items: VideoPlatformQaItem[];
  passRate: number;
  placementMatrix?: undefined;
  placementColumns?: undefined;
  deviceMatrix?: undefined;
  deviceColumns?: undefined;
  placementLegend?: string;
} {
  const spec = VIDEO_PLATFORM_SPECS_SUMMARY[platform] || VIDEO_PLATFORM_SPECS_SUMMARY.meta_ads;
  const videoInsights = insights.filter((i) => i.mediaType === "video" || i.videoValidationMeta);

  let compatibilityStatus: VideoQaStatus = "pass";
  let aspectStatus: VideoQaStatus = "pass";
  let durationStatus: VideoQaStatus = "pass";

  for (const insight of videoInsights) {
    const checklist = insight.videoValidationMeta?.checklist || [];
    for (const item of checklist) {
      if (item.key === "platform_compatibility") {
        compatibilityStatus = worstItemStatus(compatibilityStatus, item.status);
      }
      if (item.key === "aspect_ratio") {
        aspectStatus = worstItemStatus(aspectStatus, item.status);
      }
      if (item.key === "duration") {
        durationStatus = worstItemStatus(durationStatus, item.status);
      }
    }
  }

  const items: VideoPlatformQaItem[] = [
    {
      status: compatibilityStatus,
      text:
        compatibilityStatus === "pass"
          ? `Compatible with ${spec.label} video placements: ${spec.placements.join(", ")}.`
          : `Review ${spec.label} placement compatibility for one or more video creatives.`,
    },
    {
      status: aspectStatus,
      text:
        aspectStatus === "pass"
          ? `Aspect ratios support ${spec.label} inventory (${spec.aspects}).`
          : `One or more videos need an aspect ratio suited to ${spec.label} (${spec.aspects}).`,
    },
    {
      status: durationStatus,
      text:
        durationStatus === "pass"
          ? `Duration fits ${spec.label} guidance (${spec.duration}).`
          : `Adjust video length toward ${spec.label} guidance (${spec.duration}).`,
    },
    ...spec.placements.map((placement) => ({
      status: "pass" as VideoQaStatus,
      text: `${placement}: supported video placement for this platform.`,
    })),
  ];

  const pass = items.filter((i) => i.status === "pass").length;
  const scored = items.length || 1;

  return {
    summary: `${spec.label} video placement coverage across ${spec.placements.length} inventory surfaces for ${videoInsights.length || insights.length} creative(s).`,
    items,
    passRate: Math.round((pass / scored) * 100),
    placementLegend: `Video placements for ${spec.label}: ${spec.placements.join(" · ")}`,
  };
}
