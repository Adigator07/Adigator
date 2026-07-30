import { describe, expect, it } from "vitest";
import { resolvePostAuthDestination } from "./roleLabels";

describe("resolvePostAuthDestination", () => {
  it("routes all successful sign-ins to the dashboard", () => {
    expect(resolvePostAuthDestination()).toBe("/dashboard");
    expect(resolvePostAuthDestination("usa_client")).toBe("/dashboard");
    expect(resolvePostAuthDestination("end_client")).toBe("/dashboard");
    expect(resolvePostAuthDestination("unknown_role")).toBe("/dashboard");
  });
});
