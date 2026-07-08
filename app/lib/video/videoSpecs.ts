/**
 * Platform-specific video ad specifications.
 *
 * These are the OFFICIAL Meta and Google video ad requirements used by the dedicated
 * Video Ads validation pipeline. They are intentionally separate from the image/display
 * (Responsive Display) size registries — video creatives must NEVER be validated against
 * banner/RDA rules.
 *
 * Aspect ratios are expressed as `{ label, ratio }` (width/height) with a tolerance so we
 * can validate real-world encodes that are a few pixels off an exact ratio.
 */

export interface AspectRatioSpec {
  label: string;
  ratio: number;
}

export const ASPECT_RATIO_TOLERANCE = 0.06;

/** Video file-size guidance — separate from image 150 KB rules. */
export const VIDEO_LAUNCH_READY_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_NEEDS_REVIEW_MAX_BYTES = 500 * 1024 * 1024;

export function getVideoFileSizeTier(
  fileSizeBytes: number,
  platformMaxBytes: number,
): "ready" | "review" | "critical" {
  const size = Number(fileSizeBytes || 0);
  if (size > platformMaxBytes) return "critical";
  if (size > VIDEO_LAUNCH_READY_MAX_BYTES) return "review";
  return "ready";
}

export function formatVideoFileSize(bytes: number): string {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

export const META_VIDEO_SPECS = {
  platform: "meta_ads",
  label: "Meta Ads",
  allowedMimeTypes: ["video/mp4", "video/quicktime"],
  allowedExtensions: [".mp4", ".mov"],
  // Container/codec guidance (best-effort — browsers cannot always probe the codec).
  recommendedVideoCodecs: ["h264", "avc", "h.264"],
  recommendedAudioCodecs: ["aac"],
  maxFileSizeBytes: 4 * 1024 * 1024 * 1024,
  maxDurationSeconds: 240 * 60,
  minDurationSeconds: 1,
  reelsMaxDurationSeconds: 60,
  // Minimum resolution Meta will accept without heavy quality loss.
  minWidth: 500,
  minHeight: 500,
  recommendedMinShortSidePx: 1080,
  // Frame rate window Meta recommends (fps).
  minFrameRate: 23,
  maxFrameRate: 60,
  supportedAspectRatios: [
    { label: "1:1", ratio: 1 },
    { label: "4:5", ratio: 0.8 },
    { label: "9:16", ratio: 0.5625 },
    { label: "16:9", ratio: 1.7778 },
  ] as AspectRatioSpec[],
  recommendedAspectRatios: {
    feed: ["1:1", "4:5"],
    stories: ["9:16"],
    reels: ["9:16"],
  },
  safeZone: {
    storiesReels: {
      width: 1080,
      height: 1920,
      topPx: 250,
      bottomPx: 300,
    },
  },
} as const;

export const GOOGLE_VIDEO_SPECS = {
  platform: "google_ads",
  label: "Google Ads",
  allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
  allowedExtensions: [".mp4", ".webm", ".mov"],
  recommendedVideoCodecs: ["h264", "avc", "h.264", "vp9"],
  recommendedAudioCodecs: ["aac", "opus", "vorbis"],
  maxFileSizeBytes: 256 * 1024 * 1024 * 1024,
  minDurationSeconds: 1,
  skippableRecommendedMaxSeconds: 180,
  nonSkippableMaxSeconds: 60,
  // YouTube recommends 1080p; accept down to 480p short side.
  minWidth: 640,
  minHeight: 360,
  recommendedMinShortSidePx: 720,
  minFrameRate: 23,
  maxFrameRate: 60,
  supportedAspectRatios: [
    { label: "16:9", ratio: 1.7778 },
    { label: "9:16", ratio: 0.5625 },
    { label: "1:1", ratio: 1 },
    { label: "4:5", ratio: 0.8 },
  ] as AspectRatioSpec[],
  recommendedAspectRatios: ["16:9", "9:16", "1:1"],
} as const;

export type PlatformVideoSpec = typeof META_VIDEO_SPECS | typeof GOOGLE_VIDEO_SPECS;

export const VIDEO_FRAME_DEFAULTS = {
  intervalSeconds: 2.5,
  maxFrames: 15,
  maxFrameWidth: 1280,
  maxFrameHeight: 720,
} as const;

export const VIDEO_ANALYSIS_SCORE_KEYS = [
  "campaign_goal_alignment",
  "vertical_alignment",
  "brief_alignment",
  "brand_visibility",
  "cta_analysis",
  "text_readability",
  "visual_quality",
  "audio_quality",
  "hook_strength",
  "message_clarity",
  "product_visibility",
  "scene_flow",
  "engagement_potential",
  "platform_compliance",
  "accessibility",
  "pacing",
  "risk_detection",
  "final_launch_readiness_score",
] as const;
