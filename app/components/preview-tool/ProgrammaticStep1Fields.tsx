"use client";



import type { ChangeEvent } from "react";

import {
  isProgrammaticCampaignSetup,
  isProgrammaticCreativeAddition,
  isProgrammaticCreativeReplacement,
  isProgrammaticCampaignRenewal,
  isProgrammaticUrlValidationUtmUpdate,
  type ProgrammaticAdGroup,
  type ProgrammaticTaskTypeId,
} from "@/app/lib/programmaticWorkflow";

import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import type { AnalyzerPlatform } from "@/app/lib/platforms/types";
import { getPlatformAdapter } from "@/app/lib/platforms/registry";
import {
  GOOGLE_CAMPAIGN_TYPES,
  type GoogleCampaignType,
} from "@/app/lib/googleCampaignTypes";

import ProgrammaticCreativeAdditionPanel, {

  type CreativeAdditionMode,

} from "@/app/components/preview-tool/ProgrammaticCreativeAdditionPanel";

import ProgrammaticCreativeReplacementPanel from "@/app/components/preview-tool/ProgrammaticCreativeReplacementPanel";

import ProgrammaticCampaignRenewalPanel from "@/app/components/preview-tool/ProgrammaticCampaignRenewalPanel";

import ProgrammaticUrlValidationUtmPanel from "@/app/components/preview-tool/ProgrammaticUrlValidationUtmPanel";

import ProgrammaticAdGroupConfiguration, {
  type AdGroupObjectiveOption,
} from "@/app/components/preview-tool/ProgrammaticAdGroupConfiguration";

import { ToolInput, ToolSelect, ToolTextarea } from "@/app/components/preview-tool/PreviewToolUi";
import CampaignBriefInsightsPanel from "@/app/components/preview-tool/CampaignBriefInsightsPanel";
import type { CampaignBriefInsights } from "@/app/lib/campaignBriefInsights";



type ProgrammaticStep1FieldsProps = {
  platform: AnalyzerPlatform | "";
  taskType: ProgrammaticTaskTypeId | "";

  adGroupCount: number | "";

  adGroups: ProgrammaticAdGroup[];

  selectedAdGroupIds: string[];

  applyAdGroupsToAll: boolean;

  campaignName: string;

  campaignBrief: string;
  campaignProductFocus?: string;
  googleCampaignType?: GoogleCampaignType;

  campaignVertical: string | null;

  landingUrl: string;

  lookupCampaignId: string;

  campaignId: string;

  campaignOwnerId: string | null;

  campaignAccessToken?: string | null;

  advertiserId?: string;

  advertiserName?: string;

  loadedCampaign: ProgrammaticCampaignSnapshot | null;

  creativeAdditionMode: CreativeAdditionMode | "";

  creativeAdditionFindError: string;

  verticals: Array<{ id: string; title: string }>;
  /** Google / Meta display vs video ads (campaign setup only). */
  adType?: "display" | "video";
  onAdTypeChange?: (value: "display" | "video") => void;
  objectiveOptions?: AdGroupObjectiveOption[];
  supportsCustomObjective?: boolean;
  onTaskTypeChange: (value: ProgrammaticTaskTypeId) => void;

  onAdGroupCountChange: (value: number) => void;

  onAdGroupNameChange: (groupId: string, name: string) => void;

  onAdGroupObjectiveChange: (groupId: string, objective: string) => void;

  onAdGroupCustomObjectiveChange: (groupId: string, customObjective: string) => void;

  onAddAdGroup: () => void;

  onRemoveAdGroup: (groupId: string) => void;

  onSelectedAdGroupIdsChange: (groupIds: string[]) => void;

  onApplyAdGroupsToAllChange: (applyToAll: boolean) => void;

  onCampaignNameChange: (value: string) => void;

  onCampaignBriefChange: (value: string) => void;
  onCampaignProductFocusChange?: (value: string) => void;
  onGoogleCampaignTypeChange?: (value: GoogleCampaignType) => void;

  onLandingUrlChange: (value: string) => void;

  onVerticalChange: (value: string) => void;

  onLookupCampaignIdChange: (value: string) => void;

  onFindCampaign: () => void;

  onAdvertiserCampaignSelect?: (campaign: AdvertiserCampaign) => void;

  onCreativeAdditionModeChange: (mode: CreativeAdditionMode) => void;
  campaignIntent?: string;
  effectiveCampaignGoal?: string;
  onBriefInsightsChange?: (insights: CampaignBriefInsights | null) => void;
};



