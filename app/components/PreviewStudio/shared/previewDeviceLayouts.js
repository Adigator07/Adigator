"use client";

export function isMobileDeviceMode(deviceMode) {
  return deviceMode !== "desktop";
}

export const DEVICE_FRAME_PRESETS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 820 },
  desktopWide: { width: 1100, height: 880 },
  desktopCompact: { width: 980, height: 720 },
};

export function getDeviceFrame(deviceMode, { mobile, desktop, forceMobile = false } = {}) {
  const isMobile = forceMobile || isMobileDeviceMode(deviceMode);
  const preset = isMobile
    ? { ...DEVICE_FRAME_PRESETS.mobile, ...mobile }
    : { ...DEVICE_FRAME_PRESETS.desktop, ...desktop };
  return { isMobile, ...preset };
}
