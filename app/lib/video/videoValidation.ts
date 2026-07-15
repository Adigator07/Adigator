import {
  ASPECT_RATIO_TOLERANCE,
  GOOGLE_VIDEO_SPECS,
  META_VIDEO_SPECS,
  PROGRAMMATIC_VIDEO_SPECS,
  VIDEO_LAUNCH_READY_MAX_BYTES,
  VIDEO_NEEDS_REVIEW_MAX_BYTES,
  formatVideoFileSize,
  getVideoFileSizeTier,
  getVideoSpecsForPlatform,
  resolveVideoPlatformId,
  type PlatformVideoSpec,
  type VideoPlatformId,
} from "@/app/lib/video/videoSpecs";

export interface VideoMetadataInput {
  mimeType?: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileName?: string;
  /** False when the file could not be decoded (corrupted / unreadable). */
  readable?: boolean;
  /** Best-effort measured frames-per-second (null when unknown). */
  frameRate?: number | null;
  /** Best-effort audio-track presence (null when unknown). */
  hasAudio?: boolean | null;
  /** Best-effort codec strings (usually unknown in-browser). */
  videoCodec?: string | null;
  audioCodec?: string | null;
}

export type VideoIssueSeverity = "high" | "medium" | "low";

export interface VideoValidationIssue {
  type: string;
  severity: VideoIssueSeverity;
  message: string;
  recommendation: string;
}

export interface VideoValidationResult {
  pass: boolean;
  /** Hard errors (block launch). Kept for backward compatibility with the analyzer. */
  errors: string[];
  /** Non-blocking warnings. */
  warnings: string[];
  /** Structured issues used by the UI. */
  issues: VideoValidationIssue[];
}

function normalizeMime(mimeType?: string, fileName?: string) {
  const mime = String(mimeType || "").toLowerCase();
  if (mime) return mime;
  const name = String(fileName || "").toLowerCase();
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mp4")) return "video/mp4";
  return "";
}

function aspectRatioLabel(width: number, height: number) {
  if (!width || !height) return "unknown";
  return `${width}x${height}`;
}

