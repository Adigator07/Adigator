"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Users } from "lucide-react";
import {
  buildLocalCampaignBriefInsights,
  type CampaignBriefInsights,
} from "@/app/lib/campaignBriefInsights";

type CampaignBriefInsightsPanelProps = {
  campaignBrief: string;
  campaignGoal?: string;
  vertical?: string;
  platform?: string;
  preferredIntent?: string;
  onInsightsChange?: (insights: CampaignBriefInsights | null) => void;
};

const DEBOUNCE_MS = 650;

function AudienceChipBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-studio-tertiary">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-studio-text/85"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CampaignBriefInsightsPanel({
  campaignBrief,
  campaignGoal = "",
  vertical = "",
  platform = "",
  preferredIntent = "",
  onInsightsChange,
}: CampaignBriefInsightsPanelProps) {
  const [insights, setInsights] = useState<CampaignBriefInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onInsightsChangeRef = useRef(onInsightsChange);
  onInsightsChangeRef.current = onInsightsChange;

  useEffect(() => {
    const brief = campaignBrief.trim();
    if (!brief) {
      setInsights(null);
      setLoading(false);
      setError(null);
      onInsightsChangeRef.current?.(null);
      return;
    }

    const local = buildLocalCampaignBriefInsights({
      campaignBrief: brief,
      campaignGoal,
      vertical,
      platform,
    });

    const seeded =
      preferredIntent?.trim() && local
        ? { ...local, campaignIntent: preferredIntent.trim() }
        : local;
    setInsights(seeded);
    onInsightsChangeRef.current?.(seeded);
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/campaign-brief-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            campaignBrief: brief,
            campaignGoal,
            vertical,
            platform,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Could not refresh campaign insights.");
        }
        const next = payload?.data as CampaignBriefInsights | undefined;
        const hasAudience = Boolean(
          next?.targetAudience?.description
          || next?.targetAudience?.primaryAudience?.length
          || next?.targetAudience?.interests?.length,
        );
        if (next && (next.campaignIntent || hasAudience)) {
          setInsights(next);
          onInsightsChangeRef.current?.(next);
          setError(null);
        } else if (seeded) {
          setInsights(seeded);
          onInsightsChangeRef.current?.(seeded);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not refresh campaign insights.");
        if (seeded) {
          setInsights(seeded);
          onInsightsChangeRef.current?.(seeded);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [campaignBrief, campaignGoal, vertical, platform, preferredIntent]);

  const briefEmpty = !campaignBrief.trim();
  const audience = insights?.targetAudience;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
        <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">
                Campaign Intent
              </p>
              <h3 className="mt-1 text-sm font-semibold text-studio-text">What this campaign is trying to do</h3>
            </div>
            {loading ? (
              <Loader2 size={16} className="shrink-0 animate-spin text-studio-accent" aria-label="Updating intent" />
            ) : (
              <Sparkles size={16} className="shrink-0 text-studio-accent/80" aria-hidden />
            )}
          </div>
          {briefEmpty ? (
            <p className="mt-3 text-sm leading-relaxed text-studio-muted">
              Add a campaign brief to generate a plain-language intent summary.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-studio-text/90">
              {insights?.campaignIntent || "Generating campaign intent…"}
            </p>
          )}
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-studio-tertiary">
                Target Audience
              </p>
              <h3 className="mt-1 text-sm font-semibold text-studio-text">Who the campaign is for</h3>
            </div>
            {loading ? (
              <Loader2 size={16} className="shrink-0 animate-spin text-studio-accent" aria-label="Updating audience" />
            ) : (
              <Users size={16} className="shrink-0 text-studio-accent/80" aria-hidden />
            )}
          </div>

          {briefEmpty ? (
            <p className="mt-3 text-sm leading-relaxed text-studio-muted">
              Audience details appear here once the brief has enough context.
            </p>
          ) : audience && (audience.description || audience.primaryAudience?.length) ? (
            <div className="mt-3 max-h-[22rem] space-y-2.5 overflow-y-auto pr-1">
              {audience.description ? (
                <p className="text-sm leading-relaxed text-studio-text/90">{audience.description}</p>
              ) : null}

              {audience.primaryAudience?.length ? (
                <AudienceChipBlock title="Primary audience" items={audience.primaryAudience} />
              ) : null}

              {audience.secondaryAudience?.length ? (
                <AudienceChipBlock title="Secondary audience" items={audience.secondaryAudience} />
              ) : null}

              {(audience.ageRange || audience.gender || audience.income || audience.education || audience.location || audience.demographics) ? (
                <div className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-studio-tertiary">
                    Demographics
                  </p>
                  {audience.ageRange || audience.gender || audience.income || audience.education || audience.location ? (
                    <ul className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-studio-text/85">
                      {audience.ageRange ? <li>Age: {audience.ageRange}</li> : null}
                      {audience.gender ? <li>Gender: {audience.gender}</li> : null}
                      {audience.income ? <li>Income: {audience.income}</li> : null}
                      {audience.education ? <li>Education: {audience.education}</li> : null}
                      {audience.location ? <li>Location: {audience.location}</li> : null}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-studio-text/85">{audience.demographics}</p>
                  )}
                </div>
              ) : null}

              {audience.interests?.length ? (
                <AudienceChipBlock title="Interest targeting" items={audience.interests} />
              ) : null}

              {audience.purchaseIntent?.length ? (
                <AudienceChipBlock title="Purchase intent" items={audience.purchaseIntent} />
              ) : null}

              {audience.remarketing?.length ? (
                <AudienceChipBlock title="Remarketing" items={audience.remarketing} />
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-studio-muted">Generating target audience…</p>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-xs text-amber-300/90">
          Showing a local summary for now. {error}
        </p>
      ) : null}
    </div>
  );
}
