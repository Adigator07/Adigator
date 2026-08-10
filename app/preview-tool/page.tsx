"use client";

import { Suspense } from "react";
import PreviewToolGate from "../components/PreviewToolGate";

function PreviewToolFallback() {
  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function PreviewToolPage() {
  return (
    <Suspense fallback={<PreviewToolFallback />}>
      <PreviewToolGate />
    </Suspense>
  );
}
