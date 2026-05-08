import { CreativeAnalysisResult } from "./ai";

export interface CreativeGrade {
  grade: "Elite Creative" | "Strong Performer" | "Needs Optimization" | "High Risk Creative";
  color: "emerald" | "blue" | "yellow" | "red";
}

export interface OptimizationSuggestion {
  dimension: string;
  subscore: number;
  issue: string;
  recommendation: string;
  priority: "High" | "Medium" | "Low";
}

export interface DecisionEngineOutput {
  grade: CreativeGrade;
  optimizations: OptimizationSuggestion[];
}

export function evaluateCreative(aiData: Partial<CreativeAnalysisResult>): DecisionEngineOutput {
  // 1. Calculate Grade
  let grade: CreativeGrade;
  const score = aiData.conversionScore || 0;

  if (score >= 90) {
    grade = { grade: "Elite Creative", color: "emerald" };
  } else if (score >= 75) {
    grade = { grade: "Strong Performer", color: "blue" };
  } else if (score >= 60) {
    grade = { grade: "Needs Optimization", color: "yellow" };
  } else {
    grade = { grade: "High Risk Creative", color: "red" };
  }

  // 2. Generate Actionable Suggestions from the new schema
  const optimizations: OptimizationSuggestion[] = [];

  if (aiData.verticalFitScore !== undefined && aiData.verticalFitScore < 70) {
    optimizations.push({
      dimension: "Vertical Alignment",
      subscore: aiData.verticalFitScore,
      issue: `Messaging is misaligned with standard expectations for the ${aiData.vertical || 'selected'} vertical.`,
      recommendation: "Review the vertical intelligence rules and adapt the tone, trust signals, or emotional triggers.",
      priority: "High"
    });
  }

  const missingElements = aiData.missingElements || [];
  missingElements.forEach((el) => {
    optimizations.push({
      dimension: "Missing Element",
      subscore: 50,
      issue: `The creative is missing a key element: ${el}`,
      recommendation: `Add the missing element: ${el}`,
      priority: "High"
    });
  });

  const weaknesses = aiData.weaknesses || [];
  weaknesses.forEach((w, i) => {
    optimizations.push({
      dimension: "Weakness Detected",
      subscore: 60,
      issue: w,
      recommendation: aiData.improvements?.[i] || "Address this weakness to improve conversion readiness.",
      priority: "Medium"
    });
  });

  // Sort optimizations by priority (High -> Medium -> Low) and subscore ascending
  optimizations.sort((a, b) => {
    const pA = a.priority === "High" ? 0 : a.priority === "Medium" ? 1 : 2;
    const pB = b.priority === "High" ? 0 : b.priority === "Medium" ? 1 : 2;
    if (pA !== pB) return pA - pB;
    return a.subscore - b.subscore;
  });

  return {
    grade,
    optimizations
  };
}
