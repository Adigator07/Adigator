export type PerformanceTier = "full" | "lite";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
  };
};

export function getAdaptivePerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "full";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "lite";
  }

  const nav = window.navigator as NavigatorWithHints;
  const lowCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const saveData = Boolean(nav.connection?.saveData);
  const slowNetwork = ["slow-2g", "2g", "3g"].includes(nav.connection?.effectiveType ?? "");

  return lowCpu || lowMemory || saveData || slowNetwork ? "lite" : "full";
}
