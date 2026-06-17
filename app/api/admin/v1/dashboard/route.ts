import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { getDashboardMetrics } from "@/app/lib/admin-platform/services/analytics.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const metrics = await getDashboardMetrics(gate.ctx.supabase);
    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
