import { NextResponse } from "next/server";
import { withAdminAuth } from "@/app/lib/admin-platform/middleware/withAdminAuth";
import {
  createOrganization,
  listOrganizations,
} from "@/app/lib/organization-platform/services/organizations.service";

export async function GET(request: Request) {
  const gate = await withAdminAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const metrics = await listOrganizations(gate.ctx.supabase);
    return NextResponse.json(metrics, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load organizations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const gate = await withAdminAuth(request, "users:write");
  if (!gate.ok) return gate.response;

  if (gate.ctx.auth.role !== "super_admin") {
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const org = await createOrganization(gate.ctx.supabase, {
      name,
      slug: body.slug ? String(body.slug) : undefined,
      plan: body.plan ? String(body.plan) : undefined,
      ownerUserId: body.ownerUserId ? String(body.ownerUserId) : undefined,
    });

    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create organization" },
      { status: 500 },
    );
  }
}
