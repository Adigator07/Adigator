import { NextResponse } from "next/server";
import {
  authenticateAdminRequest,
  createServiceSupabase,
  getBearerToken,
  getClientIp,
  parseUserAgent,
  requirePermission,
  type AdminAuthContext,
} from "@/app/lib/admin-platform/auth";

export type AdminRouteContext = {
  supabase: NonNullable<ReturnType<typeof createServiceSupabase>>;
  auth: AdminAuthContext;
  ip: string;
  userAgent: ReturnType<typeof parseUserAgent>;
};

export async function withAdminAuth(
  request: Request,
  permission?: string,
): Promise<{ ok: true; ctx: AdminRouteContext } | { ok: false; response: NextResponse }> {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Server configuration error" }, { status: 503 }),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authorization required" }, { status: 401 }),
    };
  }

  const authResult = await authenticateAdminRequest(supabase, token);
  if (!authResult.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: authResult.error }, { status: authResult.status }),
    };
  }

  if (permission && !requirePermission(authResult.ctx, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  const ua = parseUserAgent(request.headers.get("user-agent"));

  return {
    ok: true,
    ctx: {
      supabase,
      auth: authResult.ctx,
      ip: getClientIp(request),
      userAgent: ua,
    },
  };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
