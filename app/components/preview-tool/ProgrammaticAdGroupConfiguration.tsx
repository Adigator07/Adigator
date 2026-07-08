"use client";

import type { ChangeEvent } from "react";
import { Minus, Plus } from "lucide-react";

import {
  MAX_PROGRAMMATIC_AD_GROUPS,
  MIN_PROGRAMMATIC_AD_GROUPS,
  PROGRAMMATIC_AD_GROUP_COUNT_OPTIONS,
  PROGRAMMATIC_OBJECTIVES,
  PROGRAMMATIC_OBJECTIVE_CUSTOM,
  getProgrammaticAdGroupDisplayName,
  getProgrammaticAdGroupObjectiveLabel,
  type ProgrammaticAdGroup,
} from "@/app/lib/programmaticWorkflow";
import { ToolInput, ToolSelect } from "@/app/components/preview-tool/PreviewToolUi";

export type ProgrammaticAdGroupConfigMode = "setup" | "select";

export type AdGroupObjectiveOption = { id: string; label: string };

type ProgrammaticAdGroupConfigurationProps = {
  mode: ProgrammaticAdGroupConfigMode;
  adGroupCount: number | "";
  adGroups: ProgrammaticAdGroup[];
  selectedGroupIds?: string[];
  applyToAll?: boolean;
  allowEditStructure?: boolean;
  description?: string;
  /** Section heading — defaults to "Ad Group Configuration". */
  title?: string;
  /** Objective options for the per-group dropdown. Defaults to programmatic objectives. */
  objectiveOptions?: AdGroupObjectiveOption[];
  /** Whether the "Custom objective" free-text option is offered. Defaults to true. */
  supportsCustomObjective?: boolean;
  onAdGroupCountChange?: (count: number) => void;
  onAdGroupNameChange?: (groupId: string, name: string) => void;
  onAdGroupObjectiveChange?: (groupId: string, objective: string) => void;
  onAdGroupCustomObjectiveChange?: (groupId: string, customObjective: string) => void;
  onAddAdGroup?: () => void;
  onRemoveAdGroup?: (groupId: string) => void;
  onSelectedGroupIdsChange?: (groupIds: string[]) => void;
  onApplyToAllChange?: (applyToAll: boolean) => void;
};

function objectiveLabel(
  objective: string,
  group: ProgrammaticAdGroup,
  options: AdGroupObjectiveOption[],
  supportsCustomObjective: boolean,
): string {
  if (supportsCustomObjective && objective === PROGRAMMATIC_OBJECTIVE_CUSTOM) {
    return getProgrammaticAdGroupObjectiveLabel(group);
  }
  return options.find((item) => item.id === objective)?.label || objective || "Not set";
}

const DEFAULT_OBJECTIVE_OPTIONS: AdGroupObjectiveOption[] = PROGRAMMATIC_OBJECTIVES.map((item) => ({
  id: item.id,
  label: item.label,
}));

