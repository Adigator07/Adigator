import type { CampaignTaskTypeId } from "@/app/lib/platforms/types";
import type { SetupFieldContext, SetupMissingField } from "@/app/lib/setupRequiredFields";
import {
  PROGRAMMATIC_OBJECTIVES,
  resolveAnalyzerGoal,
} from "@/app/lib/campaignObjectives";
import type { PlatformWorkflowAdapter } from "@/app/lib/platforms/types";
import {
  PROGRAMMATIC_TASK_TYPES,
  isProgrammaticAdGroupConfigComplete,
  isProgrammaticAdGroupSelectionComplete,
  isProgrammaticCampaignRenewal,
  isProgrammaticCampaignSetup,
  isProgrammaticCreativeAddition,
  isProgrammaticCreativeReplacement,
  isProgrammaticUrlValidationUtmUpdate,
  PROGRAMMATIC_AD_GROUP_COUNT_OPTIONS,
  getProgrammaticAdGroupDisplayName,
} from "@/app/lib/programmaticWorkflow";

function describeIncompleteAdGroups(groups: SetupFieldContext["programmaticAdGroups"]): string {
  const issues = groups.flatMap((group) => {
    const name = getProgrammaticAdGroupDisplayName(group);
    if (!group.name?.trim()) return [`${name}: add a name`];
    if (!group.objective) return [`${name}: select an objective`];
    if (group.objective === "custom" && !group.customObjective?.trim()) {
      return [`${name}: describe the custom objective`];
    }
    return [];
  });
  return issues.length ? issues.join(" · ") : "Complete each ad group name and objective.";
}

function getProgrammaticMissingSetupFields(context: SetupFieldContext): SetupMissingField[] {
  const missing: SetupMissingField[] = [];
  const taskType = context.programmaticTaskType;
  const isSetup = isProgrammaticCampaignSetup(taskType);
  const isAddition = isProgrammaticCreativeAddition(taskType);
  const isReplacement = isProgrammaticCreativeReplacement(taskType);
  const isRenewal = isProgrammaticCampaignRenewal(taskType);
  const isUrlUtm = isProgrammaticUrlValidationUtmUpdate(taskType);

  if (!taskType) {
    missing.push({
      key: "programmaticTaskType",
      label: "Programmatic task type",
      prompt: "Select the workflow you are running (setup, creative swap, renewal, etc.).",
      inputType: "select",
      options: PROGRAMMATIC_TASK_TYPES.map((item) => ({ value: item.id, label: item.label })),
      scrollTargetId: "programmatic-task-type",
    });
  }

  if (isAddition && !context.loadedCampaignSnapshot) {
    missing.push({
      key: "lookupCampaign",
      label: "Existing campaign",
      prompt: "Find the campaign you want to add creatives to by ID or name.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "programmatic-campaign-lookup",
    });
  } else if (isAddition && context.loadedCampaignSnapshot && !context.creativeAdditionMode) {
    missing.push({
      key: "creativeAdditionMode",
      label: "Creative addition mode",
      prompt: "Choose whether to add creatives to the existing setup or start a new ad group layout.",
      inputType: "info",
      scrollTargetId: "programmatic-creative-addition",
    });
  } else if (isReplacement && !context.loadedCampaignSnapshot) {
    missing.push({
      key: "lookupCampaign",
      label: "Existing campaign",
      prompt: "Load the campaign whose creatives you want to replace.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "programmatic-campaign-lookup",
    });
  } else if (isRenewal && !context.renewalReferenceSnapshot) {
    missing.push({
      key: "renewalReference",
      label: "Campaign to renew",
      prompt: "Find and load the campaign you are renewing.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "programmatic-campaign-lookup",
    });
  } else if (isUrlUtm && !context.urlUtmReferenceSnapshot) {
    missing.push({
      key: "urlUtmReference",
      label: "Campaign for URL/UTM update",
      prompt: "Find the campaign whose destination URL or UTM tags you are updating.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "programmatic-campaign-lookup",
    });
  }

  if (isSetup) {
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
  }

  const needsGoal = isRenewal && !context.renewalUsesAdGroups && !context.campaignGoal;
  if (needsGoal) {
    missing.push({
      key: "campaignGoal",
      label: "Campaign objective",
      prompt: "Select the marketing goal for this campaign.",
      inputType: "info",
      scrollTargetId: "setup-goal-section",
    });
  }

  const needsBrief = (isAddition && context.loadedCampaignSnapshot && context.creativeAdditionMode)
    || isReplacement
    || isRenewal
    || isUrlUtm;

  if (needsBrief && !context.campaignBrief.trim()) {
    missing.push({
      key: "campaignBrief",
      label: "Campaign brief",
      prompt: "Describe goals, offer, audience, and requirements for this campaign.",
      inputType: "textarea",
      placeholder: "Describe goals, offer, audience, and requirements.",
    });
  }

  const needsAdGroupSelection = (
    (isAddition && context.loadedCampaignSnapshot && context.creativeAdditionMode && context.programmaticAdGroups.length > 0)
    || (isReplacement && context.loadedCampaignSnapshot && context.programmaticAdGroups.length > 0)
    || (isRenewal && context.renewalReferenceSnapshot && context.programmaticAdGroups.length > 0)
    || (isUrlUtm && context.urlUtmReferenceSnapshot && context.programmaticAdGroups.length > 0)
  ) && !isProgrammaticAdGroupSelectionComplete(
    context.programmaticAdGroups,
    context.selectedProgrammaticAdGroupIds,
    context.applyProgrammaticAdGroupsToAll,
  );

  if (needsAdGroupSelection) {
    missing.push({
      key: "adGroupSelection",
      label: "Ad group selection",
      prompt: "Select at least one ad group — or apply changes to all ad groups.",
      inputType: "info",
      scrollTargetId: "programmatic-ad-groups",
    });
  }

  if (isRenewal && context.renewalReferenceSnapshot && context.renewalUsesAdGroups) {
    if (!isProgrammaticAdGroupConfigComplete(context.programmaticAdGroups)) {
      missing.push({
        key: "adGroupConfig",
        label: "Ad group configuration",
        prompt: describeIncompleteAdGroups(context.programmaticAdGroups),
        inputType: "info",
        scrollTargetId: "programmatic-ad-groups",
      });
    }
  }

  return missing;
}