function orientationOf(width: number, height: number): "portrait" | "landscape" | "square" | "unknown" {
  if (!width || !height) return "unknown";
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function matchesSupportedAspectRatio(spec: PlatformVideoSpec, width: number, height: number) {
  if (!width || !height) return true;
  const ratio = width / height;
  return spec.supportedAspectRatios.some(
    (option) => Math.abs(ratio - option.ratio) <= ASPECT_RATIO_TOLERANCE,
  );
}

function formatMinutes(seconds: number) {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

function pushDurationIssues(spec: PlatformVideoSpec, duration: number, push: (
  type: string,
  severity: VideoIssueSeverity,
  message: string,
  recommendation: string,
) => void) {
  const label = spec.label;

  if (duration < spec.minDurationSeconds) {
    push(
      "duration_min",
      "high",
      `${label}: video is too short (${duration.toFixed(1)}s).`,
      `Provide a video of at least ${spec.minDurationSeconds}s.`,
    );
  }

  if (spec.platform === "meta_ads") {
    const metaSpec = spec as typeof META_VIDEO_SPECS;
    if (duration > metaSpec.maxDurationSeconds) {
      push(
        "duration_max",
        "high",
        `${label}: video exceeds the ${formatMinutes(metaSpec.maxDurationSeconds)} maximum.`,
        "Trim the video below the platform maximum duration.",
      );
    } else if (duration > metaSpec.reelsMaxDurationSeconds) {
      push(
        "duration_reels",
        "medium",
        `${label}: ${Math.round(duration)}s is longer than the ${metaSpec.reelsMaxDurationSeconds}s Reels/Stories limit.`,
        "Keep Reels/Stories placements to 60s or less (Feed/in-stream can be longer).",
      );
    }
    return;
  }

  if (spec.platform === "google_ads") {
    const googleSpec = spec as typeof GOOGLE_VIDEO_SPECS;
    if (duration > googleSpec.nonSkippableMaxSeconds) {
      push(
        "duration_non_skippable",
        "medium",
        `${label}: ${Math.round(duration)}s exceeds the ${googleSpec.nonSkippableMaxSeconds}s non-skippable limit.`,
        "Use a skippable format, or trim to 60s for non-skippable placements.",
      );
    }
    if (duration > googleSpec.skippableRecommendedMaxSeconds) {
      push(
        "duration_skippable",
        "low",
        `${label}: ${Math.round(duration)}s is longer than the recommended ${Math.round(googleSpec.skippableRecommendedMaxSeconds / 60)} min for skippable ads.`,
        "Shorter videos typically retain more viewers on YouTube.",
      );
    }
    return;
  }

  const programmaticSpec = spec as typeof PROGRAMMATIC_VIDEO_SPECS;
  if (duration > programmaticSpec.maxDurationSeconds) {
    push(
      "duration_max",
      "high",
      `${label}: ${Math.round(duration)}s exceeds the ${programmaticSpec.maxDurationSeconds}s programmatic package limit.`,
      "Trim to 120s or less for broader exchange / VAST acceptance.",
    );
  } else if (duration > programmaticSpec.preferredMaxDurationSeconds) {
    push(
      "duration_preferred",
      "medium",
      `${label}: ${Math.round(duration)}s is longer than the preferred ${programmaticSpec.preferredMaxDurationSeconds}s in-stream standard.`,
      "Prefer 15s or 30s cuts for in-stream; keep longer cuts for selected CTV/out-stream buys only.",
    );
  }
}

/**
 * Shared validation core. Each platform supplies its own official spec so
 * Google, Meta, and Programmatic validate independently.
 */
function validateVideoAgainstSpec(
  spec: PlatformVideoSpec,
  metadata: VideoMetadataInput,
): VideoValidationResult {
  const issues: VideoValidationIssue[] = [];
  const push = (
    type: string,
    severity: VideoIssueSeverity,
    message: string,
    recommendation: string,
  ) => issues.push({ type, severity, message, recommendation });

  const label = spec.label;
  const mime = normalizeMime(metadata.mimeType, metadata.fileName);
  const size = Number(metadata.fileSizeBytes || 0);
  const duration = Number(metadata.durationSeconds || 0);
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  const frameRate = metadata.frameRate == null ? null : Number(metadata.frameRate);
  const hasAudio = metadata.hasAudio;
  const readable = metadata.readable !== false;

  if (!readable) {
    push(
      "corrupted",
      "high",
      `${label}: video is corrupted or unreadable and cannot be decoded.`,
      "Re-export the video from source (H.264 MP4) and upload again.",
    );
    return finalize(issues);
  }
  if (!width || !height || !duration) {
    push(
      "empty_video",
      "high",
      `${label}: video appears empty or has no readable stream.`,
      "Upload a complete, playable video file.",
    );
    return finalize(issues);
  }

  if (!spec.allowedMimeTypes.includes(mime as never)) {
    push(
      "format",
      "high",
      `${label}: unsupported video format (${mime || "unknown"}).`,
      `Use ${spec.allowedExtensions.join(" / ")} (H.264 recommended).`,
    );
  }

  const sizeTier = getVideoFileSizeTier(size, spec.maxFileSizeBytes);
  if (sizeTier === "critical") {
    push(
      "file_size",
      "high",
      `${label}: video exceeds the ${formatVideoFileSize(spec.maxFileSizeBytes)} platform upload limit (${formatVideoFileSize(size)}).`,
      "Compress or re-encode the video to meet the platform maximum file size.",
    );
  } else if (size > VIDEO_NEEDS_REVIEW_MAX_BYTES) {
    push(
      "file_size",
      "medium",
      `${label}: ${formatVideoFileSize(size)} is above 500 MB and needs review before launch.`,
      `Compress toward ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} for launch-ready delivery (platform allows up to ${formatVideoFileSize(spec.maxFileSizeBytes)}).`,
    );
  } else if (size > VIDEO_LAUNCH_READY_MAX_BYTES) {
    push(
      "file_size",
      "medium",
      `${label}: ${formatVideoFileSize(size)} is in the ${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)}–${formatVideoFileSize(VIDEO_NEEDS_REVIEW_MAX_BYTES)} review band.`,
      `Compress toward ≤${formatVideoFileSize(VIDEO_LAUNCH_READY_MAX_BYTES)} for launch-ready delivery.`,
    );
  }

  pushDurationIssues(spec, duration, push);

  if (width < spec.minWidth || height < spec.minHeight) {
    push(
      "resolution",
      "high",
      `${label}: resolution ${aspectRatioLabel(width, height)} is below the minimum ${spec.minWidth}x${spec.minHeight}.`,
      "Export at a higher resolution to avoid rejection and quality loss.",
    );
  } else {
    const shortSide = Math.min(width, height);
    if (shortSide < spec.recommendedMinShortSidePx) {
      push(
        "resolution_soft",
        "low",
        `${label}: ${shortSide}px shortest side is below the recommended ${spec.recommendedMinShortSidePx}px.`,
        `Aim for ${spec.recommendedMinShortSidePx}px on the shortest side for best quality.`,
      );
    }
  }

  if (!matchesSupportedAspectRatio(spec, width, height)) {
    const supported = spec.supportedAspectRatios.map((r) => r.label).join(", ");
    push(
      "aspect_ratio",
      "medium",
      `${label}: aspect ratio ${aspectRatioLabel(width, height)} (${orientationOf(width, height)}) is outside the safe ratios.`,
      `Use one of ${supported} for reliable placement rendering.`,
    );
  }

  if (frameRate != null && frameRate > 0) {
    if (frameRate < spec.minFrameRate || frameRate > spec.maxFrameRate) {
      push(
        "frame_rate",
        "medium",
        `${label}: frame rate ${frameRate} fps is outside the ${spec.minFrameRate}-${spec.maxFrameRate} fps range.`,
        `Encode at ${spec.minFrameRate}-${spec.maxFrameRate} fps (24, 30, or 60 fps are safe).`,
      );
    }
  }

  const videoCodec = String(metadata.videoCodec || "").toLowerCase();
  if (videoCodec && !spec.recommendedVideoCodecs.some((c) => videoCodec.includes(c))) {
    push(
      "video_codec",
      "medium",
      `${label}: video codec "${metadata.videoCodec}" is not recommended.`,
      `Re-encode using ${spec.recommendedVideoCodecs[0].toUpperCase()} for best compatibility.`,
    );
  }
  const audioCodec = String(metadata.audioCodec || "").toLowerCase();
  if (audioCodec && !spec.recommendedAudioCodecs.some((c) => audioCodec.includes(c))) {
    push(
      "audio_codec",
      "low",
      `${label}: audio codec "${metadata.audioCodec}" is not recommended.`,
      `Re-encode audio using ${spec.recommendedAudioCodecs[0].toUpperCase()}.`,
    );
  }

  if (hasAudio === false) {
    push(
      "missing_audio",
      "low",
      `${label}: no audio track detected.`,
      "Most video placements auto-play muted, but add captions/audio for sound-on viewers.",
    );
  }

  return finalize(issues);
}

function finalize(issues: VideoValidationIssue[]): VideoValidationResult {
  const errors = issues.filter((i) => i.severity === "high").map((i) => i.message);
  const warnings = issues.filter((i) => i.severity !== "high").map((i) => i.message);
  return { pass: errors.length === 0, errors, warnings, issues };
}

export function validateMetaVideo(metadata: VideoMetadataInput): VideoValidationResult {
  return validateVideoAgainstSpec(META_VIDEO_SPECS, metadata);
}

export function validateGoogleVideo(metadata: VideoMetadataInput): VideoValidationResult {
  return validateVideoAgainstSpec(GOOGLE_VIDEO_SPECS, metadata);
}

export function validateProgrammaticVideo(metadata: VideoMetadataInput): VideoValidationResult {
  return validateVideoAgainstSpec(PROGRAMMATIC_VIDEO_SPECS, metadata);
}

const PLATFORM_RESULT_LABEL: Record<VideoPlatformId, string> = {
  meta_ads: "Meta",
  google_ads: "Google",
  programmatic: "Programmatic",
};

export function validateVideoForPlatforms(
  metadata: VideoMetadataInput,
  platforms: VideoPlatformId[] = ["meta_ads", "google_ads", "programmatic"],
) {
  const validation_results: Record<string, VideoValidationResult> = {};
  if (platforms.includes("meta_ads")) {
    validation_results[PLATFORM_RESULT_LABEL.meta_ads] = validateMetaVideo(metadata);
  }
  if (platforms.includes("google_ads")) {
    validation_results[PLATFORM_RESULT_LABEL.google_ads] = validateGoogleVideo(metadata);
  }
  if (platforms.includes("programmatic")) {
    validation_results[PLATFORM_RESULT_LABEL.programmatic] = validateProgrammaticVideo(metadata);
  }
  return validation_results;
}

function placementLabelForPlatform(platform: VideoPlatformId) {
  if (platform === "meta_ads") return "Video / Reels";
  if (platform === "google_ads") return "YouTube / Video";
  return "VAST / In-stream + Out-stream";
}

/**
 * Build the upload-time validation object for a video creative. This is the video-native
 * equivalent of the image pipeline's `finalizeValidationForPlatform` — it produces the same
 * object shape the UI consumes, but with NO display/RDA/dimension banner logic.
 */
export function buildVideoUploadValidation({
  metadata,
  platform,
}: {
  metadata: VideoMetadataInput;
  platform: string;
}) {
  const platformId = resolveVideoPlatformId(platform);
  const platforms: VideoPlatformId[] = [platformId];
  const validationResults = validateVideoForPlatforms(metadata, platforms);
  const specs = getVideoSpecsForPlatform(platformId);

  const issues = Object.entries(validationResults).flatMap(([, result]) =>
    result.issues.map((issue) => ({
      type: issue.type,
      severity: issue.severity,
      message: issue.message,
      recommendation: issue.recommendation,
      scorePenalty: issue.severity === "high" ? 25 : issue.severity === "medium" ? 8 : 3,
    })),
  );

  const valid = Object.values(validationResults).every((result) => result.pass);
  const hasHighSeverity = issues.some((issue) => issue.severity === "high");
  const hasMediumSeverity = issues.some((issue) => issue.severity === "medium");
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  const fileSizeBytes = Number(metadata.fileSizeBytes || 0);
  const sizeTier = getVideoFileSizeTier(fileSizeBytes, specs.maxFileSizeBytes);

  return {
    valid,
    status: hasHighSeverity ? "CRITICAL" : !valid || hasMediumSeverity || sizeTier === "review" ? "REVIEW" : "PASS",
    sizeTier,
    fileSizeBytes,
    fileSizeLabel: formatVideoFileSize(fileSizeBytes),
    size: "video",
    dimensions: {
      detectedWidth: width,
      detectedHeight: height,
      width,
      height,
    },
    issues,
    mediaType: "video" as const,
    durationSeconds: Number(metadata.durationSeconds || 0),
    frameRate: metadata.frameRate ?? null,
    hasAudio: metadata.hasAudio ?? null,
    validation_results: validationResults,
    intelligence: {
      placementType: placementLabelForPlatform(platformId),
      deviceClassification: platformId === "programmatic" ? "CTV + Desktop + Mobile" : "Mobile + Desktop",
      companionGuidance:
        platformId === "programmatic" ? PROGRAMMATIC_VIDEO_SPECS.companionBannerNote : undefined,
    },
  };
}
