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

export default function SaasEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "SaaS Funnel",
        heroGradient: "from-violet-900 via-indigo-900 to-slate-900",
        primaryButton: "bg-violet-600 hover:bg-violet-500 text-white",
        surface: "bg-slate-950",
        border: "border-violet-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}