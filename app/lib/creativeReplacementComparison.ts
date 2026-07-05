import { getEntryPayload } from "@/app/lib/strategicPresentation";

export type ReplacementChangeCategory =
  | "messaging"
  | "cta"
  | "dimensions"
  | "file_type"
  | "visual_elements"
  | "branding"
  | "landing_page"
  | "objective"
  | "platform_compatibility";

export type ReplacementChange = {
  category: ReplacementChangeCategory;
  label: string;
  before: string;
  after: string;
  severity: "info" | "warning" | "critical";
};

export type ReplacementComparisonPair = {
  id: string;
  baselineName: string;
  replacementName: string;
  changes: ReplacementChange[];
  resolvedIssues: string[];
  newIssues: string[];
  readinessImpact: string;
};

export type ReplacementComparisonReport = {
  pairs: ReplacementComparisonPair[];
  unpairedBaselines: string[];
  unpairedReplacements: string[];
  summary: {
    totalChanges: number;
    newIssueCount: number;
    resolvedIssueCount: number;
    alignmentStatus: string;
    launchReadinessImpact: string;
  };
};

type CreativeLike = {
  id?: string;
  name?: string;
  size?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  fileSizeKB?: number;
  adGroupName?: string | null;
  validation?: {
    status?: string;
    issues?: Array<{ message?: string; type?: string; severity?: string }>;
  };
};

type AnalysisEntry = {
  creative?: { id?: string; name?: string };
  data?: Record<string, unknown>;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\.[^.]+$/, "").replace(/[-_\s]+/g, "");
}

function pairCreatives(baselines: CreativeLike[], replacements: CreativeLike[]) {
  const pairs: Array<{ baseline: CreativeLike | null; replacement: CreativeLike | null }> = [];
  const usedReplacementIds = new Set<string>();

  baselines.forEach((baseline, index) => {
    const baselineKey = normalizeName(baseline.name || "");
    let match = replacements.find((replacement) => {
      if (!replacement.id || usedReplacementIds.has(replacement.id)) return false;
      if (baseline.adGroupName && replacement.adGroupName) {
        return baseline.adGroupName === replacement.adGroupName && normalizeName(replacement.name || "") === baselineKey;
      }
      return normalizeName(replacement.name || "") === baselineKey;
    });

    if (!match && replacements[index] && !usedReplacementIds.has(replacements[index].id || "")) {
      match = replacements[index];
    }

    if (match?.id) usedReplacementIds.add(match.id);
    pairs.push({ baseline, replacement: match || null });
  });

  replacements.forEach((replacement) => {
    if (replacement.id && usedReplacementIds.has(replacement.id)) return;
    pairs.push({ baseline: null, replacement });
  });

  return pairs;
}

function issueMessages(creative?: CreativeLike | null): string[] {
  const issues = creative?.validation?.issues || [];
  return issues.map((issue) => issue.message || issue.type || "Validation issue").filter(Boolean);
}

function analysisForCreative(analysis: AnalysisEntry[] | null | undefined, creative?: CreativeLike | null) {
  if (!creative?.id || !Array.isArray(analysis)) return null;
  const entry = analysis.find((item) => item?.creative?.id === creative.id);
  return entry ? getEntryPayload(entry) : null;
}

function scoreNumber(payload: Record<string, unknown> | null | undefined): number | null {
  const score = payload?.strategic_alignment_score;
  return typeof score === "number" ? score : null;
}

function scoreLabel(payload: Record<string, unknown> | null | undefined): string {
  const score = scoreNumber(payload);
  return score !== null ? `${score}/100` : "Not scored";
}

function alignmentLabel(payload: Record<string, unknown> | null | undefined, key: string): string {
  const block = payload?.[key] as { is_aligned?: boolean; reason?: string } | undefined;
  if (!block) return "Not evaluated";
  if (block.is_aligned === true) return "Aligned";
  if (block.is_aligned === false) return block.reason || "Misaligned";
  return "Unknown";
}

