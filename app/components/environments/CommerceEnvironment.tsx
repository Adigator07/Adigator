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

export default function CommerceEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Commerce Boost",
        heroGradient: "from-orange-900 via-amber-900 to-slate-900",
        primaryButton: "bg-orange-500 hover:bg-orange-400 text-white",
        surface: "bg-slate-950",
        border: "border-orange-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}