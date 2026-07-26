import { describe, expect, it } from "vitest";
import { FILE_SIZE_LIMITS } from "@/app/constants/programmaticSpecs";
import { DEMAND_GEN_IMAGE_REQUIREMENTS } from "@/app/constants/googleSpecs";
import {
  getTechnicalFileSizeLimit,
  resolveProgrammaticAssetKind,
  runTechnicalValidation,
} from "@/app/lib/engines/technicalValidationEngine";

describe("technical file-weight helpers", () => {
  it("resolves programmatic asset kinds from mime type", () => {
    expect(resolveProgrammaticAssetKind({ id: "1", name: "a", format: "image/jpeg" })).toBe("static_image");
    expect(resolveProgrammaticAssetKind({ id: "2", name: "b", format: "image/gif" })).toBe("animated_gif");
    expect(resolveProgrammaticAssetKind({ id: "3", name: "c", format: "application/zip" })).toBe("html5_zip");
  });

  it("applies programmatic FILE_SIZE_LIMITS and Demand Gen 5MB ceiling", () => {
    expect(
      getTechnicalFileSizeLimit("programmatic", { id: "1", name: "a", format: "image/png" }),
    ).toBe(FILE_SIZE_LIMITS.static_image);
    expect(
      getTechnicalFileSizeLimit("programmatic", { id: "2", name: "b", format: "image/gif" }),
    ).toBe(FILE_SIZE_LIMITS.animated_gif);
    expect(
      getTechnicalFileSizeLimit(
        "google_ads",
        { id: "3", name: "c", format: "image/jpeg" },
        "demand_gen",
      ),
    ).toBe(DEMAND_GEN_IMAGE_REQUIREMENTS.max_file_size_bytes);
  });

  it("flags programmatic oversize as an error", async () => {
    const result = await runTechnicalValidation({
      campaignId: "camp-1",
      platform: "programmatic",
      creatives: [{
        id: "cr-1",
        name: "Banner",
        format: "image/jpeg",
        fileSize: FILE_SIZE_LIMITS.static_image + 1,
        width: 300,
        height: 250,
      }],
    });

    expect(result.passed).toBe(false);
    expect(result.flags.some((flag) => flag.id === "creative_file_weight_exceeded" && flag.severity === "error")).toBe(true);
  });
});
