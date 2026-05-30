"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CommunicationPlatform = dynamic(
  () => import("../../components/communications/CommunicationPlatform"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center text-white/50">
        <Loader2 size={24} className="animate-spin" />
      </div>
    ),
  },
);

export default function CommunicationsPage() {
  return <CommunicationPlatform />;
}
