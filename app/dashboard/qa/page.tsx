"use client";

import { QaOverviewDashboard } from "../../components/qa/QaOverviewDashboard";
import RouteAccessShell from "@/app/components/RouteAccessShell";

export default function QaDashboardPage() {
  return (
    <RouteAccessShell routeKey="qa" title="QA Workspace">
      <div className="space-y-6 p-1">
        <QaOverviewDashboard />
      </div>
    </RouteAccessShell>
  );
}
