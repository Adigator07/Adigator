"use client";

import ContextualPreviewEngine from "../ContextualPreviewEngine";

/**
 * Thin wrapper around the existing programmatic preview engine.
 * DO NOT modify ContextualPreviewEngine — this component delegates to it as-is.
 */
export default function ProgrammaticPreviewStudio({ creatives, vertical, goal }) {
  return (
    <ContextualPreviewEngine
      creatives={creatives}
      vertical={vertical}
      goal={goal}
    />
  );
}
