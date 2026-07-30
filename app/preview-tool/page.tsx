"use client";

import dynamic from "next/dynamic";

const PreviewToolGate = dynamic(() => import("../components/PreviewToolGate"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function PreviewToolPage() {
  return <PreviewToolGate />;
}