function visualSummary(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return "Not evaluated";
  const signals = (payload.signals || payload.extraction_signals || {}) as Record<string, unknown>;
  const parts = [
    String(signals.topic_summary || "").trim(),
    String(signals.primary_message || "").trim(),
    String(signals.brand_presence || "").trim(),
    String(signals.product_category || "").trim(),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Not evaluated";
}

function platformSummary(payload: Record<string, unknown> | null | undefined): string {
  if (!payload) return "Not evaluated";
  const compatibility =
    (payload.platform_compatibility as { summary?: string } | undefined)?.summary
    || (payload.platform_alignment as { summary?: string } | undefined)?.summary;
  return String(compatibility || "").trim() || "Not evaluated";
}

function buildPairChanges(
  baseline: CreativeLike | null,
  replacement: CreativeLike | null,
  baselinePayload: Record<string, unknown> | null,
  replacementPayload: Record<string, unknown> | null,
): ReplacementChange[] {
  const changes: ReplacementChange[] = [];

  if (baseline && replacement) {
    if (baseline.size !== replacement.size) {
      changes.push({
        category: "dimensions",
        label: "Creative dimensions",
        before: baseline.size || "Unknown",
        after: replacement.size || "Unknown",
        severity: "warning",
      });
    }

    if ((baseline.mimeType || "") !== (replacement.mimeType || "")) {
      changes.push({
        category: "file_type",
        label: "File type",
        before: baseline.mimeType || "Unknown",
        after: replacement.mimeType || "Unknown",
        severity: "info",
      });
    }

    const baselineKb = baseline.fileSizeKB ?? (baseline.fileSizeBytes ? Math.round(baseline.fileSizeBytes / 1024) : null);
    const replacementKb = replacement.fileSizeKB ?? (replacement.fileSizeBytes ? Math.round(replacement.fileSizeBytes / 1024) : null);
    if (baselineKb && replacementKb && Math.abs(baselineKb - replacementKb) > 10) {
      changes.push({
        category: "platform_compatibility",
        label: "File weight",
        before: `${baselineKb} KB`,
        after: `${replacementKb} KB`,
        severity: replacementKb > baselineKb ? "warning" : "info",
      });
    }
  }

  if (baselinePayload || replacementPayload) {
    const beforeScore = scoreLabel(baselinePayload);
    const afterScore = scoreLabel(replacementPayload);
    if (beforeScore !== afterScore) {
      changes.push({
        category: "objective",
        label: "Strategic alignment score",
        before: beforeScore,
        after: afterScore,
        severity: (scoreNumber(replacementPayload) ?? 0) < (scoreNumber(baselinePayload) ?? 0) ? "critical" : "info",
      });
    }

    const alignmentKeys = [
      ["goal_alignment", "Campaign objective alignment"],
      ["vertical_alignment", "Vertical alignment"],
      ["brief_alignment", "Campaign brief alignment"],
      ["url_alignment", "Landing page alignment"],
    ] as const;

    alignmentKeys.forEach(([key, label]) => {
      const before = alignmentLabel(baselinePayload, key);
      const after = alignmentLabel(replacementPayload, key);
      if (before !== after) {
        changes.push({
          category: key === "brief_alignment" ? "messaging" : "objective",
          label,
          before,
          after,
          severity: after.includes("Misaligned") || after.includes("misaligned") ? "critical" : "warning",
        });
      }
    });

    const beforeProblem = String(baselinePayload?.main_strategic_problem || "").trim();
    const afterProblem = String(replacementPayload?.main_strategic_problem || "").trim();
    if (beforeProblem && afterProblem && beforeProblem !== afterProblem) {
      changes.push({
        category: "messaging",
        label: "Primary strategic issue",
        before: beforeProblem,
        after: afterProblem,
        severity: "warning",
      });
    }

    const beforeCta = String((baselinePayload?.adigator_analysis as { cta_assessment?: string })?.cta_assessment || "").trim();
    const afterCta = String((replacementPayload?.adigator_analysis as { cta_assessment?: string })?.cta_assessment || "").trim();
    if (beforeCta && afterCta && beforeCta !== afterCta) {
      changes.push({
        category: "cta",
        label: "CTA assessment",
        before: beforeCta,
        after: afterCta,
        severity: "warning",
      });
    }

    const beforeVisual = visualSummary(baselinePayload);
    const afterVisual = visualSummary(replacementPayload);
    if (beforeVisual !== afterVisual && (beforeVisual !== "Not evaluated" || afterVisual !== "Not evaluated")) {
      changes.push({
        category: "visual_elements",
        label: "Visual elements",
        before: beforeVisual,
        after: afterVisual,
        severity: "info",
      });
    }

    const beforePlatform = platformSummary(baselinePayload);
    const afterPlatform = platformSummary(replacementPayload);
    if (beforePlatform !== afterPlatform && (beforePlatform !== "Not evaluated" || afterPlatform !== "Not evaluated")) {
      changes.push({
        category: "platform_compatibility",
        label: "Platform compatibility",
        before: beforePlatform,
        after: afterPlatform,
        severity: afterPlatform.toLowerCase().includes("limited") ? "warning" : "info",
      });
    }
  }

  const baselineStatus = baseline?.validation?.status || "Unknown";
  const replacementStatus = replacement?.validation?.status || "Unknown";
  if (baselineStatus !== replacementStatus) {
    changes.push({
      category: "platform_compatibility",
      label: "Validation status",
      before: baselineStatus,
      after: replacementStatus,
      severity: replacementStatus === "CRITICAL" ? "critical" : "warning",
    });
  }

  return changes;
}

export function buildReplacementComparisonReport({
  baselineCreatives,
  replacementCreatives,
  baselineAnalysis,
  replacementAnalysis,
}: {
  baselineCreatives: CreativeLike[];
  replacementCreatives: CreativeLike[];
  baselineAnalysis: AnalysisEntry[] | null | undefined;
  replacementAnalysis: AnalysisEntry[] | null | undefined;
}): ReplacementComparisonReport {
  const rawPairs = pairCreatives(baselineCreatives, replacementCreatives);
  const pairs: ReplacementComparisonPair[] = rawPairs.map((pair, index) => {
    const baselineIssues = issueMessages(pair.baseline);
    const replacementIssues = issueMessages(pair.replacement);
    const resolvedIssues = baselineIssues.filter((issue) => !replacementIssues.includes(issue));
    const newIssues = replacementIssues.filter((issue) => !baselineIssues.includes(issue));
    const baselinePayload = analysisForCreative(baselineAnalysis, pair.baseline);
    const replacementPayload = analysisForCreative(replacementAnalysis, pair.replacement);
    const changes = buildPairChanges(pair.baseline, pair.replacement, baselinePayload, replacementPayload);

    let readinessImpact = "Replacement maintains comparable validation posture.";
    if (newIssues.length > resolvedIssues.length) {
      readinessImpact = "Replacement introduces more validation concerns than it resolves.";
    } else if (resolvedIssues.length > newIssues.length) {
      readinessImpact = "Replacement improves validation readiness versus the previous creative.";
    } else if (changes.some((change) => change.severity === "critical")) {
      readinessImpact = "Replacement includes critical changes that may affect launch readiness.";
    }

    return {
      id: pair.baseline?.id || pair.replacement?.id || `pair-${index}`,
      baselineName: pair.baseline?.name || "No baseline match",
      replacementName: pair.replacement?.name || "No replacement uploaded",
      changes,
      resolvedIssues,
      newIssues,
      readinessImpact,
    };
  });

  const unpairedBaselines = pairs
    .filter((pair) => pair.replacementName === "No replacement uploaded")
    .map((pair) => pair.baselineName);
  const unpairedReplacements = pairs
    .filter((pair) => pair.baselineName === "No baseline match")
    .map((pair) => pair.replacementName);

  const newIssueCount = pairs.reduce((total, pair) => total + pair.newIssues.length, 0);
  const resolvedIssueCount = pairs.reduce((total, pair) => total + pair.resolvedIssues.length, 0);
  const totalChanges = pairs.reduce((total, pair) => total + pair.changes.length, 0);

  let alignmentStatus = "Replacement creatives remain aligned with the loaded campaign context.";
  if (pairs.some((pair) => pair.changes.some((change) => change.category === "objective" && change.severity === "critical"))) {
    alignmentStatus = "Replacement creatives show objective or brief misalignment versus the previous set.";
  }

  let launchReadinessImpact = "Launch readiness should be reviewed against the highlighted replacement deltas.";
  if (resolvedIssueCount > newIssueCount) {
    launchReadinessImpact = "Replacement creatives are likely to improve launch readiness if validation issues are resolved.";
  } else if (newIssueCount > resolvedIssueCount) {
    launchReadinessImpact = "Replacement creatives may reduce launch readiness until new issues are addressed.";
  }

  return {
    pairs,
    unpairedBaselines,
    unpairedReplacements,
    summary: {
      totalChanges,
      newIssueCount,
      resolvedIssueCount,
      alignmentStatus,
      launchReadinessImpact,
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  messaging: "Messaging",
  cta: "CTA",
  dimensions: "Dimensions",
  file_type: "File type",
  visual_elements: "Visual elements",
  branding: "Branding",
  landing_page: "Landing page",
  objective: "Objective alignment",
  platform_compatibility: "Platform compatibility",
};

export type ReplacementComparisonKeyPoints = {
  headline: string;
  bullets: string[];
  categoryHighlights: Array<{ label: string; count: number }>;
  attentionPairs: Array<{ label: string; newIssues: number; changes: number }>;
  criticalCount: number;
  warningCount: number;
  pairedCount: number;
};

/** Condensed summary for Overview — avoids listing every pair when many creatives are swapped. */
export function buildReplacementComparisonKeyPoints(
  report: ReplacementComparisonReport,
): ReplacementComparisonKeyPoints {
  const categoryMap = new Map<string, number>();
  let criticalCount = 0;
  let warningCount = 0;

  for (const pair of report.pairs) {
    for (const change of pair.changes) {
      categoryMap.set(change.category, (categoryMap.get(change.category) || 0) + 1);
      if (change.severity === "critical") criticalCount += 1;
      if (change.severity === "warning") warningCount += 1;
    }
  }

  const categoryHighlights = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count]) => ({
      label: CATEGORY_LABELS[category] || category,
      count,
    }));

  const attentionPairs = report.pairs
    .filter((pair) => pair.newIssues.length > 0 || pair.changes.some((c) => c.severity !== "info"))
    .sort((a, b) => (b.newIssues.length + b.changes.length) - (a.newIssues.length + a.changes.length))
    .slice(0, 5)
    .map((pair) => ({
      label: `${pair.baselineName} → ${pair.replacementName}`,
      newIssues: pair.newIssues.length,
      changes: pair.changes.length,
    }));

  const pairedCount = report.pairs.filter(
    (p) => p.baselineName !== "No baseline match" && p.replacementName !== "No replacement uploaded",
  ).length;

  const bullets: string[] = [
    report.summary.alignmentStatus,
    report.summary.launchReadinessImpact,
    `${pairedCount} creative pair${pairedCount === 1 ? "" : "s"} compared · ${report.summary.totalChanges} total change${report.summary.totalChanges === 1 ? "" : "s"}.`,
    `${report.summary.resolvedIssueCount} issue${report.summary.resolvedIssueCount === 1 ? "" : "s"} resolved · ${report.summary.newIssueCount} new issue${report.summary.newIssueCount === 1 ? "" : "s"} introduced.`,
  ];

  if (report.unpairedBaselines.length) {
    bullets.push(
      `${report.unpairedBaselines.length} baseline creative${report.unpairedBaselines.length === 1 ? "" : "s"} removed without a replacement.`,
    );
  }
  if (report.unpairedReplacements.length) {
    bullets.push(
      `${report.unpairedReplacements.length} new replacement${report.unpairedReplacements.length === 1 ? "" : "s"} added without a baseline match.`,
    );
  }

  let headline = "Replacement review complete";
  if (criticalCount > 0) headline = "Critical replacement differences detected";
  else if (report.summary.newIssueCount > report.summary.resolvedIssueCount) headline = "Replacement introduces new validation concerns";
  else if (report.summary.resolvedIssueCount > report.summary.newIssueCount) headline = "Replacement improves on baseline validation";

  return {
    headline,
    bullets,
    categoryHighlights,
    attentionPairs,
    criticalCount,
    warningCount,
    pairedCount,
  };
}
