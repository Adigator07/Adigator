"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { CampaignIdOption } from "@/app/lib/programmaticCampaignStore";
import { listCampaignIdsByName } from "@/app/lib/programmaticCampaignStore";
import { fetchCampaignIdsByName } from "@/app/lib/programmaticCampaignApi";
import { isAuthenticatedOwnerId } from "@/app/lib/campaignOwnerScope";
import { ToolInput, ToolSelect } from "@/app/components/preview-tool/PreviewToolUi";

type CampaignIdSelectProps = {
  campaignName: string;
  campaignId: string;
  ownerId: string | null;
  accessToken?: string | null;
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
  onCampaignIdChange,
}: CampaignIdSelectProps) {
  const [options, setOptions] = useState<CampaignIdOption[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmedName = campaignName.trim();

  useEffect(() => {
    if (!trimmedName || !ownerId) {
      setOptions([]);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      const localOptions = listCampaignIdsByName(trimmedName, ownerId);
      let remoteOptions: CampaignIdOption[] = [];
      if (accessToken && isAuthenticatedOwnerId(ownerId)) {
        remoteOptions = await fetchCampaignIdsByName(trimmedName, accessToken);
      }
      if (!active) return;
      setOptions(mergeCampaignIdOptions(localOptions, remoteOptions));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [trimmedName, ownerId, accessToken]);

  const helperText = useMemo(() => {
    if (!trimmedName) return "Enter a campaign name to see your campaign IDs.";
    if (loading) return "Loading your campaign IDs…";
    if (options.length === 0) return "No saved campaigns found for this name on your account.";
    return `${options.length} campaign ID${options.length === 1 ? "" : "s"} found for your account.`;
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
            Select your campaign ID
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
        placeholder="e.g. PGM-ABC123-XYZ789"
      />
      <p className="mt-2 text-xs text-studio-tertiary">{helperText}</p>
    </div>
  );
}
