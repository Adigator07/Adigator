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

export default function SocialEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Social Launch",
        heroGradient: "from-fuchsia-900 via-purple-900 to-slate-900",
        primaryButton: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white",
        surface: "bg-slate-950",
        border: "border-fuchsia-500/20",
        muted: "text-slate-300",
      }}
    />
  );
}