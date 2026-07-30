import { NextResponse } from "next/server";
import { createServiceSupabase, getBearerToken, getUserOrgMembership } from "@/app/lib/organization-platform/auth";
import { getFirebaseAdminAuth } from "@/app/lib/firebase/admin";

export async function GET(request: Request) {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  let uid = "";
  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const membership = await getUserOrgMembership(supabase, uid);
  return NextResponse.json(membership);
}
