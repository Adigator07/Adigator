import { NextResponse } from "next/server";
import {
  authenticateOrgAdminRequest,
  createServiceSupabase,
  getBearerToken,
  type OrgAuthContext,
} from "@/app/lib/organization-platform/auth";

export type OrgRouteContext = {
  supabase: NonNullable<ReturnType<typeof createServiceSupabase>>;
  auth: OrgAuthContext;
};

export async function withOrgAuth(
  request: Request,
  organizationId?: string | null,
): Promise<{ ok: true; ctx: OrgRouteContext } | { ok: false; response: NextResponse }> {
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

  const orgId = organizationId || new URL(request.url).searchParams.get("organizationId");

  const authResult = await authenticateOrgAdminRequest(supabase, token, orgId);
  if (!authResult.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: authResult.error }, { status: authResult.status }),
    };
  }

  return {
    ok: true,
    ctx: { supabase, auth: authResult.ctx },
  };
}
