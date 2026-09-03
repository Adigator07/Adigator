"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { CampaignIdOption } from "@/app/lib/programmaticCampaignStore";
import { listCampaignIdsByName } from "@/app/lib/programmaticCampaignStore";
import { fetchCampaignIdsByName, fetchGoogleAdsCampaignIdOptions } from "@/app/lib/campaignApi";
import { isAuthenticatedOwnerId } from "@/app/lib/campaignOwnerScope";
import type { AnalyzerPlatform } from "@/app/lib/platforms/types";
import { ToolInput, ToolSelect } from "@/app/components/preview-tool/PreviewToolUi";

type CampaignIdSelectProps = {
  campaignName: string;
  campaignId: string;
  ownerId: string | null;
  accessToken?: string | null;
  platform?: string;
  onCampaignIdChange: (value: string) => void;
};

function mergeCampaignIdOptions(local: CampaignIdOption[], remote: CampaignIdOption[]): CampaignIdOption[] {
  const map = new Map<string, CampaignIdOption>();
  [...local, ...remote].forEach((option) => {
    map.set(option.id, option);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
  );
}

export default function CampaignIdSelect({
  campaignName,
  campaignId,
  ownerId,
  accessToken,
  platform,
  onCampaignIdChange,
}: CampaignIdSelectProps) {
  const [options, setOptions] = useState<CampaignIdOption[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmedName = campaignName.trim();

  useEffect(() => {
    if (!trimmedName || !ownerId) {
      const timer = window.setTimeout(() => {
        setOptions([]);
        setLoading(false);
      }, 0);
      return () => {
        window.clearTimeout(timer);
      };
    }

    let active = true;
    const loadingTimer = window.setTimeout(() => {
      if (active) setLoading(true);
    }, 0);

    void (async () => {
      const localOptions = listCampaignIdsByName(trimmedName, ownerId);
      let remoteOptions: CampaignIdOption[] = [];
      if (platform === "google_ads") {
        remoteOptions = await fetchGoogleAdsCampaignIdOptions(trimmedName);
      }
      if (accessToken && isAuthenticatedOwnerId(ownerId)) {
        const normalizedPlatform = platform === "google_ads" || platform === "meta_ads" || platform === "programmatic"
          ? platform as AnalyzerPlatform
          : undefined;
        const savedOptions = await fetchCampaignIdsByName(trimmedName, accessToken, normalizedPlatform);
        remoteOptions = [...remoteOptions, ...savedOptions];
      }
      if (!active) return;
      setOptions(mergeCampaignIdOptions(localOptions, remoteOptions));
      setLoading(false);
    })();

    return () => {
      active = false;
      window.clearTimeout(loadingTimer);
    };
  }, [trimmedName, ownerId, accessToken, platform]);

  const helperText = useMemo(() => {
    if (!trimmedName) return "Enter a campaign name to see IDs from saved Adigator IQ campaigns.";
    if (loading) return "Loading IDs from saved Adigator IQ campaigns…";
    if (options.length === 0) return platform === "google_ads"
      ? "No matching Google Ads or saved Adigator IQ campaign IDs yet. You can still import by campaign name."
      : "No saved Adigator IQ campaigns found for this name on your account.";
    return `${options.length} saved campaign ID${options.length === 1 ? "" : "s"} found in Adigator IQ.`;
  }, [trimmedName, loading, options.length]);

  if (options.length > 0) {
    return (
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
          Campaign ID
        </label>
        <ToolSelect
          value={campaignId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onCampaignIdChange(event.target.value)}
        >
          <option value="" disabled>
            Select a saved campaign ID
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id}
            </option>
          ))}
        </ToolSelect>
        <p className="mt-2 text-xs text-studio-tertiary">{helperText}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
        Campaign ID
      </label>
      <ToolInput
        type="text"
        value={campaignId}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onCampaignIdChange(event.target.value)}
        placeholder="Enter the saved Adigator IQ campaign ID"
      />
      <p className="mt-2 text-xs text-studio-tertiary">{helperText}</p>
    </div>
  );
}
