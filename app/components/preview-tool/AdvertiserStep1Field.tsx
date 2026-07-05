"use client";

import type { ChangeEvent } from "react";
import { useMemo } from "react";

import { ToolInput } from "@/app/components/preview-tool/PreviewToolUi";
import type { Advertiser } from "@/app/lib/advertiserStore";
import { buildAdvertiserWorkflowRecommendations } from "@/app/lib/advertiserWorkflow";

type AdvertiserStep1FieldProps = {
  advertiserName: string;
  advertiserId: string;
  existingAdvertisers: Advertiser[];
  platform: string | null;
  onAdvertiserNameChange: (value: string) => void;
};

export default function AdvertiserStep1Field({
  advertiserName,
  advertiserId,
  existingAdvertisers,
  platform,
  onAdvertiserNameChange,
}: AdvertiserStep1FieldProps) {
  const matchedAdvertiser = useMemo(() => {
    const normalized = advertiserName.trim().toLowerCase();
    if (!normalized) return null;
    return existingAdvertisers.find((item) => item.name.trim().toLowerCase() === normalized) || null;
  }, [advertiserName, existingAdvertisers]);

  const recommendations = useMemo(
    () => buildAdvertiserWorkflowRecommendations(matchedAdvertiser, { platform }),
    [matchedAdvertiser, platform],
  );

  const nameMissing = !advertiserName.trim();

  return (
    <section className="space-y-4">
      <div>
        <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Advertiser</h3>
        <p className="mt-1 text-sm text-studio-muted">
          Enter the brand or client this campaign belongs to. This advertiser will appear in your Strategic Workspace dashboard.
        </p>
      </div>

      <div className="max-w-xl space-y-2">
        <label htmlFor="campaign-advertiser-name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
          Advertiser Name{" "}
          <span className="text-studio-error" aria-hidden="true">*</span>
        </label>
        <ToolInput
          id="campaign-advertiser-name"
          type="text"
          list="advertiser-name-options"
          value={advertiserName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onAdvertiserNameChange(event.target.value)}
          placeholder="Enter advertiser name"
          required
          aria-required="true"
          aria-invalid={nameMissing || undefined}
          className={nameMissing ? "border-studio-error/60 ring-1 ring-studio-error/30" : ""}
        />
        <datalist id="advertiser-name-options">
          {existingAdvertisers.map((advertiser) => (
            <option key={advertiser.id} value={advertiser.name} />
          ))}
        </datalist>
        {advertiserId ? (
          <p className="text-xs text-studio-tertiary">
            Advertiser ID: <span className="font-mono text-studio-muted">{advertiserId}</span>
          </p>
        ) : null}
        {nameMissing ? (
          <p className="text-xs text-studio-error">Advertiser name is required before continuing.</p>
        ) : null}
      </div>

      {advertiserName.trim() ? (
        <div className="max-w-3xl rounded-2xl border border-studio-accent/25 bg-studio-accent/5 p-4">
          <p className="text-sm font-semibold text-studio-text">{recommendations.headline}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-studio-muted">
            {recommendations.details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="text-studio-accent">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
