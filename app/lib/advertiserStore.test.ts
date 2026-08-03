import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADVERTISERS_STORAGE_KEY, persistAdvertiserCampaignSelection } from "./advertiserStore";

describe("persistAdvertiserCampaignSelection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      clear: vi.fn(() => {
        storage.clear();
      }),
    };

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });

    const dispatchSpy = vi.fn(() => true);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        dispatchEvent: dispatchSpy,
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
  });

  it("persists a selected campaign so it appears in the advertiser workspace", () => {
    const advertiser = persistAdvertiserCampaignSelection({
      ownerId: "owner-1",
      advertiserName: "Northstar Labs",
      advertiserId: "ADV-001",
      campaign: {
        id: "campaign-123",
        name: "Google Ads Q4",
        platform: "google_ads",
        validated: true,
        updatedAt: "2025-01-01T00:00:00.000Z",
        creatives: [],
      },
    });

    expect(advertiser.campaigns[0].name).toBe("Google Ads Q4");

    const stored = JSON.parse(localStorage.getItem(ADVERTISERS_STORAGE_KEY) || "[]");
    expect(stored[0].campaigns[0].name).toBe("Google Ads Q4");
  });
});
