"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabase";
import { trackUserActivity } from "../lib/supabaseDataService";

const PreviewToolGate = dynamic(() => import("../components/PreviewToolGate"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function PreviewToolPage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      void trackUserActivity("page_visit", {
        action_label: "Preview tool visited",
        metadata: { page: "preview_tool" },
      }, { dedupeKey: "page-visit-preview-tool-root" });
    });
  }, []);

  return <PreviewToolGate />;
}
