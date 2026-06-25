import { NextResponse } from "next/server";
import { withOrgAuth } from "@/app/lib/organization-platform/middleware/withOrgAuth";
import { getOrgDashboardMetrics } from "@/app/lib/organization-platform/services/organizations.service";

export async function GET(request: Request) {
  const gate = await withOrgAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const metrics = await getOrgDashboardMetrics(gate.ctx.supabase, gate.ctx.auth.organizationId);
    return NextResponse.json(metrics, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load organization dashboard" },
      { status: 500 },
    );
  }
}
