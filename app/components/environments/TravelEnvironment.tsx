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

export default function TravelEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Travel Convert",
        heroGradient: "from-cyan-900 via-blue-900 to-slate-900",
        primaryButton: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
        surface: "bg-slate-950",
        border: "border-cyan-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}