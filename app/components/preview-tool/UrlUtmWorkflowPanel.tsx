"use client";

import type { ChangeEvent } from "react";

import UtmParameterEditor from "@/app/components/preview-tool/UtmParameterEditor";
import { ToolInput } from "@/app/components/preview-tool/PreviewToolUi";
import type { UtmParameterKey } from "@/app/lib/utmManagement";

type UrlUtmWorkflowPanelProps = {
  destinationUrl: string;
  trackingUrl: string;
  utmParameters: Record<UtmParameterKey, string>;
  validating: boolean;
  readOnly?: boolean;
  onDestinationUrlChange: (value: string) => void;
  onUtmChange: (key: UtmParameterKey, value: string) => void;
  onUtmRemove: (key: UtmParameterKey) => void;
  onValidate: () => void;
};

export default function UrlUtmWorkflowPanel({
  destinationUrl,
  trackingUrl,
  utmParameters,
  validating,
  readOnly = false,
  onDestinationUrlChange,
  onUtmChange,
  onUtmRemove,
  onValidate,
}: UrlUtmWorkflowPanelProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-studio-accent/25 bg-studio-accent/5 p-5 md:p-6">
      <div>
        <h3 className="studio-heading text-xl font-bold text-studio-text">URL & UTM Management</h3>
        <p className="mt-2 text-sm text-studio-muted">
          {readOnly
            ? "Review the campaign destination URL and UTM parameters. These values are read-only for this workflow."
            : "Update the destination URL and tracking parameters. The tracking URL is built automatically from your UTM values."}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
          Destination URL
        </label>
        <ToolInput
          type="url"
          value={destinationUrl}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onDestinationUrlChange(event.target.value)}
          placeholder="https://www.example.com/landing"
          readOnly={readOnly}
          className={readOnly ? "opacity-90" : ""}
        />
      </div>

      <UtmParameterEditor
        values={utmParameters}
        onChange={onUtmChange}
        onRemove={onUtmRemove}
        readOnly={readOnly}
      />

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
          Tracking URL
        </label>
        <ToolInput
          type="url"
          value={trackingUrl}
          readOnly
          className="opacity-90"
        />
        <p className="mt-2 text-xs text-studio-tertiary">
          Final landing page URL with UTM parameters applied.
        </p>
      </div>

      <button
        type="button"
        onClick={onValidate}
        disabled={validating || !destinationUrl.trim()}
        className="studio-btn-primary studio-focus-ring rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {validating ? "Validating URL & UTM…" : "Validate URL & UTM"}
      </button>
    </div>
  );
}
