"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  ImageIcon,
  Layers,
  Loader2,
  Megaphone,
  MonitorPlay,
  X,
} from "lucide-react";

import type {
  Advertiser,
  AdvertiserAdGroup,
  AdvertiserCampaign,
  AdvertiserCreativeRef,
} from "@/app/lib/advertiserStore";
import { isBlockedAdvertiserName, resolveCampaignBriefAndIntent } from "@/app/lib/advertiserStore";
import { labelProgrammaticTaskType } from "@/app/lib/programmaticWorkflow";
import CampaignAnalysisOverview from "@/app/components/dashboard/CampaignAnalysisOverview";
import CampaignPreviewStudioPanel from "@/app/components/dashboard/CampaignPreviewStudioPanel";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LoadingState } from "@/app/components/ui/LoadingState";
import { findDashboardCampaignSnapshot } from "@/app/lib/dashboardCampaignContext";
import {
  hydrateCreativeRecord,
  hydrateCreativesList,
  setCreativeStorageScope,
} from "@/app/lib/creativeAssetStore";

type AdvertisersSectionProps = {
  advertisers: Advertiser[];
  loading?: boolean;
  ownerId?: string;
  loadingProgress?: number;
};

type SelectedCreative = {
  advertiserName: string;
  campaignName: string;
  adGroupName: string;
  creative: AdvertiserCreativeRef;
};

type CampaignDetailTab = "campaigns" | "analysis" | "preview";

const LEVEL_STYLES = {
  advertiser: "border-sky-200/80 bg-linear-to-br from-sky-50/90 to-cyan-50/80",
  campaign: "border-sky-200/80 bg-linear-to-br from-white to-sky-50/80",
  adGroup: "border-emerald-200/80 bg-linear-to-br from-emerald-50/80 to-white",
  creative: "border-amber-200/80 bg-linear-to-br from-amber-50/70 to-white",
  analysis: "border-violet-200/80 bg-linear-to-br from-violet-50/80 to-white",
} as const;

function LevelPanel({
  level,
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}: {
  level: keyof typeof LEVEL_STYLES;
  title: string;
  subtitle?: string;
  icon: typeof Building2;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${LEVEL_STYLES[level]} ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-white shadow-sm">
          <Icon size={16} className="text-sky-600" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
          {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-800">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function TabBar({
  active,
  onChange,
  adGroupCount,
  hasAnalysis,
  previewCount,
}: {
  active: CampaignDetailTab;
  onChange: (tab: CampaignDetailTab) => void;
  adGroupCount: number;
  hasAnalysis: boolean;
  previewCount: number;
}) {
  const tabs: Array<{ id: CampaignDetailTab; label: string; count: number | null; icon: typeof Layers }> = [
    { id: "campaigns", label: "Ad Groups & Creatives", count: adGroupCount, icon: Layers },
    { id: "analysis", label: "Analysis", count: hasAnalysis ? 1 : 0, icon: BarChart3 },
    { id: "preview", label: "Preview Studio", count: previewCount, icon: MonitorPlay },
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-sky-100 pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              selected
                ? "border-sky-300 bg-sky-100 text-sky-700"
                : "border-sky-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700"
            }`}
          >
            <Icon size={15} />
            {tab.label}
            {tab.count !== null ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                selected ? "bg-sky-200 text-sky-700" : "bg-sky-50 text-slate-500"
              }`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AdvertiserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-linear-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white shadow-sm">
      {initial}
    </div>
  );
}

function ScrollableCampaignTextCell({
  text,
  emptyLabel,
}: {
  text: string;
  emptyLabel: string;
}) {
  if (!text.trim()) {
    return <span className="text-xs text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className="w-full rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2.5">
      <div className="max-h-28 overflow-y-auto overscroll-contain pr-1 text-xs leading-relaxed text-slate-600 [scrollbar-width:thin] [scrollbar-color:rgba(14,165,233,0.2)_transparent]">
        <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
      </div>
    </div>
  );
}

