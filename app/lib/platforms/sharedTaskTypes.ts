import type { CampaignTaskType, CampaignTaskTypeId } from "@/app/lib/platforms/types";
import type { SetupFieldContext, SetupMissingField } from "@/app/lib/setupRequiredFields";
import {
  PROGRAMMATIC_AD_GROUP_COUNT_OPTIONS,
  getProgrammaticAdGroupDisplayName,
  isProgrammaticAdGroupConfigComplete,
} from "@/app/lib/programmaticWorkflow";

export const CAMPAIGN_SETUP_TASK: CampaignTaskType = {
  id: "campaign_setup",
  label: "Campaign Setup",
  description: "Configure and launch a new campaign with fresh creatives.",
};

export const CREATIVE_ADDITION_TASK: CampaignTaskType = {
  id: "creative_addition",
  label: "Creative Addition",
  description: "Add new creatives to an existing saved campaign.",
};

export const CREATIVE_REPLACEMENT_TASK: CampaignTaskType = {
  id: "creative_replacement",
  label: "Creative Replacement",
  description: "Swap creatives in an existing campaign while preserving configuration.",
};

export const CAMPAIGN_RENEWAL_TASK: CampaignTaskType = {
  id: "campaign_renewal",
  label: "Campaign Renewal",
  description: "Renew a campaign with updated settings and creatives.",
};

export const URL_UTM_UPDATE_TASK: CampaignTaskType = {
  id: "url_validation_utm_update",
  label: "URL / UTM Update",
  description: "Update destination URL and UTM parameters for an existing campaign.",
};

export const STANDARD_CAMPAIGN_TASK_TYPES: CampaignTaskType[] = [
  CAMPAIGN_SETUP_TASK,
  CREATIVE_ADDITION_TASK,
  CREATIVE_REPLACEMENT_TASK,
  CAMPAIGN_RENEWAL_TASK,
  URL_UTM_UPDATE_TASK,
];

export function isCampaignSetupTask(taskType: string): boolean {
  return taskType === "campaign_setup";
}

export function isCampaignUpdateTask(taskType: string): boolean {
  return taskType !== "" && taskType !== "campaign_setup";
}

export function isCreativeAdditionTask(taskType: string): boolean {
  return taskType === "creative_addition";
}

export function isCreativeReplacementTask(taskType: string): boolean {
  return taskType === "creative_replacement" || taskType === "creative_swap";
}

export function isCampaignRenewalTask(taskType: string): boolean {
  return taskType === "campaign_renewal";
}

export function isUrlUtmUpdateTask(taskType: string): boolean {
  return taskType === "url_validation_utm_update";
}

export function labelCampaignTaskType(taskType: CampaignTaskTypeId | string): string {
  const match = STANDARD_CAMPAIGN_TASK_TYPES.find((item) => item.id === taskType);
  return match?.label || String(taskType || "Campaign Setup").replace(/_/g, " ");
}

function describeIncompleteAdGroups(groups: SetupFieldContext["programmaticAdGroups"]): string {
  const issues = groups.flatMap((group) => {
    const name = getProgrammaticAdGroupDisplayName(group);
    if (!group.name?.trim()) return [`${name}: add a name`];
    if (!group.objective) return [`${name}: select an objective`];
    return [];
  });
  return issues.length ? issues.join(" · ") : "Complete each ad group name and objective.";
}

/**
 * Shared ad-group setup validation for standard platforms (Google/Meta) so they mirror
 * the programmatic multi-ad-group flow: pick a count, then name + set an objective per group.
 */
export function getAdGroupSetupMissingFields(context: SetupFieldContext): SetupMissingField[] {
  const missing: SetupMissingField[] = [];

  if (context.programmaticAdGroupCount === "") {
    missing.push({
      key: "programmaticAdGroupCount",
      label: "Number of ad groups",
      prompt: "How many ad groups will this campaign use?",
      inputType: "select",
      options: PROGRAMMATIC_AD_GROUP_COUNT_OPTIONS.map((count) => ({
        value: String(count),
        label: `${count} ad group${count === 1 ? "" : "s"}`,
      })),
      scrollTargetId: "programmatic-ad-groups",
    });
  } else if (!isProgrammaticAdGroupConfigComplete(context.programmaticAdGroups)) {
    missing.push({
      key: "adGroupConfig",
      label: "Ad group configuration",
      prompt: describeIncompleteAdGroups(context.programmaticAdGroups),
      inputType: "info",
      scrollTargetId: "programmatic-ad-groups",
    });
  }

  return missing;
}
