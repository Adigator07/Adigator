import { NextResponse } from "next/server";
import { withAdminAuth, jsonError } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { listUsers, usersToCsv } from "@/app/lib/admin-platform/services/users.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request, "users:read");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  try {
    const result = await listUsers(gate.ctx.supabase, {
      page: Number(url.searchParams.get("page") || 1),
      limit: Number(url.searchParams.get("limit") || 20),
      search: url.searchParams.get("search") || undefined,
      role: url.searchParams.get("role") || undefined,
      status: (url.searchParams.get("status") as "active" | "suspended" | "banned") || undefined,
      sortBy: (url.searchParams.get("sortBy") as "created_at" | "last_login_at" | "email") || "created_at",
      sortDir: url.searchParams.get("sortDir") === "asc" ? "asc" : "desc",
    });

    if (format === "csv") {
      const csv = usersToCsv(result.users);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="users-export.csv"',
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to list users", 500);
  }
}