function CampaignBriefCell({ brief }: { brief: string }) {
  return <ScrollableCampaignTextCell text={brief} emptyLabel="No brief" />;
}

function CampaignIntentCell({ intentLine }: { intentLine: string }) {
  return <ScrollableCampaignTextCell text={intentLine} emptyLabel="No intent" />;
}

function TaskTypeCell({ taskType }: { taskType?: string }) {
  const label = labelProgrammaticTaskType(taskType);
  if (label === "—") {
    return <span className="text-xs text-slate-400">Not set</span>;
  }
  return (
    <span className="inline-flex max-w-full rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
      {label}
    </span>
  );
}

function EyeToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
        active
          ? "border-sky-300 bg-sky-100 text-sky-700"
          : "border-sky-200 bg-white text-slate-500 hover:border-sky-300 hover:text-sky-700"
      }`}
    >
      <Eye size={15} />
    </button>
  );
}

function StatusBadge({ validated }: { validated: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        validated
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border border-sky-100 bg-white text-slate-500"
      }`}
    >
      {validated ? "Validated" : "In progress"}
    </span>
  );
}

function CreativePreviewPanel({
  selection,
  onClose,
  loading = false,
}: {
  selection: SelectedCreative;
  onClose: () => void;
  loading?: boolean;
}) {
  const { creative, advertiserName, campaignName, adGroupName } = selection;
  const downloadUrl = creative.fullUrl || creative.previewUrl;

  return (
    <LevelPanel level="creative" title="Creative preview" subtitle={creative.name} icon={ImageIcon} className="mt-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-white/45">
          {advertiserName} · {campaignName} · {adGroupName}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-slate-500 transition hover:border-sky-300 hover:text-sky-700"
          aria-label="Close creative preview"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="flex min-h-45 flex-1 items-center justify-center overflow-hidden rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-white/45">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm text-slate-500">Loading preview…</p>
            </div>
          ) : creative.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creative.previewUrl}
              alt={creative.name}
              className="max-h-72 max-w-full rounded-lg object-contain shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImageIcon size={40} />
              <p className="text-sm">No preview available</p>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 space-y-3 lg:w-56">
          <DetailRow label="Size" value={creative.size || "Unknown"} />
          <DetailRow
            label="Validation"
            value={creative.valid === true ? "Valid" : creative.valid === false ? "Invalid" : "Not checked"}
            tone={creative.valid === true ? "success" : creative.valid === false ? "error" : "muted"}
          />
          <DetailRow label="Creative ID" value={creative.id} mono />
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download={`${creative.name || "creative"}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              <Download size={14} />
              Download creative
            </a>
          ) : null}
        </div>
      </div>
    </LevelPanel>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  tone = "default",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "default" | "success" | "error" | "muted";
}) {
  const valueClass = tone === "success"
    ? "text-emerald-700"
    : tone === "error"
      ? "text-red-600"
      : tone === "muted"
        ? "text-slate-500"
        : "text-slate-700";

  return (
    <div className="rounded-lg border border-sky-100 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-medium break-all ${mono ? "font-mono text-xs" : ""} ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function CreativesTable({
  creatives,
  selectedCreativeId,
  getPreviewUrl,
  onSelectCreative,
}: {
  creatives: AdvertiserCreativeRef[];
  selectedCreativeId: string | null;
  getPreviewUrl: (creative: AdvertiserCreativeRef) => string | undefined;
  onSelectCreative: (creative: AdvertiserCreativeRef) => void;
}) {
  if (!creatives.length) {
    return <p className="px-1 py-2 text-xs text-slate-500">No creatives stored for this ad group yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white">
      <table className="w-full min-w-120 text-left text-sm">
        <thead>
          <tr className="border-b border-sky-100 bg-white/3">
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Preview</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">Name</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">Size</th>
            <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">Status</th>
            <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-white/35">View</th>
          </tr>
        </thead>
        <tbody>
          {creatives.map((creative) => {
            const selected = selectedCreativeId === creative.id;
            const previewUrl = getPreviewUrl(creative);
            return (
              <tr
                key={creative.id}
                className={`border-b border-sky-100 transition hover:bg-sky-50/60 ${selected ? "bg-sky-100/70" : ""}`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-sky-100 bg-sky-50/80">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={14} className="text-slate-400" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-800">{creative.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{creative.size || "—"}</td>
                <td className="px-3 py-2.5">
                  {creative.valid === true ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-300">
                      <CheckCircle2 size={12} /> Valid
                    </span>
                  ) : creative.valid === false ? (
                    <span className="text-xs text-red-600">Invalid</span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <EyeToggleButton
                    active={selected}
                    label={`View ${creative.name}`}
                    onClick={() => onSelectCreative(creative)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdGroupsPanel({
  adGroups,
  campaignId,
  expandedAdGroupKey,
  onToggleAdGroup,
  selectedCreativeId,
  getPreviewUrl,
  onSelectCreative,
}: {
  adGroups: AdvertiserAdGroup[];
  campaignId: string;
  expandedAdGroupKey: string | null;
  onToggleAdGroup: (key: string) => void;
  selectedCreativeId: string | null;
  getPreviewUrl: (creative: AdvertiserCreativeRef) => string | undefined;
  onSelectCreative: (creative: AdvertiserCreativeRef, adGroupName: string) => void;
}) {
  if (!adGroups.length) {
    return <p className="text-xs text-slate-500">No ad groups recorded for this campaign yet.</p>;
  }

  return (
    <div className="space-y-3">
      {adGroups.map((group) => {
        const key = `${campaignId}:${group.id}`;
        const expanded = expandedAdGroupKey === key;

        return (
          <div
            key={group.id}
            className={`rounded-xl border transition ${expanded ? "border-emerald-200 bg-emerald-50/80" : "border-sky-100 bg-white"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Layers size={15} className="shrink-0 text-emerald-400/80" />
                <div>
                  <p className="font-semibold text-slate-800">{group.name}</p>
                  <p className="text-xs text-slate-500">
                    {group.objectiveLabel || "Not set"} · {group.creatives.length} creative{group.creatives.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <EyeToggleButton
                active={expanded}
                label={`View creatives for ${group.name}`}
                onClick={() => onToggleAdGroup(key)}
              />
            </div>

            {expanded ? (
              <div className="border-t border-emerald-500/20 px-4 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  Creatives
                </p>
                <CreativesTable
                  creatives={group.creatives}
                  selectedCreativeId={selectedCreativeId}
                  getPreviewUrl={getPreviewUrl}
                  onSelectCreative={(creative) => onSelectCreative(creative, group.name)}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CampaignDetailPanel({
  campaign,
  advertiserName,
  ownerId,
  detailTab,
  onDetailTabChange,
  expandedAdGroupKey,
  onToggleAdGroup,
  selectedCreative,
  onSelectCreative,
  getPreviewUrl,
}: {
  campaign: AdvertiserCampaign;
  advertiserName: string;
  ownerId: string;
  detailTab: CampaignDetailTab;
  onDetailTabChange: (tab: CampaignDetailTab) => void;
  expandedAdGroupKey: string | null;
  onToggleAdGroup: (key: string) => void;
  selectedCreative: SelectedCreative | null;
  onSelectCreative: (ctx: Omit<SelectedCreative, "creative">, creative: AdvertiserCreativeRef) => void;
  getPreviewUrl: (creative: AdvertiserCreativeRef) => string | undefined;
}) {
  const snapshot = useMemo(
    () => findDashboardCampaignSnapshot(campaign.id, ownerId),
    [campaign.id, ownerId],
  );

  const adGroupCount = campaign.adGroups.length;
  const creativeCount = campaign.adGroups.reduce((total, group) => total + group.creatives.length, 0);
  const previewCount = Array.isArray(snapshot?.creatives)
    ? snapshot!.creatives.filter((item) => item.valid !== false).length
    : creativeCount;
  const hasAnalysis = Boolean(snapshot?.analysisResult?.length || campaign.validated);

  return (
    <LevelPanel
      level="campaign"
      title="Selected campaign"
      subtitle={campaign.name}
      icon={Megaphone}
      className="mt-4"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span className="font-mono">{campaign.id}</span>
        <span>·</span>
        <StatusBadge validated={campaign.validated} />
        <span>·</span>
        <span>{adGroupCount} ad group{adGroupCount === 1 ? "" : "s"}</span>
        <span>·</span>
        <span>{creativeCount} creative{creativeCount === 1 ? "" : "s"}</span>
      </div>

      <TabBar
        active={detailTab}
        onChange={onDetailTabChange}
        adGroupCount={adGroupCount}
        hasAnalysis={hasAnalysis}
        previewCount={previewCount}
      />

      {detailTab === "campaigns" ? (
        <LevelPanel level="adGroup" title="Ad groups & creatives" subtitle={campaign.name} icon={Layers}>
          <AdGroupsPanel
            adGroups={campaign.adGroups}
            campaignId={campaign.id}
            expandedAdGroupKey={expandedAdGroupKey}
            onToggleAdGroup={onToggleAdGroup}
            selectedCreativeId={
              selectedCreative?.creative.id
              && selectedCreative.campaignName === campaign.name
                ? selectedCreative.creative.id
                : null
            }
            getPreviewUrl={getPreviewUrl}
            onSelectCreative={(creative, adGroupName) => onSelectCreative(
              { advertiserName, campaignName: campaign.name, adGroupName },
              creative,
            )}
          />
        </LevelPanel>
      ) : detailTab === "analysis" ? (
        <CampaignAnalysisOverview
          key={`${campaign.id}-${campaign.updatedAt}-${campaign.taskType || ""}`}
          campaign={campaign}
          ownerId={ownerId}
          advertiserName={advertiserName}
        />
      ) : (
        <CampaignPreviewStudioPanel
          key={`${campaign.id}-${campaign.updatedAt}-${campaign.taskType || ""}-preview`}
          campaign={campaign}
          ownerId={ownerId}
          advertiserName={advertiserName}
        />
      )}
    </LevelPanel>
  );
}

function getCampaignBriefDisplay(
  campaign: AdvertiserCampaign,
  ownerId: string,
): { brief: string; intentLine: string } {
  const storedBrief = campaign.campaignBrief?.trim();
  const storedIntent = campaign.campaignIntent?.trim();
  if (storedBrief && storedIntent) {
    return { brief: storedBrief, intentLine: storedIntent };
  }
  const resolved = resolveCampaignBriefAndIntent(campaign, ownerId, { readOnly: true });
  return { brief: resolved.brief, intentLine: resolved.intentLine };
}

const CampaignTableRow = memo(function CampaignTableRow({
  campaign,
  brief,
  intentLine,
  selected,
  onSelectCampaign,
}: {
  campaign: AdvertiserCampaign;
  brief: string;
  intentLine: string;
  selected: boolean;
  onSelectCampaign: (campaignId: string) => void;
}) {
  return (
    <tr
      className={`border-b border-white/6 transition hover:bg-white/3 ${selected ? "bg-blue-500/10" : ""}`}
    >
      <td className="px-3 py-3 align-top">
        <p className="wrap-break-word font-medium leading-snug text-slate-800">{campaign.name}</p>
      </td>
      <td className="px-3 py-3 align-top">
        <TaskTypeCell taskType={campaign.taskType} />
      </td>
      <td className="px-3 py-3 align-top">
        <p className="break-all font-mono text-[11px] leading-relaxed text-slate-500" title={campaign.id}>
          {campaign.id}
        </p>
      </td>
      <td className="px-3 py-3 align-top">
        <CampaignBriefCell brief={brief} />
      </td>
      <td className="px-3 py-3 align-top">
        <CampaignIntentCell intentLine={intentLine} />
      </td>
      <td className="px-3 py-3 align-top text-slate-500">{campaign.adGroups.length}</td>
      <td className="px-3 py-3 align-top"><StatusBadge validated={campaign.validated} /></td>
      <td className="px-3 py-3 align-top text-right">
        <EyeToggleButton
          active={selected}
          label={`Open ${campaign.name}`}
          onClick={() => onSelectCampaign(campaign.id)}
        />
      </td>
    </tr>
  );
});
function AdvertiserFocusView({
  advertiser,
  ownerId,
  expandedCampaignId,
  campaignDetailTab,
  expandedAdGroupKey,
  selectedCreative,
  previewLoadingId,
  onBack,
  onSelectCampaign,
  onDetailTabChange,
  onToggleAdGroup,
  onSelectCreative,
  onCloseCreative,
  getPreviewUrl,
}: {
  advertiser: Advertiser;
  ownerId: string;
  expandedCampaignId: string | null;
  campaignDetailTab: CampaignDetailTab;
  expandedAdGroupKey: string | null;
  selectedCreative: SelectedCreative | null;
  previewLoadingId: string | null;
  onBack: () => void;
  onSelectCampaign: (campaignId: string) => void;
  onDetailTabChange: (tab: CampaignDetailTab) => void;
  onToggleAdGroup: (key: string) => void;
  onSelectCreative: (ctx: Omit<SelectedCreative, "creative">, creative: AdvertiserCreativeRef) => void;
  onCloseCreative: () => void;
  getPreviewUrl: (creative: AdvertiserCreativeRef) => string | undefined;
}) {
  const selectedCampaign = expandedCampaignId
    ? advertiser.campaigns.find((item) => item.id === expandedCampaignId) || null
    : null;

  const campaignDisplayById = useMemo(() => {
    const map = new Map<string, { brief: string; intentLine: string }>();
    advertiser.campaigns.forEach((campaign) => {
      map.set(campaign.id, getCampaignBriefDisplay(campaign, ownerId));
    });
    return map;
  }, [advertiser.campaigns, ownerId]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
      >
        <ArrowLeft size={16} />
        All advertisers
      </button>

      <LevelPanel level="advertiser" title="Advertiser" subtitle={advertiser.name} icon={Building2}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AdvertiserAvatar name={advertiser.name} />
          <div>
            <p className="font-mono text-xs text-slate-500">{advertiser.id}</p>
            <p className="mt-1 text-xs text-slate-500">
              {advertiser.campaigns.length} campaign{advertiser.campaigns.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {advertiser.campaigns.length ? (
          <div className="overflow-hidden rounded-xl border border-sky-200/80 bg-linear-to-br from-white via-sky-50/70 to-emerald-50/70">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[23%]" />
                <col className="w-[23%]" />
                <col className="w-[6%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/70">
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Campaign</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Task Type</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Campaign ID</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Campaign Brief</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Campaign Intent</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Ad Groups</th>
                  <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Status</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Open</th>
                </tr>
              </thead>
              <tbody>
                {advertiser.campaigns.map((campaign) => {
                  const display = campaignDisplayById.get(campaign.id) || { brief: "", intentLine: "" };
                  return (
                    <CampaignTableRow
                      key={campaign.id}
                      campaign={campaign}
                      brief={display.brief}
                      intentLine={display.intentLine}
                      selected={expandedCampaignId === campaign.id}
                      onSelectCampaign={onSelectCampaign}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No campaigns linked to this advertiser yet.</p>
        )}
      </LevelPanel>

      {selectedCampaign ? (
        <CampaignDetailPanel
          campaign={selectedCampaign}
          advertiserName={advertiser.name}
          ownerId={ownerId}
          detailTab={campaignDetailTab}
          onDetailTabChange={onDetailTabChange}
          expandedAdGroupKey={expandedAdGroupKey}
          onToggleAdGroup={onToggleAdGroup}
          selectedCreative={selectedCreative}
          onSelectCreative={onSelectCreative}
          getPreviewUrl={getPreviewUrl}
        />
      ) : null}

      {selectedCreative && selectedCreative.advertiserName === advertiser.name ? (
        <CreativePreviewPanel
          selection={selectedCreative}
          loading={previewLoadingId === selectedCreative.creative.id}
          onClose={onCloseCreative}
        />
      ) : null}
    </div>
  );
}

export default function AdvertisersSection({ advertisers, loading = false, ownerId = "", loadingProgress }: AdvertisersSectionProps) {
  const [expandedAdvertiserId, setExpandedAdvertiserId] = useState<string | null>(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [campaignDetailTab, setCampaignDetailTab] = useState<CampaignDetailTab>("campaigns");
  const [expandedAdGroupKey, setExpandedAdGroupKey] = useState<string | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<SelectedCreative | null>(null);
  const [hydratedPreviews, setHydratedPreviews] = useState<Record<string, { previewUrl?: string; fullUrl?: string }>>({});
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const sortedAdvertisers = useMemo(
    () => [...advertisers]
      .filter((item) => !isBlockedAdvertiserName(item.name))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [advertisers],
  );

  const focusedAdvertiser = useMemo(
    () => sortedAdvertisers.find((item) => item.id === expandedAdvertiserId) || null,
    [sortedAdvertisers, expandedAdvertiserId],
  );

  const getPreviewUrl = useCallback(
    (creative: AdvertiserCreativeRef) => hydratedPreviews[creative.id]?.previewUrl || creative.previewUrl,
    [hydratedPreviews],
  );
  const getFullUrl = useCallback(
    (creative: AdvertiserCreativeRef) => hydratedPreviews[creative.id]?.fullUrl || creative.fullUrl || creative.previewUrl,
    [hydratedPreviews],
  );

  const expandedAdGroupCreatives = useMemo(() => {
    if (!expandedAdGroupKey || !focusedAdvertiser || !expandedCampaignId) return [];
    const campaign = focusedAdvertiser.campaigns.find((item) => item.id === expandedCampaignId);
    if (!campaign) return [];
    const [, groupId] = expandedAdGroupKey.split(":");
    const group = campaign.adGroups.find((item) => item.id === groupId);
    return group?.creatives || [];
  }, [expandedAdGroupKey, focusedAdvertiser, expandedCampaignId]);

  useEffect(() => {
    if (!ownerId || !expandedAdGroupCreatives.length) return;

    const missing = expandedAdGroupCreatives.filter((creative) => !getPreviewUrl(creative));
    if (!missing.length) return;

    let cancelled = false;
    setCreativeStorageScope(ownerId);

    void hydrateCreativesList(
      missing.map((creative) => ({ id: creative.id, hasStoredAssets: true })),
      3,
    ).then((hydrated) => {
      if (cancelled) return;
      const next: Record<string, { previewUrl?: string; fullUrl?: string }> = {};
      hydrated.forEach((record, index) => {
        const url = typeof record?.url === "string" ? record.url : "";
        const fullUrl = typeof record?.fullUrl === "string" ? record.fullUrl : "";
        if (url || fullUrl) {
          next[missing[index].id] = { previewUrl: url || fullUrl, fullUrl: fullUrl || url };
        }
      });
      if (Object.keys(next).length) {
        setHydratedPreviews((current) => ({ ...current, ...next }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ownerId, expandedAdGroupCreatives, getPreviewUrl]);

  const resetCampaignState = useCallback(() => {
    setExpandedCampaignId(null);
    setCampaignDetailTab("campaigns");
    setExpandedAdGroupKey(null);
    setSelectedCreative(null);
    setPreviewLoadingId(null);
  }, []);

  const handleSelectAdvertiser = useCallback((advertiserId: string) => {
    setExpandedAdvertiserId(advertiserId);
    resetCampaignState();
  }, [resetCampaignState]);

  const handleBackToList = useCallback(() => {
    setExpandedAdvertiserId(null);
    resetCampaignState();
  }, [resetCampaignState]);

  const handleSelectCampaign = useCallback((campaignId: string) => {
    setExpandedCampaignId((current) => (current === campaignId ? null : campaignId));
    setCampaignDetailTab("campaigns");
    setExpandedAdGroupKey(null);
    setSelectedCreative(null);
  }, []);

  const handleSelectCreative = useCallback(async (
    ctx: Omit<SelectedCreative, "creative">,
    creative: AdvertiserCreativeRef,
  ) => {
    if (!creative.id) {
      setSelectedCreative(null);
      return;
    }

    const previewUrl = getPreviewUrl(creative);
    setSelectedCreative({ ...ctx, creative: { ...creative, previewUrl, fullUrl: getFullUrl(creative) } });

    if (previewUrl || !ownerId) return;

    setPreviewLoadingId(creative.id);
    try {
      setCreativeStorageScope(ownerId);
      const hydrated = await hydrateCreativeRecord({ id: creative.id, hasStoredAssets: true });
      const resolved = typeof hydrated?.url === "string" ? hydrated.url : undefined;
      const resolvedFull = typeof hydrated?.fullUrl === "string" ? hydrated.fullUrl : resolved;
      if (resolved || resolvedFull) {
        setHydratedPreviews((current) => ({
          ...current,
          [creative.id]: { previewUrl: resolved || resolvedFull, fullUrl: resolvedFull || resolved },
        }));
        setSelectedCreative({
          ...ctx,
          creative: { ...creative, previewUrl: resolved || resolvedFull, fullUrl: resolvedFull || resolved },
        });
      }
    } finally {
      setPreviewLoadingId(null);
    }
  }, [getFullUrl, getPreviewUrl, ownerId]);

  if (loading) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Advertisers</h2>
        <LoadingState title="Loading advertisers" description="Preparing your portfolio and campaign context." progress={loadingProgress} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Advertisers</h2>
        <span className="text-xs text-slate-400">
          {focusedAdvertiser ? `Viewing ${focusedAdvertiser.name}` : `${sortedAdvertisers.length} total`}
        </span>
      </div>

      {sortedAdvertisers.length === 0 ? (
        <EmptyState
          title="No advertisers added yet"
          description="Enter an advertiser in Campaign Setup of Campaign Intelligence Studio to start building your portfolio."
          className="border-sky-200/80 bg-linear-to-br from-sky-50 via-white to-emerald-50/80 text-left"
        />
      ) : focusedAdvertiser ? (
        <AdvertiserFocusView
          advertiser={focusedAdvertiser}
          ownerId={ownerId}
          expandedCampaignId={expandedCampaignId}
          campaignDetailTab={campaignDetailTab}
          expandedAdGroupKey={expandedAdGroupKey}
          selectedCreative={selectedCreative}
          previewLoadingId={previewLoadingId}
          onBack={handleBackToList}
          onSelectCampaign={handleSelectCampaign}
          onDetailTabChange={setCampaignDetailTab}
          onToggleAdGroup={(key) => {
            setExpandedAdGroupKey((current) => (current === key ? null : key));
            setSelectedCreative(null);
          }}
          onSelectCreative={handleSelectCreative}
          onCloseCreative={() => setSelectedCreative(null)}
          getPreviewUrl={getPreviewUrl}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-linear-to-br from-white via-sky-50/70 to-emerald-50/70 shadow-[0_18px_45px_-24px_rgba(14,116,144,0.3)] premium-card">
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/70">
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Advertiser Name</th>
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Advertiser ID</th>
                  <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Campaigns</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAdvertisers.map((advertiser) => (
                  <tr
                    key={advertiser.id}
                    className="border-b border-sky-100 transition hover:bg-sky-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AdvertiserAvatar name={advertiser.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{advertiser.name}</p>
                          <p className="mt-0.5 inline-flex rounded-md border border-sky-100 bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                            {advertiser.id.split("-AD-")[1] || advertiser.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{advertiser.id}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold tabular-nums text-slate-700">{advertiser.campaigns.length}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <EyeToggleButton
                        active={false}
                        label={`View ${advertiser.name}`}
                        onClick={() => handleSelectAdvertiser(advertiser.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
