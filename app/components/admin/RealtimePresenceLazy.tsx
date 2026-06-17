"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const RealtimePresence = dynamic(
  () => import("@/app/components/admin/RealtimePresence").then((m) => m.RealtimePresence),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader><CardTitle>Live Users</CardTitle></CardHeader>
        <CardContent><p className="text-xs text-white/40">Connecting…</p></CardContent>
      </Card>
    ),
  },
);

export { RealtimePresence };
