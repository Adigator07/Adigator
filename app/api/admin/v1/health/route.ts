import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { getSystemHealth } from "@/app/lib/admin-platform/services/health.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request, "health:read");
  if (!gate.ok) return gate.response;

  try {
    const health = await getSystemHealth(gate.ctx.supabase);
    return NextResponse.json(health);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Health check failed" },
      { status: 500 },
    );
  }
}
