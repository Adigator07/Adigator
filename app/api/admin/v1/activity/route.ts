import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { listActivityLogsForAdmin } from "@/app/lib/admin-platform/services/activity-list.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request);
  if (!gate.ok) return gate.response;

  const params = new URL(request.url).searchParams;
  const { events, error } = await listActivityLogsForAdmin(gate.ctx.supabase, {
    limit: Number(params.get("limit") || "50"),
    userId: params.get("user_id") || null,
    actionType: params.get("action_type") || null,
    since: params.get("since") || null,
    search: params.get("search") || null,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json(
    { events },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
}
