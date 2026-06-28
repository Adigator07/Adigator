/**
 * Platform-specific Technical QA and Placement QA builders.
 * Uses validation issues, placement scores, and analyzer payload — not generic templates.
 */

import {
  computePlacementCompatibility,
  computeDeviceCompatibility,
  getPlacementColumns,
} from "./placementCompatibility";
import { getCompatibleSizesForPlacement } from "./previewPlacementRegistry";

const STATUS_FROM_SCORE = {
  good: "pass",
  warning: "warn",
  bad: "fail",
};

function formatSize(size) {
  return String(size || "unknown").replace(/x/g, "×");
}

export function validationIssuesToQa(creative, platform, limit = 4) {
  const issues = Array.isArray(creative?.validation?.issues) ? creative.validation.issues : [];
  const items = [];

  for (const issue of issues) {
    if (!issue?.message) continue;
    const severity = issue.severity === "high" ? "fail" : issue.severity === "medium" ? "warn" : "pass";
    if (severity === "pass") continue;
    items.push({
      status: severity,
      text: issue.message,
      source: "validation",
      type: issue.type,
    });
    if (items.length >= limit) break;
  }

  if (platform === "programmatic" && items.length < limit) {
    const intel = creative?.validation?.intelligence;
    if (intel?.dspCompatibility?.count != null && intel.dspCompatibility.count < 5) {
      items.push({
        status: "warn",
        text: `DSP coverage: ${intel.dspCompatibility.count}/7 buyers — may limit programmatic scale.`,
        source: "dsp",
      });
    }
    if (intel?.auctionReadiness?.band && !/excellent|strong/i.test(intel.auctionReadiness.band)) {
      items.push({
        status: "warn",
        text: `Auction readiness: ${intel.auctionReadiness.band} for ${formatSize(creative?.size)}.`,
        source: "auction",
      });
    }
  }

  return items.slice(0, limit);
}

function scoreMessage(platform, columnId, label, score, size, textHigh) {
  const sizeLabel = formatSize(size);
  const shortLabel = String(label || "").replace(/\s+/g, " ").trim();
  if (score === "good") {
    return `${shortLabel}: ${sizeLabel} supported`;
  }
  if (score === "warning") {
    const hint = textHigh && /feed|story|reel|mobile|banner|leaderboard/i.test(shortLabel)
      ? " Heavy copy may hurt delivery."
      : "";
    return `${shortLabel}: ${sizeLabel} may need crop or resize.${hint}`;
  }
  const compatible = getCompatibleSizesForPlacement(platform, mapColumnToRegistryId(platform, columnId));
  const suggestion = compatible?.slice(0, 2).join(", ") || "a core platform size";
  return `${shortLabel}: ${sizeLabel} not recommended. Use ${suggestion}.`;
}

function mapColumnToRegistryId(platform, columnId) {
  const map = {
    google_ads: {
      gdn: "gdn",
      responsive_display: "responsive_display",
      demand_gen: "demand_gen",
      gmail: "gmail",
      app_inventory: "app_inventory",
      youtube_companion: "youtube_companion",
    },
    meta_ads: {
      facebook_feed: "facebook_feed",
      instagram_feed: "instagram_feed",
      stories: "facebook_stories",
      reels: "facebook_reels",
      messenger: "messenger",
      audience_network: "audience_network",
    },
    programmatic: {
      native_ads: "native_ads",
      display_banners: "display_banners",
      mobile_app: "mobile_app_inventory",
      open_web: "open_web",
    },
  };
  return map[platform]?.[columnId] || columnId;
}

export function buildPlacementQaFromScores(creative, platform, payload, options = {}) {
  const { maxItems = 6, includePasses = 1 } = options;
  const scores = computePlacementCompatibility(creative, platform, payload);
  const columns = getPlacementColumns(platform);
  const size = creative?.size || "";
  const signals = payload?.extraction_signals || payload?.ai_analysis?.extraction_signals || {};
  const textHigh = signals?.text_density === "high";

  const ranked = columns
    .map((col) => ({
      col,
      score: scores[col.id] || "bad",
      status: STATUS_FROM_SCORE[scores[col.id]] || "fail",
    }))
    .sort((a, b) => {
      const order = { bad: 0, warning: 1, good: 2 };
      return (order[a.score] ?? 3) - (order[b.score] ?? 3);
    });

  const items = [];
  for (const entry of ranked) {
    if (entry.score === "good" && items.filter((i) => i.status === "pass").length >= includePasses) continue;
    if (entry.score === "good" && items.some((i) => i.status !== "pass")) continue;
    items.push({
      status: entry.status,
      text: scoreMessage(platform, entry.col.id, entry.col.label, entry.score, size, textHigh),
      placementId: entry.col.id,
    });
    if (items.length >= maxItems) break;
  }

  const evalKey = platform === "google_ads"
    ? "google_ads_dynamic_eval"
    : platform === "meta_ads"
      ? "meta_ads_dynamic_eval"
      : "programmatic_ads_dynamic_eval";
  const evalBlock = payload?.ai_analysis?.[evalKey];

  if (Array.isArray(evalBlock?.missing_signals) && evalBlock.missing_signals[0]) {
    items.push({ status: "warn", text: evalBlock.missing_signals[0] });
  } else if (Array.isArray(evalBlock?.avoided_elements_found) && evalBlock.avoided_elements_found[0]) {
    items.push({ status: "warn", text: evalBlock.avoided_elements_found[0] });
  } else if (Array.isArray(evalBlock?.detected_signals) && evalBlock.detected_signals[0] && items.every((i) => i.status !== "fail")) {
    items.push({ status: "pass", text: evalBlock.detected_signals[0] });
  }

  if (platform === "google_ads") {
    const deviceScores = computeDeviceCompatibility(creative, "google_ads") || {};
    if (deviceScores.mobile === "bad") {
      items.push({ status: "fail", text: `Mobile: ${formatSize(size)} is not sized for phone display — consider 320×50 or 300×250.` });
    } else if (deviceScores.desktop === "bad") {
      items.push({ status: "warn", text: `Desktop: ${formatSize(size)} may underperform on wide publisher layouts — 728×90 or 970×250 preferred.` });
    }
  }

  return items.slice(0, maxItems);
}

