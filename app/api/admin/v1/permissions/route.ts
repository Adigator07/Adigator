import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import {
  getFeaturePermissions,
  getPermissionsMatrix,
  listRoleDefinitions,
} from "@/app/lib/admin-platform/services/permissions.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request, "users:read");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  try {
    if (userId) {
      const matrix = await getPermissionsMatrix(gate.ctx.supabase, userId);
      return NextResponse.json(matrix);
    }

    const [roles, permissions] = await Promise.all([
      listRoleDefinitions(gate.ctx.supabase),
      getFeaturePermissions(gate.ctx.supabase),
    ]);

    return NextResponse.json({ roles, permissions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load permissions" },
      { status: 500 },
    );
  }
}
