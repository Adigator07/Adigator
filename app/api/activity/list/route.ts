import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";



export const runtime = "nodejs";



export async function GET(request: NextRequest) {

  try {

    const accessToken = getAccessTokenFromRequest(request);

    if (!accessToken) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const { user, error: authError } = await getAuthenticatedUser(accessToken);

    if (authError || !user) {

      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });

    }



    const limitParam = Number(request.nextUrl.searchParams.get("limit") || "50");

    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;



    const supabase = createServerSupabaseClient(accessToken);

    const { data, error } = await supabase

      .from("activity_logs")

      .select("*")

      .eq("user_id", user.id)

      .order("created_at", { ascending: false })

      .limit(limit);



    if (error) {

      return NextResponse.json({ error: error.message }, { status: 400 });

    }



    return NextResponse.json({ events: data || [] });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Failed to fetch activity";

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