export default function ProgrammaticAdGroupConfiguration({
  mode,
  adGroupCount,
  adGroups,
  selectedGroupIds = [],
  applyToAll = false,
  allowEditStructure = true,
  description,
  title = "Ad Group Configuration",
  objectiveOptions = DEFAULT_OBJECTIVE_OPTIONS,
  supportsCustomObjective = true,
  onAdGroupCountChange,
  onAdGroupNameChange,
  onAdGroupObjectiveChange,
  onAdGroupCustomObjectiveChange,
  onAddAdGroup,
  onRemoveAdGroup,
  onSelectedGroupIdsChange,
  onApplyToAllChange,
}: ProgrammaticAdGroupConfigurationProps) {
  const canAddGroup = adGroups.length < MAX_PROGRAMMATIC_AD_GROUPS;
  const canRemoveGroup = adGroups.length > MIN_PROGRAMMATIC_AD_GROUPS;
  const missingNameGroups = mode === "setup"
    ? adGroups.filter((group) => !group.name?.trim())
    : [];
  const showNameRequiredErrors = missingNameGroups.length > 0;

  const toggleGroupSelection = (groupId: string) => {
    if (!onSelectedGroupIdsChange || applyToAll) return;
    const next = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id) => id !== groupId)
      : [...selectedGroupIds, groupId];
    onSelectedGroupIdsChange(next);
  };

  return (
    <section id="programmatic-ad-groups" className="space-y-5">
      <div>
        <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">{title}</h3>
        <p className="mt-1 text-sm text-studio-muted">
          {description || (mode === "setup"
            ? "Name each ad group and set its objective. Add more groups any time before upload."
            : "Choose which ad groups this task should apply to, or apply changes to all ad groups.")}
        </p>
      </div>

      {mode === "select" ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-studio-accent/25 bg-studio-accent/5 p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-studio-border accent-studio-accent"
            checked={applyToAll}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onApplyToAllChange?.(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-studio-text">Apply to all ad groups</span>
            <span className="mt-1 block text-xs text-studio-muted">
              When enabled, this task affects every ad group in the loaded campaign.
            </span>
          </span>
        </label>
      ) : null}

      {mode === "setup" && allowEditStructure ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="max-w-xs flex-1">
            <label htmlFor="programmatic-ad-group-count" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
              How many ad groups are under your campaign?
            </label>
            <ToolSelect
              id="programmatic-ad-group-count"
              value={adGroupCount === "" ? "" : String(adGroupCount)}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onAdGroupCountChange?.(Number(event.target.value))}
            >
              <option value="" disabled>
                Select ad group count
              </option>
              {PROGRAMMATIC_AD_GROUP_COUNT_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </ToolSelect>
          </div>
          {canAddGroup ? (
            <button
              type="button"
              onClick={onAddAdGroup}
              className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-2 rounded-xl border border-studio-border px-4 py-2.5 text-sm font-semibold"
            >
              <Plus size={16} />
              Add ad group
            </button>
          ) : null}
        </div>
      ) : null}

      {mode === "select" && allowEditStructure && canAddGroup ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAddAdGroup}
            className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-2 rounded-xl border border-studio-border px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} />
            Add ad group
          </button>
        </div>
      ) : null}

      {adGroups.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-studio-border bg-black/20">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-b border-studio-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
            {mode === "select" ? <span className="col-span-3">Ad groups</span> : (
              <>
                <span>
                  Ad group name{" "}
                  <span className="text-studio-error" aria-hidden="true">*</span>
                </span>
                <span>Objective</span>
                <span className="text-right">Actions</span>
              </>
            )}
          </div>
          <div className="divide-y divide-studio-border">
            {adGroups.map((group) => {
              const displayName = getProgrammaticAdGroupDisplayName(group);
              const isSelected = applyToAll || selectedGroupIds.includes(group.id);
              const nameMissing = mode === "setup" && !group.name?.trim();

              if (mode === "select") {
                return (
                  <label
                    key={group.id}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-4 transition ${
                      applyToAll ? "opacity-80" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-studio-border accent-studio-accent"
                      checked={isSelected}
                      disabled={applyToAll}
                      onChange={() => toggleGroupSelection(group.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-studio-text">{displayName}</span>
                      <span className="mt-1 block text-xs text-studio-muted">
                        Objective: {objectiveLabel(group.objective, group, objectiveOptions, supportsCustomObjective)}
                      </span>
                    </span>
                  </label>
                );
              }

              return (
                <div
                  key={group.id}
                  className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary md:sr-only">
                      Ad group name{" "}
                      <span className="text-studio-error" aria-hidden="true">*</span>
                    </label>
                    <ToolInput
                      type="text"
                      value={group.name}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => onAdGroupNameChange?.(group.id, event.target.value)}
                      placeholder="Enter ad group name"
                      required
                      aria-required="true"
                      aria-invalid={nameMissing || undefined}
                      className={nameMissing ? "border-studio-error/60 ring-1 ring-studio-error/30" : ""}
                    />
                    {nameMissing ? (
                      <p className="mt-1.5 text-xs text-studio-error">Ad group name is required.</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary md:sr-only">
                      Objective
                    </label>
                    <ToolSelect
                      value={group.objective}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => onAdGroupObjectiveChange?.(group.id, event.target.value)}
                    >
                      <option value="" disabled>
                        Select objective
                      </option>
                      {objectiveOptions.map((objective) => (
                        <option key={objective.id} value={objective.id}>
                          {objective.label}
                        </option>
                      ))}
                    </ToolSelect>
                    {supportsCustomObjective && group.objective === PROGRAMMATIC_OBJECTIVE_CUSTOM ? (
                      <ToolInput
                        type="text"
                        value={group.customObjective || ""}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => onAdGroupCustomObjectiveChange?.(group.id, event.target.value)}
                        placeholder="Enter custom objective"
                      />
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    {allowEditStructure && canRemoveGroup ? (
                      <button
                        type="button"
                        onClick={() => onRemoveAdGroup?.(group.id)}
                        className="studio-btn-ghost inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-studio-muted hover:text-studio-error"
                        aria-label={`Remove ${displayName}`}
                      >
                        <Minus size={14} />
                        Remove
                      </button>
                    ) : (
                      <span className="hidden md:block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === "setup" && showNameRequiredErrors ? (
        <p className="text-sm text-studio-error">
          Enter a name for each ad group before continuing.
        </p>
      ) : null}

      {mode === "select" && !applyToAll && selectedGroupIds.length === 0 ? (
        <p className="text-sm text-studio-error">Select at least one ad group, or enable apply to all.</p>
      ) : null}
    </section>
  );
}
