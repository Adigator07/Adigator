import type { SetupFieldContext, SetupMissingField } from "@/app/lib/setupRequiredFields";
import {
  GOOGLE_OBJECTIVES,
  resolveAnalyzerGoal,
} from "@/app/lib/campaignObjectives";
import { GOOGLE_OBJECTIVE_REQUIREMENTS } from "@/app/constants/googleSpecs";
import type { PlatformWorkflowAdapter } from "@/app/lib/platforms/types";
import {
  STANDARD_CAMPAIGN_TASK_TYPES,
  isCampaignRenewalTask,
  isCampaignSetupTask,
  isCampaignUpdateTask,
  isCreativeAdditionTask,
  isCreativeReplacementTask,
  isUrlUtmUpdateTask,
} from "@/app/lib/platforms/sharedTaskTypes";

function getGoogleMissingSetupFields(context: SetupFieldContext): SetupMissingField[] {
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
      label: "Google Ads workflow",
      prompt: "Select the Google Ads workflow you are running.",
      inputType: "select",
      options: STANDARD_CAMPAIGN_TASK_TYPES.map((item) => ({ value: item.id, label: item.label })),
      scrollTargetId: "platform-task-type",
    });
  }

  if (isAddition && !context.loadedCampaignSnapshot) {
    missing.push({
      key: "lookupCampaign",
      label: "Existing Google Ads campaign",
      prompt: "Find the campaign you want to add creatives to.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  } else if (isReplacement && !context.loadedCampaignSnapshot) {
    missing.push({
      key: "lookupCampaign",
      label: "Existing Google Ads campaign",
      prompt: "Load the campaign whose creatives you want to replace.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  } else if (isRenewal && !context.renewalReferenceSnapshot) {
    missing.push({
      key: "renewalReference",
      label: "Campaign to renew",
      prompt: "Find and load the Google Ads campaign you are renewing.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  } else if (isUrlUtm && !context.urlUtmReferenceSnapshot) {
    missing.push({
      key: "urlUtmReference",
      label: "Campaign for URL update",
      prompt: "Find the Google Ads campaign whose destination URL or UTM tags you are updating.",
      inputType: "text",
      placeholder: "Campaign ID or search by name",
      scrollTargetId: "platform-campaign-lookup",
    });
  }

  if (!context.campaignGoal && (isSetup || (isRenewal && !context.renewalUsesAdGroups))) {
    missing.push({
      key: "campaignGoal",
      label: "Campaign objective",
      prompt: "Select a Google Ads campaign objective (Sales, Leads, Traffic, etc.).",
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
      prompt: "Describe goals, offer, audience, and Google Ads requirements.",
      inputType: "textarea",
      placeholder: "Describe goals, offer, audience, and requirements.",
    });
  }

  if (isSetup && !context.landingUrl.trim()) {
    missing.push({
      key: "landingUrl",
      label: "Final URL",
      prompt: "Google Ads display campaigns require a valid final URL for destination validation.",
      inputType: "url",
      placeholder: "https://www.example.com/landing",
      scrollTargetId: "campaign-landing-url",
    });
  }

  return missing;
}

export const googleAdsAdapter: PlatformWorkflowAdapter = {
  id: "google_ads",
  label: "Google Ads",
  shortLabel: "Google",
  description: "Display inventory and responsive placements optimized for intent-rich contexts.",
  taskTypes: STANDARD_CAMPAIGN_TASK_TYPES,
  uploadStrategy: "flat",
  getObjectives: () => GOOGLE_OBJECTIVES,
  resolveAnalyzerGoal: resolveAnalyzerGoal,
  validationRules: {
    landingUrlRequired: true,
    defaultMaxFileSizeKb: 150,
    uploadGuidance: "Use IAB standard display sizes. Responsive Display Ads support landscape (1.91:1), square (1:1), and logo assets per Google specs.",
  },
  previewStudioMode: "static-placements",
  defaultPreviewTemplateId: "display",
  getMissingSetupFields: getGoogleMissingSetupFields,
  isSetupTask: isCampaignSetupTask,
  isUpdateTask: isCampaignUpdateTask,
  buildSnapshotExtensions: (context) => ({
    googleCampaignType: context.googleCampaignType || "display",
    googleAdGroupCount: context.googleAdGroupCount ?? "",
  }),
  analysisPlatform: "google_ads",
  intelligenceLabel: "Inventory Intelligence",
  previewStudioDescription: "Preview Google Search, Display, Shopping, and App Install templates with safe-zone and crop analysis.",
  analysisReportLabel: "Google Ads Analysis Report (PDF)",
  previewReportLabel: "Google Ads Preview (PDF)",
};

export function getGoogleObjectiveRequirements(analyzerGoal: string) {
  return GOOGLE_OBJECTIVE_REQUIREMENTS[analyzerGoal] || GOOGLE_OBJECTIVE_REQUIREMENTS.awareness;
}
