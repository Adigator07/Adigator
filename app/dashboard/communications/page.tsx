"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import RouteAccessShell from "@/app/components/RouteAccessShell";

const CommunicationPlatform = dynamic(
  () => import("../../components/communications/CommunicationPlatform"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center text-white/50" style={{ minHeight: 420 }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    ),
  },
);

export default function CommunicationsPage() {
  return (
    <RouteAccessShell routeKey="communications" title="Communications">
      <CommunicationPlatform />
    </RouteAccessShell>
  );
}
