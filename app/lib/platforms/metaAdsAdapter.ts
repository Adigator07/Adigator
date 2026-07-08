import type { SetupFieldContext, SetupMissingField } from "@/app/lib/setupRequiredFields";
import {
  META_OBJECTIVES,
  resolveAnalyzerGoal,
} from "@/app/lib/campaignObjectives";
import { META_OBJECTIVE_REQUIREMENTS } from "@/app/constants/metaSpecs";
import type { PlatformWorkflowAdapter } from "@/app/lib/platforms/types";
import {
  STANDARD_CAMPAIGN_TASK_TYPES,
  getAdGroupSetupMissingFields,
  isCampaignRenewalTask,
  isCampaignSetupTask,
  isCampaignUpdateTask,
  isCreativeAdditionTask,
  isCreativeReplacementTask,
  isUrlUtmUpdateTask,
} from "@/app/lib/platforms/sharedTaskTypes";

function getMetaMissingSetupFields(context: SetupFieldContext): SetupMissingField[] {
  const missing: SetupMissingField[] = [];
  const taskType = context.programmaticTaskType;
  const isSetup = isCampaignSetupTask(taskType);
  const isAddition = isCreativeAdditionTask(taskType);
  const isReplacement = isCreativeReplacementTask(taskType);
  const isRenewal = isCampaignRenewalTask(taskType);
  const isUrlUtm = isUrlUtmUpdateTask(taskType);

  if (!taskType) {
    missing.push({
      key: "programmaticTaskType",
      label: "Meta Ads workflow",
      prompt: "Select the Meta Ads workflow you are running.",
      inputType: "select",
      options: STANDARD_CAMPAIGN_TASK_TYPES.map((item) => ({ value: item.id, label: item.label })),
      scrollTargetId: "platform-task-type",
    });
  }

  if (isAddition && !context.loadedCampaignSnapshot) {
    missing.push({
      key: "lookupCampaign",
      label: "Existing Meta campaign",
      prompt: "Find the campaign you want to add creatives to.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  } else if (isReplacement && !context.loadedCampaignSnapshot) {
    missing.push({
      key: "lookupCampaign",
      label: "Existing Meta campaign",
      prompt: "Load the campaign whose creatives you want to replace.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  } else if (isRenewal && !context.renewalReferenceSnapshot) {
    missing.push({
      key: "renewalReference",
      label: "Campaign to renew",
      prompt: "Find and load the Meta campaign you are renewing.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  } else if (isUrlUtm && !context.urlUtmReferenceSnapshot) {
    missing.push({
      key: "urlUtmReference",
      label: "Campaign for URL update",
      prompt: "Find the Meta campaign whose destination URL or UTM tags you are updating.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  }

  if (isSetup) {
    missing.push(...getAdGroupSetupMissingFields(context));
  } else if (isRenewal && !context.renewalUsesAdGroups && !context.campaignGoal) {
    missing.push({
      key: "campaignGoal",
      label: "Campaign objective",
      prompt: "Select a Meta campaign objective (Awareness, Traffic, Engagement, Leads, App Promotion, or Sales).",
      inputType: "info",
      scrollTargetId: "setup-goal-section",
    });
  }

  const needsBrief = (isAddition && context.loadedCampaignSnapshot)
    || isReplacement
    || isRenewal
    || isUrlUtm;

  if (needsBrief && !context.campaignBrief.trim()) {
    missing.push({
      key: "campaignBrief",
      label: "Campaign brief",
      prompt: "Describe goals, offer, audience, and Meta placement requirements.",
      inputType: "textarea",
      placeholder: "Describe goals, offer, audience, and requirements.",
    });
  }

  return missing;
}

export const metaAdsAdapter: PlatformWorkflowAdapter = {
  id: "meta_ads",
  label: "Meta Ads",
  shortLabel: "Meta",
  description: "Feed, Story, and Reels ecosystems tuned for mobile attention and social engagement.",
  taskTypes: STANDARD_CAMPAIGN_TASK_TYPES,
  uploadStrategy: "flat",
  getObjectives: () => META_OBJECTIVES,
  resolveAnalyzerGoal: resolveAnalyzerGoal,
  validationRules: {
    landingUrlRequired: false,
    defaultMaxFileSizeKb: 300,
    minCreativeDimensions: { width: 600, height: 315 },
    uploadGuidance: "Meta Feed supports 1:1 and 4:5; Stories/Reels require 9:16 with safe zones. Keep text overlay under 20% for image ads.",
  },
  previewStudioMode: "static-placements",
  defaultPreviewTemplateId: "facebook_feed",
  getMissingSetupFields: getMetaMissingSetupFields,
  isSetupTask: isCampaignSetupTask,
  isUpdateTask: isCampaignUpdateTask,
  buildSnapshotExtensions: (context) => ({
    metaCampaignType: context.metaCampaignType || "manual",
    metaAdSetCount: context.metaAdSetCount ?? "",
  }),
  analysisPlatform: "meta_ads",
  intelligenceLabel: "Placement Intelligence",
  previewStudioDescription: "Preview Facebook, Instagram, Stories, Reels, Carousel, and Messenger templates with safe-zone overlays.",
  analysisReportLabel: "Meta Ads Analysis Report (PDF)",
  previewReportLabel: "Meta Ads Preview (PDF)",
};

export function getMetaObjectiveRequirements(analyzerGoal: string) {
  return META_OBJECTIVE_REQUIREMENTS[analyzerGoal] || META_OBJECTIVE_REQUIREMENTS.awareness;
}
