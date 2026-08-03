import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAdsAccountDetails,
  listAccessibleCustomerResourceNames,
  listGoogleAdsCampaigns,
} from "@/app/lib/googleAds/client";
import { readGoogleAdsSession } from "@/app/lib/googleAds/session";

const basePayload = {
  summary: {
    health: 92,
    tracking: 89,
    landingPage: 90,
    aiReadiness: 94,
    approvals: 87,
  },
  alerts: [
    {
      title: "Three landing pages are missing consent state handling",
      severity: "High",
      detail: "Consent mode is likely to suppress conversion tracking on EU traffic until the banner is wired to the GTM consent layer.",
    },
    {
      title: "One campaign has a duplicated UTM campaign parameter",
      severity: "Medium",
      detail: "Budget is still being attributed to the wrong source because the campaign naming convention is not normalized.",
    },
  ],
  campaigns: [
    {
      id: "CMP-2048",
      name: "Spring Launch - Premium Travel",
      platform: "Meta + GA4",
      owner: "Mina Chen",
      status: "Ready for review",
      score: 94,
      lastReviewed: "12 min ago",
      nextAction: "Approve creative QA package",
      flags: ["Tracking healthy", "Brand aligned"],
    },
    {
      id: "CMP-2051",
      name: "Q3 Demand Gen Expansion",
      platform: "Google Ads",
      owner: "Alicia Brooks",
      status: "Needs attention",
      score: 81,
      lastReviewed: "47 min ago",
      nextAction: "Fix consent and UTM naming",
      flags: ["Consent gap", "UTM mismatch"],
    },
    {
      id: "CMP-2058",
      name: "Retention Re-engagement",
      platform: "LinkedIn",
      owner: "Darius Holt",
      status: "In progress",
      score: 88,
      lastReviewed: "1 hr ago",
      nextAction: "Validate landing page and CTA hierarchy",
      flags: ["CTA clarity", "Responsive QA pending"],
    },
    {
      id: "CMP-2063",
      name: "Mobile App Install Push",
      platform: "TikTok",
      owner: "Nadia Flores",
      status: "At risk",
      score: 72,
      lastReviewed: "2 hrs ago",
      nextAction: "Restore pixel and landing page checks",
      flags: ["Pixel not firing", "LCP above target"],
    },
  ],
  recommendations: [
    {
      title: "Automate consent-aware conversion validation",
      detail: "Apply a rule that blocks launch approvals when consent mode is incomplete for EU traffic.",
    },
    {
      title: "Normalize campaign naming at the source",
      detail: "Enforce lowercase, hyphen-separated naming to prevent duplicate attribution and reporting drift.",
    },
    {
      title: "Surface AI readiness score before handoff",
      detail: "Make the readiness score visible to reviewers and launch approvers on every campaign card.",
    },
  ],
  integration: {
    connected: false,
    platform: "Google Ads",
    label: "Connect Google Ads to import live campaign data",
  },
};

async function loadGoogleAdsCampaigns(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) {
    return null;
  }

  try {
    const resourceNames = await listAccessibleCustomerResourceNames(session.accessToken);
    const customerId = resourceNames[0]?.split("/")[1] || "";
    if (!customerId) {
      return null;
    }

    const account = await getGoogleAdsAccountDetails(session.accessToken, customerId);
    const campaigns = await listGoogleAdsCampaigns(session.accessToken, customerId, 4);

    return {
      connected: true,
      customerId: account.customerId,
      accountName: account.name || "Connected Google Ads account",
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        platform: "Google Ads",
        owner: session.email || "Connected account",
        status: campaign.status === "ENABLED" ? "Ready for review" : "Needs attention",
        score: campaign.suggestedGoal === "conversion" ? 92 : 84,
        lastReviewed: "Just synced",
        nextAction: "Run creative validation",
        flags: campaign.suggestedGoal ? [campaign.suggestedGoal, "Synced from Google Ads"] : ["Synced from Google Ads"],
      })),
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const googleAdsData = await loadGoogleAdsCampaigns(request);
  const payload = {
    ...basePayload,
    summary: {
      ...basePayload.summary,
      health: googleAdsData?.connected ? 96 : basePayload.summary.health,
      tracking: googleAdsData?.connected ? 95 : basePayload.summary.tracking,
      landingPage: googleAdsData?.connected ? 93 : basePayload.summary.landingPage,
      aiReadiness: googleAdsData?.connected ? 97 : basePayload.summary.aiReadiness,
      approvals: googleAdsData?.connected ? 92 : basePayload.summary.approvals,
    },
    campaigns: googleAdsData?.connected
      ? googleAdsData.campaigns
      : basePayload.campaigns,
    recommendations: googleAdsData?.connected
      ? [
          {
            title: "Validate imported Google Ads creatives",
            detail: "Use the synced campaign assets as the source of truth for preview, QA, and approval workflows.",
          },
          {
            title: "Surface the live campaign score before launch",
            detail: "Let reviewers compare imported campaign health against the current QA checklist in one view.",
          },
        ]
      : basePayload.recommendations,
    integration: googleAdsData?.connected
      ? {
          connected: true,
          platform: "Google Ads",
          label: `Synced to ${googleAdsData.accountName}`,
          customerId: googleAdsData.customerId,
        }
      : basePayload.integration,
  };

  return NextResponse.json(payload);
}
