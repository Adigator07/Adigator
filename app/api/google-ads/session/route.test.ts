import { describe, expect, it } from "vitest";
import { buildGoogleAdsSessionPayload } from "./route";

describe("buildGoogleAdsSessionPayload", () => {
  it("returns a disconnected payload when no session is present", () => {
    const payload = buildGoogleAdsSessionPayload(null);

    expect(payload.connected).toBe(false);
    expect(payload.message).toContain("No Google Ads account connected");
  });

  it("returns connected details when a session and account data are available", () => {
    const payload = buildGoogleAdsSessionPayload(
      {
        accessToken: "token",
        email: "user@example.com",
      },
      {
        customerId: "1234567890",
        account: { name: "Example account" },
        campaigns: [{ id: "1", name: "Summer campaign", status: "ENABLED" }],
      },
    );

    expect(payload.connected).toBe(true);
    expect(payload.email).toBe("user@example.com");
    expect(payload.customerId).toBe("1234567890");
    expect(payload.campaigns).toHaveLength(1);
    expect(payload.message).toContain("connected");
  });
});
