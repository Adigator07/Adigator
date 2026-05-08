/**
 * useAnalysisStore — Phase 1 Persistence Hook (Stub)
 *
 * Prepares the groundwork for saving analysis results to a store
 * (localStorage now, Supabase in Phase 2).
 *
 * Shape of a persisted record:
 * {
 *   id: string           (creative ID)
 *   name: string
 *   size: string
 *   goal: string
 *   platform: string
 *   overall_score: number
 *   grade: string
 *   campaign_goal: string
 *   vertical: string
 *   cta_state: string
 *   subscores: object
 *   optimizations: array
 *   analyzedAt: ISO date string
 * }
 */

import { useCallback } from "react";

const STORAGE_KEY = "adigator_analysis_results";

export interface PersistedAnalysisRecord {
  id: string;
  name: string;
  size: string;
  goal: string;
  platform: string;
  overall_score: number;
  grade: string;
  campaign_goal: string;
  vertical: string;
  cta_state: string;
  subscores: Record<string, number>;
  optimizations: Array<{ dimension: string; priority: string; recommendation: string }>;
  analyzedAt: string;
}

export function useAnalysisStore() {
  /**
   * Persist a single creative analysis result to localStorage.
   * Future: swap this out with a Supabase upsert.
   */
  const saveResult = useCallback((record: PersistedAnalysisRecord) => {
    try {
      const existing = getAll();
      const index = existing.findIndex((r) => r.id === record.id);
      if (index >= 0) {
        existing[index] = record;
      } else {
        existing.push(record);
      }
      // Keep only the latest 100 records
      const trimmed = existing.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn("[AnalysisStore] Failed to persist result:", e);
    }
  }, []);

  /**
   * Get all persisted records.
   */
  const getAll = useCallback((): PersistedAnalysisRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Clear all stored records.
   */
  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { saveResult, getAll, clearAll };
}

/**
 * Helper: Build a PersistedAnalysisRecord from the analysis pipeline output.
 */
export function buildAnalysisRecord(
  creative: { id: string; name: string; size: string },
  goal: string,
  platform: string,
  data: Record<string, unknown>
): PersistedAnalysisRecord {
  const aiData = data.aiData as Record<string, unknown> | undefined;
  const decisionEngine = data.decisionEngine as Record<string, unknown> | undefined;

  return {
    id: creative.id,
    name: creative.name,
    size: creative.size,
    goal,
    platform,
    overall_score: (data.overall_score as number) || (data.finalScore as number) || 0,
    grade: (decisionEngine?.grade as { grade: string })?.grade || "Unknown",
    campaign_goal: (aiData?.campaign_goal as string) || "Unknown",
    vertical: (aiData?.vertical as string) || "Other",
    cta_state: (aiData?.cta_state as string) || "Unknown",
    subscores: (aiData?.subscores as Record<string, number>) || {},
    optimizations: (decisionEngine?.optimizations as Array<{ dimension: string; priority: string; recommendation: string }>) || [],
    analyzedAt: new Date().toISOString(),
  };
}
