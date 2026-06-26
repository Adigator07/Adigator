"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const ENV_CHECKS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key" },
  { key: "NEXT_PUBLIC_REALTIME_URL", label: "Realtime Server URL", optional: true },
];

function EnvStatus({ configured }: { configured: boolean }) {
  return configured ? (
    <CheckCircle2 size={16} className="text-emerald-400" />
  ) : (
    <XCircle size={16} className="text-white/30" />
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Admin Settings</h1>
        <p className="mt-1 text-sm text-white/40">Platform configuration and environment status.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Client environment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ENV_CHECKS.map((item) => {
            const isSet = Boolean(process.env[item.key]);
            return (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs font-mono text-white/40">{item.key}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  {item.optional ? "Optional" : "Required"}
                  <EnvStatus configured={isSet} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Server configuration</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-white/60">
          <p><code className="text-amber-300">SUPABASE_SERVICE_ROLE_KEY</code>: required for admin APIs (check System Health)</p>
          <p><code className="text-amber-300">REDIS_URL</code>: optional cache layer</p>
          <p><code className="text-amber-300">ADMIN_EMAIL</code>, <code className="text-amber-300">SECURITY_EMAIL</code>: alert routing</p>
        </CardContent>
      </Card>
    </div>
  );
}
