"use client";

import { PLACEMENTS } from "./shared/previewPlacements";

const PLATFORM_OPTIONS = [
  { id: "google", label: "Google Ads" },
  { id: "meta", label: "Meta Ads" },
  { id: "programmatic", label: "Programmatic" },
];

export default function PreviewControls({
  platform,
  placement,
  onPlatformChange,
  onPlacementChange,
  lockPlatform = false,
}) {
  const placementOptions = PLACEMENTS[platform] || [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Step 1: Platform
          </label>
          {lockPlatform ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
              {PLATFORM_OPTIONS.find((p) => p.id === platform)?.label || platform}
            </div>
          ) : (
            <select
              value={platform}
              onChange={(e) => onPlatformChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Step 2: Placement
          </label>
          <select
            value={placement}
            onChange={(e) => onPlacementChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {placementOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Step 3: Preview renders automatically below. Use Download PNG to export the exact preview frame.
      </p>
    </div>
  );
}
