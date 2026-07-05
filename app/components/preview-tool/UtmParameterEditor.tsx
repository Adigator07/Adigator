"use client";

import type { ChangeEvent } from "react";

import { REQUIRED_UTM_KEYS, SUPPORTED_UTM_KEYS, type UtmParameterKey } from "@/app/lib/utmManagement";
import { ToolInput } from "@/app/components/preview-tool/PreviewToolUi";

const UTM_LABELS: Record<UtmParameterKey, string> = {
  utm_source: "UTM Source",
  utm_medium: "UTM Medium",
  utm_campaign: "UTM Campaign",
  utm_content: "UTM Content",
  utm_term: "UTM Term",
};

const UTM_PLACEHOLDERS: Record<UtmParameterKey, string> = {
  utm_source: "e.g. programmatic",
  utm_medium: "e.g. display",
  utm_campaign: "e.g. q2_running_shoes",
  utm_content: "e.g. leaderboard_300x250",
  utm_term: "e.g. running_shoes",
};

type UtmParameterEditorProps = {
  values: Record<UtmParameterKey, string>;
  onChange: (key: UtmParameterKey, value: string) => void;
  onRemove: (key: UtmParameterKey) => void;
  readOnly?: boolean;
};

export default function UtmParameterEditor({
  values,
  onChange,
  onRemove,
  readOnly = false,
}: UtmParameterEditorProps) {
  return (
    <div className="space-y-4">
      {SUPPORTED_UTM_KEYS.map((key) => {
        const isRequired = REQUIRED_UTM_KEYS.includes(key);
        const hasValue = Boolean(values[key]?.trim());

        return (
          <div key={key} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
                {UTM_LABELS[key]}
                {isRequired ? " (required)" : " (optional)"}
              </label>
              <ToolInput
                type="text"
                value={values[key] || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(key, event.target.value)}
                placeholder={UTM_PLACEHOLDERS[key]}
                readOnly={readOnly}
                className={readOnly ? "opacity-90" : ""}
              />
            </div>
            {!readOnly && !isRequired && hasValue ? (
              <button
                type="button"
                onClick={() => onRemove(key)}
                className="studio-btn-ghost rounded-lg px-3 py-2 text-xs font-semibold"
              >
                Remove
              </button>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
