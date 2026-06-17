import { NextResponse } from "next/server";
import { withAdminAuth, jsonError } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { getUserDetail } from "@/app/lib/admin-platform/services/users.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const gate = await withAdminAuth(request, "users:read");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  try {
    const detail = await getUserDetail(gate.ctx.supabase, id);
    if (!detail) return jsonError("User not found", 404);
    return NextResponse.json(detail);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to load user", 500);
  }
}
