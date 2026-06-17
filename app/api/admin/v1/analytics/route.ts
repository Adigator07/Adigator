import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { getAnalyticsExtended } from "@/app/lib/admin-platform/services/analytics.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request, "analytics:read");
  if (!gate.ok) return gate.response;

  try {
    const analytics = await getAnalyticsExtended(gate.ctx.supabase);
    return NextResponse.json(analytics, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load analytics" },
      { status: 500 },
    );
  }
}
