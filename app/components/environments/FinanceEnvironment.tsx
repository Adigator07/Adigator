"use client";

import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";
import LandingPageTemplate from "./LandingPageTemplate";

interface Props {
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

export default function FinanceEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Finance Growth",
        heroGradient: "from-slate-900 via-sky-900 to-slate-800",
        primaryButton: "bg-sky-600 hover:bg-sky-500 text-white",
        surface: "bg-slate-950",
        border: "border-sky-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}