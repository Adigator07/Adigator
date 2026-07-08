import {
  GOOGLE_VIDEO_SPECS,
  META_VIDEO_SPECS,
  VIDEO_LAUNCH_READY_MAX_BYTES,
  VIDEO_NEEDS_REVIEW_MAX_BYTES,
  formatVideoFileSize,
  getVideoFileSizeTier,
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
      text: `${label} is above 500 MB — needs review. Compress toward ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} for launch-ready delivery.`,
    };
  }
  if (tier === "review") {
    return {
      key: "file_size",
      label: "File size",
      status: "warn",
      text: `${label} is in the 100–500 MB review band. Compress toward ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} for launch-ready delivery.`,
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
    text: "Frame rate could not be measured in-browser — 24, 30, or 60 fps are safe defaults.",
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
  const platformMaxBytes =
    platform === "google_ads"
      ? GOOGLE_VIDEO_SPECS.maxFileSizeBytes
      : platform === "meta_ads"
        ? META_VIDEO_SPECS.maxFileSizeBytes
        : Math.min(GOOGLE_VIDEO_SPECS.maxFileSizeBytes, META_VIDEO_SPECS.maxFileSizeBytes);

  const allowedFormats =
    platform === "google_ads"
      ? GOOGLE_VIDEO_SPECS.allowedExtensions.join(" / ")
      : platform === "meta_ads"
        ? META_VIDEO_SPECS.allowedExtensions.join(" / ")
        : "MP4 / MOV / WebM";

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
        text: "Video decoded successfully — file is readable and playable.",
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
