"use client";

import { useCallback, useState } from "react";
import type { CampaignReadinessReport } from "@/app/types/validation";

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
    }) => {
      setLoading(true);
      setError("");
      setReport(null);
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

        setReport(data as CampaignReadinessReport);
        return data as CampaignReadinessReport;
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

  const reset = useCallback(() => {
    setReport(null);
    setError("");
    setProgressStep(0);
  }, []);

  return {
    report,
    loading,
    error,
    progressStep,
    progressLabel: MODULE_STEPS[progressStep] || MODULE_STEPS[0],
    runValidation,
    reset,
  };
}
