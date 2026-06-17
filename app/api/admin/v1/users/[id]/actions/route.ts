import { NextResponse } from "next/server";
import { withAdminAuth, jsonError } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import { writeAuditLog } from "@/app/lib/admin-platform/services/audit.service";
import {
  deleteUser,
  updateUserProfile,
  updateUserStatus,
} from "@/app/lib/admin-platform/services/users.service";
import { setUserFeaturePermissions } from "@/app/lib/admin-platform/services/permissions.service";
import type { UserStatus } from "@/app/lib/admin-platform/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const gate = await withAdminAuth(request, "users:write");
  if (!gate.ok) return gate.response;

  const { id: targetUserId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  try {
    switch (action) {
      case "suspend":
        await updateUserStatus(gate.ctx.supabase, targetUserId, "suspended");
        await writeAuditLog(gate.ctx.supabase, {
          adminId: gate.ctx.auth.userId,
          action: "user.suspend",
          targetUserId,
          description: `Suspended user ${targetUserId}`,
          ipAddress: gate.ctx.ip,
          device: gate.ctx.userAgent.device,
          browser: gate.ctx.userAgent.browser,
        });
        break;

      case "activate":
        await updateUserStatus(gate.ctx.supabase, targetUserId, "active");
        await writeAuditLog(gate.ctx.supabase, {
          adminId: gate.ctx.auth.userId,
          action: "user.activate",
          targetUserId,
          description: `Activated user ${targetUserId}`,
          ipAddress: gate.ctx.ip,
          device: gate.ctx.userAgent.device,
          browser: gate.ctx.userAgent.browser,
        });
        break;

      case "ban":
        await updateUserStatus(gate.ctx.supabase, targetUserId, "banned");
        await writeAuditLog(gate.ctx.supabase, {
          adminId: gate.ctx.auth.userId,
          action: "user.ban",
          targetUserId,
          description: `Banned user ${targetUserId}`,
          ipAddress: gate.ctx.ip,
          device: gate.ctx.userAgent.device,
          browser: gate.ctx.userAgent.browser,
        });
        break;

      case "update":
        await updateUserProfile(gate.ctx.supabase, targetUserId, {
          fullName: body.fullName,
          phone: body.phone,
          country: body.country,
          adminRole: body.adminRole,
          role: body.role,
        });
        await writeAuditLog(gate.ctx.supabase, {
          adminId: gate.ctx.auth.userId,
          action: "user.update",
          targetUserId,
          description: `Updated profile for user ${targetUserId}`,
          ipAddress: gate.ctx.ip,
          device: gate.ctx.userAgent.device,
          browser: gate.ctx.userAgent.browser,
        });
        break;

      case "permissions":
        if (body.permissions) {
          await setUserFeaturePermissions(gate.ctx.supabase, targetUserId, body.permissions);
          await writeAuditLog(gate.ctx.supabase, {
            adminId: gate.ctx.auth.userId,
            action: "permissions.update",
            targetUserId,
            description: `Updated feature permissions for user ${targetUserId}`,
            ipAddress: gate.ctx.ip,
            device: gate.ctx.userAgent.device,
            browser: gate.ctx.userAgent.browser,
          });
        }
        break;

      case "delete":
        await writeAuditLog(gate.ctx.supabase, {
          adminId: gate.ctx.auth.userId,
          action: "user.delete",
          targetUserId,
          description: `Deleted user ${targetUserId}`,
          ipAddress: gate.ctx.ip,
          device: gate.ctx.userAgent.device,
          browser: gate.ctx.userAgent.browser,
        });
        await deleteUser(gate.ctx.supabase, targetUserId);
        break;

      case "reset_password":
        await gate.ctx.supabase.auth.admin.generateLink({
          type: "recovery",
          email: body.email,
        });
        await writeAuditLog(gate.ctx.supabase, {
          adminId: gate.ctx.auth.userId,
          action: "user.reset_password",
          targetUserId,
          description: `Password reset initiated for user ${targetUserId}`,
          ipAddress: gate.ctx.ip,
          device: gate.ctx.userAgent.device,
          browser: gate.ctx.userAgent.browser,
        });
        break;

      default:
        return jsonError(`Unknown action: ${action}`);
    }

    return NextResponse.json({ ok: true, action });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Action failed", 500);
  }
}
