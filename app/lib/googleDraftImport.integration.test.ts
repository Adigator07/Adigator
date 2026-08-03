import { beforeEach, describe, expect, it, vi } from "vitest";

import { upsertCampaign, listCampaignsByPlatform } from "@/app/lib/campaignStore";
import { listDownloadHistory, recordDownloadHistory } from "@/app/lib/downloadHistoryStore";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";

function mockBrowserStorage() {
  const localStore = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => localStore.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => localStore.set(key, value)),
      removeItem: vi.fn((key: string) => localStore.delete(key)),
      clear: vi.fn(() => localStore.clear()),
    },
  });

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent: vi.fn(),
    },
  });

  Object.defineProperty(globalThis, "CustomEvent", {
    configurable: true,
    value: class CustomEventStub extends Event {
      constructor(type: string, init?: EventInit) {
        super(type, init);
      }
    },
  });
}

function buildDraftSnapshot(): CampaignSnapshot {
  const now = new Date().toISOString();
  return {
    id: "draft-campaign-1001",
    platform: "google_ads",
    ownerId: "owner-1",
    campaignName: "Draft Import Campaign",
    campaignBrief: "Imported draft",
    vertical: "technology",
    landingUrl: "https://example.com",
    campaignGoal: "traffic",
    campaignAudienceStage: "cold",
    campaignProductFocus: "Product",
    campaignTaskType: "campaign_setup",
    creatives: [],
    analysisResult: [],
    urlValidation: null,
    viewMode: "multiple",
    showSlotLabels: false,
    createdAt: now,
    updatedAt: now,
    googleAdsCampaignStatus: "Draft",
    googleAdsCampaignSource: "draft",
    importSource: "google_ads",
  };
}

describe("google draft import integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockBrowserStorage();
  });

  it("saves imported draft campaigns so they appear in My Projects store", () => {
    const saved = upsertCampaign(buildDraftSnapshot());
    const projects = listCampaignsByPlatform("owner-1", "google_ads");

    expect(saved.id).toBe("draft-campaign-1001");
    expect(projects.some((entry) => entry.id === "draft-campaign-1001")).toBe(true);
  });

  it("records downloaded draft report entries so they appear in Downloads", () => {
    recordDownloadHistory({
      ownerId: "owner-1",
      reportType: "Creative Analysis Report (PDF)",
      campaignName: "Draft Import Campaign",
      campaignId: "draft-campaign-1001",
      advertiserName: "Demo Advertiser",
      downloadedBy: "Tester",
      status: "Completed",
      platform: "google_ads",
    });

    const entries = listDownloadHistory("owner-1");
    expect(entries).toHaveLength(1);
    expect(entries[0].campaignId).toBe("draft-campaign-1001");
    expect(entries[0].platform).toBe("google_ads");
  });
});
