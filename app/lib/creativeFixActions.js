/**
 * Maps validation issue types to one-click fix actions shown in the Preview Tool.
 */

export const FIX_ACTION_IDS = {
  CONVERT_TO_JPEG: "convert_to_jpeg",
  CONVERT_TO_PNG: "convert_to_png",
  COMPRESS_150KB: "compress_150kb",
  COMPRESS_TARGET: "compress_target",
};

const GOOGLE_SUPPORTED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/zip",
]);

const META_SUPPORTED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
]);

export function enrichIssuesWithFixActions(issues, platform) {
  if (!Array.isArray(issues)) return [];

  return issues.map((issue) => {
    if (issue.fixAction) return issue;

    const type = String(issue.type || "").toLowerCase();

    if (type === "format") {
      const actions =
        platform === "meta_ads"
          ? [
              {
                id: FIX_ACTION_IDS.CONVERT_TO_JPEG,
                label: "Convert to JPG",
                description: "One-click conversion to Meta-compatible JPEG",
              },
              {
                id: FIX_ACTION_IDS.CONVERT_TO_PNG,
                label: "Convert to PNG",
                description: "Preserve transparency with PNG export",
              },
            ]
          : [
              {
                id: FIX_ACTION_IDS.CONVERT_TO_JPEG,
                label: "Convert to JPG",
                description: "One-click conversion to Google-compatible JPEG",
              },
              {
                id: FIX_ACTION_IDS.CONVERT_TO_PNG,
                label: "Convert to PNG",
                description: "One-click conversion to Google-compatible PNG",
              },
            ];
      return {
        ...issue,
        fixAction: actions[0],
        fixActions: actions,
      };
    }

    if (type === "weight" || type === "google_weight") {
      return {
        ...issue,
        fixAction: {
          id: FIX_ACTION_IDS.COMPRESS_150KB,
          label: "Compress to 150KB",
          description: "Auto-compress to meet display banner weight guidance",
          params: { targetKB: 150, enforceSizeCompliance: true },
        },
      };
    }

    if (type === "meta_weight") {
      return {
        ...issue,
        fixAction: {
          id: FIX_ACTION_IDS.COMPRESS_TARGET,
          label: "Compress below 30MB",
          description: "Reduce file size to Meta upload limits",
          params: { targetKB: 28000 },
        },
      };
    }

    if (type === "mobile_delivery" || type === "delivery") {
      return {
        ...issue,
        fixAction: {
          id: FIX_ACTION_IDS.COMPRESS_TARGET,
          label: "Compress for mobile",
          description: "Optimize payload for faster mobile delivery",
          params: { targetKB: 5000 },
        },
      };
    }

    return issue;
  });
}

export function isMimeSupportedForPlatform(mimeType, platform) {
  const mime = String(mimeType || "").toLowerCase();
  if (platform === "google_ads") return GOOGLE_SUPPORTED_MIMES.has(mime);
  if (platform === "meta_ads") return META_SUPPORTED_MIMES.has(mime);
  return mime.startsWith("image/") || mime === "application/zip";
}

export function getPrimaryFixAction(issue) {
  if (issue?.fixAction) return issue.fixAction;
  if (Array.isArray(issue?.fixActions) && issue.fixActions.length) return issue.fixActions[0];
  return null;
}
