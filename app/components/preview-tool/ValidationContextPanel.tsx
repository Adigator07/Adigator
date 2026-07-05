"use client";

import type { ChangeEvent } from "react";
import CampaignIdSelect from "@/app/components/preview-tool/CampaignIdSelect";
import UtmParameterEditor from "@/app/components/preview-tool/UtmParameterEditor";
import { ToolInput, ToolTextarea } from "@/app/components/preview-tool/PreviewToolUi";
import type { UtmParameterKey } from "@/app/lib/utmManagement";

export type ValidationContextGap = {
  id: string;
  label: string;
  severity: "recommended" | "required";
};

type ValidationContextPanelProps = {
  gaps: ValidationContextGap[];
  campaignName: string;
  campaignBrief: string;
  landingUrl: string;
  destinationUrl: string;
  showDestinationFields: boolean;
  showUtmFields: boolean;
  utmParameters: Record<UtmParameterKey, string>;
  trackingUrl: string;
  onCampaignNameChange: (value: string) => void;
  onCampaignBriefChange: (value: string) => void;
  onLandingUrlChange: (value: string) => void;
  onDestinationUrlChange: (value: string) => void;
  onUtmChange: (key: UtmParameterKey, value: string) => void;
  onUtmRemove: (key: UtmParameterKey) => void;
  showCampaignIdField?: boolean;
  campaignId?: string;
  campaignOwnerId?: string | null;
  campaignAccessToken?: string | null;
  onCampaignIdChange?: (value: string) => void;
  onContinue: () => void;
  continueLabel?: string;
};

export default function ValidationContextPanel({
  gaps,
  campaignName,
  campaignBrief,
  landingUrl,
  destinationUrl,
  showDestinationFields,
  showUtmFields,
  utmParameters,
  trackingUrl,
  onCampaignNameChange,
  onCampaignBriefChange,
  onLandingUrlChange,
  onDestinationUrlChange,
  onUtmChange,
  onUtmRemove,
  showCampaignIdField = false,
  campaignId = "",
  campaignOwnerId = null,
  campaignAccessToken = null,
  onCampaignIdChange,
  onContinue,
  continueLabel = "Continue to validation",
}: ValidationContextPanelProps) {
  const hasRequiredGaps = gaps.some((gap) => gap.severity === "required");

  return (
    <div className="studio-card space-y-5 rounded-2xl border border-studio-accent/25 bg-studio-accent/5 p-5 md:p-6">
      <div>
        <h3 className="studio-heading text-lg font-bold text-studio-text">Review campaign context</h3>
        <p className="mt-1 text-sm text-studio-muted">
          Fill in any missing details from earlier steps before validation runs. This improves URL checks, UTM alignment, and analysis quality.
        </p>
      </div>

      {gaps.length > 0 ? (
        <ul className="space-y-1 text-sm text-studio-muted">
          {gaps.map((gap) => (
            <li key={gap.id} className="flex items-start gap-2">
              <span className={gap.severity === "required" ? "text-studio-error" : "text-amber-300"}>•</span>
              <span>
                <span className="font-medium text-studio-text">{gap.label}</span>
                {gap.severity === "required" ? " (required)" : " (recommended)"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-studio-success">All recommended context fields are set.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
            Campaign name
          </label>
          <ToolInput
            type="text"
            value={campaignName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onCampaignNameChange(event.target.value)}
            placeholder="e.g. Q2 Food Sales Awareness"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
            Campaign brief
          </label>
          <ToolTextarea
            value={campaignBrief}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onCampaignBriefChange(event.target.value)}
            placeholder="Describe goals, offer, audience, and requirements."
            rows={3}
          />
        </div>
        {showCampaignIdField ? (
          <div className="md:col-span-2">
            <CampaignIdSelect
              campaignName={campaignName}
              campaignId={campaignId}
              ownerId={campaignOwnerId}
              accessToken={campaignAccessToken}
              onCampaignIdChange={onCampaignIdChange || (() => {})}
            />
          </div>
        ) : null}
        {showDestinationFields ? (
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
              {showUtmFields ? "Destination URL" : "Landing page URL"}
            </label>
            <ToolInput
              type="url"
              value={showUtmFields ? destinationUrl : landingUrl}
              onChange={(event: ChangeEvent<HTMLInputElement>) => (
                showUtmFields
                  ? onDestinationUrlChange(event.target.value)
                  : onLandingUrlChange(event.target.value)
              )}
              placeholder="https://www.example.com/landing"
            />
          </div>
        ) : null}
      </div>

      {showUtmFields ? (
        <div className="space-y-4">
          <UtmParameterEditor
            values={utmParameters}
            onChange={onUtmChange}
            onRemove={onUtmRemove}
          />
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
              Tracking URL preview
            </label>
            <ToolInput type="url" value={trackingUrl} readOnly className="opacity-90" />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={hasRequiredGaps}
        className="studio-btn-primary studio-focus-ring rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {continueLabel}
      </button>
    </div>
  );
}
