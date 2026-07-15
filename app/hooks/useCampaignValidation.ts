"use client";

import { useCallback, useEffect, useState } from "react";
import type { CampaignReadinessReport } from "@/app/types/validation";
import {
  clearStoredReadinessReport,
  readStoredReadinessReport,
  readinessMatchesSession,
  withReadinessSession,
  writeStoredReadinessReport,
} from "@/app/lib/campaignReadinessStore";

const MODULE_STEPS = [
  "Checking creative specs…",
  "Scanning for duplicates…",
  "Validating URL health…",
  "Checking UTM parameters…",
  "Analyzing landing page…",
  "Evaluating campaign alignment…",
  "Building readiness report…",
];

export function useCampaignValidation() {
  const [report, setReport] = useState<CampaignReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readStoredReadinessReport();
    if (stored) setReport(stored as CampaignReadinessReport);
  }, []);

  const runValidation = useCallback(
    async (payload: {
      platform: string;
      url?: string;
      objective: string;
      campaignName?: string;
      vertical?: string;
      creatives: Array<{
        id: string;
        name: string;
        size?: string;
        fileSize?: number;
        mimeType?: string;
        contentHash?: string;
        validation?: Record<string, unknown>;
      }>;
      headlines?: string[];
      descriptions?: string[];
      creativeFingerprint?: string;
    }) => {
      setLoading(true);
      setError("");
      setProgressStep(0);

      const stepTimer = window.setInterval(() => {
        setProgressStep((s) => Math.min(s + 1, MODULE_STEPS.length - 1));
      }, 450);

      try {
        const response = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Validation request failed.");
        }

        const enriched = withReadinessSession(data as CampaignReadinessReport, {
          url: payload.url || "",
          creativeFingerprint: payload.creativeFingerprint || "",
          platform: payload.platform,
          objective: payload.objective,
        });
        setReport(enriched as CampaignReadinessReport);
        writeStoredReadinessReport(enriched);
        return enriched as CampaignReadinessReport;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Validation failed.";
        setError(message);
        return null;
      } finally {
        window.clearInterval(stepTimer);
        setProgressStep(MODULE_STEPS.length - 1);
        setLoading(false);
      }
    },
    [],
  );

  const restoreIfMatching = useCallback((session: {
    url?: string;
    fingerprint?: string;
    platform?: string;
    objective?: string;
  }) => {
    const stored = readStoredReadinessReport();
    if (stored && readinessMatchesSession(stored, session)) {
      // Avoid setState when the in-memory report already matches — otherwise Step 2
      // re-renders forever (setReport → effect → restoreIfMatching → setReport).
      setReport((current) => {
        if (current && readinessMatchesSession(current, session)) return current;
        return stored as CampaignReadinessReport;
      });
      return stored as CampaignReadinessReport;
    }
    if (stored && !readinessMatchesSession(stored, session)) {
      clearStoredReadinessReport();
      setReport((current) => (current == null ? current : null));
    }
    return null;
  }, []);

  const reset = useCallback(() => {
    setReport(null);
    setError("");
    setProgressStep(0);
    clearStoredReadinessReport();
  }, []);

  return {
    report,
    loading,
    error,
    progressStep,
    progressLabel: MODULE_STEPS[progressStep] || MODULE_STEPS[0],
    runValidation,
    restoreIfMatching,
    reset,
    setReport,
  };
}
