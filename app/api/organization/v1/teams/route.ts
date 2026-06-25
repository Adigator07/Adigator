import { NextResponse } from "next/server";
import { withOrgAuth } from "@/app/lib/organization-platform/middleware/withOrgAuth";
import { createTeam, listTeams } from "@/app/lib/organization-platform/services/organizations.service";

export async function GET(request: Request) {
  const gate = await withOrgAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const teams = await listTeams(gate.ctx.supabase, gate.ctx.auth.organizationId);
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load teams" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const gate = await withOrgAuth(request);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const team = await createTeam(gate.ctx.supabase, gate.ctx.auth.organizationId, {
      name,
      description: body.description ? String(body.description) : undefined,
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create team" },
      { status: 500 },
    );
  }
}
