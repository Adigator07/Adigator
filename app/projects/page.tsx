"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, FolderOpen, Layers3, RefreshCcw, Search } from "lucide-react";
import { motion } from "framer-motion";

import {
  ADVERTISERS_STORAGE_KEY,
  listAdvertisers,
  type Advertiser,
  type AdvertiserCampaign,
} from "@/app/lib/advertiserStore";
import { PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY } from "@/app/lib/programmaticCampaignStore";
import { resolveCampaignOwnerId } from "@/app/lib/campaignOwnerScope";
import { readCampaignProgress } from "@/app/lib/workflowStorage";
import { buildWorkflowStepHref } from "@/app/lib/workflowSteps";

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countCreatives(campaign: AdvertiserCampaign) {
  return campaign.adGroups.reduce((count, group) => count + group.creatives.length, 0);
}

function resolveResumeStep(campaign: AdvertiserCampaign) {
  const progress = readCampaignProgress(campaign.id);
  if (progress?.lastStep) {
    return Math.max(1, Math.min(4, Number(progress.lastStep)));
  }
  if (campaign.validated) return 4;
  if (countCreatives(campaign) > 0) return 3;
  return 1;
}

function buildProjectConversationRef(advertiser: Advertiser, campaign: AdvertiserCampaign) {
  return `${advertiser.name} · ${campaign.name} · ${campaign.id}`;
}

function matchesProjectSearch(advertiser: Advertiser, campaign: AdvertiserCampaign, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [advertiser.name, advertiser.id, campaign.name, campaign.id, campaign.platform]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export default function ProjectsPage() {
  const [ownerId, setOwnerId] = useState("");
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");

  const refreshProjects = useCallback(async () => {
    const resolvedOwnerId = await resolveCampaignOwnerId();
    setOwnerId(resolvedOwnerId);
    setAdvertisers(listAdvertisers(resolvedOwnerId));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshProjects();
    }, 0);

    const handleRefresh = () => {
      void refreshProjects();
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key
        && event.key !== ADVERTISERS_STORAGE_KEY
        && event.key !== PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY
      ) {
        return;
      }
      void refreshProjects();
    };

    window.addEventListener("adigator-advertisers-updated", handleRefresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("adigator-advertisers-updated", handleRefresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshProjects]);

  const totalCampaigns = useMemo(
    () => advertisers.reduce((count, advertiser) => count + advertiser.campaigns.length, 0),
    [advertisers],
  );

  const platformOptions = useMemo(() => {
    const platforms = new Set<string>();
    advertisers.forEach((advertiser) => {
      advertiser.campaigns.forEach((campaign) => {
        if (campaign.platform) platforms.add(campaign.platform);
      });
    });
    return ["all", ...Array.from(platforms)];
  }, [advertisers]);

  const filteredAdvertisers = useMemo(() => {
    return advertisers
      .map((advertiser) => ({
        ...advertiser,
        campaigns: advertiser.campaigns.filter((campaign) => {
          const platformMatches = platformFilter === "all" || campaign.platform === platformFilter;
          return platformMatches && matchesProjectSearch(advertiser, campaign, searchQuery);
        }),
      }))
      .filter((advertiser) => advertiser.campaigns.length > 0);
  }, [advertisers, platformFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#08111f] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/55 transition hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80">Project Workspace</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">My Projects</h1>
              <p className="mt-2 text-sm text-white/55">
                Resume campaign work, jump into intelligence, and keep advertiser projects organized in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void refreshProjects();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
            <Link
              href="/preview-tool?step=campaign-setup"
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110"
            >
              <FolderOpen size={16} /> New Project
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { label: "Advertisers", value: advertisers.length, icon: BriefcaseBusiness },
            { label: "Campaigns", value: totalCampaigns, icon: Layers3 },
            { label: "Owner Scope", value: ownerId ? "Ready" : "Pending", icon: FolderOpen },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_-30px_rgba(14,116,144,0.45)]">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-black text-white">{item.value}</p>
                <p className="mt-1 text-sm text-white/55">{item.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search advertiser, campaign, platform, or campaign ID"
              className="w-full rounded-xl border border-white/10 bg-[#0b1628] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Platform</span>
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1628] px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400/50"
            >
              {platformOptions.map((platform) => (
                <option key={platform} value={platform}>
                  {platform === "all" ? "All platforms" : platform.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            Loading projects...
          </div>
        ) : advertisers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-sky-300/20 bg-sky-500/5 p-10 text-center">
            <p className="text-lg font-semibold text-white">No saved projects yet</p>
            <p className="mt-2 text-sm text-white/55">
              Start in Campaign Intelligence Studio to create your first advertiser and campaign workspace.
            </p>
            <Link
              href="/preview-tool?step=campaign-setup"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Open Campaign Intelligence Studio
            </Link>
          </div>
        ) : filteredAdvertisers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <p className="text-lg font-semibold text-white">No projects match your filters</p>
            <p className="mt-2 text-sm text-white/55">Try a different search term or switch back to all platforms.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAdvertisers.map((advertiser) => (
              <motion.section
                key={advertiser.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_22px_60px_-34px_rgba(14,116,144,0.38)]"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">Advertiser</p>
                    <h2 className="mt-1 text-2xl font-black text-white">{advertiser.name}</h2>
                    <p className="mt-2 text-sm text-white/55">
                      {advertiser.campaigns.length} campaign{advertiser.campaigns.length === 1 ? "" : "s"} · Last updated {formatUpdatedAt(advertiser.updatedAt)}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                  >
                    Open Workspace <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {advertiser.campaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-2xl border border-white/10 bg-[#0b1628] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-white">{campaign.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300/75">
                            {campaign.platform.replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${campaign.validated ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border border-amber-400/30 bg-amber-500/10 text-amber-200"}`}>
                          {campaign.validated ? "Validated" : "In Progress"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/65">
                        <div>
                          <p className="text-white/40">Campaign ID</p>
                          <p className="mt-1 font-mono text-xs text-white/80">{campaign.id}</p>
                        </div>
                        <div>
                          <p className="text-white/40">Creatives</p>
                          <p className="mt-1 font-semibold text-white">{countCreatives(campaign)}</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                          href={buildWorkflowStepHref("/preview-tool", resolveResumeStep(campaign), {
                            campaign_id: campaign.id,
                            campaign_name: campaign.name,
                            advertiser_id: advertiser.id,
                            platform: campaign.platform,
                          })}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                          Resume Last Step
                        </Link>
                        <Link
                          href={`/dashboard/communications?open_new=1&project_ref=${encodeURIComponent(buildProjectConversationRef(advertiser, campaign))}&title=${encodeURIComponent(`${advertiser.name} · ${campaign.name}`)}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                        >
                          Message Team
                        </Link>
                        <Link
                          href={buildWorkflowStepHref("/preview-tool", 3, {
                            campaign_id: campaign.id,
                            campaign_name: campaign.name,
                            advertiser_id: advertiser.id,
                            platform: campaign.platform,
                          })}
                          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
                        >
                          Open Intelligence
                        </Link>
                        <Link
                          href={buildWorkflowStepHref("/preview-tool", 4, {
                            campaign_id: campaign.id,
                            campaign_name: campaign.name,
                            advertiser_id: advertiser.id,
                            platform: campaign.platform,
                          })}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                        >
                          Open Preview Studio
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}