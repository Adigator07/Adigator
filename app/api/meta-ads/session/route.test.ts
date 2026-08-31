import { describe, expect, it } from "vitest";
import { buildMetaAdsSessionPayload } from "./route";

describe("buildMetaAdsSessionPayload", () => {
  it("returns a disconnected payload when no session is present", () => {
    const payload = buildMetaAdsSessionPayload(null);
    expect(payload.connected).toBe(false);
    expect(payload.message).toContain("No Meta Ads account connected");
  });

  it("returns connected details when a session is present", () => {
    const payload = buildMetaAdsSessionPayload(
      { accessToken: "token", email: "user@example.com" },
      { adAccountId: "act_123", account: { name: "Test account" } },
    );
    expect(payload.connected).toBe(true);
    expect(payload.email).toBe("user@example.com");
    expect(payload.adAccountId).toBe("act_123");
  });
});