export default function ProgrammaticStep1Fields({
  platform,
  taskType,

  adGroupCount,

  adGroups,

  selectedAdGroupIds,

  applyAdGroupsToAll,

  campaignName,

  campaignBrief,
  campaignProductFocus = "",
  googleCampaignType = "display",

  campaignVertical,

  landingUrl,

  lookupCampaignId,

  campaignId,

  campaignOwnerId,

  campaignAccessToken,

  advertiserId = "",

  advertiserName = "",

  loadedCampaign,

  creativeAdditionMode,

  creativeAdditionFindError,

  verticals,
  adType = "display",
  onAdTypeChange,
  objectiveOptions,
  supportsCustomObjective,
  campaignIntent = "",
  onBriefInsightsChange,
  effectiveCampaignGoal = "",
  onTaskTypeChange,

  onAdGroupCountChange,

  onAdGroupNameChange,

  onAdGroupObjectiveChange,

  onAdGroupCustomObjectiveChange,

  onAddAdGroup,

  onRemoveAdGroup,

  onSelectedAdGroupIdsChange,

  onApplyAdGroupsToAllChange,

  onCampaignNameChange,

  onCampaignBriefChange,
  onCampaignProductFocusChange,
  onGoogleCampaignTypeChange,

  onLandingUrlChange,

  onVerticalChange,

  onLookupCampaignIdChange,

  onFindCampaign,

  onAdvertiserCampaignSelect,

  onCreativeAdditionModeChange,

}: ProgrammaticStep1FieldsProps) {
  const platformAdapter = getPlatformAdapter(platform || "programmatic");
  const taskTypeOptions = platformAdapter.taskTypes;
  const isProgrammatic = platform === "programmatic";
  const showAdTypeSelector = isProgrammaticCampaignSetup(taskType);
  const adGroupObjectiveOptions = objectiveOptions;
  const adGroupSupportsCustomObjective = supportsCustomObjective ?? isProgrammatic;
  const adGroupDescription = isProgrammatic
    ? "Name each ad group and set its objective. You can add more ad groups after choosing an initial count."
    : `Name each ad group and set its ${platformAdapter.shortLabel} objective. Each ad group gets its own creative folder and objective-specific analysis.`;

  const isCampaignSetup = isProgrammaticCampaignSetup(taskType);

  const isCreativeAddition = isProgrammaticCreativeAddition(taskType);

  const isCreativeReplacement = isProgrammaticCreativeReplacement(taskType);

  const isCampaignRenewal = isProgrammaticCampaignRenewal(taskType);

  const isUrlUtmUpdate = isProgrammaticUrlValidationUtmUpdate(taskType);

  const isCampaignDetailsReadOnly =

    (isCreativeAddition && Boolean(creativeAdditionMode))

    || (isCreativeReplacement && Boolean(loadedCampaign));

  const showCampaignDetails = (!isCreativeAddition || Boolean(creativeAdditionMode))

    && (!isCreativeReplacement || Boolean(loadedCampaign))

    && (!isCampaignRenewal || Boolean(loadedCampaign))

    && (!isUrlUtmUpdate || Boolean(loadedCampaign));



  const showAdGroupSetup = isCampaignSetup;

  const showAdGroupSelection = (

    (isCreativeAddition && Boolean(creativeAdditionMode) && Boolean(loadedCampaign) && adGroups.length > 0)

    || (isCreativeReplacement && Boolean(loadedCampaign) && adGroups.length > 0)

    || (isCampaignRenewal && Boolean(loadedCampaign) && adGroups.length > 0)

    || (isUrlUtmUpdate && Boolean(loadedCampaign) && adGroups.length > 0)

  );



  const adGroupSelectionDescription = isCreativeAddition

    ? "Select the ad group(s) where you want to upload new creatives."

    : isCreativeReplacement

      ? "Select the ad group(s) where you want to replace creatives."

      : isCampaignRenewal

        ? "Renewal applies to all ad groups by default. Uncheck to limit changes to specific ad groups."

        : "Select the ad group(s) that should receive URL and UTM updates, or apply to all.";



  return (

    <div className="space-y-8">

      <section className="space-y-5">

        <div>
          <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Task Type</h3>
          <p className="mt-1 text-studio-muted">
            {isProgrammatic
              ? "Choose the programmatic workflow you are running."
              : `Choose the ${platformAdapter.shortLabel} workflow you are running.`}
          </p>
        </div>

        <div className="max-w-xl">

          <label htmlFor="programmatic-task-type" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">

            Task Type

          </label>

          <ToolSelect

            id="programmatic-task-type"

            value={taskType}

            onChange={(event: ChangeEvent<HTMLSelectElement>) => onTaskTypeChange(event.target.value as ProgrammaticTaskTypeId)}

          >

            <option value="" disabled>

              Select a task type

            </option>

            {taskTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}

          </ToolSelect>

        </div>

      </section>

      {platform === "google_ads" && isCampaignSetup ? (
        <section id="google-campaign-type" className="space-y-5">
          <div>
            <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">
              Google Campaign Type
            </h3>
            <p className="mt-1 text-studio-muted">
              Select the inventory architecture used for format, weight, placement, and safe-zone validation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {GOOGLE_CAMPAIGN_TYPES.map((option) => {
              const selected = googleCampaignType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onGoogleCampaignTypeChange?.(option.id)}
                  className={`rounded-xl border px-4 py-4 text-left transition ${
                    selected
                      ? "border-studio-accent bg-studio-accent/10 ring-1 ring-studio-accent"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <span className="block text-sm font-semibold text-studio-text">{option.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-studio-muted">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}



      {isCreativeAddition ? (

        <ProgrammaticCreativeAdditionPanel

          campaignName={campaignName}

          campaignId={lookupCampaignId}

          campaignOwnerId={campaignOwnerId}

          campaignAccessToken={campaignAccessToken}

          advertiserId={advertiserId}

          advertiserName={advertiserName}

          loadedCampaign={loadedCampaign}

          selectedMode={creativeAdditionMode}

          findError={creativeAdditionFindError}

          onCampaignNameChange={onCampaignNameChange}

          onCampaignIdChange={onLookupCampaignIdChange}

          onFindCampaign={onFindCampaign}

          onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}

          onSelectMode={onCreativeAdditionModeChange}

        />

      ) : null}



      {isCreativeReplacement ? (

        <ProgrammaticCreativeReplacementPanel

          campaignName={campaignName}

          campaignId={lookupCampaignId}

          campaignOwnerId={campaignOwnerId}

          campaignAccessToken={campaignAccessToken}

          advertiserId={advertiserId}

          advertiserName={advertiserName}

          loadedCampaign={loadedCampaign}

          findError={creativeAdditionFindError}

          onCampaignNameChange={onCampaignNameChange}

          onCampaignIdChange={onLookupCampaignIdChange}

          onFindCampaign={onFindCampaign}

          onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}

        />

      ) : null}



      {isCampaignRenewal ? (

        <ProgrammaticCampaignRenewalPanel

          campaignName={campaignName}

          campaignId={lookupCampaignId}

          campaignOwnerId={campaignOwnerId}

          campaignAccessToken={campaignAccessToken}

          advertiserId={advertiserId}

          advertiserName={advertiserName}

          loadedCampaign={loadedCampaign}

          findError={creativeAdditionFindError}

          onCampaignNameChange={onCampaignNameChange}

          onCampaignIdChange={onLookupCampaignIdChange}

          onFindCampaign={onFindCampaign}

          onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}

        />

      ) : null}



      {isUrlUtmUpdate ? (

        <ProgrammaticUrlValidationUtmPanel

          campaignName={campaignName}

          campaignId={lookupCampaignId}

          campaignOwnerId={campaignOwnerId}

          campaignAccessToken={campaignAccessToken}

          advertiserId={advertiserId}

          advertiserName={advertiserName}

          loadedCampaign={loadedCampaign}

          findError={creativeAdditionFindError}

          onCampaignNameChange={onCampaignNameChange}

          onCampaignIdChange={onLookupCampaignIdChange}

          onFindCampaign={onFindCampaign}

          onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}

        />

      ) : null}



      {showAdGroupSetup ? (

        <ProgrammaticAdGroupConfiguration
          mode="setup"
          adGroupCount={adGroupCount}
          adGroups={adGroups}
          description={adGroupDescription}
          objectiveOptions={adGroupObjectiveOptions}
          supportsCustomObjective={adGroupSupportsCustomObjective}
          onAdGroupCountChange={onAdGroupCountChange}

          onAdGroupNameChange={onAdGroupNameChange}

          onAdGroupObjectiveChange={onAdGroupObjectiveChange}

          onAdGroupCustomObjectiveChange={onAdGroupCustomObjectiveChange}

          onAddAdGroup={onAddAdGroup}

          onRemoveAdGroup={onRemoveAdGroup}

        />

      ) : null}



      {showAdGroupSelection ? (

        <ProgrammaticAdGroupConfiguration
          mode="select"
          adGroupCount={adGroupCount}
          adGroups={adGroups}
          selectedGroupIds={selectedAdGroupIds}
          applyToAll={applyAdGroupsToAll}
          allowEditStructure
          description={`${adGroupSelectionDescription} You can add new ad groups for additional creatives without affecting existing groups.`}
          objectiveOptions={adGroupObjectiveOptions}
          supportsCustomObjective={adGroupSupportsCustomObjective}
          onAdGroupNameChange={onAdGroupNameChange}

          onAdGroupObjectiveChange={onAdGroupObjectiveChange}

          onAdGroupCustomObjectiveChange={onAdGroupCustomObjectiveChange}

          onAddAdGroup={onAddAdGroup}

          onRemoveAdGroup={onRemoveAdGroup}

          onSelectedGroupIdsChange={onSelectedAdGroupIdsChange}

          onApplyToAllChange={onApplyAdGroupsToAllChange}

        />

      ) : null}



      {showCampaignDetails ? (

        <section className="space-y-5">

          <div>

            <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Campaign Details</h3>

            <p className="mt-1 text-studio-muted">

              {isCampaignDetailsReadOnly

                ? "Loaded campaign settings are fixed for reference. Continue to upload creatives in the next step."

                : isCreativeAddition || isCreativeReplacement

                ? "Review the loaded campaign settings before uploading creatives."

                : isCampaignRenewal

                  ? "Update campaign settings for the renewed campaign. Previous values are pre-filled for reference."

                  : isUrlUtmUpdate

                    ? "Review loaded campaign context. URL and UTM updates happen in Step 2."

                    : isCampaignSetup

                      ? "Save this Campaign ID with your campaign name. You will need both to load this campaign in other task types."

                      : "Used for readiness scoring, mismatch detection, and report export."}

            </p>

          </div>

          <div className="max-w-xl space-y-5">

            {isCampaignDetailsReadOnly ? (

              <>

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                    Campaign Name

                  </label>

                  <ToolInput type="text" value={campaignName} readOnly className="opacity-90" />

                </div>

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                    Campaign ID

                  </label>

                  <ToolInput

                    type="text"

                    value={loadedCampaign?.id || lookupCampaignId}

                    readOnly

                    className="font-mono opacity-90"

                  />

                </div>

              </>

            ) : null}

            {!isCreativeAddition && !isCreativeReplacement ? (

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                  Campaign Name

                </label>

                <ToolInput

                  type="text"

                  value={campaignName}

                  onChange={(event: ChangeEvent<HTMLInputElement>) => onCampaignNameChange(event.target.value)}

                  placeholder="e.g. Q2 Running Shoes Awareness"

                />

              </div>

            ) : null}

            {isCampaignSetup && campaignId ? (

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                  Campaign ID

                </label>

                <ToolInput

                  type="text"

                  value={campaignId}

                  readOnly

                  className="font-mono opacity-90"

                />

                <p className="mt-2 text-xs text-studio-tertiary">

                  Auto-generated for this campaign. Use this ID with the campaign name to load this campaign later.

                </p>

              </div>

            ) : null}

            {!isCampaignSetup && !isCampaignDetailsReadOnly && (loadedCampaign?.id || lookupCampaignId) ? (

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                  Campaign ID

                </label>

                <ToolInput

                  type="text"

                  value={loadedCampaign?.id || lookupCampaignId}

                  readOnly

                  className="font-mono opacity-90"

                />

                <p className="mt-2 text-xs text-studio-tertiary">

                  Existing campaign ID. Updates will be saved against this ID.

                </p>

              </div>

            ) : null}

            {showAdTypeSelector ? (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">
                  Ad Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "display" as const, title: "Display Ads", desc: "Image / banner creatives" },
                    {
                      id: "video" as const,
                      title: "Video Ads",
                      desc: isProgrammatic
                        ? "VAST in-stream / out-stream video"
                        : platform === "meta_ads"
                          ? "MP4 / MOV for Feed & Reels"
                          : "MP4 / MOV / WebM for YouTube",
                    },
                  ].map((option) => {
                    const selected = adType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onAdTypeChange?.(option.id)}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-studio-accent bg-studio-accent/10 ring-1 ring-studio-accent"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25"
                        }`}
                      >
                        <span className={`block text-sm font-semibold ${selected ? "text-studio-text" : "text-studio-text/90"}`}>
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-studio-muted">{option.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[#9a9aad]">
                  {adType === "video"
                    ? "Uploads and URL validation switch to video ad–specific checks."
                    : "Uploads and URL validation use display (image) ad checks."}
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">
                  Offer Context
                </label>
                <ToolTextarea
                  value={campaignProductFocus}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onCampaignProductFocusChange?.(event.target.value)}
                  placeholder="Describe the product, price, promotion, incentive, or value proposition shown in the ads and landing page."
                  rows={3}
                  readOnly={isCampaignDetailsReadOnly}
                  className={isCampaignDetailsReadOnly ? "opacity-90" : ""}
                />
                <p className="mt-2 text-xs text-studio-tertiary">
                  Used to validate creative messaging, CTA expectations, and landing-page offer continuity.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">
                  Campaign Brief
                </label>
                <ToolTextarea
                  value={campaignBrief}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onCampaignBriefChange(event.target.value)}
                  placeholder="Describe campaign goals, product, requirements, and context."
                  rows={4}
                  readOnly={isCampaignDetailsReadOnly}
                  className={isCampaignDetailsReadOnly ? "opacity-90" : ""}
                />
                <p className="mt-2 text-xs text-studio-tertiary">
                  Intent and audience update automatically as you edit the brief.
                </p>
              </div>

              <CampaignBriefInsightsPanel
                campaignBrief={campaignBrief}
                campaignGoal={effectiveCampaignGoal || undefined}
                vertical={campaignVertical || undefined}
                platform={platform || undefined}
                preferredIntent={campaignIntent}
                onInsightsChange={onBriefInsightsChange}
              />
            </div>

            <div>

              <label htmlFor="programmatic-campaign-vertical" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">

                Vertical

              </label>

              <ToolSelect

                id="programmatic-campaign-vertical"

                value={campaignVertical || ""}

                onChange={(event: ChangeEvent<HTMLSelectElement>) => onVerticalChange(event.target.value)}

                disabled={isCampaignDetailsReadOnly}

                className={isCampaignDetailsReadOnly ? "opacity-90" : ""}

              >

                <option value="" disabled>

                  Select an industry vertical

                </option>

                {verticals.map((vertical) => (

                  <option key={vertical.id} value={vertical.id}>

                    {vertical.title}

                  </option>

                ))}

              </ToolSelect>

            </div>

            {isCreativeAddition || isCreativeReplacement || isCampaignRenewal || isUrlUtmUpdate ? (

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                  Landing Page URL

                </label>

                <ToolInput

                  type="url"

                  value={landingUrl}

                  onChange={(event: ChangeEvent<HTMLInputElement>) => onLandingUrlChange(event.target.value)}

                  placeholder="https://www.example.com/landing"

                  readOnly={isCampaignDetailsReadOnly}

                  className={isCampaignDetailsReadOnly ? "opacity-90" : ""}

                />

              </div>

            ) : null}

          </div>

        </section>

      ) : null}

    </div>

  );

}


