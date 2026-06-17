import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { auditLogsToCsv, listAuditLogs } from "@/app/lib/admin-platform/services/audit.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request, "audit:read");
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  try {
    const logs = await listAuditLogs(gate.ctx.supabase, {
      limit: Number(url.searchParams.get("limit") || 100),
      adminId: url.searchParams.get("adminId") || undefined,
      targetUserId: url.searchParams.get("targetUserId") || undefined,
    });

    if (format === "csv") {
      const csv = auditLogsToCsv(logs);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="audit-logs.csv"',
        },
      });
    }

    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load audit logs" },
      { status: 500 },
    );
  }
}
