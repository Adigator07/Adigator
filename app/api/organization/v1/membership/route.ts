import { NextResponse } from "next/server";
import { createServiceSupabase, getBearerToken, getUserOrgMembership } from "@/app/lib/organization-platform/auth";

export async function GET(request: Request) {
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
