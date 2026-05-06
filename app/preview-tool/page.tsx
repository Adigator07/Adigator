"use client";

import dynamic from "next/dynamic";

const PreviewTool = dynamic(() => import("../components/PreviewTool"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-medium">Loading Preview Tool...</p>
      </div>
    </div>
  ),
});

export default function PreviewToolPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <PreviewTool />
    </div>
  );
}
