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

export default function NewsEnvironment(props: Props) {
  return (
    <LandingPageTemplate
      {...props}
      theme={{
        brand: "Newsroom Pro",
        heroGradient: "from-slate-900 via-blue-900 to-slate-800",
        primaryButton: "bg-blue-600 hover:bg-blue-500 text-white",
        surface: "bg-slate-950",
        border: "border-slate-700/40",
        muted: "text-slate-300",
      }}
    />
  );
}