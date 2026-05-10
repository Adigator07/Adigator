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

export default function GamingEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Gaming Launch",
        heroGradient: "from-emerald-900 via-teal-900 to-slate-900",
        primaryButton: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
        surface: "bg-slate-950",
        border: "border-emerald-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}