import { NextResponse } from "next/server";
import { withOrgAuth } from "@/app/lib/organization-platform/middleware/withOrgAuth";
import { updateOrganizationMember } from "@/app/lib/organization-platform/services/organizations.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const gate = await withOrgAuth(request);
  if (!gate.ok) return gate.response;

  const { id } = await params;

  try {
    const body = await request.json();
    await updateOrganizationMember(gate.ctx.supabase, id, gate.ctx.auth.organizationId, {
      memberRole: body.memberRole ? String(body.memberRole) : undefined,
      teamId: body.teamId !== undefined ? (body.teamId as string | null) : undefined,
      status: body.status ? String(body.status) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update member" },
      { status: 500 },
    );
  }
}
