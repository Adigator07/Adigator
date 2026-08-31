import { describe, expect, it } from "vitest";

import { runWithConcurrency } from "@/app/lib/googleAds/resolveAccount";

describe("runWithConcurrency", () => {
  it("runs work in parallel batches while preserving order", async () => {
    const started: number[] = [];
    const results = await runWithConcurrency([1, 2, 3, 4], 2, async (value) => {
      started.push(value);
      await new Promise((resolve) => setTimeout(resolve, 20));
      return value * 10;
    });

    expect(results).toEqual([10, 20, 30, 40]);
    expect(started.slice(0, 2).sort()).toEqual([1, 2]);
  });

  it("returns an empty array for empty input", async () => {
    expect(await runWithConcurrency([], 4, async (value) => value)).toEqual([]);
  });
});
