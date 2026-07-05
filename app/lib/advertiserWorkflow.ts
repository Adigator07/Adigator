import type { Advertiser } from "@/app/lib/advertiserStore";
import { countValidatedCampaigns } from "@/app/lib/advertiserStore";

export type AdvertiserWorkflowRecommendation = {
  headline: string;
  details: string[];
  suggestedPlatform?: string;
  suggestedObjective?: string;
  suggestedTaskType?: string;
};

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  let best: string | undefined;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
}

export function buildAdvertiserWorkflowRecommendations(
  advertiser: Advertiser | null,
  options: { platform?: string | null } = {},
): AdvertiserWorkflowRecommendation {
  if (!advertiser) {
    return {
      headline: "Enter an advertiser to unlock tailored workflow guidance",
      details: [
        "We will store this advertiser in your Strategic Workspace dashboard.",
        "Past campaign patterns will inform platform, objective, and task recommendations.",
      ],
    };
  }

  const validatedCount = countValidatedCampaigns(advertiser);
  const platforms = advertiser.campaigns.map((campaign) => campaign.platform);
  const objectives = advertiser.campaigns.flatMap((campaign) => (
    campaign.adGroups.map((group) => group.objectiveLabel || group.objective)
  ));
  const taskTypes = advertiser.campaigns.map((campaign) => campaign.taskType).filter(Boolean) as string[];

  const topPlatform = mostCommon(platforms);
  const topObjective = mostCommon(objectives);
  const topTaskType = mostCommon(taskTypes);

  const details: string[] = [
    `${validatedCount} validated campaign${validatedCount === 1 ? "" : "s"} on record for ${advertiser.name}.`,
  ];

  if (topPlatform) {
    details.push(`Most campaigns run on ${topPlatform.replace(/_/g, " ")}.`);
  }
  if (topObjective) {
    details.push(`Common ad group objective: ${topObjective}.`);
  }
  if (topTaskType) {
    details.push(`Recent workflow: ${topTaskType.replace(/_/g, " ")}.`);
  }

  if (options.platform === "programmatic") {
    details.push("For programmatic, configure ad groups in Step 1 and upload folder creatives in Step 2.");
    if (validatedCount > 0) {
      details.push("Consider Creative Addition or Campaign Renewal for existing validated campaigns.");
    }
  } else if (options.platform) {
    details.push("Upload creatives in Step 2, then run analysis in Step 3 to validate against campaign goals.");
  } else {
    details.push("Select a platform next to see platform-specific workflow guidance.");
  }

  return {
    headline: validatedCount > 0
      ? `Continue building on ${advertiser.name}'s validated campaigns`
      : `Set up the first validated campaign for ${advertiser.name}`,
    details,
    suggestedPlatform: topPlatform,
    suggestedObjective: topObjective,
    suggestedTaskType: topTaskType,
  };
}
