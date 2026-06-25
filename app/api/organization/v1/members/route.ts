import { NextResponse } from "next/server";
import { createServiceSupabase, getBearerToken, getUserOrgMembership } from "@/app/lib/organization-platform/auth";
import { listOrganizationMembers } from "@/app/lib/organization-platform/services/organizations.service";
import { withOrgAuth } from "@/app/lib/organization-platform/middleware/withOrgAuth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("scope") === "self") {
    const supabase = createServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const membership = await getUserOrgMembership(supabase, userData.user.id);
    return NextResponse.json(membership);
  }

  const gate = await withOrgAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const members = await listOrganizationMembers(gate.ctx.supabase, gate.ctx.auth.organizationId);
    return NextResponse.json({ members });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load members" },
      { status: 500 },
    );
  }
}