export function buildTechnicalQaForPlatform(creative, payload, platform) {
  const size = creative?.size || "";
  const fileKb = creative?.fileSizeKB;
  const items = [...validationIssuesToQa(creative, platform, 3)];

  if (platform === "google_ads") {
    if (fileKb && fileKb <= 150) {
      items.push({ status: "pass", text: `Google Display: ${fileKb}KB meets the 150KB load-speed guidance.` });
    } else if (fileKb) {
      items.push({ status: "warn", text: `Google Display: ${fileKb}KB exceeds 150KB — may affect viewability on GDN.` });
    }
    const dims = size.split("x").map(Number);
    if (dims[0] >= 600 && dims[1] >= 314) {
      items.push({ status: "pass", text: `RDA: ${formatSize(size)} meets Responsive Display minimum landscape guidance.` });
    } else if (dims[0] >= 300 && dims[1] >= 300) {
      items.push({ status: "warn", text: `RDA: ${formatSize(size)} works as square but landscape 600×314+ expands YouTube/Display reach.` });
    }
  } else if (platform === "meta_ads") {
    const metaLimit = 5120;
    if (fileKb && fileKb <= 150) {
      items.push({ status: "pass", text: `Meta: ${fileKb}KB is lean for Feed delivery.` });
    } else if (fileKb && fileKb <= metaLimit) {
      items.push({ status: "warn", text: `Meta: ${fileKb}KB is within the 5MB cap but may slow Feed load.` });
    } else if (fileKb) {
      items.push({ status: "fail", text: `Meta: ${fileKb}KB exceeds the 5MB upload limit.` });
    }
    if (/1080x1080|1080x1350|1080x1920|1200x628/.test(size)) {
      items.push({ status: "pass", text: `Meta Feed/Stories: ${formatSize(size)} matches core Meta static ratios.` });
    } else if (size) {
      items.push({ status: "warn", text: `Meta: ${formatSize(size)} is non-native — 1080×1080, 1080×1350, or 1080×1920 recommended.` });
    }
  } else if (platform === "programmatic") {
    const intel = creative?.validation?.intelligence;
    if (intel?.iabCompatibility?.compatible) {
      items.push({ status: "pass", text: `IAB: ${formatSize(size)} — ${intel.iabCompatibility.standard || "supported"} for open exchange.` });
    } else if (size) {
      items.push({ status: "warn", text: `Programmatic: ${formatSize(size)} is outside core RTB sizes — 300×250, 728×90, 336×280 preferred.` });
    }
    if (fileKb && fileKb <= 150) {
      items.push({ status: "pass", text: `RTB load: ${fileKb}KB supports viewability scoring on display inventory.` });
    } else if (fileKb) {
      items.push({ status: "warn", text: `RTB load: ${fileKb}KB above 150KB guidance — compress for publisher acceptance.` });
    }
  }

  const risks = payload?.adigator_analysis?.technical_risks;
  if (Array.isArray(risks)) {
    const risk = risks.find((r) => String(r).toLowerCase() !== "none");
    if (risk && items.length < 6) items.push({ status: "warn", text: String(risk) });
  }

  return dedupeQaItems(items, 6);
}

function dedupeQaItems(items, limit) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item.text || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function summarizePlacementMatrix(platform, insights, columns) {
  if (!insights?.length || !columns?.length) return "";
  const counts = { good: 0, warning: 0, bad: 0 };
  for (const insight of insights) {
    for (const col of columns) {
      const score = insight.placementScores?.[col.id];
      if (score && counts[score] !== undefined) counts[score] += 1;
    }
  }
  const total = counts.good + counts.warning + counts.bad;
  if (!total) return "";

  const platformName = platform === "google_ads" ? "Google Ads" : platform === "meta_ads" ? "Meta Ads" : "Programmatic";
  const blocked = columns.filter((col) =>
    insights.some((i) => i.placementScores?.[col.id] === "bad"),
  ).map((c) => c.label);

  let summary = `${platformName}: ${counts.good} strong fits, ${counts.warning} need adjustment, ${counts.bad} blocked across ${insights.length} creative(s).`;
  if (blocked.length) {
    summary += ` Review: ${blocked.slice(0, 2).join(", ")}${blocked.length > 2 ? "…" : ""}.`;
  }
  return summary;
}
