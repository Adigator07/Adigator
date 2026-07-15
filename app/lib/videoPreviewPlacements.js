/**
 * Video Ads Preview Studio placements — platform-specific video inventory only.
 */

const VIDEO_SIZES_16_9 = ["1920x1080", "1280x720", "1080x608", "640x360", "1200x675"];
const VIDEO_SIZES_9_16 = ["1080x1920", "720x1280", "1080x1350", "720x900"];
const VIDEO_SIZES_1_1 = ["1080x1080", "1200x1200", "600x600"];
const VIDEO_ALL = [...new Set([...VIDEO_SIZES_16_9, ...VIDEO_SIZES_9_16, ...VIDEO_SIZES_1_1])];

/** @typedef {{ id: string, label: string, environments: string[], compatibleSizes: string[], devices?: string[], description?: string }} VideoPreviewPlacement */

/** @type {Record<string, Record<string, VideoPreviewPlacement>>} */
export const VIDEO_PREVIEW_PLACEMENT_REGISTRY = {
  google_ads: {
    youtube: {
      id: "youtube",
      label: "YouTube",
      environments: ["youtube"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "YouTube in-stream and watch-page video ads.",
    },
    google_video_partners: {
      id: "google_video_partners",
      label: "Google Video Partners",
      environments: ["google_video_partners"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Google Video Partners and publisher in-stream inventory.",
    },
    discover: {
      id: "discover",
      label: "Discover",
      environments: ["google_discover"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Google Discover video and Demand Gen surfaces.",
    },
    gmail: {
      id: "gmail",
      label: "Gmail",
      environments: ["gmail"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Gmail promotional video placements.",
    },
  },
  meta_ads: {
    facebook_feed: {
      id: "facebook_feed",
      label: "Facebook Feed",
      environments: ["facebook_feed", "facebook_feed_desktop"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Facebook Feed video ads.",
    },
    instagram_feed: {
      id: "instagram_feed",
      label: "Instagram Feed",
      environments: ["instagram_feed"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile"],
      description: "Instagram Feed video ads.",
    },
    facebook_stories: {
      id: "facebook_stories",
      label: "Facebook Stories",
      environments: ["facebook_story"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile"],
      description: "Facebook Stories full-screen video.",
    },
    instagram_stories: {
      id: "instagram_stories",
      label: "Instagram Stories",
      environments: ["instagram_story"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile"],
      description: "Instagram Stories full-screen video.",
    },
    facebook_reels: {
      id: "facebook_reels",
      label: "Facebook Reels",
      environments: ["instagram_reels"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile"],
      description: "Facebook Reels vertical video.",
    },
    instagram_reels: {
      id: "instagram_reels",
      label: "Instagram Reels",
      environments: ["instagram_reels"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile"],
      description: "Instagram Reels vertical video.",
    },
    in_stream_video: {
      id: "in_stream_video",
      label: "In-Stream Video",
      environments: ["meta_in_stream"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Meta in-stream / rewarded video placements.",
    },
    audience_network: {
      id: "audience_network",
      label: "Audience Network",
      environments: ["audience_network"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Meta Audience Network video across apps and sites.",
    },
  },
  programmatic: {
    publisher_websites: {
      id: "publisher_websites",
      label: "Publisher Websites",
      environments: ["prog_publisher_video"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Publisher website in-article and player video units.",
    },
    mobile_apps: {
      id: "mobile_apps",
      label: "Mobile Apps",
      environments: ["prog_mobile_app_video"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile"],
      description: "In-app interstitial and rewarded video inventory.",
    },
    in_stream: {
      id: "in_stream",
      label: "In-Stream Video",
      environments: ["prog_in_stream"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Pre-roll / mid-roll in-stream video ads.",
    },
    out_stream: {
      id: "out_stream",
      label: "Out-Stream Video",
      environments: ["prog_out_stream"],
      compatibleSizes: VIDEO_ALL,
      devices: ["mobile", "desktop"],
      description: "Out-stream / in-read publisher video units.",
    },
    ctv: {
      id: "ctv",
      label: "Connected TV (CTV)",
      environments: ["prog_ctv"],
      compatibleSizes: VIDEO_SIZES_16_9,
      devices: ["desktop"],
      description: "Connected TV and living-room video placements.",
    },
    ott: {
      id: "ott",
      label: "OTT Platforms",
      environments: ["prog_ott"],
      compatibleSizes: VIDEO_SIZES_16_9,
      devices: ["desktop"],
      description: "OTT streaming platform video ads.",
    },
    dooh: {
      id: "dooh",
      label: "Digital Out-of-Home",
      environments: ["prog_dooh"],
      compatibleSizes: VIDEO_ALL,
      devices: ["desktop"],
      description: "DOOH / digital screen video placements.",
    },
  },
};

export function getVideoPreviewPlacementTabs(platform) {
  const registry = VIDEO_PREVIEW_PLACEMENT_REGISTRY[platform];
  if (!registry) return [];
  return Object.values(registry).map(({ id, label, description }) => ({
    id,
    label,
    title: description,
  }));
}

export function getVideoPreviewPlacement(platform, placementId) {
  return VIDEO_PREVIEW_PLACEMENT_REGISTRY[platform]?.[placementId] || null;
}

export function getDefaultVideoPreviewPlacement(platform) {
  const tabs = getVideoPreviewPlacementTabs(platform);
  return tabs[0]?.id || null;
}

export function isVideoPreviewPlatform(platform) {
  return Boolean(VIDEO_PREVIEW_PLACEMENT_REGISTRY[platform]);
}
