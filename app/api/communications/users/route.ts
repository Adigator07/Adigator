import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";



export const runtime = "nodejs";



function json<T>(success: boolean, data: T | null, error: string | null, status = 200) {

  return NextResponse.json({ success, data, error }, { status });

}



export async function GET(request: NextRequest) {

  try {

    const token = getAccessTokenFromRequest(request);

    if (!token) return json(false, null, "Unauthorized", 401);



    const { user, error: authError } = await getAuthenticatedUser(token);

    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);



    const supabase = createServerSupabaseClient(token);

    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

    const role = request.nextUrl.searchParams.get("role");

    const search = request.nextUrl.searchParams.get("search");



    if (email) {

      const { data, error } = await supabase

        .from("profiles")

        .select("id, email, full_name, avatar_url, role, company_name, is_online, last_seen_at")

        .eq("email", email)

        .neq("id", user.id)

        .maybeSingle();



      if (error) return json(false, null, error.message, 400);

      if (!data) return json(false, null, "No registered user found with that email", 404);

      return json(true, data, null);

    }



    let query = supabase

      .from("profiles")

      .select("id, email, full_name, avatar_url, role, company_name, is_online, last_seen_at")

      .neq("id", user.id)

      .order("full_name");



    if (role) query = query.eq("role", role);

    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);



    const { data, error } = await query.limit(50);

    if (error) return json(false, null, error.message, 400);



    return json(true, data || [], null);

  } catch (err) {

    const message = err instanceof Error ? err.message : "Failed to fetch users";

    return json(false, null, message, 500);

  }

}



export async function PATCH(request: NextRequest) {

  try {

    const token = getAccessTokenFromRequest(request);

    if (!token) return json(false, null, "Unauthorized", 401);



    const { user, error: authError } = await getAuthenticatedUser(token);

    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);



    const body = await request.json();

    const supabase = createServerSupabaseClient(token);



    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.is_online === "boolean") {

      updates.is_online = body.is_online;

      if (!body.is_online) updates.last_seen_at = new Date().toISOString();

    }



    const { data, error } = await supabase

      .from("profiles")

      .update(updates)

      .eq("id", user.id)

      .select("*")

      .single();



    if (error) return json(false, null, error.message, 400);

    return json(true, data, null);

  } catch (err) {

    const message = err instanceof Error ? err.message : "Failed to update status";

    return json(false, null, message, 500);

  }

}

