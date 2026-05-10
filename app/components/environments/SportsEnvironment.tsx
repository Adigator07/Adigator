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

export default function SportsEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Sports Impact",
        heroGradient: "from-amber-900 via-yellow-900 to-slate-900",
        primaryButton: "bg-amber-500 hover:bg-amber-400 text-slate-950",
        surface: "bg-slate-950",
        border: "border-amber-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}