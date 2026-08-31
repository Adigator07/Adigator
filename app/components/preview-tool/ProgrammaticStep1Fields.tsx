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
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
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

import type { AdGroupObjectiveOption } from "@/app/components/preview-tool/ProgrammaticAdGroupConfiguration";

import { ToolInput, ToolSelect, ToolTextarea } from "@/app/components/preview-tool/PreviewToolUi";
import CampaignBriefInsightsPanel from "@/app/components/preview-tool/CampaignBriefInsightsPanel";
import type { CampaignBriefInsights } from "@/app/lib/campaignBriefInsights";

function formatImportedBudget(amountMicros?: number) {
  if (!amountMicros) return "—";
  return (Number(amountMicros) / 1_000_000).toFixed(2);
}



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

  loadedCampaign: CampaignSnapshot | null;

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
  campaignIntent = "",
  onBriefInsightsChange,
  effectiveCampaignGoal = "",
  onTaskTypeChange,

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
                      : "border-white/10 bg-white/3 hover:border-white/25"
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

          platform={platform}

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

          platform={platform}

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

          platform={platform}

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

          platform={platform}

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

      {platform === "google_ads" && loadedCampaign?.importSource === "google_ads" ? (
        <section className="space-y-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-5">
          <div>
            <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Imported Google Ads Summary</h3>
            <p className="mt-1 text-studio-muted">
              This campaign was imported from your connected Google Ads account. Name, brief, URL, objective, type, ad groups, and creatives are populated automatically for Creative Validation and Campaign Intelligence.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">Customer ID</p>
              <p className="mt-2 text-sm font-semibold text-studio-text">{loadedCampaign.googleAdsCustomerId || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">Campaign Status</p>
              <p className="mt-2 text-sm font-semibold text-studio-text">{loadedCampaign.googleAdsCampaignStatus || "—"}</p>
              <p className="mt-1 text-[11px] text-studio-tertiary">{loadedCampaign.googleAdsCampaignSource === "draft" ? "Source: Draft" : "Source: Published"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">Channel Summary</p>
              <p className="mt-2 text-sm font-semibold text-studio-text">{loadedCampaign.googleAdsChannelSummary || loadedCampaign.googleAdsChannelType || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">Start Date</p>
              <p className="mt-2 text-sm font-semibold text-studio-text">{loadedCampaign.googleAdsStartDate || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">End Date</p>
              <p className="mt-2 text-sm font-semibold text-studio-text">{loadedCampaign.googleAdsEndDate || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">Budget</p>
              <p className="mt-2 text-sm font-semibold text-studio-text">{formatImportedBudget(loadedCampaign.googleAdsBudgetAmountMicros)}</p>
            </div>
          </div>
        </section>
      ) : null}



      {showCampaignDetails ? (

        <section className="space-y-5">

          <div>

            <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Campaign Details</h3>

            <p className="mt-1 text-studio-muted">

              {isCampaignDetailsReadOnly
                ? loadedCampaign?.importSource === "google_ads"
                  ? "Imported Google Ads details, ad groups, and creatives are already filled in. Review them below — extra uploads are optional."
                  : "Loaded campaign settings are fixed for reference. Continue to upload creatives below."

                : isCreativeAddition || isCreativeReplacement

                ? "Review the loaded campaign settings before uploading creatives."

                : isCampaignRenewal

                  ? "Update campaign settings for the renewed campaign. Previous values are pre-filled for reference."

                  : isUrlUtmUpdate

                    ? "Review loaded campaign context. URL and UTM updates happen below."

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

                <label htmlFor="campaign-name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                  Campaign Name <span className="text-red-500">*</span>

                </label>

                <ToolInput

                  id="campaign-name"

                  type="text"

                  value={campaignName}

                  onChange={(event: ChangeEvent<HTMLInputElement>) => onCampaignNameChange(event.target.value)}

                  placeholder="e.g. Q2 Running Shoes Awareness"

                  required

                  aria-required="true"

                />

              </div>

            ) : null}

            {isCampaignSetup && (campaignId || lookupCampaignId || loadedCampaign?.id) ? (

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">

                  Campaign ID

                </label>

                <ToolInput

                  type="text"

                  value={campaignId || lookupCampaignId || loadedCampaign?.id || ""}

                  readOnly

                  className="font-mono opacity-90"

                />

                <p className="mt-2 text-xs text-studio-tertiary">

                  {platform === "google_ads"
                    ? "Filled automatically from the Google Ads campaign you imported."
                    : "Auto-generated for this campaign. Use this ID with the campaign name to load this campaign later."}

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
              <div id="campaign-ad-type">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">
                  Ad Type <span className="text-red-500">*</span>
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
                            : "border-white/10 bg-white/3 hover:border-white/25"
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
                <label htmlFor="campaign-brief" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9a9aad]">
                  Campaign Brief <span className="text-red-500">*</span>
                </label>
                <ToolTextarea
                  id="campaign-brief"
                  value={campaignBrief}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onCampaignBriefChange(event.target.value)}
                  placeholder="Describe campaign goals, product, requirements, and context."
                  rows={4}
                  readOnly={isCampaignDetailsReadOnly}
                  className={isCampaignDetailsReadOnly ? "opacity-90" : ""}
                  required
                  aria-required="true"
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

                Vertical <span className="text-red-500">*</span>

              </label>

              <ToolSelect

                id="programmatic-campaign-vertical"

                value={campaignVertical || ""}

                onChange={(event: ChangeEvent<HTMLSelectElement>) => onVerticalChange(event.target.value)}

                disabled={isCampaignDetailsReadOnly}

                required

                aria-required="true"

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


