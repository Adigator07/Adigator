"use client";

import type { ChangeEvent } from "react";
import { AlertCircle, ArrowDown } from "lucide-react";

import type { SetupMissingField } from "@/app/lib/setupRequiredFields";
import { ToolInput, ToolSelect, ToolTextarea } from "@/app/components/preview-tool/PreviewToolUi";

type FieldValues = {
  advertiserName?: string;
  campaignName?: string;
  campaignBrief?: string;
  landingUrl?: string;
  programmaticTaskType?: string;
  programmaticAdGroupCount?: number | "";
  lookupCampaignId?: string;
  campaignVertical?: string | null;
};

type MissingSetupFieldsPanelProps = {
  title?: string;
  description?: string;
  fields: SetupMissingField[];
  values: FieldValues;
  highlighted?: boolean;
  verticalOptions?: Array<{ id: string; title: string }>;
  onAdvertiserNameChange?: (value: string) => void;
  onCampaignNameChange?: (value: string) => void;
  onCampaignBriefChange?: (value: string) => void;
  onLandingUrlChange?: (value: string) => void;
  onProgrammaticTaskTypeChange?: (value: string) => void;
  onProgrammaticAdGroupCountChange?: (value: number) => void;
  onLookupCampaignIdChange?: (value: string) => void;
  onVerticalChange?: (value: string) => void;
  onFindCampaign?: () => void;
  onScrollToTarget?: (targetId: string) => void;
};

function scrollToTarget(targetId: string) {
  const node = document.getElementById(targetId);
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  if (node instanceof HTMLElement) {
    node.focus({ preventScroll: true });
  }
}

export default function MissingSetupFieldsPanel({
  title = "Required information missing",
  description = "Complete the items below to continue. You can enter details here without returning to an earlier screen.",
  fields,
  values,
  highlighted = false,
  verticalOptions = [],
  onAdvertiserNameChange,
  onCampaignNameChange,
  onCampaignBriefChange,
  onLandingUrlChange,
  onProgrammaticTaskTypeChange,
  onProgrammaticAdGroupCountChange,
  onLookupCampaignIdChange,
  onVerticalChange,
  onFindCampaign,
  onScrollToTarget,
}: MissingSetupFieldsPanelProps) {
  if (!fields.length) return null;

  const handleScroll = (targetId?: string) => {
    if (!targetId) return;
    if (onScrollToTarget) onScrollToTarget(targetId);
    else scrollToTarget(targetId);
  };

  return (
    <div
      className={`space-y-4 rounded-2xl border p-4 transition-shadow ${
        highlighted
          ? "border-amber-400/50 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]"
          : "border-studio-accent/25 bg-studio-accent/5"
      }`}
      role="region"
      aria-live="polite"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <div>
          <h4 className="text-sm font-bold text-studio-text">{title}</h4>
          <p className="mt-1 text-sm text-studio-muted">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
              {field.label}
              {field.required === false ? " (recommended)" : " *"}
            </p>
            <p className="mt-1 text-sm text-studio-muted">{field.prompt}</p>

            {field.inputType === "text" && field.key === "advertiserName" ? (
              <ToolInput
                className="mt-3"
                type="text"
                value={values.advertiserName || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onAdvertiserNameChange?.(event.target.value)}
                placeholder={field.placeholder}
              />
            ) : null}

            {field.inputType === "text" && field.key === "campaignName" ? (
              <ToolInput
                className="mt-3"
                type="text"
                value={values.campaignName || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onCampaignNameChange?.(event.target.value)}
                placeholder={field.placeholder}
              />
            ) : null}

            {field.inputType === "text" && (field.key === "lookupCampaign" || field.key === "renewalReference" || field.key === "urlUtmReference") ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <ToolInput
                  type="text"
                  value={values.lookupCampaignId || ""}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onLookupCampaignIdChange?.(event.target.value)}
                  placeholder={field.placeholder}
                  className="flex-1"
                />
                {onFindCampaign ? (
                  <button
                    type="button"
                    onClick={onFindCampaign}
                    className="studio-btn-primary studio-focus-ring shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold"
                  >
                    Find campaign
                  </button>
                ) : null}
              </div>
            ) : null}

            {field.inputType === "textarea" ? (
              <ToolTextarea
                className="mt-3"
                value={values.campaignBrief || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onCampaignBriefChange?.(event.target.value)}
                placeholder={field.placeholder}
                rows={3}
              />
            ) : null}

            {field.inputType === "url" ? (
              <ToolInput
                className="mt-3"
                type="url"
                value={values.landingUrl || ""}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onLandingUrlChange?.(event.target.value)}
                placeholder={field.placeholder}
              />
            ) : null}

            {field.inputType === "select" && field.key === "programmaticTaskType" ? (
              <ToolSelect
                className="mt-3"
                value={values.programmaticTaskType || ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => onProgrammaticTaskTypeChange?.(event.target.value)}
              >
                <option value="" disabled>Select a task type</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </ToolSelect>
            ) : null}

            {field.inputType === "select" && field.key === "programmaticAdGroupCount" ? (
              <ToolSelect
                className="mt-3"
                value={values.programmaticAdGroupCount === "" ? "" : String(values.programmaticAdGroupCount)}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) onProgrammaticAdGroupCountChange?.(next);
                }}
              >
                <option value="" disabled>Select ad group count</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </ToolSelect>
            ) : null}

            {field.inputType === "select" && field.key === "campaignVertical" ? (
              <ToolSelect
                id="campaign-vertical"
                className="mt-3"
                value={values.campaignVertical || ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => onVerticalChange?.(event.target.value)}
              >
                <option value="" disabled>Select an industry vertical</option>
                {verticalOptions.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>{vertical.title}</option>
                ))}
              </ToolSelect>
            ) : null}

            {field.inputType === "info" && field.scrollTargetId ? (
              <button
                type="button"
                onClick={() => handleScroll(field.scrollTargetId)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-studio-text transition hover:border-white/20 hover:bg-white/10"
              >
                <ArrowDown size={14} />
                Go to {field.label.toLowerCase()}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
