"use client";

import { Bell, Mail, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const PLACEHOLDER_ALERTS = [
  { id: "1", type: "info", title: "Admin Console active", body: "You are viewing the enterprise admin dashboard.", time: "Now" },
  { id: "2", type: "warning", title: "Email alerts not configured", body: "Set SMTP_HOST and ADMIN_EMAIL in .env.local for email notifications.", time: "Setup" },
  { id: "3", type: "security", title: "Audit logging enabled", body: "Admin actions are recorded in Audit Logs.", time: "System" },
];

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Notification Center</h1>
        <p className="mt-1 text-sm text-white/40">Security alerts, system warnings, and admin broadcasts.</p>
      </div>

      <div className="grid gap-4">
        {PLACEHOLDER_ALERTS.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className={`rounded-xl p-2 ${
                alert.type === "security" ? "bg-red-500/20 text-red-300"
                  : alert.type === "warning" ? "bg-amber-500/20 text-amber-300"
                    : "bg-blue-500/20 text-blue-300"
              }`}>
                {alert.type === "security" ? <ShieldAlert size={18} /> : alert.type === "warning" ? <Mail size={18} /> : <Bell size={18} />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{alert.title}</p>
                <p className="mt-1 text-sm text-white/50">{alert.body}</p>
                <p className="mt-2 text-xs text-white/30">{alert.time}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
