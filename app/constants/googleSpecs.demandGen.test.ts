import { describe, expect, it } from "vitest";
import {
  DEMAND_GEN_IMAGE_REQUIREMENTS,
  evaluateDemandGenImageAsset,
} from "@/app/constants/googleSpecs";

describe("evaluateDemandGenImageAsset", () => {
  it("classifies recommended landscape, square, portrait, and vertical assets", () => {
    expect(evaluateDemandGenImageAsset(1200, 628)).toMatchObject({
      assetClass: "landscape",
      ratioSupported: true,
      meetsMinimum: true,
    });
    expect(evaluateDemandGenImageAsset(1200, 1200)).toMatchObject({
      assetClass: "square",
      ratioSupported: true,
      meetsMinimum: true,
    });
    expect(evaluateDemandGenImageAsset(960, 1200)).toMatchObject({
      assetClass: "portrait",
      ratioSupported: true,
      meetsMinimum: true,
    });
    expect(evaluateDemandGenImageAsset(1080, 1920)).toMatchObject({
      assetClass: "vertical",
      ratioSupported: true,
      meetsMinimum: true,
    });
  });

  it("rejects unsupported ratios and undersized matching ratios", () => {
    expect(evaluateDemandGenImageAsset(300, 250)).toMatchObject({
      assetClass: "unsupported",
      ratioSupported: false,
      meetsMinimum: false,
    });
    expect(evaluateDemandGenImageAsset(400, 400)).toMatchObject({
      assetClass: "square",
      ratioSupported: true,
      meetsMinimum: true,
    });
    expect(evaluateDemandGenImageAsset(200, 200)).toMatchObject({
      assetClass: "square",
      ratioSupported: true,
      meetsMinimum: false,
    });
  });

  it("keeps the 5MB Demand Gen image ceiling", () => {
    expect(DEMAND_GEN_IMAGE_REQUIREMENTS.max_file_size_bytes).toBe(5 * 1024 * 1024);
    expect(DEMAND_GEN_IMAGE_REQUIREMENTS.allowed_mime_types).toEqual([
      "image/jpeg",
      "image/png",
    ]);
  });
});