export const programmaticAdapter: PlatformWorkflowAdapter = {
  id: "programmatic",
  label: "Programmatic Ads",
  shortLabel: "Programmatic",
  description: "Real-time bidding across premium publisher inventory with AI contextual previews.",
  taskTypes: PROGRAMMATIC_TASK_TYPES.map((item) => ({
    id: item.id as CampaignTaskTypeId,
    label: item.label,
    description: item.label,
  })),
  uploadStrategy: "ad-group-folders",
  getObjectives: () => PROGRAMMATIC_OBJECTIVES,
  resolveAnalyzerGoal: resolveAnalyzerGoal,
  validationRules: {
    landingUrlRequired: true,
    defaultMaxFileSizeKb: 150,
    uploadGuidance: "Upload IAB standard sizes per ad group. Each ad group can have its own objective and folder of creatives.",
  },
  previewStudioMode: "contextual-ai",
  defaultPreviewTemplateId: "news",
  getMissingSetupFields: getProgrammaticMissingSetupFields,
  isSetupTask: isProgrammaticCampaignSetup,
  isUpdateTask: (taskType) => taskType !== "" && !isProgrammaticCampaignSetup(taskType),
  buildSnapshotExtensions: (context) => ({
    programmaticAdGroupCount: context.programmaticAdGroupCount ?? "",
    programmaticAdGroups: context.programmaticAdGroups || [],
    selectedProgrammaticAdGroupIds: context.selectedProgrammaticAdGroupIds || [],
    applyProgrammaticAdGroupsToAll: context.applyProgrammaticAdGroupsToAll ?? false,
  }),
  analysisPlatform: "programmatic",
  intelligenceLabel: "Cross-Inventory Intelligence",
  previewStudioDescription: "See your creatives in realistic interactive website contexts powered by AI publisher templates.",
  analysisReportLabel: "Programmatic Analysis Report (PDF)",
  previewReportLabel: "Programmatic Preview (PDF)",
};
